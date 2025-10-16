/**
 * Toast - Sonner Toast 组件配置
 *
 * 基于 sonner 的现代化 Toast 通知系统
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
}

export function Toast({ className }: ToastProps) {
    return (
        <Toaster
            className={cn("toaster group", className)}
            position="top-right"
            expand={false}
            richColors
            closeButton
            theme="system"
            toastOptions={{
                classNames: {
                    toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                    description: "group-[.toast]:text-muted-foreground",
                    actionButton:
                        "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton:
                        "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                    successIcon: "text-success",
                    errorIcon: "text-destructive",
                    warningIcon: "text-warning",
                    infoIcon: "text-info",
                },
            }}
        />
    );
}

// 类型定义
export type { ExternalToast, ToastOptions } from "sonner";
// 导出 sonner 的 toast 方法，方便使用
export { toast } from "sonner";

export default Toast;
