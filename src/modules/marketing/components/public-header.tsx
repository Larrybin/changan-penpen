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
                <nav
                    className="hidden xs:flex items-center gap-6 text-sm text-foreground/80"
                    role="navigation"
                    aria-label={tMarketingHeader("mainNavigation")}
                >
                    {navigationItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="hover:text-accent transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1"
                            aria-label={`${tMarketingHeader("navigateTo")} ${item.label}`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="hidden xs:flex items-center gap-2" role="navigation" aria-label={tMarketingHeader("userActions")}>
                    <LanguageSwitcher />
                    <Link href="/login" aria-label={tMarketingHeader("loginToAccount")}>
                        <Button
                            variant="outline"
                            className="border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        >
                            {tAuth("login")}
                        </Button>
                    </Link>
                    <Link href="/signup" aria-label={tMarketingHeader("createAccount")}>
                        <Button className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                            {tMarketingHeader("cta")}
                        </Button>
                    </Link>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="xs:hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            aria-label={tMarketingHeader("menuLabel")}
                            aria-expanded={false}
                            aria-controls="mobile-navigation-menu"
                        >
                            <Menu className="h-5 w-5" aria-hidden="true" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent
                        className="xs:hidden max-w-sm"
                        id="mobile-navigation-menu"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="mobile-menu-title"
                    >
                        <div className="flex flex-col gap-4">
                            <h2 id="mobile-menu-title" className="sr-only">
                                {tMarketingHeader("mobileMenuTitle")}
                            </h2>
                            <nav
                                className="flex flex-col gap-3 text-base text-foreground/80"
                                role="navigation"
                                aria-label={tMarketingHeader("mobileNavigation")}
                            >
                                {navigationItems.map((item) => (
                                    <DialogClose asChild key={item.href}>
                                        <Link
                                            href={item.href}
                                            className="hover:text-accent transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-3 py-2"
                                            aria-label={`${tMarketingHeader("navigateTo")} ${item.label}`}
                                        >
                                            {item.label}
                                        </Link>
                                    </DialogClose>
                                ))}
                            </nav>
                            <LanguageSwitcher />
                            <div className="flex flex-col gap-2" role="navigation" aria-label={tMarketingHeader("mobileUserActions")}>
                                <DialogClose asChild>
                                    <Link href="/login" aria-label={tMarketingHeader("loginToAccount")}>
                                        <Button
                                            variant="outline"
                                            className="w-full border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                        >
                                            {tAuth("login")}
                                        </Button>
                                    </Link>
                                </DialogClose>
                                <DialogClose asChild>
                                    <Link href="/signup" aria-label={tMarketingHeader("createAccount")}>
                                        <Button className="w-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
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
