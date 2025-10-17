"use client";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function PublicHeader() {
    const tCommon = useTranslations("Common");
    const tNav = useTranslations("Nav");
    const tAuth = useTranslations("Auth");
    const tMarketingHeader = useTranslations("Marketing.header");
    const navigationItems = [
        { href: "#features", label: tNav("features") },
        { href: "#why", label: tNav("why") },
        { href: "#trust", label: tNav("trust") },
        { href: "#faq", label: tNav("faq") },
    ];
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
                    {navigationItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="hover:text-accent transition"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="hidden xs:flex items-center gap-2">
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
                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="xs:hidden"
                            aria-label={tMarketingHeader("menuLabel")}
                        >
                            <Menu className="h-5 w-5" aria-hidden="true" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="xs:hidden max-w-sm">
                        <div className="flex flex-col gap-4">
                            <nav className="flex flex-col gap-3 text-base text-foreground/80">
                                {navigationItems.map((item) => (
                                    <DialogClose asChild key={item.href}>
                                        <Link
                                            href={item.href}
                                            className="hover:text-accent transition"
                                        >
                                            {item.label}
                                        </Link>
                                    </DialogClose>
                                ))}
                            </nav>
                            <LanguageSwitcher />
                            <div className="flex flex-col gap-2">
                                <DialogClose asChild>
                                    <Link href="/login">
                                        <Button
                                            variant="outline"
                                            className="w-full border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                                        >
                                            {tAuth("login")}
                                        </Button>
                                    </Link>
                                </DialogClose>
                                <DialogClose asChild>
                                    <Link href="/signup">
                                        <Button className="w-full">
                                            {tMarketingHeader("cta")}
                                        </Button>
                                    </Link>
                                </DialogClose>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </header>
    );
}
