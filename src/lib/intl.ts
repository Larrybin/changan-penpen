import type { AbstractIntlMessages } from "next-intl";

export function pickMessages(
    messages: AbstractIntlMessages,
    namespaces: readonly string[],
): AbstractIntlMessages {
    return namespaces.reduce<AbstractIntlMessages>((acc, namespace) => {
        const value = (messages as Record<string, unknown>)[namespace];

        if (value !== undefined) {
            (acc as Record<string, unknown>)[namespace] = value;
        }

        return acc;
    }, {} as AbstractIntlMessages);
}
