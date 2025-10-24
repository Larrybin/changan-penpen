import { GalleryVerticalEnd } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type React from "react";

import { LoginForm } from "./components/login-form";

export default async function LoginPage() {
    const [tCommon, tLoginPage] = await Promise.all([
        getTranslations("Common"),
        getTranslations("AuthPages.Login"),
    ]);
    return (
        <div
            className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 xs:p-8 md:p-10"
            style={
                {
                    "--card-header-gap": "0.5rem",
                    // Primary submit button colors via tokens
                    "--button-bg": "var(--token-color-accent)",
                    "--button-fg": "#000",
                    "--button-hover-bg":
                        "color-mix(in oklch, var(--token-color-accent) 85%, black 15%)",
                    // Outline (Google) accent colors
                    "--accent": "var(--token-color-accent)",
                    "--accent-foreground": "#000",
                } as React.CSSProperties
            }
        >
            <div className="flex w-full max-w-sm xs:max-w-md flex-col gap-6 lg-narrow:max-w-lg">
                <Link
                    href="/"
                    className="flex items-center gap-2 self-center font-medium"
                >
                    <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                        <GalleryVerticalEnd className="size-4" />
                    </div>
                    {tCommon("appName")}
                </Link>
                <div className="space-y-2 text-center">
                    <h1 className="font-semibold text-3xl tracking-tight">
                        {tLoginPage("title")}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {tLoginPage("subtitle")}
                    </p>
                </div>
                <LoginForm />
            </div>
        </div>
    );
}
