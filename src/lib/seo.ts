import type { AppLocale } from "@/i18n/config";
import { getDefaultLocale, getLocales } from "@/i18n/config";
import type { SiteSettingsPayload } from "@/modules/admin/services/site-settings.service";

const LOCAL_DEV_APP_URL = "http://localhost:3000";

type ResolveAppUrlOptions = {
    envAppUrl?: string;
    fallbackLocalUrl?: string;
    allowLocalInProduction?: boolean;
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

function getProcessEnv(key: string): string | undefined {
    try {
        return (
            globalThis as {
                process?: { env?: Record<string, string | undefined> };
            }
        ).process?.env?.[key];
    } catch {
        return undefined;
    }
}

function parseBooleanFlag(value: string | undefined): boolean | undefined {
    if (typeof value !== "string") return undefined;
    const normalized = value.trim().toLowerCase();
    if (!normalized) return undefined;
    if (normalized === "1" || normalized === "true") return true;
    if (normalized === "0" || normalized === "false") return false;
    return undefined;
}

function shouldAllowLocalAppUrl(options: ResolveAppUrlOptions): boolean {
    if (typeof options.allowLocalInProduction === "boolean") {
        return options.allowLocalInProduction;
    }

    const globalOverride = parseBooleanFlag(
        getGlobalEnvOverride("ALLOW_LOCAL_APP_URL"),
    );
    if (typeof globalOverride === "boolean") {
        return globalOverride;
    }

    return parseBooleanFlag(getProcessEnv("ALLOW_LOCAL_APP_URL")) ?? false;
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
    } catch {
        // Ignore invalid URLs and fall back to additional scheme checks.
    }
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
    let index = 0;
    let output = "";

    while (index < input.length) {
        const segment = consumeNoscriptSegment(input, index);
        output += segment.output;
        index = segment.nextIndex;
    }

    return output;
}

type NoscriptSegment = { output: string; nextIndex: number };

function consumeNoscriptSegment(input: string, start: number): NoscriptSegment {
    const text = consumeNoscriptPlainText(input, start);
    if (text) return text;

    const comment = consumeNoscriptComment(input, start);
    if (comment) return comment;

    const tag = consumeNoscriptTag(input, start);
    if (tag) return tag;

    return { output: "&lt;", nextIndex: Math.min(start + 1, input.length) };
}

function consumeNoscriptPlainText(
    input: string,
    start: number,
): NoscriptSegment | null {
    const lt = input.indexOf("<", start);
    if (lt === -1) {
        return {
            output: escapeHtmlText(input.slice(start)),
            nextIndex: input.length,
        };
    }
    if (lt > start) {
        return {
            output: escapeHtmlText(input.slice(start, lt)),
            nextIndex: lt,
        };
    }
    return null;
}

function consumeNoscriptComment(
    input: string,
    start: number,
): NoscriptSegment | null {
    if (!input.startsWith("<!--", start)) return null;
    const end = input.indexOf("-->", start + 4);
    return { output: "", nextIndex: end === -1 ? input.length : end + 3 };
}

type ScannedNoscriptTag = {
    name: string;
    isClosing: boolean;
    rawAttributes: string;
    nextIndex: number;
};

function consumeNoscriptTag(
    input: string,
    start: number,
): NoscriptSegment | null {
    if (input.charAt(start) !== "<") return null;
    const afterLt = start + 1;
    if (afterLt >= input.length) {
        return { output: "&lt;", nextIndex: input.length };
    }
    const isClosing = input.charCodeAt(afterLt) === 47;
    const nameStart = isClosing ? afterLt + 1 : afterLt;
    if (nameStart >= input.length) {
        return { output: "&lt;", nextIndex: Math.min(start + 1, input.length) };
    }
    if (!isAsciiLetterCode(input.charCodeAt(nameStart))) {
        return { output: "&lt;", nextIndex: start + 1 };
    }

    const scanned = scanNoscriptTag(input, nameStart, isClosing);
    if (!scanned) {
        return {
            output: escapeHtmlText(input.slice(start)),
            nextIndex: input.length,
        };
    }
    if (!ALLOWED_NOSCRIPT_TAGS.has(scanned.name)) {
        return { output: "", nextIndex: scanned.nextIndex };
    }
    if (scanned.isClosing) {
        return { output: `</${scanned.name}>`, nextIndex: scanned.nextIndex };
    }
    const attrs = parseNoscriptAttributesLinear(
        scanned.rawAttributes,
        scanned.name,
    );
    const selfClosing = isSelfClosingNoscript(
        scanned.name,
        scanned.rawAttributes,
    );
    return {
        output: serializeStartTag(scanned.name, attrs, selfClosing),
        nextIndex: scanned.nextIndex,
    };
}

function scanNoscriptTag(
    input: string,
    nameStart: number,
    isClosing: boolean,
): ScannedNoscriptTag | null {
    let cursor = nameStart + 1;
    while (cursor < input.length && isAlphaNumCode(input.charCodeAt(cursor))) {
        cursor++;
    }

    const name = input.slice(nameStart, cursor).toLowerCase();
    const gt = input.indexOf(">", cursor);
    if (gt === -1) return null;

    return {
        name,
        isClosing,
        rawAttributes: input.slice(cursor, gt),
        nextIndex: gt + 1,
    };
}

