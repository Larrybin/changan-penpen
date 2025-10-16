import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

const toastMock = vi.hoisted(() => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
}));

beforeEach(() => {
    for (const fn of Object.values(toastMock)) {
        fn.mockReset();
    }
});

vi.mock("@/lib/toast", () => ({
    __esModule: true,
    toast: toastMock,
    default: toastMock,
}));

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
        renderWithMessages("en", enMessages);

        fireEvent.click(
            screen.getByRole("button", {
                name: enMessages.AuthForms.Login.forgotPassword,
            }),
        );

        expect(toastMock.info).toHaveBeenCalledWith(
            enMessages.AuthForms.Login.forgotUnavailable,
        );
    });

    it("shows password min length message with count (FR)", async () => {
        renderWithMessages("fr", frMessages);

        const user = userEvent.setup();
        const emailInput = screen.getByLabelText(
            frMessages.AuthForms.Shared.fields.email.label,
        );
        const passwordInput = screen.getByLabelText(
            frMessages.AuthForms.Shared.fields.password.label,
        );
        const submitButton = screen.getByRole("button", {
            name: frMessages.AuthForms.Login.submit,
        });

        await user.type(emailInput, "john@doe.com");
        await user.type(passwordInput, "short");

        await user.click(submitButton);

        const minMessage = frMessages.AuthForms.Validation.password.min.replace(
            "{count}",
            "8",
        );

        expect(await screen.findByText(minMessage)).toBeInTheDocument();
    });
});
