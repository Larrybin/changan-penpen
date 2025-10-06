import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock server actions used by the component
vi.mock("../../actions/auth.action", () => ({
    signIn: vi.fn().mockResolvedValue({
        success: true,
        code: "SIGNED_IN",
        messageKey: "signInSuccess",
    }),
}));

import { type AbstractIntlMessages, NextIntlClientProvider } from "next-intl";
import enMessages from "@/i18n/messages/en.json";
import frMessages from "@/i18n/messages/fr.json";
import { LoginForm } from "../login-form";

const createToastMock = () =>
    Object.assign(vi.fn(), {
        success: vi.fn(),
        error: vi.fn(),
    });

type ToastMock = ReturnType<typeof createToastMock>;

const importToast = async (): Promise<ToastMock> => {
    const module = await import("react-hot-toast");
    return module.default as unknown as ToastMock;
};

vi.mock("react-hot-toast", () => {
    const toast = createToastMock();
    return { default: toast };
});

describe("LoginForm", () => {
    const renderWithMessages = (
        locale: string,
        messages: Record<string, unknown>,
    ) =>
        render(
            <NextIntlClientProvider
                locale={locale}
                messages={messages as unknown as AbstractIntlMessages}
            >
                <LoginForm />
            </NextIntlClientProvider>,
        );

    it("renders English copy", () => {
        renderWithMessages("en", enMessages);

        expect(
            screen.getByRole("heading", {
                level: 2,
                name: enMessages.AuthForms.Login.title,
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByText(enMessages.AuthForms.Login.description),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", {
                name: enMessages.AuthForms.Login.googleCta,
            }),
        ).toBeInTheDocument();
    });

    it("shows validation in French", async () => {
        renderWithMessages("fr", frMessages);

        fireEvent.click(
            screen.getByRole("button", {
                name: frMessages.AuthForms.Login.submit,
            }),
        );

        expect(
            await screen.findByText(
                frMessages.AuthForms.Validation.email.required,
            ),
        ).toBeInTheDocument();

        // Minimal snapshot to detect key regressions
        expect(screen.getByRole("heading", { level: 2 })).toMatchSnapshot();
    });

    it("fires localized forgot-password toast (EN)", async () => {
        const toast = await importToast();
        renderWithMessages("en", enMessages);

        fireEvent.click(
            screen.getByRole("button", {
                name: enMessages.AuthForms.Login.forgotPassword,
            }),
        );

        expect(toast).toHaveBeenCalledWith(
            enMessages.AuthForms.Login.forgotUnavailable,
        );
    });

    it("shows password min length message with count (FR)", async () => {
        renderWithMessages("fr", frMessages);

        // Fill a valid email and a short password to trigger min-length
        fireEvent.change(
            screen.getByLabelText(
                frMessages.AuthForms.Shared.fields.email.label,
            ),
            {
                target: { value: "john@doe.com" },
            },
        );
        fireEvent.change(
            screen.getByLabelText(
                frMessages.AuthForms.Shared.fields.password.label,
            ),
            { target: { value: "short" } },
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: frMessages.AuthForms.Login.submit,
            }),
        );

        expect(
            await screen.findByText(
                frMessages.AuthForms.Validation.password.min.replace(
                    "{count}",
                    "8",
                ),
            ),
        ).toBeInTheDocument();
    });

    it("shows success toast on sign-in using i18n key (EN)", async () => {
        const toast = await importToast();
        renderWithMessages("en", enMessages);

        fireEvent.change(
            screen.getByLabelText(
                enMessages.AuthForms.Shared.fields.email.label,
            ),
            { target: { value: "john@doe.com" } },
        );
        fireEvent.change(
            screen.getByLabelText(
                enMessages.AuthForms.Shared.fields.password.label,
            ),
            { target: { value: "password123" } },
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: enMessages.AuthForms.Login.submit,
            }),
        );

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(
                enMessages.AuthForms.Messages.signInSuccess,
            );
        });
    });
});
