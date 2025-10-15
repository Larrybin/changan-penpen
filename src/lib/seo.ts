import type { AppLocale } from "@/i18n/config";
import { defaultLocale, locales } from "@/i18n/config";
import type { SiteSettingsPayload } from "@/modules/admin/services/site-settings.service";

const LOCAL_DEV_APP_URL = "http://localhost:3000";

type ResolveAppUrlOptions = {
    envAppUrl?: string;
    fallbackLocalUrl?: string;
};

function getGlobalEnvOverride(key: string): string | undefined {
    try {
        const fromGlobal = (
            globalThis as {
                __ENV__?: Record<string, string | undefined>;
            }
        )?.__ENV__?.[key];
        if (typeof fromGlobal === "string" && fromGlobal.trim().length > 0) {
            return fromGlobal;
        }
    } catch (error) {
        console.warn("Failed to read global environment override", {
            key,
            error,
        });
    }
    return undefined;
}

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

function hasHttpScheme(input: string): boolean {
    const lower = input.toLowerCase();
    return lower.startsWith("http:") || lower.startsWith("https:");
}

function _isDataImageBase64(s: string): boolean {
    const lower = s.toLowerCase();
    if (!lower.startsWith("data:image/")) return false;
    const comma = lower.indexOf(",");
    if (comma === -1) return false;
    const prefix = lower.slice(0, comma); // e.g., data:image/png;base64
    if (!prefix.endsWith(";base64")) return false;
    const subtype = prefix.slice(
        "data:image/".length,
        prefix.length - ";base64".length,
    );
    const allowed = new Set(["png", "jpeg", "jpg", "gif", "webp", "svg+xml"]);
    if (!allowed.has(subtype)) return false;
    const data = s.slice(comma + 1);
    return /^[a-z0-9+/=]+$/i.test(data);
}

// noscript 内容允许的标签与属性（白名单）
const ALLOWED_NOSCRIPT_TAGS = new Set([
    "a",
    "p",
    "span",
    "strong",
    "em",
    "b",
    "i",
    "u",
    "s",
    "small",
    "code",
    "pre",
    "ul",
    "ol",
    "li",
    "br",
    "img",
]);

const NOSCRIPT_ALLOWED_ATTRS: Record<string, Set<string>> = {
    a: new Set(["href", "title", "rel", "target"]),
    img: new Set(["src", "alt", "width", "height", "loading"]),
    code: new Set(["class"]),
    pre: new Set(["class"]),
    p: new Set(["class"]),
    span: new Set(["class"]),
    strong: new Set(["class"]),
    em: new Set(["class"]),
    b: new Set(["class"]),
    i: new Set(["class"]),
    u: new Set(["class"]),
    s: new Set(["class"]),
    small: new Set(["class"]),
    ul: new Set(["class"]),
    ol: new Set(["class"]),
    li: new Set(["class"]),
    br: new Set([]),
};

function isAllowedNoscriptAttribute(tag: string, attr: string): boolean {
    if (attr.startsWith("data-")) return true;
    if (attr.startsWith("aria-")) return true;
    if (attr.toLowerCase().startsWith("on")) return false; // 阻断事件属�?    if (attr.toLowerCase() === "style") return false; // 阻断内联样式
    const set =
        NOSCRIPT_ALLOWED_ATTRS[tag as keyof typeof NOSCRIPT_ALLOWED_ATTRS];
    return Boolean(set?.has(attr));
}
function isAllowedUriScheme(url: string): boolean {
    if (url.startsWith("/")) return true;
    if (url.startsWith("//")) return true; // protocol-relative
    if (!hasHttpScheme(url)) return true; // relative paths
    try {
        const u = new URL(url, "https://example.com");
        const scheme = (u.protocol || "").toLowerCase();
        if (scheme === "http:" || scheme === "https:") return true;
    } catch {}
    // data URL (only images)
    if (_isDataImageBase64(url)) return true;
    // allow mailto links
    if (url.trim().toLowerCase().startsWith("mailto:")) return true;
    return false;
}

function stripWrappingQuotes(value: string): string {
    let start = 0;
    let end = value.length;

    while (start < end) {
        const char = value.charAt(start);
        if (char === "'" || char === '"') {
            start += 1;
            continue;
        }
        break;
    }

    while (end > start) {
        const char = value.charAt(end - 1);
        if (char === "'" || char === '"') {
            end -= 1;
            continue;
        }
        break;
    }

    if (start === 0 && end === value.length) {
        return value;
    }

    return value.slice(start, end);
}

