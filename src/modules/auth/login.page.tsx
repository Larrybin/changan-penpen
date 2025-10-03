import { GalleryVerticalEnd } from "lucide-react";
import type React from "react";

import { LoginForm } from "./components/login-form";

export default function LoginPage() {
    return (
        <div
            className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 xs:p-8 md:p-10"
            style={{
                "--card-header-gap": "0.5rem",
                // Primary submit button colors via tokens
                "--button-bg": "var(--token-color-accent)",
                "--button-fg": "#000",
                "--button-hover-bg": "color-mix(in oklch, var(--token-color-accent) 85%, black 15%)",
                // Outline (Google) accent colors
                "--accent": "var(--token-color-accent)",
                "--accent-foreground": "#000",
            } as React.CSSProperties}
        >
            <div className="flex w-full max-w-sm xs:max-w-md lg-narrow:max-w-lg flex-col gap-6">
                <a
                    href="#"
                    className="flex items-center gap-2 self-center font-medium"
                >
                    <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                        <GalleryVerticalEnd className="size-4" />
                    </div>
                    Acme Inc.
                </a>
                <LoginForm />
            </div>
        </div>
    );
}
