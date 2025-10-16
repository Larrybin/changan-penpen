/**
 * Form 组件模块导出
 *
 * 统一的表单组件和工具，支持 React Hook Form + Zod + 国际化
 */

// 核心组件
export {
    Form,
    FormControl,
    FormDescription,
    FormError,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormSubmit,
    FormSuccess,
} from "./form";
export { default as FormCheckbox } from "./form-checkbox";
// 预设组件（后续扩展）
export { default as FormInput } from "./form-input";
export { default as FormRadio } from "./form-radio";
export { default as FormSelect } from "./form-select";
export { default as FormTextarea } from "./form-textarea";
export type {
    UseZodFormOptions,
    UseZodFormReturn,
} from "./use-zod-form";
// Hooks
export { useSimpleForm, useZodForm } from "./use-zod-form";
