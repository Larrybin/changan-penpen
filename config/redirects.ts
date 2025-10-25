import type { Redirect } from "next/dist/lib/load-custom-routes";

const BASE_REDIRECTS: Array<Pick<Redirect, "source" | "destination">> = [
    {
        source: "/privacy-policy",
        destination: "/privacy",
    },
    {
        source: "/terms-of-service",
        destination: "/terms",
    },
    {
        source: "/about-us",
        destination: "/about",
    },
];

function withLocalePrefixes(
    redirect: Pick<Redirect, "source" | "destination">,
): Redirect[] {
    return [
        { ...redirect, permanent: true },
        {
            source: `/:locale${redirect.source}`,
            destination: `/:locale${redirect.destination}`,
            permanent: true,
        },
    ];
}

export function buildRedirects(): Redirect[] {
    return BASE_REDIRECTS.flatMap(withLocalePrefixes);
}
