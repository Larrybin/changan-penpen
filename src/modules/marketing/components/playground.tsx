"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";

type Ratio = "1:1" | "4:3" | "9:16" | "3:2" | "16:9";

export default function Playground() {
    const [fileName, setFileName] = useState<string>("");
    const [prompt, setPrompt] = useState<string>("");
    const [ratio, setRatio] = useState<Ratio>("1:1");
    const tPlayground = useTranslations("Marketing.playground");
    const badges = tPlayground.raw("badges") as string[];

    return (
        <section
            className="border border-yellow-400/30 rounded-lg p-4 md:p-6 bg-black/40 text-yellow-50"
            aria-labelledby="playground-heading"
        >
            <div className="flex items-center justify-between mb-4">
                <h3
                    id="playground-heading"
                    className="font-semibold tracking-wide"
                >
                    {tPlayground("title")}
                </h3>
                <div className="text-[10px] md:text-xs text-yellow-200/70 space-x-2">
                    {badges.map((badge, index) => (
                        <span key={badge}>
                            {index > 0 ? "· " : ""}
                            {badge}
                        </span>
                    ))}
                </div>
            </div>

            <div className="grid lg-narrow:grid-cols-2 gap-[var(--grid-gap-section)]">
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between text-xs text-yellow-200/80 mb-1">
                            <span>{tPlayground("uploadLabel")}</span>
                            <span>{tPlayground("uploadSecondary")}</span>
                        </div>
                        <label className="block">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                    setFileName(e.target.files?.[0]?.name ?? "")
                                }
                            />
                            <div className="cursor-pointer rounded-md border border-yellow-400/30 bg-black/60 px-4 py-8 text-center text-yellow-200 hover:border-yellow-400/60">
                                {fileName
                                    ? fileName
                                    : tPlayground("filePlaceholder")}
                            </div>
                        </label>
                    </div>

                    <div>
                        <div className="flex items-center justify-between text-xs text-yellow-200/80 mb-1">
                            <span>{tPlayground("instructionsLabel")}</span>
                            <a
                                className="text-primary hover:underline"
                                href="#"
                                onClick={(e) => e.preventDefault()}
                            >
                                {tPlayground("usageGuide")}
                            </a>
                        </div>
                        <Textarea
                            placeholder={tPlayground("promptPlaceholder")}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="min-h-24 bg-black/50 border-yellow-400/30 text-yellow-50 placeholder:text-yellow-100/40"
                        />
                    </div>

                    <div>
                        <p className="text-xs text-yellow-200/80 mb-2">
                            {tPlayground("aspectRatioLabel")}
                        </p>
                        <div className="flex gap-2">
                            {["1:1", "4:3", "3:2", "9:16", "16:9"].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRatio(r as Ratio)}
                                    className={`px-3 py-1 rounded border text-xs transition ${
                                        ratio === r
                                            ? "border-yellow-400 bg-yellow-400 text-black"
                                            : "border-yellow-400/30 text-yellow-100/80 hover:border-yellow-400/60"
                                    }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                        <p className="mt-2 text-[10px] text-yellow-200/60">
                            {tPlayground("humanCheck")}
                        </p>
                    </div>

                    <div>
                        <Button className="bg-yellow-400 text-black hover:bg-yellow-300">
                            {tPlayground("generate")}
                        </Button>
                    </div>
                </div>

                <div className="hidden lg-narrow:flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-7xl mb-4">🍌</div>
                        <p className="text-yellow-200/80 text-sm">
                            {tPlayground("sideDescription")}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
