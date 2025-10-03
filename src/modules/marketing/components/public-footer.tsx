import Link from "next/link";

export default function PublicFooter() {
    return (
        <footer className="border-t border-border bg-background text-foreground">
            <div className="mx-auto w-full max-w-[var(--container-max-w)] px-[var(--container-px)] py-10 grid gap-[var(--grid-gap-section)] md:grid-cols-3">
                <div>
                    <div className="flex items-center gap-2 text-primary mb-2">
                        <span className="text-lg">🍌</span>
                        <span className="font-semibold">Banana Generator</span>
                    </div>
                    <p className="text-sm text-foreground/70">
                        AI image editing that keeps you the top banana.
                    </p>
                </div>
                <div>
                    <h4 className="font-semibold mb-2">Support</h4>
                    <ul className="space-y-1 text-sm text-foreground/80">
                        <li>
                            <Link href="#" className="hover:text-accent">
                                About
                            </Link>
                        </li>
                        <li>
                            <Link href="#" className="hover:text-accent">
                                Contact
                            </Link>
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-2">Legal</h4>
                    <ul className="space-y-1 text-sm text-foreground/80">
                        <li>
                            <Link href="#" className="hover:text-accent">
                                Privacy
                            </Link>
                        </li>
                        <li>
                            <Link href="#" className="hover:text-accent">
                                Terms
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-border/50 text-center text-xs py-4 text-foreground/60">
                © 2025 Banana Generator. All rights reserved.
            </div>
        </footer>
    );
}
