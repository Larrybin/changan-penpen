import type React from "react";

import type { SanitizedHeadNode } from "@/lib/seo";

const ATTRIBUTE_NAME_MAP: Record<string, string> = {
    "http-equiv": "httpEquiv",
    crossorigin: "crossOrigin",
    referrerpolicy: "referrerPolicy",
    hreflang: "hrefLang",
    fetchpriority: "fetchPriority",
};

function mapAttributes(
    node: SanitizedHeadNode,
): Record<string, string | boolean> {
    const mapped: Record<string, string | boolean> = {};
    Object.entries(node.attributes).forEach(([key, value]) => {
        const reactKey = ATTRIBUTE_NAME_MAP[key] ?? key;
        if (value === "") {
            mapped[reactKey] = true;
            return;
        }
        mapped[reactKey] = value;
    });
    return mapped;
}

function renderNode(
    node: SanitizedHeadNode,
    index: number,
): React.ReactElement | null {
    const props = mapAttributes(node);
    const key = `${node.tag}-${index}`;
    switch (node.tag) {
        case "script": {
            if (node.content?.trim().length) {
                return (
                    <script key={key} {...props}>
                        {node.content}
                    </script>
                );
            }
            return <script key={key} {...props} />;
        }
        case "style": {
            return (
                <style key={key} {...props}>
                    {node.content ?? ""}
                </style>
            );
        }
        case "noscript": {
            return (
                <noscript
                    key={key}
                    {...props}
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: noscript content needs to render raw HTML for fallback messaging.
                    dangerouslySetInnerHTML={{ __html: node.content ?? "" }}
                />
            );
        }
        case "meta": {
            return <meta key={key} {...props} />;
        }
        case "link": {
            return <link key={key} {...props} />;
        }
        default: {
            return null;
        }
    }
}

export function InjectedHtml({
    nodes,
}: {
    nodes: SanitizedHeadNode[];
}): React.ReactElement | null {
    if (!nodes.length) {
        return null;
    }
    return <>{nodes.map((node, index) => renderNode(node, index))}</>;
}
