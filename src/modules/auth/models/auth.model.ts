import { z } from "zod";

type TranslateFn = (
    key: string,
    values?: Record<string, string | number | Date>,
) => string;

const defaultTranslate: TranslateFn = (key) => key;

export const createSignInSchema = (t: TranslateFn) =>
    z.object({
        email: z
            .string()
            .trim()
            .min(1, { message: t("email.required") })
            .email({ message: t("email.invalid") }),
        password: z
            .string()
            .min(1, { message: t("password.required") })
            .min(8, { message: t("password.min", { count: 8 }) }),
    });

export const createSignUpSchema = (t: TranslateFn) =>
    createSignInSchema(t).extend({
        username: z
            .string()
            .trim()
            .min(1, { message: t("username.required") })
            .min(3, { message: t("username.min", { count: 3 }) }),
    });

export const signInSchema = createSignInSchema(defaultTranslate);

export type SignInSchema = z.infer<typeof signInSchema>;

export const signUpSchema = createSignUpSchema(defaultTranslate);

export type SignUpSchema = z.infer<typeof signUpSchema>;

export type AuthResponse = {
    success: boolean;
    code: "SIGNED_IN" | "SIGNED_UP" | "SIGNED_OUT" | "ERROR";
    messageKey: string; // i18n key within AuthForms.Messages namespace
    message?: string; // optional raw message from server for logging/fallback
};
