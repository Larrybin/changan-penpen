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

const ARG_HANDLERS: Record<
    string,
    (value: string | true, options: CliOptions) => void
> = {
    target(value, options) {
        if (typeof value !== "string" || value.length === 0) {
            return;
        }
        options.targets = value
            .split(",")
            .map((token) => token.trim())
            .filter(Boolean);
    },
    source(value, options) {
        if (typeof value === "string" && value.length > 0) {
            options.source = value;
        }
    },
    provider(value, options) {
        if (typeof value === "string" && value.length > 0) {
            options.provider = value;
        }
    },
    tone(value, options) {
        if (typeof value === "string" && value.length > 0) {
            options.tone = value;
        }
    },
    "dry-run"(value, options) {
        options.dryRun = value === true || value === "true";
    },
};

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
        if (!arg.startsWith("--")) {
            continue;
        }

        if (arg === "--dry-run") {
            ARG_HANDLERS["dry-run"](true, options);
            continue;
        }

        const [rawKey, rawValue = ""] = arg.split("=");
        const key = rawKey.slice(2);
        const handler = ARG_HANDLERS[key];
        if (!handler) {
            continue;
        }

        const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;
        handler(value, options);
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
    next?: PathSegment,
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

    pathSegments.forEach((segment, index) => {
        const isLast = index === pathSegments.length - 1;
        const nextSegment = pathSegments[index + 1];

        if (isLast) {
            assignSegmentValue(current, segment, value, pathSegments);
            return;
        }

        current = prepareNextContainer(current, {
            segment,
            nextSegment,
            fullPath: pathSegments,
        });
    });
};

const assignSegmentValue = (
    container: Record<string, unknown> | unknown[],
    segment: PathSegment,
    value: string,
    fullPath: PathSegment[],
) => {
    if (typeof segment === "number") {
        const array = expectArray(container, fullPath);
        array[segment] = value;
        return;
    }

    const object = expectRecord(container, fullPath);
    if (isDangerousKey(segment)) {
        console.warn("Skipped setting dangerous key in translation output", {
            segment,
        });
        return;
    }
    object[segment] = value;
};

const prepareNextContainer = (
    container: Record<string, unknown> | unknown[],
    context: {
        segment: PathSegment;
        nextSegment: PathSegment | undefined;
        fullPath: PathSegment[];
    },
): Record<string, unknown> | unknown[] => {
    if (typeof context.segment === "number") {
        const array = expectArray(container, context.fullPath);
        ensureArraySlot(array, context.segment, context.nextSegment);
        return array[context.segment] as Record<string, unknown> | unknown[];
    }

    const object = expectRecord(container, context.fullPath);
    ensureContainer(object, context.segment, context.nextSegment);
    const existing = object[context.segment];
    if (existing === undefined) {
        object[context.segment] =
            typeof context.nextSegment === "number"
                ? []
                : (Object.create(null) as Record<string, unknown>);
    }
    return object[context.segment] as Record<string, unknown> | unknown[];
};

const expectArray = (
    container: Record<string, unknown> | unknown[],
    fullPath: PathSegment[],
): unknown[] => {
    if (!Array.isArray(container)) {
        throw new Error(
            `Expected array while setting path ${buildKeyFromPath(fullPath)}`,
        );
    }
    return container;
};

const expectRecord = (
    container: Record<string, unknown> | unknown[],
    fullPath: PathSegment[],
): Record<string, unknown> => {
    if (!isRecord(container)) {
        throw new Error(
            `Expected object while setting path ${buildKeyFromPath(fullPath)}`,
        );
    }
    return container;
};

