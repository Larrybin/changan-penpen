import { afterEach, describe, expect, it, vi } from "vitest";
import type {
    AppUrlResolutionError as AppUrlResolutionErrorType,
    SanitizedHeadNode,
} from "../seo";

const originalEnv = process.env.NEXT_PUBLIC_APP_URL;
const OriginalURL = URL;

afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalEnv;
    global.URL = OriginalURL;
    vi.restoreAllMocks();
});

async function loadSeoModule() {
    vi.resetModules();
    return await import("../seo");
}

describe("resolveAppUrl", () => {
    it("uses configured site settings when provided", async () => {
        const { resolveAppUrl } = await loadSeoModule();
        const url = resolveAppUrl({ domain: "https://example.com" } as never);
        expect(url).toBe("https://example.com");
    });

    it("falls back to environment variable when settings are empty", async () => {
        process.env.NEXT_PUBLIC_APP_URL = "https://fallback.example";
        const { resolveAppUrl } = await loadSeoModule();
        const url = resolveAppUrl(null);
        expect(url).toBe("https://fallback.example");
    });

    it("falls back to localhost and logs a warning when nothing configured", async () => {
        process.env.NEXT_PUBLIC_APP_URL = "";
        const warnSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => undefined);
        const { resolveAppUrl } = await loadSeoModule();
        const url = resolveAppUrl({ domain: "" } as never);
        expect(url).toBe("http://localhost:3000");
        expect(warnSpy).toHaveBeenCalledWith(
            "Falling back to default development URL",
            expect.objectContaining({ fallback: "http://localhost:3000" }),
        );
    });

    it("throws an error when no URL can be resolved", async () => {
        process.env.NEXT_PUBLIC_APP_URL = "";
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => undefined);
        class FailingURL extends URL {
            constructor(input: string, base?: string | URL) {
                if (input.includes("localhost")) {
                    throw new Error("unsupported");
                }
                super(input, base);
            }
        }
        global.URL = FailingURL as unknown as typeof URL;

        const { resolveAppUrl, AppUrlResolutionError } =
            (await loadSeoModule()) as {
                resolveAppUrl: (settings?: unknown) => string;
                AppUrlResolutionError: typeof AppUrlResolutionErrorType;
            };

        expect(() => resolveAppUrl({ domain: "" } as never)).toThrow(
            AppUrlResolutionError,
        );
        expect(errorSpy).toHaveBeenCalled();
    });
});

describe("ensureAbsoluteUrl", () => {
    it("returns absolute values unchanged", async () => {
        const { ensureAbsoluteUrl } = await loadSeoModule();
        expect(
            ensureAbsoluteUrl("https://cdn.example/app.js", "https://site.dev"),
        ).toBe("https://cdn.example/app.js");
    });

    it("converts protocol relative URLs", async () => {
        const { ensureAbsoluteUrl } = await loadSeoModule();
        expect(
            ensureAbsoluteUrl("//cdn.example/app.js", "https://site.dev"),
        ).toBe("https://cdn.example/app.js");
    });

    it("resolves root relative URLs using the provided base", async () => {
        const { ensureAbsoluteUrl } = await loadSeoModule();
        expect(ensureAbsoluteUrl("/images/logo.png", "https://site.dev")).toBe(
            "https://site.dev/images/logo.png",
        );
    });

    it("joins relative paths with a slash", async () => {
        const { ensureAbsoluteUrl } = await loadSeoModule();
        expect(ensureAbsoluteUrl("assets/logo.png", "https://site.dev")).toBe(
            "https://site.dev/assets/logo.png",
        );
    });
});

describe("getActiveAppLocales", () => {
    it("returns enabled locales when valid", async () => {
        const { getActiveAppLocales } = await loadSeoModule();
        const locales = getActiveAppLocales({
            enabledLanguages: ["de", "fr", "es"],
        } as never);
        expect(locales).toEqual(["de", "fr"]);
    });

    it("returns defaults when nothing is configured", async () => {
        const { getActiveAppLocales } = await loadSeoModule();
        const locales = getActiveAppLocales(null);
        expect(locales).toEqual(["en", "de", "fr", "pt"]);
    });
});

describe("sanitizeCustomHtml", () => {
    it("sanitizes tags and attributes", async () => {
        const { sanitizeCustomHtml } = await loadSeoModule();
        const html = `
            <script src="https://cdn.example/app.js" onclick="alert(1)"></script>
            <meta name="description" content="  Hello  ">
            <link rel="stylesheet" href="javascript:alert('x')">
            <style media="screen">body { color: red; }</style>
        `;

        const nodes = sanitizeCustomHtml(html) as SanitizedHeadNode[];
        expect(nodes).toHaveLength(4);
        expect(nodes[0]).toEqual({
            tag: "script",
            attributes: { src: "https://cdn.example/app.js" },
            content: "",
        });
        expect(nodes[1]).toEqual({
            tag: "meta",
            attributes: { name: "description", content: "  Hello  " },
        });
        expect(nodes[2]).toEqual({
            tag: "link",
            attributes: { rel: "stylesheet" },
        });
        expect(nodes[3]).toEqual({
            tag: "style",
            attributes: { media: "screen" },
            content: "body { color: red; }",
        });
    });
});

describe("buildLocalizedPath", () => {
    it("keeps default locale paths without prefix", async () => {
        const { buildLocalizedPath } = await loadSeoModule();
        expect(buildLocalizedPath("en", "/dashboard")).toBe("/dashboard");
    });

    it("prefixes non-default locales", async () => {
        const { buildLocalizedPath } = await loadSeoModule();
        expect(buildLocalizedPath("fr", "/dashboard")).toBe("/fr/dashboard");
        expect(buildLocalizedPath("pt", "settings")).toBe("/pt/settings");
    });

    it("handles root path", async () => {
        const { buildLocalizedPath } = await loadSeoModule();
        expect(buildLocalizedPath("en", "/")).toBe("/");
        expect(buildLocalizedPath("de", "/")).toBe("/de");
    });
});

describe("localeCurrencyMap", () => {
    it("maps locales to expected currencies", async () => {
        const { localeCurrencyMap } = await loadSeoModule();
        expect(localeCurrencyMap.en).toBe("USD");
        expect(localeCurrencyMap.de).toBe("EUR");
        expect(localeCurrencyMap.pt).toBe("BRL");
    });
});
