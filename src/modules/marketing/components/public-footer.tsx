import Link from "next/link";
import { useTranslations } from "next-intl";

export default function PublicFooter() {
    const tCommon = useTranslations("Common");
    const tFooter = useTranslations("Marketing.footer");
    return (
        <footer className="border-t border-border bg-background text-foreground">
            <div className="mx-auto w-full max-w-[var(--container-max-w)] px-[var(--container-px)] py-10 grid gap-[var(--grid-gap-section)] md:grid-cols-3">
                <div>
                    <div className="flex items-center gap-2 text-primary mb-2">
                        <span className="text-lg">🍌</span>
                        <span className="font-semibold">
                            {tCommon("appName")}
                        </span>
                    </div>
                    <p className="text-sm text-foreground/70">
                        {tCommon("brandTagline")}
                    </p>
                </div>
                <div>
                    <h4 className="font-semibold mb-2">
                        {tFooter("supportTitle")}
                    </h4>
                    <ul className="space-y-1 text-sm text-foreground/80">
                        <li>
                            <Link href="#" className="hover:text-accent">
                                {tFooter("supportLinks.about")}
                            </Link>
                        </li>
                        <li>
                            <Link href="#" className="hover:text-accent">
                                {tFooter("supportLinks.contact")}
                            </Link>
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-2">
                        {tFooter("legalTitle")}
                    </h4>
                    <ul className="space-y-1 text-sm text-foreground/80">
                        <li>
                            <Link href="#" className="hover:text-accent">
                                {tFooter("legalLinks.privacy")}
                            </Link>
                        </li>
                        <li>
                            <Link href="#" className="hover:text-accent">
                                {tFooter("legalLinks.terms")}
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-border/50 text-center text-xs py-4 text-foreground/60">
                {tFooter("copyright")}
            </div>
        </footer>
    );
}
