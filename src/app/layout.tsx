import type { Metadata } from "next";
import "../../instrumentation-client";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "react-hot-toast";

import { InjectedHtml } from "@/components/seo/custom-html";
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
                <NextIntlClientProvider messages={messages}>
                    <main>{children}</main>
                </NextIntlClientProvider>
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        className:
                            "border rounded-md shadow-sm text-sm bg-[var(--color-info-subtle)] text-[var(--color-info-foreground)] border-[var(--color-info-border)]",
                        duration: 3000,
                        success: {
                            className:
                                "border rounded-md shadow-sm text-sm bg-[var(--color-success-subtle)] text-[var(--color-success-foreground)] border-[var(--color-success-border)]",
                            duration: 2500,
                        },
                        error: {
                            className:
                                "border rounded-md shadow-sm text-sm bg-[var(--color-danger-subtle)] text-red-700 border-[var(--color-danger-border)]",
                            duration: 3500,
                        },
                        loading: {
                            className:
                                "border rounded-md shadow-sm text-sm bg-[var(--color-info-subtle)] text-[var(--color-info-foreground)] border-[var(--color-info-border)]",
                        },
                    }}
                />
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
