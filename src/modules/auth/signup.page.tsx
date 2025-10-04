import { GalleryVerticalEnd } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { getTranslations } from "next-intl/server";

import { SignupForm } from "./components/signup-form";

export default async function SignUpPage() {
    const [tCommon, tSignupPage] = await Promise.all([
        getTranslations("Common"),
        getTranslations("AuthPages.Signup"),
    ]);
    return (
        <div
            className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 xs:p-8 md:p-10"
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
            <div className="flex w-full max-w-sm xs:max-w-md lg-narrow:max-w-lg flex-col gap-6">
                <Link
                    href="/"
                    className="flex items-center gap-2 self-center font-medium"
                >
                    <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                        <GalleryVerticalEnd className="size-4" />
                    </div>
                    {tCommon("appName")}
                </Link>
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight">
                        {tSignupPage("title")}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {tSignupPage("subtitle")}
                    </p>
                </div>
                <SignupForm />
            </div>
        </div>
    );
}
