import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/i18n/messages/en.json";
import LogoutButton from "../logout-button";
import { vi } from "vitest";

vi.mock("react-hot-toast", () => {
    const fn: any = vi.fn();
    fn.success = vi.fn();
    fn.error = vi.fn();
    return { default: fn };
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
        const toast = (await import("react-hot-toast")).default as any;

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
