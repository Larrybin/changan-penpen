import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Toast, toast } from "@/components/ui/toast";

function InteractionPlayground() {
    return (
        <>
            <Dialog>
                <DialogTrigger asChild>
                    <Button type="button">Manage plan</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogTitle>Subscription</DialogTitle>
                    <DialogDescription>
                        Choose your plan and confirm to save.
                    </DialogDescription>
                    <Select defaultValue="starter">
                        <SelectTrigger aria-label="Plan">
                            <SelectValue placeholder="Select a plan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="starter">Starter</SelectItem>
                            <SelectItem value="growth">Growth</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => toast.info("No changes applied")}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() =>
                                toast.success("Plan updated", {
                                    description: "Customers will see the new pricing.",
                                })
                            }
                        >
                            Save changes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <Toast />
        </>
    );
}

describe("UI regression flow", () => {
    it("supports dialog focus, select keyboard control, and toast feedback", async () => {
        const user = userEvent.setup();

        render(<InteractionPlayground />);

        const trigger = screen.getByRole("button", { name: /manage plan/i });
        await user.click(trigger);

        const dialog = await screen.findByRole("dialog", {
            name: /subscription/i,
        });
        expect(dialog).toBeVisible();

        const combobox = within(dialog).getByRole("combobox", { name: /plan/i });
        expect(combobox).toHaveTextContent(/starter/i);

        await user.click(combobox);
        await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
        expect(combobox).toHaveTextContent(/enterprise/i);

        await user.click(
            within(dialog).getByRole("button", { name: /save changes/i }),
        );

        const successToast = await screen.findByRole("status", {
            name: /plan updated/i,
        });
        expect(successToast).toHaveTextContent(
            /customers will see the new pricing/i,
        );

        await user.keyboard("{Escape}");

        expect(trigger).toHaveFocus();
    });
});