function sanitizeNoscriptAttrValue(
    attribute: string,
    raw: string | undefined,
    _tag: string,
): string | undefined {
    if (!raw) return "";
    const val = stripWrappingQuotes(String(raw).trim());
    if (!val) return "";
    if (attribute === "href" || attribute === "src") {
        // sanitize script-like schemes in URLs
        const norm = val.replace(/\s+/g, "").toLowerCase();
        if (
            norm.startsWith("javascript:") ||
            norm.startsWith("vbscript:") ||
            norm.startsWith("data:")
        )
            return undefined;
        if (!isAllowedUriScheme(val)) return undefined;
    }
    return val;
}

function escapeHtmlText(s: string): string {
    return s
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function serializeStartTag(
    tag: string,
    attrs: Record<string, string>,
    selfClosing: boolean,
): string {
    const parts: string[] = ["<", tag];
    for (const [k, v] of Object.entries(attrs)) {
        if (v === "") {
            parts.push(" ", k);
        } else {
            const safe = v.replaceAll('"', "&quot;");
            parts.push(" ", k, '="', safe, '"');
        }
    }
    parts.push(selfClosing ? "/>" : ">");
    return parts.join("");
}

// removed parseAttributesLoose\n

// 新的、基于线性扫描的实现，降低正则与认知复杂度
function isAsciiLetterCode(c: number): boolean {
    return (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
}
function isAlphaNumCode(c: number): boolean {
    return (
        (c >= 97 && c <= 122) || (c >= 65 && c <= 90) || (c >= 48 && c <= 57)
    );
}
function sanitizeNoscriptContent(input: string): string {
    if (!input) return "";
    let i = 0;
    let out = "";
    const len = input.length;

    while (i < len) {
        const lt = input.indexOf("<", i);
        if (lt === -1) {
            out += escapeHtmlText(input.slice(i));
            break;
        }

        if (lt > i) out += escapeHtmlText(input.slice(i, lt));

        // 注释 <!-- ... -->
        if (input.startsWith("<!--", lt)) {
            const end = input.indexOf("-->", lt + 4);
            i = end === -1 ? len : end + 3;
            continue;
        }

        const isEnd = input.charCodeAt(lt + 1) === 47; // '/'
        let j = isEnd ? lt + 2 : lt + 1;

        // 解析标签名（ASCII 字母 + 数字）
        const nameStart = j;
        if (j >= len) break;
        const first = input.charCodeAt(j);
        const isLetter = isAsciiLetterCode(first);
        if (!isLetter) {
            // 非标签起始，按文本处理
            out += "&lt;";
            i = lt + 1;
            continue;
        }
        j++;
        while (j < len) {
            const _c = input.charCodeAt(j);
            if (!isAlphaNumCode(_c)) break;
            j++;
        }
        const name = input.slice(nameStart, j).toLowerCase();
        const gt = input.indexOf(">", j);
        if (gt === -1) {
            out += escapeHtmlText(input.slice(lt));
            break;
        }

        if (!ALLOWED_NOSCRIPT_TAGS.has(name)) {
            i = gt + 1;
            continue;
        }

        const rawInside = input.slice(j, gt);
        const isSelfClosing =
            rawInside.trimEnd().endsWith("/") ||
            name === "br" ||
            name === "img";

        if (isEnd) {
            out += `</${name}>`;
            i = gt + 1;
            continue;
        }

        const safeAttrs = parseNoscriptAttributesLinear(rawInside, name);
        out += serializeStartTag(name, safeAttrs, isSelfClosing);
        i = gt + 1;
    }
    return out;
}

// 线性扫描解析 noscript 内部标签属性，使用 noscript 白名单与专用净化
function parseNoscriptAttributesLinear(
    raw: string,
    tag: string,
): Record<string, string> {
    const attrs: Record<string, string> = {};
    const len = raw.length;
    let i = 0;
    const isWs = (c: number) => c === 32 || c === 10 || c === 13 || c === 9;
    const skipWs = () => {
        while (i < len && isWs(raw.charCodeAt(i))) i++;
    };
    const readName = (): string | null => {
        const start = i;
        while (i < len) {
            const ch = raw.charCodeAt(i);
            const isAlpha = (ch >= 97 && ch <= 122) || (ch >= 65 && ch <= 90);
            const isDigit = ch >= 48 && ch <= 57;
            const isOther = ch === 45 /*-*/ || ch === 58 /*:*/;
            if (!(isAlpha || isDigit || isOther)) break;
            i++;
        }
        if (i === start) return null;
        return raw.slice(start, i);
    };
    const readValue = (): string | undefined => {
        if (i >= len) return undefined;
        const ch = raw.charAt(i);
        if (ch === '"' || ch === "'") {
            const quote = ch;
            const start = i;
            i++;
            while (i < len && raw.charAt(i) !== quote) i++;
            if (i < len) i++;
            return raw.slice(start, i);
        }
        const start = i;
        while (i < len && !isWs(raw.charCodeAt(i))) i++;
        return raw.slice(start, i);
    };

    while (i < len) {
        skipWs();
        const rawName = readName();
        if (!rawName) break;
        const attr = rawName.toLowerCase();
        skipWs();
        let rawValue: string | undefined;
        if (raw.charAt(i) === "=") {
            i++;
            skipWs();
            rawValue = readValue();
        }
        if (!isAllowedNoscriptAttribute(tag, attr)) continue;
        if (!rawValue && attr && attr in Object.prototype) continue;
        if (!rawValue && attr) {
            // boolean attribute allowed
            attrs[attr] = "";
            continue;
        }
        const safeVal = sanitizeNoscriptAttrValue(attr, rawValue, tag);
        if (safeVal !== undefined) attrs[attr] = safeVal;
    }
    return attrs;
}

export const localeCurrencyMap: Record<AppLocale, string> = {
    en: "USD",
    de: "EUR",
    fr: "EUR",
    pt: "BRL",
};

function dropHttpPrefix(value: string): string {
    const lower = value.toLowerCase();
    if (lower.startsWith("http://")) return value.slice(7);
    if (lower.startsWith("https://")) return value.slice(8);
    return value;
}

function normalizeBaseUrl(candidate: string): string | undefined {
    if (!candidate) {
        return undefined;
    }
    const trimmed = candidate.trim();
    if (!trimmed) {
        return undefined;
    }
    const prefixed = hasHttpScheme(trimmed)
        ? trimmed
        : `https://${dropHttpPrefix(trimmed)}`;
    try {
        const parsed = new URL(prefixed);
        return parsed.origin;
    } catch (error) {
        console.warn("Failed to normalize base URL", { candidate, error });
        return undefined;
    }
}

export function resolveAppUrl(
    settings?: SiteSettingsPayload | null,
    options: ResolveAppUrlOptions = {},
): string {
    const configured = normalizeBaseUrl(settings?.domain ?? "");
    if (configured) {
        return configured;
    }
    const envAppUrl =
        options.envAppUrl ?? getGlobalEnvOverride("NEXT_PUBLIC_APP_URL");
    const fallback = normalizeBaseUrl(envAppUrl ?? "");
    if (fallback) {
        return fallback;
    }
    const normalizedLocal = normalizeBaseUrl(
        options.fallbackLocalUrl ?? LOCAL_DEV_APP_URL,
    );
    if (normalizedLocal) {
        console.warn("Falling back to default development URL", {
            domain: settings?.domain,
            hasEnvFallback: Boolean(envAppUrl),
            fallback: normalizedLocal,
        });
        return normalizedLocal;
    }
    const error = new AppUrlResolutionError();
    console.error(error.message, {
        domain: settings?.domain,
        hasEnvFallback: Boolean(envAppUrl),
    });
    throw error;
}

export function ensureAbsoluteUrl(value: string, baseUrl: string): string {
    const trimmed = value?.trim();
    if (!trimmed) {
        return baseUrl;
    }
    if (hasHttpScheme(trimmed)) {
        return trimmed;
    }
    if (trimmed.startsWith("//")) {
        return `https:${trimmed}`;
    }
    const normalizedBase = normalizeBaseUrl(baseUrl) ?? baseUrl;
    try {
        if (trimmed.startsWith("/")) {
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
    const configuredLocales = new Set<string>(locales as readonly string[]);
    const enabled = settings?.enabledLanguages ?? [];
    const filtered = enabled.filter((locale): locale is AppLocale =>
        configuredLocales.has(locale),
    );
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
    const trimmed = stripWrappingQuotes(value.trim());
    if (!trimmed) {
        return "";
    }
    const lowered = trimmed.toLowerCase();
    if (
        lowered.startsWith("javascript:") ||
        lowered.startsWith("data:") ||
        lowered.startsWith("vbscript:")
    ) {
        return undefined;
    }
    if ((attribute === "src" || attribute === "href") && tag !== "meta") {
        if (
            !(
                hasHttpScheme(trimmed) ||
                trimmed.startsWith("//") ||
                trimmed.startsWith("/")
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
    const len = rawAttributes.length;
    let i = 0;

    const isWs = (c: number) => c === 32 || c === 10 || c === 13 || c === 9;
    const skipWs = () => {
        while (i < len && isWs(rawAttributes.charCodeAt(i))) i++;
    };

    const readName = (): string | null => {
        const start = i;
        while (i < len) {
            const ch = rawAttributes.charCodeAt(i);
            const isAlpha = (ch >= 97 && ch <= 122) || (ch >= 65 && ch <= 90);
            const isDigit = ch >= 48 && ch <= 57;
            const isOther = ch === 45 /*-*/ || ch === 58 /*:*/;
            if (!(isAlpha || isDigit || isOther)) break;
            i++;
        }
        if (i === start) return null;
        return rawAttributes.slice(start, i).toLowerCase();
    };

    const readValue = (): string | undefined => {
        if (i >= len) return undefined;
        const ch = rawAttributes.charAt(i);
        if (ch === '"' || ch === "'") {
            const quote = ch;
            const start = i;
            i++; // skip opening
            while (i < len && rawAttributes.charAt(i) !== quote) i++;
            if (i < len) i++; // include closing
            return rawAttributes.slice(start, i);
        }
        const start = i;
        while (i < len && !isWs(rawAttributes.charCodeAt(i))) i++;
        return rawAttributes.slice(start, i);
    };

    while (i < len) {
        skipWs();
        const name = readName();
        if (!name) break;
        skipWs();

        let rawValue: string | undefined;
        if (rawAttributes.charAt(i) === "=") {
            i++;
            skipWs();
            rawValue = readValue();
        }

        if (!isAllowedAttribute(tag, name)) {
            // skip silently for disallowed attributes
            continue;
        }

        if (!rawValue && ALLOWED_BOOLEAN_ATTRIBUTES.has(name)) {
            attributes[name] = "";
            continue;
        }

        const sanitized = sanitizeAttributeValue(name, rawValue, tag);
        if (sanitized !== undefined) {
            attributes[name] = sanitized;
        }
    }
    return attributes;
}

export function sanitizeCustomHtml(html: string): SanitizedHeadNode[] {
    if (!html) return [];
    const nodes: SanitizedHeadNode[] = [];

    const lower = html.toLowerCase();
    const allowedWithContent: AllowedHeadTag[] = [
        "script",
        "style",
        "noscript",
    ];
    const allowedSelfClosing: AllowedHeadTag[] = ["meta", "link"];

    function tryProcessWithContent(
        lt: number,
        tag: AllowedHeadTag,
    ): { node: SanitizedHeadNode; next: number } | null {
        const open = `<${tag}`;
        if (!lower.startsWith(open, lt)) return null;
        const gt = html.indexOf(">", lt + open.length);
        if (gt === -1)
            return { node: { tag, attributes: {} }, next: html.length };
        const rawAttrs = html.slice(lt + open.length, gt);
        const close = `</${tag}>`;
        const closeIdx = lower.indexOf(close, gt + 1);
        const content = closeIdx === -1 ? "" : html.slice(gt + 1, closeIdx);
        const attributes = parseAttributes(rawAttrs, tag);
        const safeContent =
            tag === "noscript" && content
                ? sanitizeNoscriptContent(content)
                : content;
        const node: SanitizedHeadNode = {
            tag,
            attributes,
            content: safeContent,
        };
        const next = closeIdx === -1 ? gt + 1 : closeIdx + close.length;
        return { node, next };
    }

    function tryProcessSelfClosing(
        lt: number,
        tag: AllowedHeadTag,
    ): { node: SanitizedHeadNode; next: number } | null {
        const open = `<${tag}`;
        if (!lower.startsWith(open, lt)) return null;
        const gt = html.indexOf(">", lt + open.length);
        if (gt === -1)
            return { node: { tag, attributes: {} }, next: html.length };
        const rawAttrs = html.slice(lt + open.length, gt);
        const attributes = parseAttributes(rawAttrs, tag);
        const node: SanitizedHeadNode = { tag, attributes };
        return { node, next: gt + 1 };
    }

    let i = 0;
    while (i < html.length) {
        const lt = lower.indexOf("<", i);
        if (lt === -1) break;

        // Skip comments quickly
        if (lower.startsWith("<!--", lt)) {
            const endComment = lower.indexOf("-->", lt + 4);
            i = endComment === -1 ? html.length : endComment + 3;
            continue;
        }

        let handled = false;
        for (const tag of allowedWithContent) {
            const res = tryProcessWithContent(lt, tag);
            if (res) {
                nodes.push(res.node);
                i = res.next;
                handled = true;
                break;
            }
        }
        if (handled) continue;

        for (const tag of allowedSelfClosing) {
            const res = tryProcessSelfClosing(lt, tag);
            if (res) {
                nodes.push(res.node);
                i = res.next;
                handled = true;
                break;
            }
        }
        if (handled) continue;

        // Not an allowed tag; skip this '<'
        i = lt + 1;
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
