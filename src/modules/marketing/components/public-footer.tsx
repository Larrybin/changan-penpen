import Link from "next/link";
import { useTranslations } from "next-intl";

export default function PublicFooter() {
    const tCommon = useTranslations("Common");
    const tFooter = useTranslations("Marketing.footer");
    return (
        <footer className="border-border border-t bg-background text-foreground">
            <div className="mx-auto grid w-full max-w-[var(--container-max-w)] gap-[var(--grid-gap-section)] px-[var(--container-px)] py-10 md:grid-cols-3">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-primary">
                        <span className="text-lg">🍌</span>
                        <span className="font-semibold">
                            {tCommon("appName")}
                        </span>
                    </div>
                    <p className="text-foreground/70 text-sm">
                        {tCommon("brandTagline")}
                    </p>
                </div>
                <div>
                    <h4 className="mb-2 font-semibold">
                        {tFooter("supportTitle")}
                    </h4>
                    <ul className="space-y-1 text-foreground/80 text-sm">
                        <li>
                            <Link href="/about" className="hover:text-accent">
                                {tFooter("supportLinks.about")}
                            </Link>
                        </li>
                        <li>
                            <Link href="/contact" className="hover:text-accent">
                                {tFooter("supportLinks.contact")}
                            </Link>
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className="mb-2 font-semibold">
                        {tFooter("legalTitle")}
                    </h4>
                    <ul className="space-y-1 text-foreground/80 text-sm">
                        <li>
                            <Link href="/privacy" className="hover:text-accent">
                                {tFooter("legalLinks.privacy")}
                            </Link>
                        </li>
                        <li>
                            <Link href="/terms" className="hover:text-accent">
                                {tFooter("legalLinks.terms")}
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="border-border/50 border-t py-4 text-center text-foreground/60 text-xs">
                {tFooter("copyright")}
            </div>
        </footer>
    );
}
