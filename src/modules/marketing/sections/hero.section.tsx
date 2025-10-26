import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { HeroSectionData } from "./types";

type HeroSectionProps = {
    data: HeroSectionData;
};

export function HeroSection({ data }: HeroSectionProps) {
    const supportValues = Object.values(data.support ?? {});

    return (
        <header className="mx-auto w-full max-w-[var(--container-max-w)] px-[var(--container-px)] py-12 md:py-16">
            <div className="grid xs:grid-cols-2 items-center gap-[var(--grid-gap-section)]">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Badge
                            className="bg-yellow-400 text-black focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-black"
                            aria-label={data.badge}
                        >
                            {data.badge}
                        </Badge>
                        <span
                            className="text-lg"
                            aria-hidden="true"
                            role="presentation"
                        >
                            {data.emoji}
                        </span>
                    </div>
                    <h1
                        id="hero-heading"
                        className="mb-4 font-extrabold text-title tracking-tight"
                    >
                        {data.title}
                    </h1>
                    <p className="mb-6 text-lg text-yellow-200/80 leading-relaxed">
                        {data.description}
                    </p>
                    <nav
                        aria-label={data.primaryActions ?? "Primary actions"}
                        className="mb-6 flex xs:flex-row flex-col gap-3 xs:gap-3"
                    >
                        <Link
                            href="/signup"
                            className="inline-flex"
                            aria-label={data.primaryAriaLabel}
                        >
                            <Button
                                className="w-full xs:w-auto focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-black"
                                size="lg"
                            >
                                {data.primaryCta}
                            </Button>
                        </Link>
                        {data.secondaryCta ? (
                            <Link
                                href="#playground"
                                className="inline-flex"
                                aria-label={data.secondaryAriaLabel}
                            >
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full xs:w-auto border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-black"
                                >
                                    {data.secondaryCta}
                                </Button>
                            </Link>
                        ) : null}
                    </nav>
                    {supportValues.length ? (
                        <ul
                            aria-label={data.featuresLabel ?? "Key features"}
                            className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-yellow-200/70"
                        >
                            {supportValues.map((item) => (
                                <li
                                    className="inline-flex items-center gap-1"
                                    key={item}
                                >
                                    {data.featurePrefix ? (
                                        <span className="sr-only">
                                            {data.featurePrefix}
                                        </span>
                                    ) : null}
                                    {item}
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>
                <div
                    className="hidden min-h-[4rem] animate-pulse text-right text-7xl lg-narrow:block"
                    aria-hidden="true"
                    role="presentation"
                >
                    {data.emoji}✨
                </div>
            </div>
        </header>
    );
}
