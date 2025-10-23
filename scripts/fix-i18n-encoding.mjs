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

function updateString(value, transform, assign) {
    const next = transform(value);
    if (next !== value) {
        assign(next);
        return true;
    }
    return false;
}

function processArrayEntries(array, transform, stack) {
    let mutated = false;
    for (let i = 0; i < array.length; i++) {
        const value = array[i];
        if (typeof value === "string") {
            mutated =
                updateString(value, transform, (next) => {
                    array[i] = next;
                }) || mutated;
        } else if (value && typeof value === "object") {
            stack.push(value);
        }
    }
    return mutated;
}

function processObjectEntries(object, transform, stack, seen) {
    if (seen.has(object)) return false;
    seen.add(object);
    let mutated = false;
    for (const key of Object.keys(object)) {
        const value = object[key];
        if (typeof value === "string") {
            mutated =
                updateString(value, transform, (next) => {
                    object[key] = next;
                }) || mutated;
        } else if (value && typeof value === "object") {
            stack.push(value);
        }
    }
    return mutated;
}

function mutateStrings(root, transform) {
    let mutated = false;
    const seenObjects = new WeakSet();
    const stack = [root];

    while (stack.length > 0) {
        const current = stack.pop();
        if (handleNode(current, transform, stack, seenObjects)) {
            mutated = true;
        }
    }

    return mutated;
}

function handleNode(node, transform, stack, seenObjects) {
    if (!node) return false;
    if (Array.isArray(node)) {
        return processArrayEntries(node, transform, stack);
    }
    if (typeof node === "string") {
        return transform(node) !== node;
    }
    if (typeof node === "object") {
        return processObjectEntries(node, transform, stack, seenObjects);
    }
    return false;
}

const QUOTE_STYLES = {
    de: {
        doubleOpen: "„",
        doubleClose: "“",
        singleOpen: "‚",
        singleClose: "‘",
    },
    pt: {
        doubleOpen: "“",
        doubleClose: "”",
        singleOpen: "‘",
        singleClose: "’",
    },
};

const DASH_NORMALIZERS = {
    de: (value) => value.replace(/\s+[-—]\s+/g, " – "),
    pt: (value) => value.replace(/\s+[-–]\s+/g, " — "),
};

function createQuoteTransformer(style) {
    return (value) => {
        let out = value.replace(
            /"([^"{}\n]+)"/g,
            `${style.doubleOpen}$1${style.doubleClose}`,
        );
        out = out.replace(
            /'([^'{}\n]+)'/g,
            `${style.singleOpen}$1${style.singleClose}`,
        );
        return out;
    };
}

const FRENCH_PUNCTUATION = /[!?;:]/;

function applyFrenchSpacing(value) {
    let replaced = value
        .replace(/[\u00A0\u202F ]+([!?;:])/g, "\u202F$1")
        .replace(
            new RegExp(`([^\u00A0\u202Fs])(${FRENCH_PUNCTUATION.source})`, "g"),
            "$1\u202F$2",
        );
    replaced = replaced.replace(/«\s*/g, "«\u00A0").replace(/\s*»/g, "\u00A0»");
    return replaced;
}

let totalChanged = 0;
for (const file of walk(ROOT)) {
    const locale = path.basename(file, ".json");
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    let changed = false;
    const applyStrings = (transform) => {
        if (mutateStrings(json, transform)) {
            changed = true;
        }
    };

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
            const normalizeString = (value) => {
                let out = value.replace(/\uFFFD/g, "");
                out = out.replace(/\s{2,}/g, " ");
                out = out.replace(/\.{3}/g, "…");
                return out.replace(/(\d)\s*-\s*(\d)/g, "$1–$2");
            };
            applyStrings(normalizeString);

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
            const typographicApostrophes = (value) =>
                value.replace(
                    /([A-Za-zÀ-ÖØ-öø-ÿ])'([A-Za-zÀ-ÖØ-öø-ÿ])/g,
                    "$1’$2",
                );
            applyStrings(typographicApostrophes);

            // Non-breaking space between number and unit (MP, KB/MB/GB/TB, %, km/cm/mm, px)
            const nbspNumberUnit = (value) => {
                const out = value.replace(
                    /(\d)\s+(MP|KB|K[Bb]|MB|GB|TB|%|km|cm|mm|px)/g,
                    "$1\u00A0$2",
                );
                return out.replace(
                    /(\{\{\s*(?:total|count|amount|size)\s*\}\})\s+(\{\{\s*unit\s*\}\})/g,
                    "$1\u00A0$2",
                );
            };
            applyStrings(nbspNumberUnit);
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

    if (locale === "de" || locale === "pt") {
        const style = QUOTE_STYLES[locale];
        if (style) {
            applyStrings(createQuoteTransformer(style));
        }
        const dashNormalizer = DASH_NORMALIZERS[locale];
        if (dashNormalizer) {
            applyStrings(dashNormalizer);
        }
    }

    if (locale === "fr") {
        applyStrings(applyFrenchSpacing);
    }

    if (changed) {
        fs.writeFileSync(file, `${JSON.stringify(json, null, 4)}\n`, "utf8");
        totalChanged++;
        console.info(`Fixed: ${path.relative(process.cwd(), file)}`);
    }
}

console.info(
    totalChanged === 0
        ? "No i18n encoding issues found."
        : `Done. Updated ${totalChanged} file(s).`,
);