function isSelfClosingNoscript(tag: string, rawInside: string): boolean {
    if (tag === "br" || tag === "img") return true;
    return rawInside.trimEnd().endsWith("/");
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

function isLikelyLocalOrigin(origin: string): boolean {
    try {
        const url = new URL(origin);
        const hostname = url.hostname.toLowerCase();
        if (hostname === "localhost" || hostname === "0.0.0.0") {
            return true;
        }
        if (hostname.endsWith(".local")) {
            return true;
        }
        if (hostname.startsWith("127.")) {
            return true;
        }
        return false;
    } catch (error) {
        console.warn("Failed to inspect origin for locality", {
            origin,
            error,
        });
        return false;
    }
}

export function resolveAppUrl(
    settings?: SiteSettingsPayload | null,
    options: ResolveAppUrlOptions = {},
): string {
    const allowLocalInProduction = shouldAllowLocalAppUrl(options);
    const isProduction = Boolean(
        (
            globalThis as {
                process?: { env?: Record<string, string | undefined> };
            }
        ).process?.env?.NODE_ENV === "production",
    );
    const configured = normalizeBaseUrl(settings?.domain ?? "");
    if (configured) {
        if (
            isProduction &&
            isLikelyLocalOrigin(configured) &&
            !allowLocalInProduction
        ) {
            const error = new AppUrlResolutionError(
                "Configured domain resolves to a local development host. Update site settings with your production domain.",
            );
            console.error(error.message, { domain: settings?.domain });
            throw error;
        }
        return configured;
    }
    const envAppUrl =
        options.envAppUrl ?? getGlobalEnvOverride("NEXT_PUBLIC_APP_URL");
    const fallback = normalizeBaseUrl(envAppUrl ?? "");
    if (fallback) {
        if (
            isProduction &&
            isLikelyLocalOrigin(fallback) &&
            !allowLocalInProduction
        ) {
            const error = new AppUrlResolutionError(
                "NEXT_PUBLIC_APP_URL points to a local development host. Provide a production URL for canonical tags.",
            );
            console.error(error.message, { envAppUrl: fallback });
            throw error;
        }
        return fallback;
    }
    if (!isProduction) {
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
    const supportedLocales = getLocales();
    const configuredLocales = new Set<string>(supportedLocales);
    const enabled = settings?.enabledLanguages ?? [];
    const filtered = enabled.filter((locale): locale is AppLocale =>
        configuredLocales.has(locale),
    );
    if (filtered.length) {
        return Array.from(new Set(filtered));
    }
    return [...supportedLocales];
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
    const withContentTags: AllowedHeadTag[] = ["script", "style", "noscript"];
    const selfClosingTags: AllowedHeadTag[] = ["meta", "link"];

    type TagProcessor = (
        lt: number,
    ) => { node: SanitizedHeadNode; next: number } | null;

    const processors: TagProcessor[] = [
        ...withContentTags.map((tag) =>
            createContentProcessor(tag, html, lower),
        ),
        ...selfClosingTags.map((tag) =>
            createSelfClosingProcessor(tag, html, lower),
        ),
    ];

    let index = 0;
    while (index < html.length) {
        const lt = lower.indexOf("<", index);
        if (lt === -1) break;

        const commentEnd = findHtmlCommentEnd(lower, lt, html.length);
        if (commentEnd !== null) {
            index = commentEnd;
            continue;
        }

        const processed = tryProcessAllowedTag(processors, lt);
        if (processed) {
            nodes.push(processed.node);
            index = processed.next;
            continue;
        }

        index = lt + 1;
    }
    return nodes;
}

function createContentProcessor(
    tag: AllowedHeadTag,
    html: string,
    lower: string,
): (lt: number) => { node: SanitizedHeadNode; next: number } | null {
    const open = `<${tag}`;
    const close = `</${tag}>`;
    return (lt: number) => {
        if (!lower.startsWith(open, lt)) return null;
        const gt = html.indexOf(">", lt + open.length);
        if (gt === -1) {
            return { node: { tag, attributes: {} }, next: html.length };
        }
        const rawAttrs = html.slice(lt + open.length, gt);
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
    };
}

function createSelfClosingProcessor(
    tag: AllowedHeadTag,
    html: string,
    lower: string,
): (lt: number) => { node: SanitizedHeadNode; next: number } | null {
    const open = `<${tag}`;
    return (lt: number) => {
        if (!lower.startsWith(open, lt)) return null;
        const gt = html.indexOf(">", lt + open.length);
        if (gt === -1) {
            return { node: { tag, attributes: {} }, next: html.length };
        }
        const rawAttrs = html.slice(lt + open.length, gt);
        const attributes = parseAttributes(rawAttrs, tag);
        const node: SanitizedHeadNode = { tag, attributes };
        return { node, next: gt + 1 };
    };
}

function findHtmlCommentEnd(
    lower: string,
    start: number,
    fallback: number,
): number | null {
    if (!lower.startsWith("<!--", start)) return null;
    const endComment = lower.indexOf("-->", start + 4);
    return endComment === -1 ? fallback : endComment + 3;
}

function tryProcessAllowedTag(
    processors: Array<
        (lt: number) => { node: SanitizedHeadNode; next: number } | null
    >,
    lt: number,
): { node: SanitizedHeadNode; next: number } | null {
    for (const processor of processors) {
        const result = processor(lt);
        if (result) {
            return result;
        }
    }
    return null;
}

export function buildLocalizedPath(locale: AppLocale, path: string): string {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    const defaultLocale = getDefaultLocale();
    if (normalized === "/") {
        return locale === defaultLocale ? "/" : `/${locale}`;
    }
    return locale === defaultLocale ? normalized : `/${locale}${normalized}`;
}
