"use client";

import { useServerInsertedHTML } from "next/navigation";

import { InjectedHtml } from "@/components/seo/custom-html";
import type { SanitizedHeadNode } from "@/lib/seo";

export function HeadInjection({
    nodes,
    nonce,
}: {
    nodes: SanitizedHeadNode[];
    nonce?: string;
}) {
    useServerInsertedHTML(() => <InjectedHtml nodes={nodes} nonce={nonce} />);
    return null;
}
