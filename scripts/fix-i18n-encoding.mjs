import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "src/i18n/messages");

function walk(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walk(p));
        else if (entry.isFile() && p.endsWith(".json")) out.push(p);
    }
    return out;
}

const FAST_BY_LOCALE = {
    en: "⚡ Fast",
    de: "⚡ Schnell",
    fr: "⚡ Rapide",
    pt: "⚡ Rápido",
};

let totalChanged = 0;
for (const file of walk(ROOT)) {
    const locale = path.basename(file, ".json");
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    let changed = false;

    // Normalize hero.support.fast across locales
    const fast = FAST_BY_LOCALE[locale];
    if (
        json?.Marketing?.hero?.support &&
        typeof json.Marketing.hero.support === "object" &&
        fast
    ) {
        if (json.Marketing.hero.support.fast !== fast) {
            json.Marketing.hero.support.fast = fast;
            changed = true;
        }
    }

    // English-only targeted fixes
    if (locale === "en") {
        // Fix features[0] description dash
        const items = json?.Marketing?.features?.items;
        if (Array.isArray(items) && items.length > 0) {
            const i0 = items[0];
            const expected =
                "Enjoy unlimited image generation — no sign-up, no hidden costs.";
            if (
                i0?.title?.includes("Free & Unlimited Access") &&
                i0?.description !== expected
            ) {
                i0.description = expected;
                changed = true;
            }

            // Generic deep normalization: remove Unicode replacement chars and collapse extra spaces
            function normalizeString(value) {
                if (typeof value !== "string") return value;
                let out = value.replace(/\uFFFD/g, "");
                out = out.replace(/\s{2,}/g, " ");
                // Normalize ellipsis
                out = out.replace(/\.{3}/g, "…");
                // Normalize number ranges to en-dash: 9-12 -> 9–12
                out = out.replace(/(\d)\s*-\s*(\d)/g, "$1–$2");
                return out;
            }

            function walkAndNormalize(obj) {
                if (obj && typeof obj === "object") {
                    if (Array.isArray(obj)) {
                        for (let i = 0; i < obj.length; i++) {
                            const before = obj[i];
                            const after = walkAndNormalize(before);
                            if (after !== before) {
                                obj[i] = after;
                                changed = true;
                            }
                        }
                    } else {
                        for (const k of Object.keys(obj)) {
                            const before = obj[k];
                            const after = walkAndNormalize(before);
                            if (after !== before) {
                                obj[k] = after;
                                changed = true;
                            }
                        }
                    }
                    return obj;
                }
                const normalized = normalizeString(obj);
                if (normalized !== obj) return normalized;
                return obj;
            }

            walkAndNormalize(json);

            // Ensure FAQ questions end with '?'
            const faqItems = json?.Marketing?.faq?.items;
            if (Array.isArray(faqItems)) {
                for (const it of faqItems) {
                    if (it && typeof it.question === "string") {
                        const q = it.question.trim();
                        if (q && !q.endsWith("?")) {
                            it.question = `${q}?`;
                            changed = true;
                        }
                    }
                }
            }

            // Apostrophes: use typographic apostrophe in all locales (don't touch tags or placeholders)
            function typographicApostrophes(value) {
                if (typeof value !== "string") return value;
                // Replace letter ' letter with letter ’ letter
                return value.replace(
                    /([A-Za-zÀ-ÖØ-öø-ÿ])'([A-Za-zÀ-ÖØ-öø-ÿ])/g,
                    "$1’$2",
                );
            }

            function walkApostrophes(obj) {
                if (obj && typeof obj === "object") {
                    if (Array.isArray(obj)) {
                        for (let i = 0; i < obj.length; i++) {
                            const before = obj[i];
                            const after = walkApostrophes(before);
                            if (after !== before) {
                                obj[i] = after;
                                changed = true;
                            }
                        }
                    } else {
                        for (const k of Object.keys(obj)) {
                            const before = obj[k];
                            const after = walkApostrophes(before);
                            if (after !== before) {
                                obj[k] = after;
                                changed = true;
                            }
                        }
                    }
                    return obj;
                }
                const next = typographicApostrophes(obj);
                if (next !== obj) return next;
                return obj;
            }

            walkApostrophes(json);

            // Non-breaking space between number and unit (MP, KB/MB/GB/TB, %, km/cm/mm, px)
            function nbspNumberUnit(value) {
                if (typeof value !== "string") return value;
                let out = value.replace(
                    /(\d)\s+(MP|KB|K[Bb]|MB|GB|TB|%|km|cm|mm|px)/g,
                    "$1\u00A0$2",
                );
                // Placeholder-based: {{total}} {{unit}} -> {{total}} NBSP {{unit}}
                out = out.replace(
                    /(\{\{\s*(?:total|count|amount|size)\s*\}\})\s+(\{\{\s*unit\s*\}\})/g,
                    "$1\u00A0$2",
                );
                return out;
            }

            function walkNbsp(obj) {
                if (obj && typeof obj === "object") {
                    if (Array.isArray(obj)) {
                        for (let i = 0; i < obj.length; i++) {
                            const before = obj[i];
                            const after = walkNbsp(before);
                            if (after !== before) {
                                obj[i] = after;
                                changed = true;
                            }
                        }
                    } else {
                        for (const k of Object.keys(obj)) {
                            const before = obj[k];
                            const after = walkNbsp(before);
                            if (after !== before) {
                                obj[k] = after;
                                changed = true;
                            }
                        }
                    }
                    return obj;
                }
                const next = nbspNumberUnit(obj);
                if (next !== obj) return next;
                return obj;
            }

            walkNbsp(json);

            // Locale-specific quotes and dash normalization
            function replaceQuotes(
                value,
                { doubleOpen, doubleClose, singleOpen, singleClose },
            ) {
                if (typeof value !== "string") return value;
                let out = value;
                // Replace straight double quotes around simple phrases (avoid braces/tags)
                out = out.replace(
                    /"([^"{}\n]+)"/g,
                    `${doubleOpen}$1${doubleClose}`,
                );
                // Replace straight single quotes around simple phrases (avoid braces/tags)
                out = out.replace(
                    /'([^'{}\n]+)'/g,
                    `${singleOpen}$1${singleClose}`,
                );
                return out;
            }

            function walkQuotes(obj, style) {
                if (obj && typeof obj === "object") {
                    if (Array.isArray(obj)) {
                        for (let i = 0; i < obj.length; i++) {
                            const before = obj[i];
                            const after = walkQuotes(before, style);
                            if (after !== before) {
                                obj[i] = after;
                                changed = true;
                            }
                        }
                    } else {
                        for (const k of Object.keys(obj)) {
                            const before = obj[k];
                            const after = walkQuotes(before, style);
                            if (after !== before) {
                                obj[k] = after;
                                changed = true;
                            }
                        }
                    }
                    return obj;
                }
                const next = replaceQuotes(obj, style);
                if (next !== obj) return next;
                return obj;
            }

            function normalizeDashesDE(value) {
                if (typeof value !== "string") return value;
                // Gedankenstrich: use en dash with surrounding spaces
                return value.replace(/\s+[-—]\s+/g, " – ");
            }

            function normalizeDashesPT(value) {
                if (typeof value !== "string") return value;
                // Portuguese style: use em dash with surrounding spaces
                return value.replace(/\s+[-–]\s+/g, " — ");
            }

            function walkDashes(obj, locale) {
                if (obj && typeof obj === "object") {
                    if (Array.isArray(obj)) {
                        for (let i = 0; i < obj.length; i++) {
                            const before = obj[i];
                            const after = walkDashes(before, locale);
                            if (after !== before) {
                                obj[i] = after;
                                changed = true;
                            }
                        }
                    } else {
                        for (const k of Object.keys(obj)) {
                            const before = obj[k];
                            const after = walkDashes(before, locale);
                            if (after !== before) {
                                obj[k] = after;
                                changed = true;
                            }
                        }
                    }
                    return obj;
                }
                const next =
                    locale === "de"
                        ? normalizeDashesDE(obj)
                        : locale === "pt"
                          ? normalizeDashesPT(obj)
                          : obj;
                if (next !== obj) return next;
                return obj;
            }

            if (locale === "de") {
                // German quotes „…“ and ‚…‘
                walkQuotes(json, {
                    doubleOpen: "„",
                    doubleClose: "“",
                    singleOpen: "‚",
                    singleClose: "‘",
                });
                walkDashes(json, "de");
            }

            if (locale === "pt") {
                // Portuguese quotes “…” and ‘…’
                walkQuotes(json, {
                    doubleOpen: "“",
                    doubleClose: "”",
                    singleOpen: "‘",
                    singleClose: "’",
                });
                walkDashes(json, "pt");
            }

            // Language-specific typography rules
            if (locale === "fr") {
                // In French, use a narrow no-break space (U+202F) before ! ? ; :
                const FRENCH_PUNCT_BEFORE = /[!?;:]/;

                function applyFrenchSpacing(value) {
                    if (typeof value !== "string") return value;
                    // Collapse any sequence of normal space or NBSP/narrow NBSP before the target punctuation to a single U+202F
                    let replaced = value
                        .replace(/[\u00A0\u202F ]+([!?;:])/g, "\u202F$1")
                        // And ensure there is exactly one U+202F before the punctuation when there was none
                        .replace(
                            new RegExp(
                                `([^\u00A0\u202Fs])(${FRENCH_PUNCT_BEFORE.source})`,
                                "g",
                            ),
                            "$1\u202F$2",
                        );
                    // Ensure NBSP around guillemets « »: NBSP after « and before »
                    replaced = replaced
                        .replace(/«\s*/g, "«\u00A0")
                        .replace(/\s*»/g, "\u00A0»");
                    return replaced;
                }

                function walkFrench(obj) {
                    if (obj && typeof obj === "object") {
                        if (Array.isArray(obj)) {
                            for (let i = 0; i < obj.length; i++) {
                                const before = obj[i];
                                const after = walkFrench(before);
                                if (after !== before) {
                                    obj[i] = after;
                                    changed = true;
                                }
                            }
                        } else {
                            for (const k of Object.keys(obj)) {
                                const before = obj[k];
                                const after = walkFrench(before);
                                if (after !== before) {
                                    obj[k] = after;
                                    changed = true;
                                }
                            }
                        }
                        return obj;
                    }
                    const next = applyFrenchSpacing(obj);
                    if (next !== obj) return next;
                    return obj;
                }

                walkFrench(json);
            }
        }

        // Fix contact hours
        const details = json?.StaticPages?.contact?.details;
        if (Array.isArray(details)) {
            const hours = details.find((d) => d?.label === "Hours");
            const expected = "Mon–Fri, 9am–8pm UTC";
            if (hours && hours.value !== expected) {
                hours.value = expected;
                changed = true;
            }
        }

        // Ensure features descriptions end with a period
        const feat = json?.Marketing?.features?.items;
        if (Array.isArray(feat)) {
            for (const it of feat) {
                if (it && typeof it.description === "string") {
                    const d = it.description.trim();
                    if (d && !/[.!?…]$/.test(d)) {
                        it.description = `${d}.`;
                        changed = true;
                    }
                }
            }
        }

        // Ensure FAQ answers end with a period
        const faq = json?.Marketing?.faq?.items;
        if (Array.isArray(faq)) {
            for (const it of faq) {
                if (it && typeof it.answer === "string") {
                    const a = it.answer.trim();
                    if (a && !/[.!?…]$/.test(a)) {
                        it.answer = `${a}.`;
                        changed = true;
                    }
                }
            }
        }
    }

    if (changed) {
        fs.writeFileSync(file, `${JSON.stringify(json, null, 4)}\n`, "utf8");
        totalChanged++;
        console.log(`Fixed: ${path.relative(process.cwd(), file)}`);
    }
}

console.log(
    totalChanged === 0
        ? "No i18n encoding issues found."
        : `Done. Updated ${totalChanged} file(s).`,
);
