#!/usr/bin/env tsx

import process from "node:process";

import { customers, getDb } from "@/db";
import {
    type DashboardMetricsOptions,
    refreshDashboardMetricsCache,
} from "@/modules/admin/services/analytics.service";

interface CliOptions {
    tenantId?: string;
    from?: string;
    ttlMs?: number;
    showHelp?: boolean;
}

function printUsage() {
    console.info(
        `
Usage: pnpm exec tsx scripts/refresh-dashboard-metrics.ts [options]

Options:
  --tenant <id>     Restrict refresh to a single tenant (defaults to all tenants)
  --from <date>     Precompute usage trends starting from the provided ISO date
  --ttl <seconds>   Override cache TTL in seconds (default matches service constant)
  --ttl-ms <ms>     Override cache TTL in milliseconds
  --help            Show this message
    `.trim(),
    );
}

function parseArgs(argv: string[]): CliOptions {
    const options: CliOptions = {};

    const withValue = (index: number, flag: string, description: string) => {
        const value = argv[index + 1];
        if (!value) {
            throw new Error(`${flag} requires ${description}`);
        }
        return { value, nextIndex: index + 1 };
    };

    const parseNonNegativeNumber = (
        value: string,
        flag: string,
        unit?: string,
    ) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric) || numeric < 0) {
            const suffix = unit ? ` of ${unit}` : "";
            throw new Error(`${flag} expects a non-negative number${suffix}`);
        }
        return numeric;
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        switch (arg) {
            case "--tenant": {
                const { value, nextIndex } = withValue(
                    index,
                    "--tenant",
                    "a tenant identifier",
                );
                options.tenantId = value;
                index = nextIndex;
                break;
            }
            case "--from": {
                const { value, nextIndex } = withValue(
                    index,
                    "--from",
                    "an ISO date value",
                );
                options.from = value;
                index = nextIndex;
                break;
            }
            case "--ttl": {
                const { value, nextIndex } = withValue(
                    index,
                    "--ttl",
                    "a number of seconds",
                );
                options.ttlMs =
                    parseNonNegativeNumber(value, "--ttl", "seconds") * 1000;
                index = nextIndex;
                break;
            }
            case "--ttl-ms": {
                const { value, nextIndex } = withValue(
                    index,
                    "--ttl-ms",
                    "a number of milliseconds",
                );
                options.ttlMs = parseNonNegativeNumber(
                    value,
                    "--ttl-ms",
                    "milliseconds",
                );
                index = nextIndex;
                break;
            }
            case "--help": {
                options.showHelp = true;
                break;
            }
            default: {
                console.warn(`[analytics] Ignoring unknown argument: ${arg}`);
            }
        }
    }

    return options;
}

function createContextKey(options: DashboardMetricsOptions) {
    const tenant = options.tenantId ?? "global";
    const from = options.from ?? "default";
    return `${tenant}|${from}`;
}

async function collectContexts(options: CliOptions) {
    const contexts: DashboardMetricsOptions[] = [];
    const seen = new Set<string>();
    const addContext = (context: DashboardMetricsOptions) => {
        const key = createContextKey(context);
        if (seen.has(key)) {
            return;
        }
        seen.add(key);
        contexts.push(context);
    };

    if (options.tenantId) {
        addContext({
            tenantId: options.tenantId,
            from: options.from,
        });
        return contexts;
    }

    addContext({ from: options.from });

    const db = await getDb();
    const rows = await db
        .select({ tenantId: customers.userId })
        .from(customers);

    for (const row of rows) {
        if (!row.tenantId) continue;
        addContext({ tenantId: row.tenantId, from: options.from });
    }

    return contexts;
}

async function main() {
    const options = parseArgs(process.argv.slice(2));

    if (options.showHelp) {
        printUsage();
        return;
    }

    const contexts = await collectContexts(options);

    if (contexts.length === 0) {
        console.info("[analytics] No tenants discovered; nothing to refresh.");
        return;
    }

    const ttlOverride = options.ttlMs;
    let failureCount = 0;

    for (const context of contexts) {
        const label = `tenant=${context.tenantId ?? "global"} from=${
            context.from ?? "default"
        }`;
        try {
            if (typeof ttlOverride === "number") {
                await refreshDashboardMetricsCache(context, ttlOverride);
            } else {
                await refreshDashboardMetricsCache(context);
            }
            console.info(`[analytics] refreshed cache for ${label}`);
        } catch (error) {
            failureCount += 1;
            console.error(`[analytics] failed to refresh cache for ${label}`);
            console.error(error);
        }
    }

    if (failureCount > 0) {
        throw new Error(
            `[analytics] ${failureCount} cache refresh operation(s) failed`,
        );
    }

    console.info(
        `[analytics] completed refresh for ${contexts.length} context(s).`,
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
