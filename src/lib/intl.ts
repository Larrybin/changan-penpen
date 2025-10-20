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

export function omitMessages(
    messages: AbstractIntlMessages,
    namespaces: readonly string[],
): AbstractIntlMessages {
    const omitSet = new Set(namespaces);

    return Object.entries(messages as Record<string, unknown>).reduce(
        (acc, [namespace, value]) => {
            if (!omitSet.has(namespace) && value !== undefined) {
                (acc as Record<string, unknown>)[namespace] = value;
            }

            return acc;
        },
        {} as AbstractIntlMessages,
    );
}
