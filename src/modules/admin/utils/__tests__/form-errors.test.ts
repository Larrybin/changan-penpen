import type { FieldValues, UseFormReturn } from "react-hook-form";
import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/http-error";

import { applyApiErrorToForm } from "../form-errors";

function createFormStub<FormValues extends FieldValues>() {
    const errors: Record<string, unknown> = {};
    return {
        form: {
            setError: (name: string, error: unknown) => {
                errors[name] = error;
            },
        } as unknown as UseFormReturn<FormValues>,
        errors,
    } as const;
}

describe("applyApiErrorToForm", () => {
    it("maps field errors to the form", () => {
        const { form, errors } = createFormStub<{ email: string }>();

        const error = new ApiError("Validation failed", {
            status: 422,
            code: "VALIDATION_FAILED",
            details: {
                fieldErrors: {
                    email: "邮箱格式不正确",
                },
            },
        });

        const result = applyApiErrorToForm(form, error);

        expect(result).toBe(true);
        expect(errors.email).toMatchObject({ message: "邮箱格式不正确" });
    });

    it("sets root error when no field errors are present", () => {
        const { form, errors } = createFormStub<Record<string, string>>();

        const error = new ApiError("Server error", {
            status: 500,
            code: "INTERNAL_ERROR",
        });

        const result = applyApiErrorToForm(form, error);

        expect(result).toBe(false);
        expect(errors.root).toMatchObject({ message: "Server error" });
    });
});
