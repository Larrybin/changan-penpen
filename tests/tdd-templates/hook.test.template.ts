/**
 * React Hook TDD测试模板
 * 基于React Testing Library和@testing-library/react-hooks
 * 遵循测试驱动开发原则
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * React Hook TDD测试模板使用说明
 *
 * 1. 复制此模板到Hook测试文件
 * 2. 替换useHookName为实际Hook名
 * 3. 根据Hook特性调整测试用例
 * 4. 遵循红-绿-重构TDD循环
 */

// 测试数据工厂
const createMockArgs = (overrides = {}) => ({
    // 在这里定义Hook的默认参数
    initialValue: "",
    ...overrides,
});

const createMockResponse = (overrides = {}) => ({
    // 在这里定义Hook返回的默认数据
    data: null,
    loading: false,
    error: null,
    ...overrides,
});

describe("useHookName", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("初始状态测试", () => {
        it("应该返回正确的初始状态", () => {
            const args = createMockArgs();
            const { result } = renderHook(() => useHookName(args));

            expect(result.current).toEqual(createMockResponse());
        });

        it("应该使用默认参数", () => {
            const { result } = renderHook(() => useHookName());

            expect(result.current).toEqual(createMockResponse());
        });

        it("应该正确处理自定义初始值", () => {
            const customArgs = createMockArgs({
                initialValue: "custom initial value",
            });
            const { result } = renderHook(() => useHookName(customArgs));

            expect(result.current).toEqual(
                createMockResponse({
                    data: "custom initial value",
                })
            );
        });
    });

    describe("状态更新测试", () => {
        it("应该正确更新状态", async () => {
            const args = createMockArgs();
            const { result } = renderHook(() => useHookName(args));

            // 执行状态更新操作
            act(() => {
                result.current.update("new value");
            });

            expect(result.current.data).toBe("new value");
        });

        it("应该处理异步状态更新", async () => {
            const args = createMockArgs();
            const { result } = renderHook(() => useHookName(args));

            // 执行异步操作
            act(() => {
                result.current.fetchData();
            });

            // 验证加载状态
            expect(result.current.loading).toBe(true);

            // 等待异步操作完成
            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.data).toBeDefined();
        });

        it("应该处理异步错误", async () => {
            const args = createMockArgs();
            const { result } = renderHook(() => useHookName(args));

            // Mock错误
            global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

            act(() => {
                result.current.fetchData();
            });

            await waitFor(() => {
                expect(result.current.error).toBeTruthy();
                expect(result.current.loading).toBe(false);
            });
        });
    });

    describe("副作用测试", () => {
        it("应该在依赖变化时重新执行", () => {
            const args = createMockArgs();
            const { result, rerender } = renderHook(
                ({ deps }) => useHookName({ ...args, deps }),
                {
                    initialProps: { deps: "initial" },
                }
            );

            expect(result.current.data).toBe("initial");

            rerender({ deps: "updated" });

            expect(result.current.data).toBe("updated");
        });

        it("应该在组件卸载时清理副作用", () => {
            const mockCleanup = vi.fn();
            const args = createMockArgs({ onCleanup: mockCleanup });

            const { unmount } = renderHook(() => useHookName(args));

            unmount();

            expect(mockCleanup).toHaveBeenCalledTimes(1);
        });

        it("应该处理定时器副作用", async () => {
            vi.useFakeTimers();

            const args = createMockArgs();
            const { result } = renderHook(() => useHookName(args));

            act(() => {
                result.current.startTimer();
            });

            expect(result.current.timerActive).toBe(true);

            act(() => {
                vi.advanceTimersByTime(1000);
            });

            await waitFor(() => {
                expect(result.current.timerActive).toBe(false);
            });

            vi.useRealTimers();
        });
    });

    describe("性能优化测试", () => {
        it("应该使用useMemo优化计算", () => {
            const expensiveComputation = vi.fn((value) => value * 2);
            const args = createMockArgs({ compute: expensiveComputation });

            const { result, rerender } = renderHook(() => useHookName(args));

            expect(expensiveComputation).toHaveBeenCalledTimes(1);

            rerender(); // 重新渲染，参数未变化

            expect(expensiveComputation).toHaveBeenCalledTimes(1);
        });

        it("应该使用useCallback优化函数", () => {
            const mockCallback = vi.fn();
            const args = createMockArgs({ callback: mockCallback });

            const { result, rerender } = renderHook(() => useHookName(args));

            const callback = result.current.getCallback();

            rerender(); // 重新渲染

            const newCallback = result.current.getCallback();

            expect(callback).toBe(newCallback);
        });

        it("应该正确处理防抖", async () => {
            vi.useFakeTimers();

            const args = createMockArgs();
            const { result } = renderHook(() => useHookName(args));

            act(() => {
                result.current.setValue("value1");
            });

            act(() => {
                result.current.setValue("value2");
            });

            act(() => {
                vi.advanceTimersByTime(300); // 防抖延迟
            });

            await waitFor(() => {
                expect(result.current.debouncedValue).toBe("value2");
            });

            vi.useRealTimers();
        });
    });

    describe("错误处理测试", () => {
        it("应该处理无效参数", () => {
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            const { result } = renderHook(() => useHookName({}));

            act(() => {
                result.current.invalidOperation(null);
            });

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("Invalid parameter")
            );

            consoleSpy.mockRestore();
        });

        it("应该提供错误恢复机制", () => {
            const args = createMockArgs();
            const { result } = renderHook(() => useHookName(args));

            act(() => {
                result.current.triggerError();
            });

            expect(result.current.error).toBeTruthy();

            act(() => {
                result.current.clearError();
            });

            expect(result.current.error).toBeNull();
        });
    });

    describe("内存泄漏测试", () => {
        it("应该正确清理事件监听器", () => {
            const addEventListenerSpy = vi.spyOn(document, "addEventListener");
            const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

            const { unmount } = renderHook(() => useHookName({
                eventType: "click",
            }));

            expect(addEventListenerSpy).toHaveBeenCalledWith("click", expect.any(Function), expect.any(Object));

            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith("click", expect.any(Function), expect.any(Object));

            addEventListenerSpy.mockRestore();
            removeEventListenerSpy.mockRestore();
        });

        it("应该正确清理订阅", () => {
            const mockSubscribe = vi.fn(() => () => {});
            const mockUnsubscribe = vi.fn();

            const { unmount } = renderHook(() => useHookName({
                subscribe: mockSubscribe,
            }));

            expect(mockSubscribe).toHaveBeenCalled();

            unmount();

            // 验证unsubscribe被调用
            expect(mockUnsubscribe).toHaveBeenCalled();
        });
    });

    describe("集成测试", () => {
        it("应该与Context配合工作", () => {
            const mockContext = {
                value: "context value",
                update: vi.fn(),
            };

            const { result } = renderHook(() => useHookName(), {
                wrapper: ({ children }) => (
                    <MockContextProvider value={mockContext}>
                        {children}
                    </MockContextProvider>
                ),
            });

            expect(result.current.contextValue).toBe("context value");
        });

        it("应该与Redux配合工作", () => {
            const mockDispatch = vi.fn();
            const mockStore = {
                getState: () => ({ value: "store value" }),
                dispatch: mockDispatch,
            };

            const { result } = renderHook(() => useHookName(), {
                wrapper: ({ children }) => (
                    <MockStoreProvider store={mockStore}>
                        {children}
                    </MockStoreProvider>
                ),
            });

            act(() => {
                result.current.dispatchAction({ type: "UPDATE", payload: "new value" });
            });

            expect(mockDispatch).toHaveBeenCalledWith({
                type: "UPDATE",
                payload: "new value",
            });
        });
    });
});

// Hook类型定义（根据实际Hook调整）
interface UseHookNameProps {
    initialValue?: string;
    deps?: any;
    onCleanup?: () => void;
    compute?: (value: any) => any;
    callback?: (...args: any[]) => void;
    eventType?: string;
    subscribe?: () => () => void;
}

interface UseHookNameReturn {
    data: any;
    loading: boolean;
    error: Error | null;
    update: (value: any) => void;
    fetchData: () => Promise<void>;
    startTimer: () => void;
    stopTimer: () => void;
    timerActive: boolean;
    debouncedValue: any;
    setValue: (value: any) => void;
    getCallback: () => (...args: any[]) => void;
    clearError: () => void;
    triggerError: () => void;
    contextValue: any;
    dispatchAction: (action: any) => void;
}

// Mock组件（用于集成测试）
const MockContextProvider = ({ children, value }: any) => (
    <div data-testid="mock-context">{children}</div>
);

const MockStoreProvider = ({ children, store }: any) => (
    <div data-testid="mock-store">{children}</div>
);