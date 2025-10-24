import type { Metadata } from "next";
import "./globals.css";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import { WebVitals } from "@/components/performance/web-vitals";
import { InjectedHtml } from "@/components/seo/custom-html";
import { resolveAppLocale } from "@/i18n/config";
import { pickMessages } from "@/lib/intl";
import { readCspNonce } from "@/lib/security/csp";
import { sanitizeCustomHtml } from "@/lib/seo";
import { createMetadata, getMetadataContext } from "@/lib/seo-metadata";

const SHARED_NAMESPACES = ["Common", "Nav", "Auth", "AuthForms"] as const;

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const headerList = await headers();
    const nonce = readCspNonce(headerList);
    const locale = resolveAppLocale(await getLocale());
    const [allMessages, metadataContext] = await Promise.all([
        getMessages({ locale }),
        getMetadataContext(locale),
    ]);
    const messages = pickMessages(allMessages, SHARED_NAMESPACES);
    const headNodes = sanitizeCustomHtml(metadataContext.settings.headHtml);
    const footerNodes = sanitizeCustomHtml(metadataContext.settings.footerHtml);
    return (
        <html lang={locale}>
            <head>
                <InjectedHtml nodes={headNodes} nonce={nonce} />
            </head>
            <body className="min-h-screen bg-gray-50 font-sans antialiased">
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
                >
                    Skip to main content
                </a>
                <WebVitals />
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <main id="main-content">{children}</main>
                </NextIntlClientProvider>
                <InjectedHtml nodes={footerNodes} nonce={nonce} />
            </body>
        </html>
    );
}

export async function generateMetadata(): Promise<Metadata> {
    const locale = resolveAppLocale(await getLocale());
    const context = await getMetadataContext(locale);
    return createMetadata(context, { path: "/" });
}
