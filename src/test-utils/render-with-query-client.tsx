import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

interface RenderWithQueryClientOptions {
    client?: QueryClient;
}

export function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
}

export function renderWithQueryClient(
    ui: ReactNode,
    options: RenderWithQueryClientOptions = {},
) {
    const client = options.client ?? createTestQueryClient();
    const result = render(
        <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
    );
    return { ...result, client };
}
