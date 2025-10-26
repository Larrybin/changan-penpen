import "./globals.css";
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
