"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";

export default function PublicHeader() {
    const tCommon = useTranslations("Common");
    const tNav = useTranslations("Nav");
    const tAuth = useTranslations("Auth");
    const tMarketingHeader = useTranslations("Marketing.header");
    return (
        <header className="sticky top-0 z-[var(--z-nav)] w-full border-b border-border bg-background/80 backdrop-blur text-foreground">
            <div className="mx-auto w-full max-w-[var(--container-max-w)] px-[var(--container-px)] py-3 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-primary">
                    <span className="text-xl">🍌</span>
                    <span className="font-semibold tracking-wide">
                        {tCommon("appName")}
                    </span>
                </Link>
                <nav className="hidden xs:flex items-center gap-6 text-sm text-foreground/80">
                    <Link
                        href="#features"
                        className="hover:text-accent transition"
                    >
                        {tNav("features")}
                    </Link>
                    <Link href="#why" className="hover:text-accent transition">
                        {tNav("why")}
                    </Link>
                    <Link href="#faq" className="hover:text-accent transition">
                        {tNav("faq")}
                    </Link>
                </nav>
                <div className="flex items-center gap-2">
                    <LanguageSwitcher />
                    <Link href="/login">
                        <Button
                            variant="outline"
                            className="border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                        >
                            {tAuth("login")}
                        </Button>
                    </Link>
                    <Link href="/signup">
                        <Button>{tMarketingHeader("cta")}</Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}
