import PublicHeader from "./components/public-header";
import type React from "react";
import Playground from "./components/playground";
import PublicFooter from "./components/public-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function MarketingLandingPage() {
    return (
        <div
            className="bg-black text-yellow-50"
            style={{
                "--card-header-gap": "0.5rem",
                "--token-font-family-sans": "var(--font-inter)",
                // Button tokens for default variant
                "--button-bg": "var(--token-color-accent)",
                "--button-fg": "#000",
                "--button-hover-bg": "color-mix(in oklch, var(--token-color-accent) 85%, black 15%)",
                // Accent used by outline variant
                "--accent": "var(--token-color-accent)",
                "--accent-foreground": "#000",
                fontFamily: "var(--token-font-family-sans)",
            } as React.CSSProperties}
        >
            <PublicHeader />

            <main>
                <section className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
                    <div className="grid xs:grid-cols-2 gap-8 items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-yellow-400 text-black">Free Online</Badge>
                                <span className="text-lg">🍌</span>
                            </div>
                            <h1 className="text-title font-extrabold tracking-tight mb-4">
                                AI Photo Editor
                            </h1>
                            <p className="text-yellow-200/80 leading-relaxed mb-6">
                                Transform, edit, and enhance your images with simple text prompts.
                                Add, remove, or restyle anything in seconds using AI image editing.
                            </p>
                            <div className="flex gap-3">
                                <Link href="/signup">
                                    <Button>
                                        Try it free
                                    </Button>
                                </Link>
                                <Link href="#playground">
                                    <Button
                                        variant="outline"
                                        className="border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                                    >
                                        What can it do?
                                    </Button>
                                </Link>
                            </div>
                            <div className="mt-3 text-xs text-yellow-200/70">
                                <span className="mr-3">⚡ Fast</span>
                                <span className="mr-3">🔒 No sign-up</span>
                                <span>🆓 Unlimited</span>
                            </div>
                        </div>
                        <div className="hidden lg-narrow:block text-right text-7xl">🍌✨</div>
                    </div>
                </section>

                <div id="playground" className="mx-auto w-full max-w-6xl px-4 pb-12">
                    <Playground />
                </div>

                <section id="features" className="mx-auto w-full max-w-6xl px-4 py-10">
                    <h2 className="text-subtitle font-bold text-center mb-6">
                        What is Banana Generator?
                    </h2>
                    <div className="grid gap-4 xs:grid-cols-2 lg-narrow:grid-cols-3">
                        {[
                            {
                                title: "Free & Unlimited Access",
                                desc: "Enjoy unlimited image generation — no sign-up, no hidden costs.",
                            },
                            {
                                title: "Natural Language Editing",
                                desc: "Replace backgrounds, adjust lighting, or remove objects using text.",
                            },
                            {
                                title: "Consistent Characters",
                                desc: "Maintain identifiable characters across multiple images.",
                            },
                            {
                                title: "Seamless Scene Integration",
                                desc: "Blend edits naturally with original shadows and lighting.",
                            },
                            {
                                title: "High‑Speed Processing",
                                desc: "Generate or edit 1MP images in seconds.",
                            },
                            {
                                title: "Versatile Style Generation",
                                desc: "Photorealistic, cartoon, watercolor, or oil painting styles.",
                            },
                        ].map((f) => (
                            <Card key={f.title} className="bg-black/40 border-yellow-400/20">
                                <CardContent className="p-4">
                                    <h3 className="font-semibold mb-1">{f.title}</h3>
                                    <p className="text-sm text-yellow-200/80">{f.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                <section id="why" className="mx-auto w-full max-w-6xl px-4 py-10">
                    <h2 className="text-subtitle font-bold text-center mb-6">
                        Why Choose Banana Generator?
                    </h2>
                    <div className="grid gap-4 xs:grid-cols-2 lg-narrow:grid-cols-3">
                        {[
                            {
                                title: "AI Photo Editor",
                                desc: "Edit photos by simply describing changes. No layers needed.",
                            },
                            {
                                title: "AI Image Generator",
                                desc: "Turn text into unique images with realistic or artistic styles.",
                            },
                            {
                                title: "Go Bananas Mode",
                                desc: "Create multiple variations at once for endless inspiration.",
                            },
                        ].map((f) => (
                            <Card key={f.title} className="bg-black/40 border-yellow-400/20">
                                <CardContent className="p-4">
                                    <h3 className="font-semibold mb-1">{f.title}</h3>
                                    <p className="text-sm text-yellow-200/80">{f.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                <section id="faq" className="mx-auto w-full max-w-4xl px-4 py-10">
                    <h2 className="text-subtitle font-bold text-center mb-6">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-3">
                        {[
                            {
                                q: "What is Banana Generator?",
                                a: "A free AI photo editor and image generator powered by the Nano Banana model.",
                            },
                            {
                                q: "Do I need to sign up or pay?",
                                a: "No. It's fast, free, and unlimited to get started.",
                            },
                            {
                                q: "What formats are supported?",
                                a: "Upload common formats like PNG and JPG; high‑res export is supported.",
                            },
                            {
                                q: "Is my data private and secure?",
                                a: "We follow a privacy‑first policy. You keep ownership of your images.",
                            },
                        ].map((item) => (
                            <details key={item.q} className="bg-black/40 border border-yellow-400/20 rounded-md p-4">
                                <summary className="cursor-pointer font-medium text-yellow-50">
                                    {item.q}
                                </summary>
                                <p className="mt-2 text-sm text-yellow-200/80">{item.a}</p>
                            </details>
                        ))}
                    </div>
                </section>

                <section className="mx-auto w-full max-w-3xl px-4 py-14 text-center">
                    <h3 className="text-3xl font-extrabold mb-3">Ready to Go Bananas?</h3>
                    <p className="text-yellow-200/80 mb-6">
                        Try Banana Generator now and turn your photos into top banana creations!
                    </p>
                    <Link href="/signup">
                        <Button className="bg-yellow-400 text-black hover:bg-yellow-300">
                            Try Banana Generator Free
                        </Button>
                    </Link>
                </section>
            </main>

            <PublicFooter />
        </div>
    );
}
