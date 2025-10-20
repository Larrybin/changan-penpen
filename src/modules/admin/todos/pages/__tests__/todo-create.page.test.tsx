import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import { toast } from "@/lib/toast";
import { renderWithQueryClient } from "@/test-utils/render-with-query-client";
import AdminTodoCreatePage from "../todo-create.page";

const pushMock = vi.fn();
const replaceMock = vi.fn();
const prefetchMock = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: pushMock,
        replace: replaceMock,
        prefetch: prefetchMock,
    }),
}));

const server = testUtils.server;

afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
    pushMock.mockReset();
    replaceMock.mockReset();
    prefetchMock.mockReset();
});

describe("AdminTodoCreatePage", () => {
    it("submits the form and redirects to the todo list", async () => {
        const capturedSearchParams: string[] = [];
        let capturedBody: unknown;

        server.use(
            http.get("/api/v1/admin/categories", ({ request }) => {
                const url = new URL(request.url);
                capturedSearchParams.push(url.searchParams.toString());
                return HttpResponse.json({
                    data: [
                        { id: 1, name: "默认分类" },
                        { id: 2, name: "扩展分类" },
                    ],
                    total: 2,
                });
            }),
            http.post("/api/v1/admin/todos", async ({ request }) => {
                capturedBody = await request.json();
                return HttpResponse.json({ data: { id: 42 } });
            }),
        );

        const toastSpy = vi.spyOn(toast, "success");

        renderWithQueryClient(<AdminTodoCreatePage />);

        await userEvent.type(screen.getByLabelText("租户 ID"), "tenant-1");
        await userEvent.type(screen.getByLabelText("标题"), "新增任务");

        await waitFor(() => {
            expect(
                capturedSearchParams.some((entry) =>
                    entry.includes("tenantId=tenant-1"),
                ),
            ).toBe(true);
        });

        await userEvent.click(screen.getByRole("button", { name: "创建" }));

        await waitFor(() => {
            expect(toastSpy).toHaveBeenCalledWith("Todo 已创建");
            expect(pushMock).toHaveBeenCalledWith(
                expect.stringContaining("/admin/todos"),
            );
            expect(capturedBody).toMatchObject({
                userId: "tenant-1",
                title: "新增任务",
            });
        });

        toastSpy.mockRestore();
    });
});
