/**
 * Toast - Sonner Toast 组件配置
 *
 * 基于 sonner 的现代化 Toast 通知系统，应用完整的设计令牌系统
 *
 * @example
 * ```tsx
 * import { toast } from "sonner";
 *
 * // 基本用法
 * toast.success("操作成功");
 * toast.error("操作失败");
 * toast.info("提示信息");
 * toast.warning("警告信息");
 *
 * // 自定义描述
 * toast.success("操作成功", {
 *   description: "数据已保存到服务器"
 * });
 *
 * // 自定义动作
 * toast.success("保存成功", {
 *   action: {
 *     label: "撤销",
 *     onClick: () => console.log("撤销操作")
 *   }
 * });
 * ```
 */

"use client";

import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

interface ToastProps {
    className?: string;
    position?:
        | "top-left"
        | "top-right"
        | "bottom-left"
        | "bottom-right"
        | "top-center"
        | "bottom-center";
    expand?: boolean;
    richColors?: boolean;
    closeButton?: boolean;
    theme?: "system" | "light" | "dark";
}

export function Toast({
    className,
    position = "top-right",
    expand = false,
    richColors = true,
    closeButton = true,
    theme = "system",
}: ToastProps) {
    return (
        <Toaster
            className={cn(
                // 基础容器样式
                "toaster group",
                // 固定定位和层级
                "fixed z-[100] flex max-h-screen w-full flex-col-reverse p-[var(--token-spacing-4)]",
                // 响应式设计
                "sm:max-w-[420px] sm:justify-end",
                // 定位令牌
                {
                    "top-0 right-0": position === "top-right",
                    "top-0 left-0": position === "top-left",
                    "right-0 bottom-0": position === "bottom-right",
                    "bottom-0 left-0": position === "bottom-left",
                    "-translate-x-1/2 top-0 left-1/2":
                        position === "top-center",
                    "-translate-x-1/2 bottom-0 left-1/2":
                        position === "bottom-center",
                },
                className,
            )}
            position={position}
            expand={expand}
            richColors={richColors}
            closeButton={closeButton}
            theme={theme}
            toastOptions={{
                classNames: {
                    // Toast 主体样式
                    toast: cn(
                        // 基础布局
                        "group toast relative flex w-full items-center justify-between space-x-[var(--token-spacing-4)] overflow-hidden rounded-[var(--token-radius-card,var(--token-radius-md))]",
                        // 内边距
                        "p-[var(--token-spacing-4)]",
                        // 设计令牌 - 颜色和背景
                        "bg-[var(--color-background)] text-[var(--color-foreground)]",
                        // 边框和阴影
                        "border border-[var(--color-border)] shadow-[var(--shadow-lg)]",
                        // 动画系统
                        "fade-in slide-in-from-top-2 color-transition transition-[all] duration-[var(--token-motion-duration-normal)] ease-[var(--token-motion-ease-standard)]",
                        // 微交互
                        "hover:shadow-[var(--shadow-xl)] hover:border-[var(--color-border,var(--color-muted-foreground)/30)]",
                        // 组样式 - 确保在toaster容器中的样式继承
                        "group-[.toaster]:bg-[var(--color-background)] group-[.toaster]:text-[var(--color-foreground)] group-[.toaster]:border-[var(--color-border)] group-[.toaster]:shadow-[var(--shadow-lg)]",
                    ),
                    // 描述文本样式
                    description: cn(
                        // 排版令牌
                        "text-[var(--token-text-sm)] leading-[var(--token-line-height-normal)]",
                        // 颜色令牌
                        "text-[var(--color-muted-foreground)]",
                        // 组样式继承
                        "group-[.toast]:text-[var(--color-muted-foreground)]",
                    ),
                    // 成功状态样式
                    success: cn(
                        // 背景色
                        "bg-[var(--color-success)]/[8%] border-[var(--color-success)]/20",
                        // 文本色
                        "text-[var(--color-success-foreground)]",
                        // 图标和强调色
                        "[&>[data-icon]]:text-[var(--color-success)]",
                    ),
                    // 错误状态样式
                    error: cn(
                        // 背景色
                        "bg-[var(--color-destructive)]/[8%] border-[var(--color-destructive)]/20",
                        // 文本色
                        "text-[var(--color-destructive-foreground)]",
                        // 图标和强调色
                        "[&>[data-icon]]:text-[var(--color-destructive)]",
                    ),
                    // 警告状态样式
                    warning: cn(
                        // 背景色
                        "bg-[var(--color-warning)]/[8%] border-[var(--color-warning)]/20",
                        // 文本色
                        "text-[var(--color-warning-foreground)]",
                        // 图标和强调色
                        "[&>[data-icon]]:text-[var(--color-warning)]",
                    ),
                    // 信息状态样式
                    info: cn(
                        // 背景色
                        "bg-[var(--color-info)]/[8%] border-[var(--color-info)]/20",
                        // 文本色
                        "text-[var(--color-info-foreground)]",
                        // 图标和强调色
                        "[&>[data-icon]]:text-[var(--color-info)]",
                    ),
                    // 动作按钮样式
                    actionButton: cn(
                        // 基础按钮样式
                        "inline-flex items-center justify-center rounded-[var(--token-radius-button,var(--token-radius-md))]",
                        // 内边距
                        "px-[var(--token-spacing-3)] py-[var(--token-spacing-1.5)]",
                        // 排版令牌
                        "text-[var(--token-text-xs)] font-[var(--token-font-weight-medium)] leading-[var(--token-line-height-tight)]",
                        // 主色调样式
                        "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
                        // 微交互
                        "scale-active color-transition transition-[background-color,color,transform] duration-[var(--token-motion-duration-fast)] ease-[var(--token-motion-ease-standard)]",
                        "hover:bg-[var(--color-primary)]/90 focus-visible:ring-[var(--token-focus-ring-width,2px)] focus-visible:ring-[var(--token-focus-ring-color,var(--color-primary))] focus-visible:ring-offset-[var(--token-focus-ring-offset,2px)] focus-visible:ring-offset-[var(--color-background)]",
                        // 组样式继承
                        "group-[.toast]:bg-[var(--color-primary)] group-[.toast]:text-[var(--color-primary-foreground)]",
                    ),
                    // 取消按钮样式
                    cancelButton: cn(
                        // 基础按钮样式
                        "inline-flex items-center justify-center rounded-[var(--token-radius-button,var(--token-radius-md))]",
                        // 内边距
                        "px-[var(--token-spacing-3)] py-[var(--token-spacing-1.5)]",
                        // 排版令牌
                        "text-[var(--token-text-xs)] font-[var(--token-font-weight-medium)] leading-[var(--token-line-height-tight)]",
                        // 中性色调样式
                        "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]",
                        // 微交互
                        "scale-active color-transition transition-[background-color,color,transform] duration-[var(--token-motion-duration-fast)] ease-[var(--token-motion-ease-standard)]",
                        "hover:bg-[var(--color-muted)]/80 focus-visible:ring-[var(--token-focus-ring-width,2px)] focus-visible:ring-[var(--token-focus-ring-color,var(--color-muted-foreground))] focus-visible:ring-offset-[var(--token-focus-ring-offset,2px)] focus-visible:ring-offset-[var(--color-background)]",
                        // 组样式继承
                        "group-[.toast]:bg-[var(--color-muted)] group-[.toast]:text-[var(--color-muted-foreground)]",
                    ),
                    // 关闭按钮样式
                    closeButton: cn(
                        // 基础样式
                        "absolute right-[var(--token-spacing-2)] top-[var(--token-spacing-2)] rounded-[var(--token-radius-button,var(--token-radius-sm))]",
                        // 尺寸
                        "size-6 flex items-center justify-center",
                        // 颜色
                        "text-[var(--color-muted-foreground)]/60 hover:text-[var(--color-foreground)]",
                        // 微交互
                        "scale-active color-transition transition-[color,transform] duration-[var(--token-motion-duration-fast)] ease-[var(--token-motion-ease-standard)]",
                        "hover:bg-[var(--color-muted)]/50 focus-visible:ring-[var(--token-focus-ring-width,2px)] focus-visible:ring-[var(--token-focus-ring-color,var(--color-muted-foreground))] focus-visible:ring-offset-[var(--token-focus-ring-offset,2px)]",
                    ),
                    // 标题样式
                    title: cn(
                        // 排版令牌
                        "text-[var(--token-text-sm)] font-[var(--token-font-weight-semibold)] leading-[var(--token-line-height-tight)]",
                        // 颜色令牌
                        "text-[var(--color-foreground)]",
                        // 组样式继承
                        "group-[.toast]:text-[var(--color-foreground)]",
                    ),
                    // 图标样式
                    icon: cn(
                        // 尺寸和布局
                        "size-4 shrink-0",
                        // 颜色继承
                        "text-[var(--color-foreground)]",
                    ),
                },
                // 动画配置
                duration: 4000,
                // 位置和样式配置
                style: {
                    // 使用CSS变量确保主题一致性
                    "--toast-bg": "var(--color-background)",
                    "--toast-foreground": "var(--color-foreground)",
                    "--toast-border": "var(--color-border)",
                } as React.CSSProperties,
            }}
        />
    );
}

// 类型定义
export type { ExternalToast } from "sonner";
// 导出 sonner 的 toast 方法，方便使用
export { toast } from "sonner";

export default Toast;
