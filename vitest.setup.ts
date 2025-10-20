import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { toHaveNoViolations } from "jest-axe";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import type { ComponentProps, PropsWithChildren } from "react";
import React from "react";
import { afterAll, afterEach, beforeAll, expect, vi } from "vitest";

// 测试覆盖率提升配置
// 支持API mocking和更完善的测试环境

afterEach(() => {
    cleanup();
});

expect.extend(toHaveNoViolations);

const elementPrototype = Element.prototype as Element & {
    hasPointerCapture?: (pointerId: number) => boolean;
    releasePointerCapture?: (pointerId: number) => void;
    setPointerCapture?: (pointerId: number) => void;
    scrollIntoView?: () => void;
};

if (!elementPrototype.hasPointerCapture) {
    elementPrototype.hasPointerCapture = () => false;
}
if (!elementPrototype.releasePointerCapture) {
    elementPrototype.releasePointerCapture = () => {};
}
if (!elementPrototype.setPointerCapture) {
    elementPrototype.setPointerCapture = () => {};
}
if (!elementPrototype.scrollIntoView) {
    elementPrototype.scrollIntoView = () => {};
}

if (typeof window !== "undefined" && !window.matchMedia) {
    window.matchMedia = (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
    });
}

if (typeof window !== "undefined" && !("ResizeObserver" in window)) {
    class StubResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
    }

    // @ts-expect-error - assigning to global window
    window.ResizeObserver = StubResizeObserver;
}

// Ensure React is available in scope for components compiled with classic JSX
// or libraries that expect global React in test environment
(globalThis as typeof globalThis & { React?: typeof React }).React = React;

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
    }),
}));

vi.mock("next/link", () => ({
    __esModule: true,
    default: ({
        children,
        href,
        ...props
    }: PropsWithChildren<ComponentProps<"a">>) =>
        React.createElement("a", { href, ...props }, children),
}));

// MSW API Mocking Server - 使用最新API
export const server = setupServer(
    // 健康检查API
    http.get("/api/health", () => {
        return HttpResponse.json({
            status: "ok",
            timestamp: new Date().toISOString(),
            uptime: 1234,
        });
    }),

    // 认证相关API mock
    http.post("/api/auth/signin", async ({ request }) => {
        const body = (await request.json()) as {
            email?: string;
            password?: string;
        };

        // 基本验证
        if (!body.email || !body.password) {
            return HttpResponse.json(
                { error: "Missing email or password" },
                { status: 400 },
            );
        }

        return HttpResponse.json({
            success: true,
            user: {
                id: "test-user-id",
                email: body.email,
                name: "Test User",
            },
        });
    }),

    http.post("/api/auth/signout", () => {
        return HttpResponse.json({ success: true });
    }),

    // 用户管理API mock
    http.get("/api/admin/users", ({ request }) => {
        const url = new URL(request.url);
        const page = url.searchParams.get("page") || "1";
        const limit = url.searchParams.get("limit") || "10";
        const search = url.searchParams.get("search") || "";

        const mockUsers = [
            {
                id: "1",
                email: "admin@example.com",
                name: "Admin User",
                role: "admin",
                createdAt: new Date().toISOString(),
            },
            {
                id: "2",
                email: "user@example.com",
                name: "Regular User",
                role: "user",
                createdAt: new Date().toISOString(),
            },
        ];

        let filteredUsers = mockUsers;
        if (search) {
            filteredUsers = mockUsers.filter(
                (user) =>
                    user.name.toLowerCase().includes(search.toLowerCase()) ||
                    user.email.toLowerCase().includes(search.toLowerCase()),
            );
        }

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;

        return HttpResponse.json({
            users: filteredUsers.slice(startIndex, endIndex),
            total: filteredUsers.length,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(filteredUsers.length / limitNum),
        });
    }),

    // 任务管理API mock
    http.get("/api/todos", () => {
        return HttpResponse.json({
            todos: [
                {
                    id: "1",
                    title: "Test Todo 1",
                    completed: false,
                    createdAt: new Date().toISOString(),
                },
                {
                    id: "2",
                    title: "Test Todo 2",
                    completed: true,
                    createdAt: new Date().toISOString(),
                },
            ],
        });
    }),

    // 通用错误处理
    http.all("*", ({ request }) => {
        console.warn(
            `MSW: Unhandled ${request.method} request to ${request.url}`,
        );
        return HttpResponse.json(
            { error: "API endpoint not found" },
            { status: 404 },
        );
    }),
);

// 在所有测试开始前启动服务器
beforeAll(() => {
    server.listen({
        onUnhandledRequest: "warn",
    });
});

// 每个测试后重置处理器
afterEach(() => {
    server.resetHandlers();
});

// 所有测试结束后关闭服务器
afterAll(() => {
    server.close();
});

// 测试工具函数
type MockUser = {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
};

type MockTodo = {
    id: string;
    title: string;
    completed: boolean;
    createdAt: string;
};

export const createMockUser = (overrides: Partial<MockUser> = {}) => ({
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    role: "user",
    createdAt: new Date().toISOString(),
    ...overrides,
});

export const createMockTodo = (overrides: Partial<MockTodo> = {}) => ({
    id: "test-todo-id",
    title: "Test Todo",
    completed: false,
    createdAt: new Date().toISOString(),
    ...overrides,
});

declare global {
    // eslint-disable-next-line no-var
    var testUtils: {
        createMockUser: typeof createMockUser;
        createMockTodo: typeof createMockTodo;
        server: typeof server;
    };
}

// 全局测试变量
globalThis.testUtils = {
    createMockUser,
    createMockTodo,
    server,
};
