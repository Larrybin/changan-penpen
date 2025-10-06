import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { type AbstractIntlMessages, NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import enMessages from "@/i18n/messages/en.json";
import LogoutButton from "../logout-button";

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
            <NextIntlClientProvider
                locale="en"
                messages={enMessages as unknown as AbstractIntlMessages}
            >
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
