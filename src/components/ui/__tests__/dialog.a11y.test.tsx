import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from "../dialog";

describe("Dialog", () => {
    it("provides an accessible name and description when opened", async () => {
        const user = userEvent.setup();

        render(
            <Dialog>
                <DialogTrigger>Open dialog</DialogTrigger>
                <DialogContent>
                    <DialogTitle>Manage subscription</DialogTitle>
                    <DialogDescription>
                        Choose a plan and confirm. Press escape to close.
                    </DialogDescription>
                </DialogContent>
            </Dialog>,
        );

        await user.click(screen.getByRole("button", { name: /open dialog/i }));

        const dialog = await screen.findByRole("dialog", {
            name: /manage subscription/i,
        });
        expect(dialog).toBeVisible();
        expect(dialog).toHaveAccessibleDescription(
            "Choose a plan and confirm. Press escape to close.",
        );
    });
});
