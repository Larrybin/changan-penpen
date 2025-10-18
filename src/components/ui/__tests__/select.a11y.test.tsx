import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../select";

describe("Select", () => {
    it("supports keyboard navigation and announces the active option", async () => {
        const user = userEvent.setup();

        render(
            <Select defaultValue="apple">
                <SelectTrigger aria-label="Favorite fruit">
                    <SelectValue placeholder="Choose a fruit" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="apple">Apple</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                    <SelectItem value="pear">Pear</SelectItem>
                </SelectContent>
            </Select>,
        );

        const trigger = screen.getByRole("combobox", {
            name: /favorite fruit/i,
        });
        expect(trigger).toHaveTextContent("Apple");

        await user.click(trigger);
        await user.keyboard("{ArrowDown}");
        await user.keyboard("{Enter}");

        await screen.findByText("Orange");
        expect(trigger).toHaveTextContent("Orange");
    });
});