const ensureArraySlot = (
    array: unknown[],
    index: number,
    nextSegment: PathSegment | undefined,
) => {
    if (array[index] !== undefined) {
        return;
    }
    array[index] =
        typeof nextSegment === "number"
            ? []
            : (Object.create(null) as Record<string, unknown>);
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

const validateSourceLocale = (source: string) => {
    if (!locales.includes(source as (typeof locales)[number])) {
        throw new Error(
            `Source locale ${source} is not configured. Available locales: ${locales.join(", ")}`,
        );
    }
};

const filterTargetLocales = (source: string, targets: string[]) =>
    targets.filter((locale) => {
        if (!locales.includes(locale as (typeof locales)[number])) {
            console.warn(`Skipping unsupported locale: ${locale}`);
            return false;
        }
        if (locale === source) {
            console.warn(
                `Skipping locale ${locale} because it matches source.`,
            );
            return false;
        }
        return true;
    });

const translateBatches = async (
    batches: FlattenedEntry[][],
    context: {
        options: CliOptions;
        service: ReturnType<typeof createTranslationServiceFromEnv>;
        sourceLocale: string;
        targetLocale: string;
    },
): Promise<FlattenedEntry[]> => {
    const translated: FlattenedEntry[] = [];

    for (const [index, batch] of batches.entries()) {
        const batchEntries = buildTranslationEntries(batch);
        if (context.options.dryRun) {
            console.info(
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

        console.info(`  • 批次 ${index + 1}/${batches.length} 翻译中…`);
        const results = await context.service.translateBatch({
            entries: batchEntries,
            sourceLocale: context.sourceLocale,
            targetLocale: context.targetLocale,
            tone: context.options.tone,
        });

        for (const result of results) {
            const entry = batch.find((item) => item.key === result.key);
            if (!entry) {
                continue;
            }
            translated.push({ ...entry, value: result.translatedText });
        }
    }

    return translated;
};

const processTargetLocale = async (params: {
    targetLocale: string;
    sourceLocale: string;
    sourceEntries: FlattenedEntry[];
    options: CliOptions;
    service: ReturnType<typeof createTranslationServiceFromEnv>;
}) => {
    const { filePath, data: targetMessages } = await loadLocaleFile(
        params.targetLocale,
    );
    const missingEntries = params.sourceEntries.filter((entry) => {
        const currentValue = getValueAtPath(targetMessages, entry.path);
        return shouldTranslate(currentValue, entry.value);
    });

    if (missingEntries.length === 0) {
        console.info(`✅ ${params.targetLocale}: 没有需要翻译的条目。`);
        return;
    }

    console.info(
        `🌐 ${params.targetLocale}: 需要翻译 ${missingEntries.length} 条。`,
    );

    const batches = chunk(missingEntries, BATCH_SIZE);
    const translated = await translateBatches(batches, {
        options: params.options,
        service: params.service,
        sourceLocale: params.sourceLocale,
        targetLocale: params.targetLocale,
    });

    translated.forEach((entry) => {
        setValueAtPath(targetMessages, entry.path, entry.value);
    });

    if (params.options.dryRun) {
        console.info(`🚫 [dry-run] 跳过写入 ${params.targetLocale}.json。`);
        return;
    }

    await writeJsonFile(filePath, targetMessages);
    console.info(`💾 已更新 ${path.relative(ROOT_DIR, filePath)}。`);
};

const main = async () => {
    loadEnv({ path: ".dev.vars" });
    loadEnv();

    const options = parseArgs();
    validateSourceLocale(options.source);

    const targets = filterTargetLocales(options.source, options.targets);
    if (targets.length === 0) {
        console.info("No valid target locales specified. Nothing to do.");
        return;
    }

    const sourceLocale = options.source;
    const { data: sourceMessages } = await loadLocaleFile(sourceLocale);
    const sourceEntries = collectEntries(sourceMessages);

    const service = createTranslationServiceFromEnv(process.env, {
        provider: options.provider as TranslationProviderName | undefined,
    });

    for (const targetLocale of targets) {
        await processTargetLocale({
            targetLocale,
            sourceLocale,
            sourceEntries,
            options,
            service,
        });
    }
};

main().catch((error) => {
    console.error("❌ 翻译脚本执行失败", error);
    process.exitCode = 1;
});
