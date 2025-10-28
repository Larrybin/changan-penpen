#!/usr/bin/env node
import { mkdir, cp, rm, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const outputDir = path.join(repoRoot, "dist", "install-package");

async function run(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: "inherit",
            ...options,
        });

        child.on("close", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
            }
        });
    });
}

async function prepareOutputDirectory() {
    await rm(outputDir, { recursive: true, force: true });
    await mkdir(outputDir, { recursive: true });
}

async function copyManifests() {
    const manifestPath = path.join(repoRoot, "package.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    const fieldsToTrim = [
        "dependencies",
        "devDependencies",
        "optionalDependencies",
        "peerDependencies",
    ];
    const packagesToRemove = [
        "@opennextjs/cloudflare",
        "@cloudflare/workerd",
        "cloudflare",
        "wrangler",
        "miniflare",
        "typescript",
        "@biomejs/biome",
    ];

    for (const field of fieldsToTrim) {
        const container = manifest[field];
        if (!container) {
            continue;
        }

        for (const name of packagesToRemove) {
            delete container[name];
        }
    }

    const targetManifestPath = path.join(outputDir, "package.json");
    await writeFile(targetManifestPath, `${JSON.stringify(manifest, null, 4)}\n`, "utf8");

    const entries = [
        { path: "pnpm-lock.yaml", recursive: false },
        { path: "pnpmfile.cjs", recursive: false },
        { path: "patches", recursive: true },
        { path: "stubs", recursive: true },
    ];

    for (const entry of entries) {
        const source = path.join(repoRoot, entry.path);
        const target = path.join(outputDir, entry.path);
        await cp(source, target, { recursive: entry.recursive });
    }
}

async function installTrimmedDependencies() {
    const env = {
        ...process.env,
        PNPM_TRIM_INSTALL: "true",
        npm_config_audit: "false",
        npm_config_fund: "false",
    };

    await run(
        "pnpm",
        ["install", "--prod", "--ignore-scripts", "--prefer-offline"],
        { cwd: outputDir, env },
    );
}

async function main() {
    console.info("[trim] Preparing install package directory...");
    await prepareOutputDirectory();

    console.info("[trim] Copying manifest files...");
    await copyManifests();

    console.info("[trim] Installing production dependencies with platform pruning enabled...");
    await installTrimmedDependencies();

    console.info(
        "[trim] Install package ready at dist/install-package. Copy build artifacts (e.g. .next or worker bundles) as needed before archiving.",
    );
}

main().catch((error) => {
    console.error("[trim] Failed to build trimmed install package:\n", error);
    process.exit(1);
});
