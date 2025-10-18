import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Toast, toast } from "../toast";

describe("Toast", () => {
    it("announces notifications with accessible markup", async () => {
        const user = userEvent.setup();

        render(<Toast />);

        await act(async () => {
            toast.success("Profile saved", {
                description: "Your settings will sync shortly.",
            });
        });

        const liveRegion = await screen.findByLabelText(/notifications/i);
        expect(liveRegion).toHaveAttribute("aria-live", "polite");

        const title = within(liveRegion).getByText(/profile saved/i);
        const description = within(liveRegion).getByText(
            /your settings will sync shortly/i,
        );

        expect(title).toBeInTheDocument();
        expect(description).toBeInTheDocument();

        const closeButton = screen.getByRole("button", { name: /close/i });
        await user.click(closeButton);

        await waitFor(() => {
            expect(
                screen.queryByText(/profile saved/i),
            ).not.toBeInTheDocument();
        });
    });
});
