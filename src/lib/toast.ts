/**
 * Toast 封装器 - 统一通知 API
 *
 * 通过集中导出 `sonner` 的 `toast` 方法，让原先依赖
 * `react-hot-toast` 的代码可以逐步迁移，同时保证调用方式保持一致。
 *
 * @example
 * ```tsx
 * import { toast } from "@/lib/toast";
 *
 * toast.success("成功");
 * toast.error("错误");
 * toast("信息", { description: "更多内容" });
 * ```
 */

import { toast as sonnerToast } from "sonner";

export const toast = sonnerToast;

export default sonnerToast;
