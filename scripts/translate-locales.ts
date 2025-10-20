#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

import { config as loadEnv } from "dotenv";
import { type AppLocale, defaultLocale, locales } from "../src/i18n/config";
import {
    createTranslationServiceFromEnv,
    NEEDS_REVIEW_MARKERS,
    type TranslationEntry,
    type TranslationProviderName,
} from "../src/services/translation.service";

type PathSegment = string | number;

type FlattenedEntry = {
    path: PathSegment[];
    key: string;
    value: string;
};

type CliOptions = {
    source: string;
    targets: string[];
    provider?: string;
    dryRun: boolean;
    tone?: string;
};

const ROOT_DIR = path.resolve(process.cwd());
const MESSAGES_DIR = path.join(ROOT_DIR, "src", "i18n", "messages");
const BATCH_SIZE = 20;

const parseArgs = (): CliOptions => {
    const args = process.argv.slice(2);
    const options: CliOptions = {
        source: defaultLocale,
        targets: locales.filter(
            (locale: AppLocale) => locale !== defaultLocale,
        ),
        dryRun: false,
    };

    for (const arg of args) {
        if (arg.startsWith("--target=")) {
            const value = arg.split("=")[1]?.trim();
            if (value) {
                options.targets = value
                    .split(",")
                    .map((token) => token.trim())
                    .filter(Boolean);
            }
        } else if (arg.startsWith("--source=")) {
            const value = arg.split("=")[1]?.trim();
            if (value) {
                options.source = value;
            }
        } else if (arg.startsWith("--provider=")) {
            const value = arg.split("=")[1]?.trim();
            if (value) {
                options.provider = value;
            }
        } else if (arg === "--dry-run") {
            options.dryRun = true;
        } else if (arg.startsWith("--tone=")) {
            const value = arg.split("=")[1]?.trim();
            if (value) {
                options.tone = value;
            }
        }
    }

    return options;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const DANGEROUS_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function isDangerousKey(key: string): boolean {
    // __proto__ already filtered by prefix; include other critical prototype keys
    return DANGEROUS_KEYS.has(key);
}

const collectEntries = (
    value: unknown,
    pathSegments: PathSegment[] = [],
): FlattenedEntry[] => {
    if (typeof value === "string") {
        return [
            {
                path: pathSegments,
                key: buildKeyFromPath(pathSegments),
                value,
            },
        ];
    }

    if (Array.isArray(value)) {
        return value.flatMap((item, index) =>
            collectEntries(item, [...pathSegments, index]),
        );
    }

    if (isRecord(value)) {
        return Object.entries(value)
            .filter(([key]) => !key.startsWith("__") && !isDangerousKey(key))
            .flatMap(([key, nested]) =>
                collectEntries(nested, [...pathSegments, key]),
            );
    }

    return [];
};

const buildKeyFromPath = (pathSegments: PathSegment[]) =>
    pathSegments
        .map((segment, index) => {
            if (typeof segment === "number") {
                return `[${segment}]`;
            }
            return index === 0 ? segment : `.${segment}`;
        })
        .join("");

const getValueAtPath = (
    target: unknown,
    pathSegments: PathSegment[],
): unknown => {
    let current: unknown = target;
    for (const segment of pathSegments) {
        if (typeof segment === "number") {
            if (!Array.isArray(current)) {
                return undefined;
            }
            current = current[segment];
            continue;
        }

        if (!isRecord(current)) {
            return undefined;
        }
        current = current[segment];
    }

    return current;
};

const ensureContainer = (
    parent: Record<string, unknown>,
    key: string,
    next: PathSegment,
) => {
    if (isDangerousKey(key)) {
        // Skip creating containers for dangerous keys to prevent prototype pollution
        return;
    }
    const existing = parent[key];
    if (next === undefined) {
        return;
    }
    if (typeof next === "number") {
        if (!Array.isArray(existing)) {
            parent[key] = [];
        }
    } else if (!isRecord(existing)) {
        parent[key] = Object.create(null) as Record<string, unknown>;
    }
};

const setValueAtPath = (
    target: Record<string, unknown>,
    pathSegments: PathSegment[],
    value: string,
) => {
    let current: Record<string, unknown> | unknown[] = target;

    for (let index = 0; index < pathSegments.length; index++) {
        const segment = pathSegments[index];
        const isLast = index === pathSegments.length - 1;

        if (typeof segment === "number") {
            if (!Array.isArray(current)) {
                throw new Error(
                    `Expected array while setting path ${buildKeyFromPath(pathSegments)}`,
                );
            }
            if (isLast) {
                current[segment] = value;
                return;
            }
            const nextSegment = pathSegments[index + 1];
            if (current[segment] === undefined) {
                current[segment] = typeof nextSegment === "number" ? [] : {};
            }
            current = current[segment] as Record<string, unknown> | unknown[];
            continue;
        }

        if (!isRecord(current)) {
            throw new Error(
                `Expected object while setting path ${buildKeyFromPath(pathSegments)}`,
            );
        }

        if (isLast) {
            if (isDangerousKey(segment)) {
                console.warn(
                    "Skipped setting dangerous key in translation output",
                    { segment },
                );
                return;
            }
            current[segment] = value;
            return;
        }

        const nextSegment = pathSegments[index + 1];
        ensureContainer(current, segment, nextSegment);
        const nextValue = current[segment];
        current[segment] =
            nextValue ??
            (typeof nextSegment === "number"
                ? []
                : (Object.create(null) as Record<string, unknown>));
        current = current[segment] as Record<string, unknown> | unknown[];
    }
};

const chunk = <T>(items: T[], size: number): T[][] => {
    const result: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
        result.push(items.slice(index, index + size));
    }
    return result;
};

