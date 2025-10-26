import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

import type { MarketingSection } from "@/lib/static-config";

type ResolveVariantOptions = {
    section: MarketingSection;
    availableVariants: string[];
    defaultVariant: string;
    searchParams?: Record<string, string | string[] | undefined>;
    cookies?: ReadonlyRequestCookies;
};

type ResolveVariantResult = {
    variant: string;
    source: "query" | "cookie" | "default";
};

const QUERY_PREFIX = "variant_";
const COOKIE_PREFIX = "marketing-variant-";

function toSingleValue(value: string | string[] | undefined): string | null {
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }
    if (typeof value === "string") {
        return value;
    }
    return null;
}

export function resolveMarketingVariant({
    section,
    availableVariants,
    defaultVariant,
    searchParams,
    cookies,
}: ResolveVariantOptions): ResolveVariantResult {
    const allowed = new Set(availableVariants);
    const queryKey = `${QUERY_PREFIX}${section}`;
    const queryCandidate = toSingleValue(searchParams?.[queryKey])?.trim();
    if (queryCandidate && allowed.has(queryCandidate)) {
        return { variant: queryCandidate, source: "query" };
    }

    const cookieKey = `${COOKIE_PREFIX}${section}`;
    const cookieCandidate = cookies?.get(cookieKey)?.value?.trim();
    if (cookieCandidate && allowed.has(cookieCandidate)) {
        return { variant: cookieCandidate, source: "cookie" };
    }

    return { variant: defaultVariant, source: "default" };
}
