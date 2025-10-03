import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

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

export const metadata: Metadata = {
    title: "Next.js Cloudflare App",
    description:
        "Full-stack Next.js application with Cloudflare Workers, D1 db, R2 storage, and Drizzle ORM.",
};

export const dynamic = "force-dynamic";

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
