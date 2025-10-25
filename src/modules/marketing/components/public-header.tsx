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

export type MarketingHeaderMessages = {
    mainNavigation: string;
    navigateTo: string;
    userActions: string;
    loginToAccount: string;
    createAccount: string;
    cta: string;
    menuLabel: string;
    mobileMenuTitle: string;
    mobileNavigation: string;
    mobileUserActions: string;
};

interface PublicHeaderProps {
    marketingHeaderMessages: MarketingHeaderMessages;
}

export default function PublicHeader({
    marketingHeaderMessages,
}: PublicHeaderProps) {
    const tCommon = useTranslations("Common");
    const tNav = useTranslations("Nav");
    const tAuth = useTranslations("Auth");
    const navigationItems = [
        { href: "#features", label: tNav("features") },
        { href: "#why", label: tNav("why") },
        { href: "#trust", label: tNav("trust") },
        { href: "#faq", label: tNav("faq") },
    ];
    return (
        <header className="sticky top-0 z-[var(--z-nav)] w-full border-border border-b bg-background/80 text-foreground backdrop-blur">
            <div className="mx-auto flex w-full max-w-[var(--container-max-w)] items-center justify-between px-[var(--container-px)] py-3">
                <Link href="/" className="flex items-center gap-2 text-primary">
                    <span className="text-xl">🍌</span>
                    <span className="font-semibold tracking-wide">
                        {tCommon("appName")}
                    </span>
                </Link>
                <nav
                    className="xs:flex hidden items-center gap-6 text-foreground/80 text-sm"
                    aria-label={marketingHeaderMessages.mainNavigation}
                >
                    {navigationItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="rounded-md px-2 py-1 transition hover:text-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            aria-label={`${marketingHeaderMessages.navigateTo} ${item.label}`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <nav
                    className="xs:flex hidden items-center gap-2"
                    aria-label={marketingHeaderMessages.userActions}
                >
                    <LanguageSwitcher />
                    <Link
                        href="/login"
                        aria-label={marketingHeaderMessages.loginToAccount}
                    >
                        <Button
                            variant="outline"
                            className="border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        >
                            {tAuth("login")}
                        </Button>
                    </Link>
                    <Link
                        href="/signup"
                        aria-label={marketingHeaderMessages.createAccount}
                    >
                        <Button className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                            {marketingHeaderMessages.cta}
                        </Button>
                    </Link>
                </nav>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="xs:hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            aria-label={marketingHeaderMessages.menuLabel}
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
                                {marketingHeaderMessages.mobileMenuTitle}
                            </h2>
                            <nav
                                className="flex flex-col gap-3 text-base text-foreground/80"
                                aria-label={
                                    marketingHeaderMessages.mobileNavigation
                                }
                            >
                                {navigationItems.map((item) => (
                                    <DialogClose asChild key={item.href}>
                                        <Link
                                            href={item.href}
                                            className="rounded-md px-3 py-2 transition hover:text-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                            aria-label={`${marketingHeaderMessages.navigateTo} ${item.label}`}
                                        >
                                            {item.label}
                                        </Link>
                                    </DialogClose>
                                ))}
                            </nav>
                            <LanguageSwitcher />
                            <nav
                                className="flex flex-col gap-2"
                                aria-label={
                                    marketingHeaderMessages.mobileUserActions
                                }
                            >
                                <DialogClose asChild>
                                    <Link
                                        href="/login"
                                        aria-label={
                                            marketingHeaderMessages.loginToAccount
                                        }
                                    >
                                        <Button
                                            variant="outline"
                                            className="w-full border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                        >
                                            {tAuth("login")}
                                        </Button>
                                    </Link>
                                </DialogClose>
                                <DialogClose asChild>
                                    <Link
                                        href="/signup"
                                        aria-label={
                                            marketingHeaderMessages.createAccount
                                        }
                                    >
                                        <Button className="w-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                                            {marketingHeaderMessages.cta}
                                        </Button>
                                    </Link>
                                </DialogClose>
                            </nav>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </header>
    );
}
