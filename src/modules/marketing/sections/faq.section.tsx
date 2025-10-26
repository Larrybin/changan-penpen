import Link from "next/link";

import { renderRichText } from "../utils/rich-text";
import type { FaqSectionData } from "./types";

type FaqSectionProps = {
    data: FaqSectionData;
};

export function FaqSection({ data }: FaqSectionProps) {
    const supportingCopyNodes = data.supportingCopy
        ? renderRichText(data.supportingCopy, {
              contactLink: (chunks, key) => (
                  <Link
                      key={key}
                      href="/contact"
                      className="underline decoration-yellow-300 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 focus-visible:outline-offset-2"
                  >
                      {chunks}
                  </Link>
              ),
              aboutLink: (chunks, key) => (
                  <Link
                      key={key}
                      href="/about"
                      className="underline decoration-yellow-300 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 focus-visible:outline-offset-2"
                  >
                      {chunks}
                  </Link>
              ),
          })
        : null;

    return (
        <section
            id="faq"
            className="mx-auto w-full max-w-4xl px-[var(--container-px)] py-10"
        >
            <h2 className="mb-6 text-center font-bold text-subtitle">
                {data.title}
            </h2>
            <div className="space-y-3">
                {data.items.map((item) => (
                    <details
                        key={item.question}
                        className="rounded-md border border-yellow-400/20 bg-black/40 p-4"
                    >
                        <summary className="cursor-pointer font-medium text-yellow-50">
                            {item.question}
                        </summary>
                        <p className="mt-2 text-sm text-yellow-200/80">
                            {item.answer}
                        </p>
                    </details>
                ))}
            </div>
            {supportingCopyNodes ? (
                <p className="mt-6 text-sm text-yellow-100/80">
                    {supportingCopyNodes}
                </p>
            ) : null}
        </section>
    );
}
