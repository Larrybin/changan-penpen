import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type AbstractIntlMessages, NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import deMessages from "@/i18n/messages/de.json";
import ptMessages from "@/i18n/messages/pt.json";
import { SignupForm } from "../signup-form";

const toastMock = vi.hoisted(() => ({
    success: vi.fn(),
    error: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
    __esModule: true,
    toast: toastMock,
    default: toastMock,
}));

beforeEach(() => {
    for (const fn of Object.values(toastMock)) {
        fn.mockReset();
    }
});

// Mock server actions used by the component
vi.mock("../../actions/auth.action", () => ({
    signUp: vi.fn().mockResolvedValue({
        success: true,
        code: "SIGNED_UP",
        messageKey: "signUpSuccess",
    }),
}));

describe("SignupForm", () => {
    const renderWithMessages = (
        locale: string,
        messages: Record<string, unknown>,
    ) =>
        render(
            <NextIntlClientProvider
                locale={locale}
                messages={messages as unknown as AbstractIntlMessages}
            >
                <SignupForm />
            </NextIntlClientProvider>,
        );

    it("renders Portuguese copy", () => {
        renderWithMessages("pt", ptMessages);

        expect(
            screen.getByRole("heading", {
                level: 2,
                name: ptMessages.AuthForms.Signup.title,
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", {
                name: ptMessages.AuthForms.Signup.googleCta,
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByLabelText(
                ptMessages.AuthForms.Shared.fields.username.label,
            ),
        ).toBeInTheDocument();
    });

    it("shows validation in German", async () => {
        renderWithMessages("de", deMessages);

        fireEvent.click(
            screen.getByRole("button", {
                name: deMessages.AuthForms.Signup.submit,
            }),
        );

        expect(
            await screen.findByText(
                deMessages.AuthForms.Validation.username.required,
            ),
        ).toBeInTheDocument();

        // Minimal snapshot to detect key regressions
        expect(screen.getByRole("heading", { level: 2 })).toMatchSnapshot();
    });

    it("shows username min length with count (DE)", async () => {
        renderWithMessages("de", deMessages);

        const user = userEvent.setup();

        const usernameInput = screen.getByLabelText(
            deMessages.AuthForms.Shared.fields.username.label,
        );
        const emailInput = screen.getByLabelText(
            deMessages.AuthForms.Shared.fields.email.label,
        );
        const passwordInput = screen.getByLabelText(
            deMessages.AuthForms.Shared.fields.password.label,
        );
        const submitButton = screen.getByRole("button", {
            name: deMessages.AuthForms.Signup.submit,
        });

        await user.click(submitButton);

        await user.type(usernameInput, "ab");
        await user.type(emailInput, "john@doe.com");
        await user.type(passwordInput, "12345678");

        expect((usernameInput as HTMLInputElement).value).toBe("ab");
        expect((emailInput as HTMLInputElement).value).toBe("john@doe.com");
        expect((passwordInput as HTMLInputElement).value).toBe("12345678");

        await user.click(submitButton);

        const minMessage = deMessages.AuthForms.Validation.username.min.replace(
            "{count}",
            "3",
        );
        expect(await screen.findByText(minMessage)).toBeInTheDocument();
    });
});
