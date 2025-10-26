import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";

import { renderRichText } from "../utils/rich-text";
import type { FeaturesSectionData } from "./types";

type FeaturesSectionProps = {
    data: FeaturesSectionData;
};

export function FeaturesSection({ data }: FeaturesSectionProps) {
    const learnMoreNodes = data.learnMore
        ? renderRichText(data.learnMore, {
              billingLink: (chunks, key) => (
                  <Link
                      key={key}
                      href="/billing"
                      className="underline decoration-yellow-300 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 focus-visible:outline-offset-2"
                  >
                      {chunks}
                  </Link>
              ),
          })
        : null;

    return (
        <section
            id="features"
            className="mx-auto w-full max-w-[var(--container-max-w)] px-[var(--container-px)] py-10"
        >
            <h2 className="mb-6 text-center font-bold text-subtitle">
                {data.title}
            </h2>
            <div className="grid xs:grid-cols-2 gap-4 lg-narrow:grid-cols-3">
                {data.items.map((feature) => (
                    <Card
                        key={feature.title}
                        className="border-yellow-400/20 bg-black/40"
                    >
                        <CardContent className="p-4">
                            <h3 className="mb-1 font-semibold">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-yellow-200/80">
                                {feature.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {learnMoreNodes ? (
                <p className="mt-6 text-sm text-yellow-100/80">
                    {learnMoreNodes}
                </p>
            ) : null}
        </section>
    );
}
