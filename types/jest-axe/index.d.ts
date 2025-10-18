import type { AxeResults } from "axe-core";
type MatcherResult = {
    pass: boolean;
    message(): string;
};

declare module "jest-axe" {
    type RawMatcher = (...args: unknown[]) => MatcherResult;

    export interface AxeMatchers extends Record<string, RawMatcher> {
        toHaveNoViolations: RawMatcher;
    }

    export const toHaveNoViolations: AxeMatchers;

    export interface AxeRunOptions {
        rules?: Record<string, { enabled?: boolean } | boolean>;
    }

    export function axe(
        node: Parameters<typeof import("axe-core").run>[0],
        options?: AxeRunOptions,
    ): Promise<AxeResults>;
}

declare module "vitest" {
    interface Assertion<T = unknown> {
        toHaveNoViolations(): T;
    }

    interface AsymmetricMatchersContaining {
        toHaveNoViolations(): unknown;
    }
}
