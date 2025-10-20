import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/lib/toast";
import { renderWithQueryClient } from "@/test-utils/render-with-query-client";
import { ProductsListPage } from "../products-list.page";

const server = testUtils.server;

afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
});

describe("ProductsListPage", () => {
    it("renders skeleton rows while the list is loading", async () => {
        server.use(
            http.get("/api/v1/admin/products", async () => {
                await new Promise((resolve) => setTimeout(resolve, 50));
                return HttpResponse.json({ data: [], total: 0 });
            }),
        );

        const { container } = renderWithQueryClient(<ProductsListPage />);

        await waitFor(() => {
            expect(
                container.querySelectorAll(".animate-pulse.bg-muted"),
            ).not.toHaveLength(0);
        });
    });

    it("renders product rows and handles deletions", async () => {
        const deleteSpy = vi.fn();
        server.use(
            http.get("/api/v1/admin/products", () =>
                HttpResponse.json({
                    data: [
                        {
                            id: 1,
                            name: "Pro 订阅",
                            slug: "pro",
                            priceCents: 9900,
                            currency: "CNY",
                            status: "active",
                        },
                    ],
                    total: 1,
                }),
            ),
            http.delete("/api/v1/admin/products/:id", ({ params }) => {
                deleteSpy(params.id);
                return new HttpResponse(null, { status: 204 });
            }),
        );
        const toastSpy = vi.spyOn(toast, "success");

        renderWithQueryClient(<ProductsListPage />);

        const nameCell = await screen.findByText("Pro 订阅");
        const row = nameCell.closest("tr");
        expect(row).not.toBeNull();
        if (!row) {
            return;
        }

        expect(
            within(row).getByText((content) => content.includes("99.00")),
        ).toBeInTheDocument();

        await userEvent.click(
            within(row).getByRole("button", { name: "删除" }),
        );

        await waitFor(() => {
            expect(deleteSpy).toHaveBeenCalledWith("1");
            expect(toastSpy).toHaveBeenCalledWith("商品已删除");
        });

        toastSpy.mockRestore();
    });
});
