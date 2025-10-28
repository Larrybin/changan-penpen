import "./globals.css";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { defaultLocale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export const dynamic = "force-static";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
});

const jetBrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-geist-mono",
});

const fallbackAppUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://banana-generator.com";

let metadataBase: URL | undefined;
try {
    metadataBase = new URL(fallbackAppUrl);
} catch {
    metadataBase = undefined;
}

const defaultDescription =
    "Banana Generator is a production-ready Next.js starter optimized for Cloudflare Workers with PPR, SEO, and AI-ready tooling.";

export const metadata: Metadata = {
    metadataBase,
    title: {
        default: "Banana Generator",
        template: "%s | Banana Generator",
    },
    description: defaultDescription,
    alternates: {
        canonical: metadataBase?.origin ?? fallbackAppUrl,
    },
    openGraph: {
        type: "website",
        siteName: "Banana Generator",
        title: "Banana Generator",
        description: defaultDescription,
        url: metadataBase?.origin ?? fallbackAppUrl,
        images: [
            {
                url: "/og-image.svg",
                alt: "Banana Generator",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Banana Generator",
        description: defaultDescription,
        images: ["/og-image.svg"],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang={defaultLocale}>
            <body
                className={cn(
                    "min-h-screen bg-gray-50 font-sans antialiased",
                    inter.variable,
                    jetBrainsMono.variable,
                )}
            >
                {children}
            </body>
        </html>
    );
}
