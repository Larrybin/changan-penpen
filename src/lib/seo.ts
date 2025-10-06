import type { AppLocale } from "@/i18n/config";
import { defaultLocale, locales } from "@/i18n/config";
import type { SiteSettingsPayload } from "@/modules/admin/services/site-settings.service";

const FALLBACK_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export class AppUrlResolutionError extends Error {
    constructor(
        message = "Unable to resolve the application URL. Configure the domain in site settings or set NEXT_PUBLIC_APP_URL.",
    ) {
        super(message);
        this.name = "AppUrlResolutionError";
    }
}

export type AllowedHeadTag = "script" | "meta" | "link" | "style" | "noscript";

export type SanitizedHeadNode = {
    tag: AllowedHeadTag;
    attributes: Record<string, string>;
    content?: string;
};

const ALLOWED_ATTRIBUTES: Record<AllowedHeadTag, Set<string>> = {
    script: new Set([
        "src",
        "async",
        "defer",
        "type",
        "crossorigin",
        "nonce",
        "referrerpolicy",
        "integrity",
        "data-domain",
        "data-site",
        "data-site-id",
        "data-api",
        "data-host",
    ]),
    meta: new Set(["name", "content", "property", "http-equiv", "charset"]),
    link: new Set([
        "rel",
        "href",
        "as",
        "type",
        "media",
        "sizes",
        "crossorigin",
        "referrerpolicy",
        "fetchpriority",
        "title",
        "color",
    ]),
    style: new Set(["media", "nonce"]),
    noscript: new Set(),
};

const ALLOWED_BOOLEAN_ATTRIBUTES = new Set(["async", "defer"]);

const PROTOCOL_RELATIVE_REGEX = /^\/\//;
const ABSOLUTE_URL_REGEX = /^(https?:)/i;
const ROOT_RELATIVE_REGEX = /^\//;

export const localeCurrencyMap: Record<AppLocale, string> = {
    en: "USD",
    de: "EUR",
    fr: "EUR",
    pt: "BRL",
};

function normalizeBaseUrl(candidate: string): string | undefined {
    if (!candidate) {
        return undefined;
    }
    const trimmed = candidate.trim();
    if (!trimmed) {
        return undefined;
    }
    const prefixed = ABSOLUTE_URL_REGEX.test(trimmed)
        ? trimmed
        : `https://${trimmed.replace(/^https?:\/\//i, "")}`;
    try {
        const parsed = new URL(prefixed);
        return parsed.origin;
    } catch (error) {
        console.warn("Failed to normalize base URL", { candidate, error });
        return undefined;
    }
}

export function resolveAppUrl(settings?: SiteSettingsPayload | null): string {
    const configured = normalizeBaseUrl(settings?.domain ?? "");
    if (configured) {
        return configured;
    }
    const fallback = normalizeBaseUrl(FALLBACK_APP_URL ?? "");
    if (fallback) {
        return fallback;
    }
    const error = new AppUrlResolutionError();
    console.error(error.message, {
        domain: settings?.domain,
        hasEnvFallback: Boolean(FALLBACK_APP_URL),
    });
    throw error;
}

export function ensureAbsoluteUrl(value: string, baseUrl: string): string {
    const trimmed = value?.trim();
    if (!trimmed) {
        return baseUrl;
    }
    if (ABSOLUTE_URL_REGEX.test(trimmed)) {
        return trimmed;
    }
    if (PROTOCOL_RELATIVE_REGEX.test(trimmed)) {
        return `https:${trimmed}`;
    }
    const normalizedBase = normalizeBaseUrl(baseUrl) ?? baseUrl;
    try {
        if (ROOT_RELATIVE_REGEX.test(trimmed)) {
            return new URL(trimmed, normalizedBase).toString();
        }
        return new URL(`/${trimmed}`, normalizedBase).toString();
    } catch (error) {
        console.warn("Failed to resolve absolute URL", { value, error });
        return trimmed;
    }
}

export function getActiveAppLocales(
    settings?: SiteSettingsPayload | null,
): AppLocale[] {
    const configuredLocales = new Set<AppLocale>(locales);
    const enabled = settings?.enabledLanguages ?? [];
    const filtered = enabled
        .map((locale) => locale as AppLocale)
        .filter((locale) => configuredLocales.has(locale));
    if (filtered.length) {
        return Array.from(new Set(filtered));
    }
    return [...locales];
}

function isAllowedAttribute(tag: AllowedHeadTag, attribute: string): boolean {
    if (attribute.startsWith("data-")) {
        return true;
    }
    if (attribute.startsWith("aria-")) {
        return true;
    }
    if (attribute === "nonce") {
        return true;
    }
    return ALLOWED_ATTRIBUTES[tag]?.has(attribute) ?? false;
}

function sanitizeAttributeValue(
    attribute: string,
    value: string | undefined,
    tag: AllowedHeadTag,
): string | undefined {
    if (!value) {
        return "";
    }
    const trimmed = value.trim().replace(/^['"]|['"]$/g, "");
    if (!trimmed) {
        return "";
    }
    if (/javascript:/i.test(trimmed)) {
        return undefined;
    }
    if ((attribute === "src" || attribute === "href") && tag !== "meta") {
        if (
            !(
                ABSOLUTE_URL_REGEX.test(trimmed) ||
                PROTOCOL_RELATIVE_REGEX.test(trimmed) ||
                ROOT_RELATIVE_REGEX.test(trimmed)
            )
        ) {
            return undefined;
        }
    }
    return trimmed;
}

function parseAttributes(
    rawAttributes: string,
    tag: AllowedHeadTag,
): Record<string, string> {
    const attributes: Record<string, string> = {};
    const attributeRegex =
        /([a-z0-9:-]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?/gi;
    for (const match of rawAttributes.matchAll(attributeRegex)) {
        const attributeName = match[1].toLowerCase();
        if (!isAllowedAttribute(tag, attributeName)) {
            continue;
        }
        const rawValue = match[2];
        if (!rawValue && ALLOWED_BOOLEAN_ATTRIBUTES.has(attributeName)) {
            attributes[attributeName] = "";
            continue;
        }
        const sanitizedValue = sanitizeAttributeValue(
            attributeName,
            rawValue,
            tag,
        );
        if (sanitizedValue !== undefined) {
            attributes[attributeName] = sanitizedValue;
        }
    }
    return attributes;
}

export function sanitizeCustomHtml(html: string): SanitizedHeadNode[] {
    if (!html) {
        return [];
    }
    const nodes: SanitizedHeadNode[] = [];
    const nodeRegex =
        /<(script|style|noscript)([^>]*)>([\s\S]*?)<\/\1\s*>|<(meta|link)([^>]*)\/?\s*>/gi;
    for (const match of html.matchAll(nodeRegex)) {
        if (match[1]) {
            const tag = match[1].toLowerCase() as AllowedHeadTag;
            const attributes = parseAttributes(match[2] ?? "", tag);
            nodes.push({
                tag,
                attributes,
                content: match[3] ?? "",
            });
            continue;
        }
        if (match[4]) {
            const tag = match[4].toLowerCase() as AllowedHeadTag;
            const attributes = parseAttributes(match[5] ?? "", tag);
            nodes.push({
                tag,
                attributes,
            });
        }
    }
    return nodes;
}

export function buildLocalizedPath(locale: AppLocale, path: string): string {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    if (normalized === "/") {
        return locale === defaultLocale ? "/" : `/${locale}`;
    }
    return locale === defaultLocale ? normalized : `/${locale}${normalized}`;
}
