import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";

import { renderRichText } from "../utils/rich-text";
import type { TrustSectionData } from "./types";

type TrustSectionProps = {
    data: TrustSectionData;
};

export function TrustSection({ data }: TrustSectionProps) {
    const calloutNodes = data.callout
        ? renderRichText(data.callout, {
              privacyLink: (chunks, key) => (
                  <Link
                      key={key}
                      href="/privacy"
                      className="underline decoration-yellow-300 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 focus-visible:outline-offset-2"
                  >
                      {chunks}
                  </Link>
              ),
          })
        : null;

    return (
        <section
            id="trust"
            className="mx-auto w-full max-w-[var(--container-max-w)] px-[var(--container-px)] py-10"
        >
            <h2 className="mb-4 text-center font-bold text-subtitle">
                {data.title}
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-center text-yellow-200/80">
                {data.description}
            </p>
            <div className="grid gap-4 md:grid-cols-3">
                {data.items.map((item) => (
                    <Card
                        key={`${item.author}-${item.role}`}
                        className="h-full border-yellow-400/20 bg-black/40"
                    >
                        <CardContent className="flex flex-col gap-3 p-5">
                            <p className="text-sm text-yellow-50 leading-relaxed">
                                “{item.quote}”
                            </p>
                            <div className="text-xs text-yellow-200/70">
                                <p className="font-semibold">{item.author}</p>
                                <p>{item.role}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {calloutNodes ? (
                <p className="mt-8 text-center text-sm text-yellow-100/80">
                    {calloutNodes}
                </p>
            ) : null}
        </section>
    );
}
