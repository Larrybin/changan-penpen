import type { CrudFilter } from "@refinedev/core";
import { useCallback, useMemo, useState } from "react";

export interface FilterField {
    field: string;
    operator:
        | "eq"
        | "ne"
        | "lt"
        | "gt"
        | "lte"
        | "gte"
        | "contains"
        | "startswith"
        | "endswith";
    value: CrudFilter["value"];
}

export interface UseTableFiltersOptions<T = Record<string, unknown>> {
    defaultFilters?: T;
    debounceMs?: number;
    transformFilters?: (filters: T) => FilterField[];
}

export interface UseTableFiltersReturn<T> {
    filters: T;
    setFilters: (filters: T | ((prev: T) => T)) => void;
    updateFilter: (key: keyof T, value: CrudFilter["value"]) => void;
    clearFilters: () => void;
    clearFilter: (key: keyof T) => void;
    hasActiveFilters: boolean;
    crudFilters: CrudFilter[];
    resetFilters: () => void;
}

export function useTableFilters<
    T extends Record<string, unknown> = Record<string, unknown>,
>(options: UseTableFiltersOptions<T> = {}): UseTableFiltersReturn<T> {
    const {
        defaultFilters = {} as T,
        debounceMs = 300,
        transformFilters,
    } = options;

    const [_filters, setFiltersState] = useState<T>(defaultFilters);
    const [debouncedFilters, setDebouncedFilters] = useState<T>(defaultFilters);

    // Debounce filter updates
    const setFilters = useCallback(
        (newFilters: T | ((prev: T) => T)) => {
            setFiltersState((prev) => {
                const updated =
                    typeof newFilters === "function"
                        ? newFilters(prev)
                        : newFilters;

                // Simple debounce implementation
                if (debounceMs > 0) {
                    setTimeout(() => {
                        setDebouncedFilters(updated);
                    }, debounceMs);
                } else {
                    setDebouncedFilters(updated);
                }

                return updated;
            });
        },
        [debounceMs],
    );

    const updateFilter = useCallback(
        (key: keyof T, value: CrudFilter["value"]) => {
            setFilters((prev) => ({
                ...prev,
                [key]: value,
            }));
        },
        [setFilters],
    );

    const clearFilters = useCallback(() => {
        setFilters(defaultFilters);
    }, [setFilters, defaultFilters]);

    const clearFilter = useCallback(
        (key: keyof T) => {
            setFilters((prev) => {
                const newFilters = { ...prev };
                delete newFilters[key];
                return newFilters;
            });
        },
        [setFilters],
    );

    const resetFilters = useCallback(() => {
        setFiltersState(defaultFilters);
        setDebouncedFilters(defaultFilters);
    }, [defaultFilters]);

    const hasActiveFilters = useMemo(() => {
        return Object.entries(debouncedFilters).some(([_key, value]) => {
            return value !== undefined && value !== null && value !== "";
        });
    }, [debouncedFilters]);

    const crudFilters = useMemo(() => {
        if (transformFilters) {
            return transformFilters(debouncedFilters);
        }

        // Default transformation logic
        const filters: CrudFilter[] = [];

        Object.entries(debouncedFilters).forEach(([field, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                // Smart operator detection based on field name and value type
                let operator: CrudFilter["operator"] = "eq";

                if (
                    field.toLowerCase().includes("search") ||
                    typeof value === "string"
                ) {
                    operator = "contains";
                } else if (Array.isArray(value)) {
                    operator = "in";
                } else if (
                    typeof value === "object" &&
                    value !== null &&
                    !Array.isArray(value)
                ) {
                    const rangeValue = value as {
                        min?: CrudFilter["value"];
                        max?: CrudFilter["value"];
                    };
                    const hasMin = rangeValue.min !== undefined;
                    const hasMax = rangeValue.max !== undefined;

                    if (hasMin || hasMax) {
                        if (hasMin) {
                            filters.push({
                                field: `${field}.min`,
                                operator: "gte",
                                value: rangeValue.min,
                            });
                        }
                        if (hasMax) {
                            filters.push({
                                field: `${field}.max`,
                                operator: "lte",
                                value: rangeValue.max,
                            });
                        }
                        return;
                    }
                }

                filters.push({
                    field,
                    operator,
                    value,
                });
            }
        });

        return filters;
    }, [debouncedFilters, transformFilters]);

    return {
        filters: debouncedFilters,
        setFilters,
        updateFilter,
        clearFilters,
        clearFilter,
        hasActiveFilters,
        crudFilters,
        resetFilters,
    };
}
