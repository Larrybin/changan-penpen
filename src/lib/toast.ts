/**
 * Toast 封装器 - 迁移辅助工具
 *
 * 提供与 react-hot-toast 兼容的 API，方便逐步迁移到 sonner
 *
 * @example
 * ```tsx
 * // 原来的用法
 * import toast from "react-hot-toast";
 * toast.success("成功");
 * toast.error("错误");
 *
 * // 新的用法 (完全兼容)
 * import { toast } from "@/lib/toast";
 * toast.success("成功");
 * toast.error("错误");
 *
 * // 或者直接使用 sonner
 * import { toast } from "sonner";
 * toast.success("成功");
 * ```
 */

import { toast as sonnerToast } from "sonner";

// 创建与 react-hot-toast 兼容的 API
export const toast = {
    success: (message: string, options?: any) => {
        return sonnerToast.success(message, options);
    },

    error: (message: string, options?: any) => {
        return sonnerToast.error(message, options);
    },

    info: (message: string, options?: any) => {
        return sonnerToast.info(message, options);
    },

    warning: (message: string, options?: any) => {
        return sonnerToast.warning(message, options);
    },

    loading: (message: string, options?: any) => {
        return sonnerToast.loading(message, options);
    },

    dismiss: (id?: string | number) => {
        return sonnerToast.dismiss(id);
    },

    // sonner 特有的方法
    message: sonnerToast.message,
    promise: sonnerToast.promise,
    custom: sonnerToast.custom,
};

export default toast;
