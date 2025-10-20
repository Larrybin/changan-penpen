"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
            <div className="flex flex-col gap-2 mb-4 xs:flex-row xs:items-center xs:justify-between">
                <h2
                    id="playground-heading"
                    className="font-semibold tracking-wide"
                >
                    {tPlayground("title")}
                </h2>
                <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] md:text-xs text-yellow-200/70">
                    {badges.map((badge, index) => (
                        <span
                            key={badge}
                            className="before:mr-1 before:content-['·'] first:before:content-none"
                        >
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
                        <div className="flex items-start justify-between text-xs text-yellow-200/80 mb-1 gap-2">
                            <span className="pt-1">
                                {tPlayground("instructionsLabel")}
                            </span>
                            <div className="flex flex-col items-end gap-1 text-right">
                                <button
                                    type="button"
                                    className="text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300 active:text-primary/80"
                                >
                                    {tPlayground("usageGuide")}
                                </button>
                                <span className="text-[10px] text-yellow-200/60">
                                    {tPlayground("usageGuideHint")}
                                </span>
                            </div>
                        </div>
                        <Textarea
                            placeholder={tPlayground("promptPlaceholder")}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="min-h-24 bg-black/50 border-yellow-400/30 text-yellow-50 placeholder:text-yellow-100/40"
                        />
                    </div>

                    <fieldset>
                        <legend className="text-xs text-yellow-200/80 mb-2">
                            {tPlayground("aspectRatioLabel")}
                        </legend>
                        <div
                            className="flex flex-wrap gap-2"
                            role="radiogroup"
                            aria-label={tPlayground("aspectRatioLabel")}
                        >
                            {["1:1", "4:3", "3:2", "9:16", "16:9"].map((r) => {
                                const id = `playground-ratio-${r.replace(":", "-")}`;
                                const isActive = ratio === r;
                                return (
                                    <label
                                        key={r}
                                        className={`flex min-w-[4.5rem] items-center justify-center rounded border px-3 py-1 text-center text-xs transition cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-yellow-300 ${
                                            isActive
                                                ? "border-yellow-400 bg-yellow-400 text-black"
                                                : "border-yellow-400/30 text-yellow-100/80 hover:border-yellow-400/60"
                                        }`}
                                        htmlFor={id}
                                    >
                                        <input
                                            id={id}
                                            type="radio"
                                            name="aspect-ratio"
                                            value={r}
                                            checked={isActive}
                                            onChange={() =>
                                                setRatio(r as Ratio)
                                            }
                                            className="sr-only"
                                        />
                                        <span>{r}</span>
                                    </label>
                                );
                            })}
                        </div>
                        <p className="mt-2 text-[10px] text-yellow-200/60">
                            {tPlayground("humanCheck")}
                        </p>
                    </fieldset>

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
