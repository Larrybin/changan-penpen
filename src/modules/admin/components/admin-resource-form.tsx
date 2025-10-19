"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import type {
    DefaultValues,
    FieldValues,
    UseFormReturn,
} from "react-hook-form";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { adminQueryKeys } from "@/lib/query/keys";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
    createAdminRecord,
    updateAdminRecord,
} from "@/modules/admin/api/resources";
import { applyApiErrorToForm } from "@/modules/admin/utils/form-errors";

type PrepareSubmitFn<TFieldValues extends FieldValues> = (
    values: TFieldValues,
) => unknown;

interface SuccessMessages {
    create: string;
    update: string;
}

export interface AdminResourceFormProps<TFieldValues extends FieldValues> {
    resource: string;
    id?: number;
    defaultValues: DefaultValues<TFieldValues>;
    initialValues?: Partial<TFieldValues>;
    successMessages: SuccessMessages;
    cancelHref: string;
    prepareSubmit?: PrepareSubmitFn<TFieldValues>;
    formClassName?: string;
    children: (form: UseFormReturn<TFieldValues>) => ReactNode;
}

export function AdminResourceForm<TFieldValues extends FieldValues>({
    resource,
    id,
    defaultValues,
    initialValues,
    successMessages,
    cancelHref,
    prepareSubmit,
    formClassName,
    children,
}: AdminResourceFormProps<TFieldValues>) {
    const router = useRouter();
    const queryClient = useQueryClient();

    const computedDefaults = useMemo(
        () => ({ ...defaultValues, ...initialValues }),
        [defaultValues, initialValues],
    );

    const form = useForm<TFieldValues>({
        defaultValues: computedDefaults,
    });

    useEffect(() => {
        if (initialValues) {
            form.reset({ ...defaultValues, ...initialValues });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialValues, defaultValues, form.reset]);

    const mutation = useMutation({
        mutationFn: async (values: TFieldValues) => {
            const payload = (prepareSubmit ?? ((input) => input))(values);

            if (id) {
                return updateAdminRecord({
                    resource,
                    id,
                    variables: payload,
                });
            }

            return createAdminRecord({
                resource,
                variables: payload,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: adminQueryKeys.resource(resource),
            });
            toast.success(id ? successMessages.update : successMessages.create);
            router.push(cancelHref);
        },
        onError: (error) => {
            applyApiErrorToForm(form, error);
        },
    });

    const handleSubmit = form.handleSubmit(async (values) => {
        await mutation.mutateAsync(values);
    });

    const isSubmitting = form.formState.isSubmitting || mutation.isPending;

    return (
        <form
            onSubmit={handleSubmit}
            className={cn("space-y-4", formClassName)}
        >
            {children(form)}
            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(cancelHref)}
                >
                    取消
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    保存
                </Button>
            </div>
        </form>
    );
}
