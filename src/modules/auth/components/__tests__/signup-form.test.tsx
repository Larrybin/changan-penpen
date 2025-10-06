import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { type AbstractIntlMessages, NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import deMessages from "@/i18n/messages/de.json";
import ptMessages from "@/i18n/messages/pt.json";
import { SignupForm } from "../signup-form";

function createToastMock() {
    return Object.assign(vi.fn(), {
        success: vi.fn(),
        error: vi.fn(),
    });
}

type ToastMock = ReturnType<typeof createToastMock>;

const importToast = async (): Promise<ToastMock> => {
    const module = await import("react-hot-toast");
    return module.default as unknown as ToastMock;
};

vi.mock("react-hot-toast", () => {
    const toast = createToastMock();
    return { default: toast };
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

        // Provide too short username and valid email/password
        fireEvent.change(
            screen.getByLabelText(
                deMessages.AuthForms.Shared.fields.username.label,
            ),
            { target: { value: "ab" } },
        );
        fireEvent.change(
            screen.getByLabelText(
                deMessages.AuthForms.Shared.fields.email.label,
            ),
            { target: { value: "john@doe.com" } },
        );
        fireEvent.change(
            screen.getByLabelText(
                deMessages.AuthForms.Shared.fields.password.label,
            ),
            { target: { value: "12345678" } },
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: deMessages.AuthForms.Signup.submit,
            }),
        );

        expect(
            await screen.findByText(
                deMessages.AuthForms.Validation.username.min.replace(
                    "{count}",
                    "3",
                ),
            ),
        ).toBeInTheDocument();
    });

    it("shows success toast on sign-up using i18n key (PT)", async () => {
        const toast = await importToast();
        renderWithMessages("pt", ptMessages);

        fireEvent.change(
            screen.getByLabelText(
                ptMessages.AuthForms.Shared.fields.username.label,
            ),
            { target: { value: "usuario" } },
        );
        fireEvent.change(
            screen.getByLabelText(
                ptMessages.AuthForms.Shared.fields.email.label,
            ),
            { target: { value: "user@mail.com" } },
        );
        fireEvent.change(
            screen.getByLabelText(
                ptMessages.AuthForms.Shared.fields.password.label,
            ),
            { target: { value: "password123" } },
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: ptMessages.AuthForms.Signup.submit,
            }),
        );

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(
                ptMessages.AuthForms.Messages.signUpSuccess,
            );
        });
    });
});
