import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { type AbstractIntlMessages, NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useZodForm } from "../use-zod-form";

const messages = {
    Forms: {
        submission: {
            success: "Submission successful",
            error: "Submission failed",
        },
    },
} satisfies AbstractIntlMessages;

function AccessibleFormExample() {
    const { form, handleSubmit } = useZodForm({
        schema: z.object({
            email: z.string().email("Please enter a valid email address."),
        }),
        defaultValues: {
            email: "",
        },
        async onSubmit() {
            return Promise.resolve();
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit} noValidate>
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email address</FormLabel>
                            <FormControl>
                                <Input
                                    type="email"
                                    placeholder="you@example.com"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                We use this to send account updates.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <button type="submit">Submit</button>
            </form>
        </Form>
    );
}

describe("Form", () => {
    it("associates descriptions and errors for screen readers", async () => {
        const user = userEvent.setup();

        const { container } = render(
            <NextIntlClientProvider locale="en" messages={messages}>
                <AccessibleFormExample />
            </NextIntlClientProvider>,
        );

        const emailInput = screen.getByLabelText(/email address/i);
        const description = screen.getByText(/send account updates/i);

        expect(emailInput).toHaveAttribute("aria-describedby");
        expect(emailInput.getAttribute("aria-describedby")).toContain(
            description.id,
        );
        expect(emailInput).toHaveAttribute("aria-invalid", "false");

        await user.click(screen.getByRole("button", { name: /submit/i }));

        const errorMessage = await screen.findByText(
            /please enter a valid email address/i,
        );

        expect(emailInput).toHaveAttribute("aria-invalid", "true");
        expect(emailInput.getAttribute("aria-describedby")).toContain(
            errorMessage.id,
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
