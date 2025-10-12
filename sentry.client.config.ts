"use client";

// 委托到本地 instrumentation-client.ts 统一初始化 Sentry（避免重复初始化和 API 版本差异）
import "./instrumentation-client";

// Next.js 在路由切换时可调用此导出，提供空实现即可
export { onRouterTransitionStart } from "./instrumentation-client";
