import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import type { AppLocale } from "@/i18n/config";
import { defaultLocale, locales } from "@/i18n/config";

const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.bananagenerator.app";
let metadataBase: URL | undefined;
try {
    metadataBase = new URL(appUrl);
} catch (_error) {
    metadataBase = undefined;
}

const openGraphLocales: Record<AppLocale, string> = {
    en: "en_US",
    de: "de_DE",
    fr: "fr_FR",
    pt: "pt_BR",
};

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

type MetadataMessages = {
    title: string;
    description: string;
    keywords: string[];
    openGraph: {
        title: string;
        description: string;
        siteName: string;
        imageAlt: string;
    };
    twitter: {
        title: string;
        description: string;
        imageAlt: string;
    };
};

export async function generateMetadata(): Promise<Metadata> {
    const locale = (await getLocale()) as AppLocale;
    const messagesModule = (await import(`@/i18n/messages/${locale}.json`))
        .default as {
        Metadata: MetadataMessages;
    };
    const metadataMessages = messagesModule.Metadata;
    const canonicalPath = locale === defaultLocale ? "/" : `/${locale}`;
    const languageAlternates = locales.reduce(
        (acc, current) => ({
            ...acc,
            [current]: current === defaultLocale ? "/" : `/${current}`,
        }),
        {} as Record<string, string>,
    );
    const shareImagePath = "/og-image.svg";
    const shareImageUrl = metadataBase
        ? new URL(shareImagePath, metadataBase).toString()
        : shareImagePath;

    return {
        metadataBase,
        title: metadataMessages.title,
        description: metadataMessages.description,
        keywords: metadataMessages.keywords,
        alternates: {
            canonical: canonicalPath,
            languages: languageAlternates,
        },
        openGraph: {
            title: metadataMessages.openGraph.title,
            description: metadataMessages.openGraph.description,
            url: canonicalPath,
            siteName: metadataMessages.openGraph.siteName,
            locale: openGraphLocales[locale],
            type: "website",
            images: [
                {
                    url: shareImageUrl,
                    width: 1200,
                    height: 630,
                    alt: metadataMessages.openGraph.imageAlt,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: metadataMessages.twitter.title,
            description: metadataMessages.twitter.description,
            images: [
                {
                    url: shareImageUrl,
                    alt: metadataMessages.twitter.imageAlt,
                },
            ],
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                "max-video-preview": -1,
                "max-image-preview": "large",
                "max-snippet": -1,
            },
        },
    };
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const locale = await getLocale();
    const messages = await getMessages();
    return (
        <html lang={locale}>
            <body
                className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased bg-gray-50 min-h-screen`}
            >
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
            </body>
        </html>
    );
}
