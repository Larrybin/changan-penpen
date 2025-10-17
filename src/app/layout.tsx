import type { Metadata } from "next";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import { InjectedHtml } from "@/components/seo/custom-html";
import { Toast } from "@/components/ui/toast";
import type { AppLocale } from "@/i18n/config";
import { sanitizeCustomHtml } from "@/lib/seo";
import { createMetadata, getMetadataContext } from "@/lib/seo-metadata";

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const locale = (await getLocale()) as AppLocale;
    const [messages, metadataContext] = await Promise.all([
        getMessages(),
        getMetadataContext(locale),
    ]);
    const headNodes = sanitizeCustomHtml(metadataContext.settings.headHtml);
    const footerNodes = sanitizeCustomHtml(metadataContext.settings.footerHtml);
    return (
        <html lang={locale}>
            <head>
                <InjectedHtml nodes={headNodes} />
            </head>
            <body className="font-sans antialiased bg-gray-50 min-h-screen">
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
                >
                    Skip to main content
                </a>
                <NextIntlClientProvider messages={messages}>
                    <main id="main-content">{children}</main>
                </NextIntlClientProvider>
                <Toast />
                <InjectedHtml nodes={footerNodes} />
            </body>
        </html>
    );
}

export async function generateMetadata(): Promise<Metadata> {
    const locale = (await getLocale()) as AppLocale;
    const context = await getMetadataContext(locale);
    return createMetadata(context, { path: "/" });
}
