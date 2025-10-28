#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const process = require("node:process");

function resolveCandidate(candidate) {
    try {
        return require.resolve(candidate);
    } catch (error) {
        if (error && error.code !== "MODULE_NOT_FOUND") {
            throw error;
        }
        return null;
    }
}

function resolveBinaryPath() {
    if (process.env.BIOME_BINARY) {
        return process.env.BIOME_BINARY;
    }

    const candidates = [
        {
            pkg: "@biomejs/cli-win32-x64",
            bin: "biome.exe",
            platform: "win32",
            arch: "x64",
        },
        {
            pkg: "@biomejs/cli-win32-arm64",
            bin: "biome.exe",
            platform: "win32",
            arch: "arm64",
        },
        {
            pkg: "@biomejs/cli-darwin-arm64",
            bin: "biome",
            platform: "darwin",
            arch: "arm64",
        },
        {
            pkg: "@biomejs/cli-darwin-x64",
            bin: "biome",
            platform: "darwin",
            arch: "x64",
        },
        {
            pkg: "@biomejs/cli-linux-arm64",
            bin: "biome",
            platform: "linux",
            arch: "arm64",
        },
        {
            pkg: "@biomejs/cli-linux-arm64-musl",
            bin: "biome",
            platform: "linux",
            arch: "arm64",
        },
        {
            pkg: "@biomejs/cli-linux-x64",
            bin: "biome",
            platform: "linux",
            arch: "x64",
        },
        {
            pkg: "@biomejs/cli-linux-x64-musl",
            bin: "biome",
            platform: "linux",
            arch: "x64",
        },
    ];

    const ordered = [];
    for (const candidate of candidates) {
        if (
            candidate.platform === process.platform &&
            candidate.arch === process.arch
        ) {
            ordered.push(candidate);
        }
    }
    for (const candidate of candidates) {
        if (!ordered.includes(candidate)) {
            ordered.push(candidate);
        }
    }

    for (const candidate of ordered) {
        try {
            const packageJsonPath = require.resolve(
                `${candidate.pkg}/package.json`,
            );
            const packageDir = path.dirname(packageJsonPath);
            const binaryPath = path.join(packageDir, candidate.bin);

            if (fs.existsSync(binaryPath)) {
                return binaryPath;
            }
        } catch (error) {
            if (error && error.code !== "MODULE_NOT_FOUND") {
                throw error;
            }
        }
    }

    return null;
}

function main() {
    const binaryPath = resolveBinaryPath();

    if (!binaryPath) {
        console.error(
            "Unable to locate a Biome CLI binary. Ensure @biomejs/biome optional dependencies are installed.",
        );
        process.exit(1);
    }

    const result = spawnSync(binaryPath, process.argv.slice(2), {
        stdio: "inherit",
        shell: false,
        env: {
            ...process.env,
            BIOME_BINARY: undefined,
        },
    });

    if (result.error) {
        console.error(result.error);
        process.exit(1);
    }

    const exitCode = result.status ?? 0;
    process.exit(exitCode);
}

main();
