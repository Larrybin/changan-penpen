import type { ComponentProps } from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";

import { AdminTodoForm } from "@/modules/admin/todos/components/todo-form";
import { TodoPriority, TodoStatus } from "@/modules/todos/models/todo.enum";

import { customRender, setupUserEvent } from "../setup";

const applyApiErrorToFormMock = vi.hoisted(() => vi.fn());

vi.mock("@/modules/admin/utils/form-errors", () => ({
    applyApiErrorToForm: (...args: unknown[]) => applyApiErrorToFormMock(...args),
}));

describe("AdminTodoForm", () => {
    let user: ReturnType<typeof setupUserEvent>;

    const categories = [
        { id: 1, name: "Backlog" },
        { id: 2, name: "Design" },
    ];

    beforeEach(() => {
        user = setupUserEvent();
        applyApiErrorToFormMock.mockReset();
    });

    const renderForm = (props: Partial<ComponentProps<typeof AdminTodoForm>> = {}) =>
        customRender(
            <AdminTodoForm
                categories={categories}
                onSubmit={vi.fn()}
                {...props}
            />,
        );

    it("disables submission until a tenant id is provided", async () => {
        renderForm();

        const submitButton = screen.getByRole("button", { name: "保存" });
        expect(submitButton).toBeDisabled();

        const tenantInput = screen.getByLabelText("租户 ID");
        await user.type(tenantInput, "tenant-1");

        expect(submitButton).not.toBeDisabled();
    });

    it("submits normalized form values", async () => {
        const handleSubmit = vi.fn().mockResolvedValue(undefined);

        renderForm({ onSubmit: handleSubmit });

        await user.type(screen.getByLabelText("租户 ID"), "tenant-42");
        await user.type(screen.getByLabelText("标题"), "新的任务");
        await user.type(screen.getByLabelText("描述"), "补充说明");

        await user.click(screen.getByRole("button", { name: "保存" }));

        expect(handleSubmit).toHaveBeenCalledTimes(1);
        expect(handleSubmit).toHaveBeenCalledWith({
            categoryId: undefined,
            completed: false,
            description: "补充说明",
            dueDate: undefined,
            imageAlt: "",
            imageUrl: "",
            priority: TodoPriority.MEDIUM,
            status: TodoStatus.PENDING,
            title: "新的任务",
            userId: "tenant-42",
        });
    });

    it("applies API errors when submission fails", async () => {
        const submissionError = new Error("failed");
        const handleSubmit = vi.fn().mockRejectedValue(submissionError);

        renderForm({ onSubmit: handleSubmit });

        await user.type(screen.getByLabelText("租户 ID"), "tenant-42");
        await user.type(screen.getByLabelText("标题"), "新的任务");

        await user.click(screen.getByRole("button", { name: "保存" }));

        await waitFor(() => {
            expect(handleSubmit).toHaveBeenCalledTimes(1);
        });
        await expect(handleSubmit.mock.results[0]?.value).rejects.toThrow("failed");
        expect(applyApiErrorToFormMock).toHaveBeenCalled();
    });

    it("notifies tenant changes on initial values and user edits", async () => {
        const onTenantChange = vi.fn();

        renderForm({
            onTenantChange,
            initialValues: {
                userId: "tenant-5",
                title: "初始任务",
            },
        });

        await waitFor(() => {
            expect(onTenantChange).toHaveBeenCalledWith("tenant-5");
        });

        await user.type(screen.getByLabelText("租户 ID"), "-updated");

        expect(onTenantChange).toHaveBeenLastCalledWith("tenant-5-updated");
    });
});
