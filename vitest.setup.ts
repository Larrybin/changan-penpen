import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import type { ComponentProps, PropsWithChildren } from "react";
import { afterEach, vi } from "vitest";

afterEach(() => {
    cleanup();
});

// Ensure React is available in scope for components compiled with classic JSX
// or libraries that expect global React in test environment
(globalThis as any).React = React;

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
