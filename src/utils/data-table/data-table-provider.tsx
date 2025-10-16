"use client";

import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useReducer,
} from "react";
import type { DataTableContextValue, DataTableProviderConfig } from "./types";

/**
 * 数据表格提供者的默认配置
 */
const DEFAULT_CONFIG: DataTableProviderConfig = {
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
    enableColumnVisibility: true,
    enableSorting: true,
    enableFiltering: true,
    enableRowSelection: false,
    autoResetPage: true,
    locale: "zh-CN",
};

/**
 * 配置更新的动作类型
 */
type ConfigAction =
    | { type: "UPDATE_CONFIG"; payload: Partial<DataTableProviderConfig> }
    | { type: "RESET_CONFIG" }
    | { type: "SET_PAGE_SIZE_OPTIONS"; payload: number[] }
    | { type: "SET_DEFAULT_PAGE_SIZE"; payload: number }
    | {
          type: "TOGGLE_FEATURE";
          payload: keyof Omit<
              DataTableProviderConfig,
              "defaultPageSize" | "pageSizeOptions" | "locale"
          >;
      };

/**
 * 配置状态管理
 */
function configReducer(
    state: DataTableProviderConfig,
    action: ConfigAction,
): DataTableProviderConfig {
    switch (action.type) {
        case "UPDATE_CONFIG":
            return { ...state, ...action.payload };

        case "RESET_CONFIG":
            return DEFAULT_CONFIG;

        case "SET_PAGE_SIZE_OPTIONS":
            return { ...state, pageSizeOptions: action.payload };

        case "SET_DEFAULT_PAGE_SIZE": {
            const existingOptions = state.pageSizeOptions ?? [];
            const nextOptions = existingOptions.includes(action.payload)
                ? existingOptions
                : [...existingOptions, action.payload].sort((a, b) => a - b);

            return {
                ...state,
                defaultPageSize: action.payload,
                pageSizeOptions: nextOptions,
            };
        }

        case "TOGGLE_FEATURE":
            return {
                ...state,
                [action.payload]:
                    !state[action.payload as keyof DataTableProviderConfig],
            };

        default:
            return state;
    }
}

/**
 * 数据表格上下文
 */
const DataTableContext = createContext<DataTableContextValue | null>(null);

/**
 * 数据表格提供者组件
 */
export interface DataTableProviderProps {
    children: ReactNode;
    config?: Partial<DataTableProviderConfig>;
}

export function DataTableProvider({
    children,
    config: initialConfig = {},
}: DataTableProviderProps) {
    const [config, dispatch] = useReducer(configReducer, {
        ...DEFAULT_CONFIG,
        ...initialConfig,
    });

    const updateConfig = useCallback(
        (newConfig: Partial<DataTableProviderConfig>) => {
            dispatch({ type: "UPDATE_CONFIG", payload: newConfig });
        },
        [],
    );

    const resetConfig = useCallback(() => {
        dispatch({ type: "RESET_CONFIG" });
    }, []);

    const setPageSizeOptions = useCallback((options: number[]) => {
        dispatch({ type: "SET_PAGE_SIZE_OPTIONS", payload: options });
    }, []);

    const setDefaultPageSize = useCallback((size: number) => {
        dispatch({ type: "SET_DEFAULT_PAGE_SIZE", payload: size });
    }, []);

    const toggleFeature = useCallback(
        (
            feature: keyof Omit<
                DataTableProviderConfig,
                "defaultPageSize" | "pageSizeOptions" | "locale"
            >,
        ) => {
            dispatch({ type: "TOGGLE_FEATURE", payload: feature });
        },
        [],
    );

    const contextValue: DataTableContextValue = {
        config,
        updateConfig,
        // 提供更多便捷方法
        resetConfig,
        setPageSizeOptions,
        setDefaultPageSize,
        toggleFeature,
    };

    return (
        <DataTableContext.Provider value={contextValue}>
            {children}
        </DataTableContext.Provider>
    );
}

/**
 * 使用数据表格上下文的Hook
 */
export function useDataTable(): DataTableContextValue {
    const context = useContext(DataTableContext);

    if (context === null) {
        throw new Error("useDataTable must be used within a DataTableProvider");
    }

    return context;
}

/**
 * 使用数据表格配置的Hook
 */
export function useDataTableConfig(): DataTableProviderConfig {
    const { config } = useDataTable();
    return config;
}

/**
 * 创建数据表格配置更新器的Hook
 */
export function useDataTableConfigUpdater() {
    const {
        updateConfig,
        resetConfig,
        setPageSizeOptions,
        setDefaultPageSize,
        toggleFeature,
    } = useDataTable();

    return {
        updateConfig,
        resetConfig,
        setPageSizeOptions,
        setDefaultPageSize,
        toggleFeature,
    };
}

/**
 * 数据表格配置预设
 */
export const dataTablePresets = {
    // 简单表格预设
    simple: {
        enableColumnVisibility: false,
        enableRowSelection: false,
        pageSizeOptions: [10, 25, 50],
    } as Partial<DataTableProviderConfig>,

    // 高级表格预设
    advanced: {
        enableColumnVisibility: true,
        enableSorting: true,
        enableFiltering: true,
        enableRowSelection: true,
        pageSizeOptions: [10, 20, 50, 100, 200],
    } as Partial<DataTableProviderConfig>,

    // 报表表格预设
    report: {
        enableColumnVisibility: true,
        enableSorting: true,
        enableFiltering: false,
        enableRowSelection: false,
        defaultPageSize: 50,
        pageSizeOptions: [20, 50, 100, 200],
    } as Partial<DataTableProviderConfig>,

    // 只读表格预设
    readonly: {
        enableColumnVisibility: false,
        enableSorting: false,
        enableFiltering: false,
        enableRowSelection: false,
    } as Partial<DataTableProviderConfig>,
};

/**
 * 预设配置的提供者组件
 */
export interface SimpleDataTableProviderProps {
    children: ReactNode;
    preset?: keyof typeof dataTablePresets;
    additionalConfig?: Partial<DataTableProviderConfig>;
}

export function SimpleDataTableProvider({
    children,
    preset = "simple",
    additionalConfig = {},
}: SimpleDataTableProviderProps) {
    const presetConfig = dataTablePresets[preset] || dataTablePresets.simple;
    const finalConfig = { ...presetConfig, ...additionalConfig };

    return (
        <DataTableProvider config={finalConfig}>{children}</DataTableProvider>
    );
}
