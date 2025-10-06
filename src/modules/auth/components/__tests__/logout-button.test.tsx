import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { vi } from "vitest";
import enMessages from "@/i18n/messages/en.json";
import LogoutButton from "../logout-button";

type ToastMock = {
    (...args: unknown[]): unknown;
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
};

const createToastMock = (): ToastMock => {
    const toast = vi.fn<(...args: unknown[]) => unknown>() as ToastMock;
    toast.success = vi.fn();
    toast.error = vi.fn();
    return toast;
};

const importToast = async (): Promise<ToastMock> => {
    const module = (await import("react-hot-toast")) as { default: ToastMock };
    return module.default;
};

vi.mock("react-hot-toast", () => {
    const toast = createToastMock();
    return { default: toast };
});

vi.mock("../../actions/auth.action", () => ({
    signOut: vi.fn().mockResolvedValue({
        success: true,
        code: "SIGNED_OUT",
        messageKey: "signOutSuccess",
    }),
}));

describe("LogoutButton", () => {
    it("renders and triggers localized success toast on click", async () => {
        const toast = await importToast();

        render(
            <NextIntlClientProvider locale="en" messages={enMessages}>
                <LogoutButton />
            </NextIntlClientProvider>,
        );

        fireEvent.click(
            screen.getByRole("button", { name: enMessages.Auth.logout }),
        );

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(
                enMessages.AuthForms.Messages.signOutSuccess,
            );
        });
    });
});
