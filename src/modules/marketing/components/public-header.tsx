"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PublicHeader() {
    return (
        <header className="sticky top-0 z-[var(--z-nav)] w-full border-b border-border bg-background/80 backdrop-blur text-foreground">
            <div className="mx-auto w-full max-w-[var(--container-max-w)] px-[var(--container-px)] py-3 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-primary">
                    <span className="text-xl">🍌</span>
                    <span className="font-semibold tracking-wide">Banana Generator</span>
                </Link>
                <nav className="hidden xs:flex items-center gap-6 text-sm text-foreground/80">
                    <Link href="#features" className="hover:text-accent transition">Features</Link>
                    <Link href="#why" className="hover:text-accent transition">Why Us</Link>
                    <Link href="#faq" className="hover:text-accent transition">FAQ</Link>
                </nav>
                <div className="flex items-center gap-2">
                    <Link href="/login">
                        <Button variant="outline" className="border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]">
                            Login
                        </Button>
                    </Link>
                    <Link href="/signup">
                        <Button>Go Bananas</Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}
