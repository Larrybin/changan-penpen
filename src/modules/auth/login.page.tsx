import { GalleryVerticalEnd } from "lucide-react";
import type React from "react";

import { LoginForm } from "./components/login-form";

export default function LoginPage() {
    return (
        <div
            className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 xs:p-8 md:p-10"
            style={{ "--card-header-gap": "0.5rem" } as React.CSSProperties}
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