const writeJsonFile = async (filePath: string, data: unknown) => {
    const content = `${JSON.stringify(data, null, 4)}\n`;
    await fs.writeFile(filePath, content, "utf8");
};

const loadLocaleFile = async (locale: string) => {
    const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
    const content = await fs.readFile(filePath, "utf8");
    return { filePath, data: JSON.parse(content) as Record<string, unknown> };
};

const shouldTranslate = (value: unknown, sourceText: string) => {
    if (value === undefined || value === null) {
        return true;
    }

    if (typeof value !== "string") {
        return false;
    }

    if (value.trim() === "") {
        return true;
    }

    if (NEEDS_REVIEW_MARKERS.includes(value.trim())) {
        return true;
    }

    if (value === sourceText) {
        return true;
    }

    return false;
};

const buildTranslationEntries = (
    entries: FlattenedEntry[],
): TranslationEntry[] =>
    entries.map((entry) => ({
        key: entry.key,
        text: entry.value,
    }));

const main = async () => {
    loadEnv({ path: ".dev.vars" });
    loadEnv();

    const options = parseArgs();

    if (!locales.includes(options.source as (typeof locales)[number])) {
        throw new Error(
            `Source locale ${options.source} is not configured. Available locales: ${locales.join(", ")}`,
        );
    }

    const targets = options.targets.filter((locale) => {
        if (!locales.includes(locale as (typeof locales)[number])) {
            console.warn(`Skipping unsupported locale: ${locale}`);
            return false;
        }
        if (locale === options.source) {
            console.warn(
                `Skipping locale ${locale} because it matches source.`,
            );
            return false;
        }
        return true;
    });

    if (targets.length === 0) {
        console.log("No valid target locales specified. Nothing to do.");
        return;
    }

    const sourceLocale = options.source;
    const { data: sourceMessages } = await loadLocaleFile(sourceLocale);
    const sourceEntries = collectEntries(sourceMessages);

    const service = createTranslationServiceFromEnv(process.env, {
        provider: options.provider as TranslationProviderName | undefined,
    });

    for (const targetLocale of targets) {
        const { filePath, data: targetMessages } =
            await loadLocaleFile(targetLocale);
        const missingEntries = sourceEntries.filter((entry) => {
            const currentValue = getValueAtPath(targetMessages, entry.path);
            return shouldTranslate(currentValue, entry.value);
        });

        if (missingEntries.length === 0) {
            console.log(`✅ ${targetLocale}: 没有需要翻译的条目。`);
            continue;
        }

        console.log(
            `🌐 ${targetLocale}: 需要翻译 ${missingEntries.length} 条。`,
        );

        const batches = chunk(missingEntries, BATCH_SIZE);
        const translated: FlattenedEntry[] = [];

        for (const [index, batch] of batches.entries()) {
            const batchEntries = buildTranslationEntries(batch);
            if (options.dryRun) {
                console.log(
                    `  • [dry-run] 批次 ${index + 1}/${batches.length}，跳过实际请求。`,
                );
                translated.push(
                    ...batch.map((entry) => ({
                        ...entry,
                        value: `[[translation pending]] ${entry.value}`,
                    })),
                );
                continue;
            }

            console.log(`  • 批次 ${index + 1}/${batches.length} 翻译中…`);
            const results = await service.translateBatch({
                entries: batchEntries,
                sourceLocale,
                targetLocale,
                tone: options.tone,
            });

            for (const result of results) {
                const entry = batch.find((item) => item.key === result.key);
                if (!entry) {
                    continue;
                }
                translated.push({ ...entry, value: result.translatedText });
            }
        }

        translated.forEach((entry) => {
            setValueAtPath(targetMessages, entry.path, entry.value);
        });

        if (options.dryRun) {
            console.log(`🚫 [dry-run] 跳过写入 ${targetLocale}.json。`);
            continue;
        }

        await writeJsonFile(filePath, targetMessages);
        console.log(`💾 已更新 ${path.relative(ROOT_DIR, filePath)}。`);
    }
};

main().catch((error) => {
    console.error("❌ 翻译脚本执行失败", error);
    process.exitCode = 1;
});
