import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { toHaveNoViolations } from "jest-axe";
import type { ComponentProps, PropsWithChildren } from "react";
import React from "react";
import { afterEach, expect, vi } from "vitest";

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
