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
            globalThis as unknown as {
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
    if (attr.toLowerCase().startsWith("on")) return false; // 阻断事件属性
    if (attr.toLowerCase() === "style") return false; // 阻断内联样式
    const set =
        NOSCRIPT_ALLOWED_ATTRS[tag as keyof typeof NOSCRIPT_ALLOWED_ATTRS];
    return Boolean(set?.has(attr));
}

function isAllowedUriScheme(url: string): boolean {
    // 允许 https、mailto、相对路径，以及 data: 仅图片
    if (ROOT_RELATIVE_REGEX.test(url)) return true;
    if (PROTOCOL_RELATIVE_REGEX.test(url)) return true; // //example.com 视作 https
    if (!ABSOLUTE_URL_REGEX.test(url)) return true; // 其他相对路径
    try {
        const u = new URL(url, "https://example.com");
        const scheme = (u.protocol || "").toLowerCase();
        if (scheme === "http:" || scheme === "https:") return true;
    } catch {}
    // data URL 单独判定（仅图片 MIME）
    if (
        /^data:image\/(?:png|jpe?g|gif|webp|svg\+xml);base64,[a-z0-9+/=]+$/i.test(
            url,
        )
    )
        return true;
    if (/^mailto:/i.test(url)) return true;
    return false;
}

function sanitizeNoscriptAttrValue(
    attribute: string,
    raw: string | undefined,
    _tag: string,
): string | undefined {
    if (!raw) return "";
    const val = String(raw)
        .trim()
        .replace(/^['"]|['"]$/g, "");
    if (!val) return "";
    if (attribute === "href" || attribute === "src") {
        // 拦截 javascript:/vbscript:/data: 非图片
        const norm = val.replace(/\s+/g, "");
        if (/^(?:javascript|vbscript):/i.test(norm)) return undefined;
        if (!isAllowedUriScheme(val)) return undefined;
    }
    return val;
}

function escapeHtmlText(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
            const safe = v.replace(/"/g, "&quot;");
            parts.push(" ", k, '="', safe, '"');
        }
    }
    parts.push(selfClosing ? "/>" : ">");
    return parts.join("");
}

function parseAttributesLoose(
    raw: string,
): Array<{ name: string; value?: string }> {
    const out: Array<{ name: string; value?: string }> = [];
    const re =
        /([a-zA-Z0-9:-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>`]+)))?/g;
    let m: RegExpExecArray | null;
    // 避免在表达式中进行赋值（Biome: noAssignInExpressions）
    // eslint-disable-next-line no-constant-condition
    while (true) {
        m = re.exec(raw);
        if (!m) break;
        const name = m[1];
        const value = m[3] ?? m[4] ?? m[5];
        out.push({ name, value });
    }
    return out;
}

function sanitizeNoscriptContent(input: string): string {
    if (!input) return "";
    let result = "";
    let lastIndex = 0;
    const tagRe = /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
    let m: RegExpExecArray | null;
    // 避免在表达式中进行赋值（Biome: noAssignInExpressions）
    // eslint-disable-next-line no-constant-condition
    while (true) {
        m = tagRe.exec(input);
        if (!m) break;
        // 文本片段
        if (m.index > lastIndex) {
            result += escapeHtmlText(input.slice(lastIndex, m.index));
        }
        lastIndex = tagRe.lastIndex;

        // 注释直接丢弃
        if (!m[1]) {
            continue;
        }

        const rawTag = m[0];
        const name = m[1].toLowerCase();
        const isEnd = /^<\//.test(rawTag);
        const isSelfClosing =
            /\/>\s*$/.test(rawTag) || name === "br" || name === "img";

        if (!ALLOWED_NOSCRIPT_TAGS.has(name)) {
            // 非白名单标签全部丢弃（包含其起止标记）
            continue;
        }

        if (isEnd) {
            result += `</${name}>`;
            continue;
        }

        const rawAttrs = m[2] || "";
        const parsed = parseAttributesLoose(rawAttrs);
        const safeAttrs: Record<string, string> = {};
        for (const { name: attrNameRaw, value } of parsed) {
            const attr = attrNameRaw.toLowerCase();
            if (!isAllowedNoscriptAttribute(name, attr)) continue;
            const safeVal = sanitizeNoscriptAttrValue(attr, value, name);
            if (safeVal === undefined) continue;
            safeAttrs[attr] = safeVal;
        }
        result += serializeStartTag(name, safeAttrs, isSelfClosing);
    }
    // 剩余文本
    if (lastIndex < input.length) {
        result += escapeHtmlText(input.slice(lastIndex));
    }
    return result;
}

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
    if (!html) return [];
    const nodes: SanitizedHeadNode[] = [];

    const lower = html.toLowerCase();
    const allowedWithContent = ["script", "style", "noscript"] as const;
    const allowedSelfClosing = ["meta", "link"] as const;

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

        // Try content tags first
        let matched = false;
        for (const tag of allowedWithContent) {
            const open = `<${tag}`;
            if (!lower.startsWith(open, lt)) continue;
            matched = true;
            const gt = html.indexOf(">", lt + open.length);
            if (gt === -1) {
                i = html.length;
                break;
            }
            const rawAttrs = html.slice(lt + open.length, gt);
            const close = `</${tag}>`;
            const closeIdx = lower.indexOf(close, gt + 1);
            const content = closeIdx === -1 ? "" : html.slice(gt + 1, closeIdx);
            const attributes = parseAttributes(rawAttrs, tag);
            let safeContent = content;
            if (tag === "noscript" && content) {
                safeContent = sanitizeNoscriptContent(content);
            }
            nodes.push({ tag, attributes, content: safeContent });
            i = closeIdx === -1 ? gt + 1 : closeIdx + close.length;
            break;
        }
        if (matched) continue;

        // Try self-closing tags
        for (const tag of allowedSelfClosing) {
            const open = `<${tag}`;
            if (!lower.startsWith(open, lt)) continue;
            matched = true;
            const gt = html.indexOf(">", lt + open.length);
            if (gt === -1) {
                i = html.length;
                break;
            }
            const rawAttrs = html.slice(lt + open.length, gt);
            const attributes = parseAttributes(rawAttrs, tag);
            nodes.push({ tag, attributes });
            i = gt + 1;
            break;
        }
        if (matched) continue;

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
