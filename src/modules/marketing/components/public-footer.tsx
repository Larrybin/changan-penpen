import Link from "next/link";

export type FooterMessages = {
    supportTitle: string;
    supportLinks: {
        about: string;
        contact: string;
    };
    legalTitle: string;
    legalLinks: {
        privacy: string;
        terms: string;
    };
    copyright: string;
};

interface PublicFooterProps {
    appName: string;
    brandTagline: string;
    footerMessages: FooterMessages;
}

export default function PublicFooter({
    appName,
    brandTagline,
    footerMessages,
}: PublicFooterProps) {
    return (
        <footer className="border-border border-t bg-background text-foreground">
            <div className="mx-auto grid w-full max-w-[var(--container-max-w)] gap-[var(--grid-gap-section)] px-[var(--container-px)] py-10 md:grid-cols-3">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-primary">
                        <span className="text-lg">🍌</span>
                        <span className="font-semibold">{appName}</span>
                    </div>
                    <p className="text-foreground/70 text-sm">{brandTagline}</p>
                </div>
                <div>
                    <h4 className="mb-2 font-semibold">
                        {footerMessages.supportTitle}
                    </h4>
                    <ul className="space-y-1 text-foreground/80 text-sm">
                        <li>
                            <Link href="/about" className="hover:text-accent">
                                {footerMessages.supportLinks.about}
                            </Link>
                        </li>
                        <li>
                            <Link href="/contact" className="hover:text-accent">
                                {footerMessages.supportLinks.contact}
                            </Link>
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className="mb-2 font-semibold">
                        {footerMessages.legalTitle}
                    </h4>
                    <ul className="space-y-1 text-foreground/80 text-sm">
                        <li>
                            <Link href="/privacy" className="hover:text-accent">
                                {footerMessages.legalLinks.privacy}
                            </Link>
                        </li>
                        <li>
                            <Link href="/terms" className="hover:text-accent">
                                {footerMessages.legalLinks.terms}
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="border-border/50 border-t py-4 text-center text-foreground/60 text-xs">
                {footerMessages.copyright}
            </div>
        </footer>
    );
}
