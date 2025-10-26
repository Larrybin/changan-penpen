import Link from "next/link";

import { Button } from "@/components/ui/button";

import type { CtaSectionData } from "./types";

type CtaSectionProps = {
    data: CtaSectionData;
};

export function CtaSection({ data }: CtaSectionProps) {
    return (
        <section className="mx-auto w-full max-w-3xl px-4 py-14 text-center">
            <h3 className="mb-3 font-extrabold text-3xl">{data.title}</h3>
            <p className="mb-6 text-yellow-200/80">{data.description}</p>
            <Link href="/signup">
                <Button className="bg-yellow-400 text-black hover:bg-yellow-300">
                    {data.primaryCta}
                </Button>
            </Link>
        </section>
    );
}
