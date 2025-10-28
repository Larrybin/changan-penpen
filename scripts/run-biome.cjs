#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
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
        "@biomejs/cli-linux-x64/biome",
        "@biomejs/cli-linux-arm64/biome",
        "@biomejs/cli-linux-x64-musl/biome",
        "@biomejs/cli-linux-arm64-musl/biome",
        "@biomejs/cli-darwin-arm64/biome",
        "@biomejs/cli-darwin-x64/biome",
        "@biomejs/cli-win32-x64/biome.exe",
        "@biomejs/cli-win32-arm64/biome.exe",
        "@biomejs/biome/bin/biome",
    ];

    for (const candidate of candidates) {
        const resolved = resolveCandidate(candidate);
        if (resolved) {
            return resolved;
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
