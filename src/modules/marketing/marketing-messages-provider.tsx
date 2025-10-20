"use client";

import type React from "react";
import { useMemo } from "react";
import {
    type AbstractIntlMessages,
    NextIntlClientProvider,
    useLocale,
    useMessages,
} from "next-intl";

interface MarketingMessagesProviderProps {
    children: React.ReactNode;
    messages: AbstractIntlMessages;
}

export function MarketingMessagesProvider({
    children,
    messages,
}: MarketingMessagesProviderProps) {
    const locale = useLocale();
    const parentMessages = useMessages();
    const mergedMessages = useMemo(
        () =>
            ({
                ...(parentMessages ?? {}),
                ...messages,
            }) as AbstractIntlMessages,
        [parentMessages, messages],
    );

    return (
        <NextIntlClientProvider locale={locale} messages={mergedMessages}>
            {children}
        </NextIntlClientProvider>
    );
}
