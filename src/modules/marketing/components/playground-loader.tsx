"use client";

import dynamic from "next/dynamic";

import type { PlaygroundMessages } from "./playground";

const Playground = dynamic(() => import("./playground"), {
    loading: () => (
        <div
            className="flex h-[28rem] w-full flex-col items-center justify-center rounded-xl border border-border/60 border-dashed bg-muted/10 text-center"
            aria-busy="true"
            aria-live="polite"
        >
            <span className="font-medium text-muted-foreground text-sm">
                Loading interactive demo…
            </span>
            <span className="mt-2 text-muted-foreground text-xs">
                Preparing the playground experience
            </span>
        </div>
    ),
    ssr: false,
});

interface PlaygroundLoaderProps {
    messages: PlaygroundMessages;
}

export default function PlaygroundLoader({ messages }: PlaygroundLoaderProps) {
    return <Playground messages={messages} />;
}
