import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

function readBudget(): number {
    const raw = process.env.WORKER_BUNDLE_BUDGET_KB;
    if (!raw) {
        return 2500;
    }
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
        console.warn(
            `[bundle] Ignoring invalid WORKER_BUNDLE_BUDGET_KB value: ${raw}`,
        );
        return 2500;
    }
    return parsed;
}

function formatKiB(bytes: number): string {
    return (bytes / 1024).toFixed(2);
}

function main() {
    const workerPath = path.join(process.cwd(), ".open-next", "worker.js");
    const budgetKiB = readBudget();

    if (!existsSync(workerPath)) {
        console.error(
            `[bundle] OpenNext worker bundle not found at ${workerPath}. Build the project before running this check.`,
        );
        process.exitCode = 1;
        return;
    }

    const source = readFileSync(workerPath);
    const gzipped = gzipSync(source, { level: 9 });
    const gzipBytes = gzipped.byteLength;
    const gzipKiB = gzipBytes / 1024;

    console.info(
        `[bundle] worker.js gzipped size: ${formatKiB(gzipBytes)} KiB (budget ${budgetKiB} KiB)`,
    );

    if (gzipKiB > budgetKiB) {
        console.error(
            `[bundle] worker.js gzipped size ${formatKiB(gzipBytes)} KiB exceeds budget ${budgetKiB} KiB.`,
        );
        process.exitCode = 1;
        return;
    }

    console.info("[bundle] Worker bundle size is within budget.");
}

main();
