import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import { type AbstractIntlMessages, NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import enMessages from "@/i18n/messages/en.json";
import LogoutButton from "../logout-button";

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

vi.mock("../../actions/auth.action", () => ({
    signOut: vi.fn().mockResolvedValue({
        success: true,
        code: "SIGNED_OUT",
        messageKey: "signOutSuccess",
    }),
}));

describe("LogoutButton", () => {
    it("renders and triggers localized success toast on click", async () => {
        const toast = toastMock;

        render(
            <NextIntlClientProvider
                locale="en"
                messages={enMessages as unknown as AbstractIntlMessages}
            >
                <LogoutButton />
            </NextIntlClientProvider>,
        );

        await act(async () => {
            fireEvent.click(
                screen.getByRole("button", { name: enMessages.Auth.logout }),
            );
        });

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(
                enMessages.AuthForms.Messages.signOutSuccess,
            );
        });
    });
});
