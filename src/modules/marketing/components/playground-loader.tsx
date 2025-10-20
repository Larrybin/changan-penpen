"use client";

import dynamic from "next/dynamic";

const Playground = dynamic(() => import("./playground"), {
    loading: () => (
        <div
            className="bg-muted/10 border border-dashed border-border/60 rounded-xl h-[28rem] w-full flex flex-col items-center justify-center text-center"
            aria-busy="true"
            aria-live="polite"
        >
            <span className="text-sm font-medium text-muted-foreground">
                Loading interactive demo…
            </span>
            <span className="text-xs text-muted-foreground mt-2">
                Preparing the playground experience
            </span>
        </div>
    ),
    ssr: false,
});

export default Playground;
