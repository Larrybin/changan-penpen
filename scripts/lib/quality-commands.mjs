#!/usr/bin/env node

// Shared command definitions for quality scripts to avoid drift between
// different automation entrypoints.

/**
 * @typedef {Object} CommandDefinition
 * @property {string} executable
 * @property {string[]} args
 */

/**
 * Formats a {@link CommandDefinition} into a shell command string. Helpful for
 * runners that accept a single string (e.g. QualitySession.run).
 *
 * @param {CommandDefinition} definition
 */
export function formatCommand(definition) {
    return [definition.executable, ...definition.args].join(" ");
}

/**
 * Returns the canonical TypeScript check command.
 *
 * @param {{ project?: string }=} options
 * @returns {CommandDefinition}
 */
export function getTypeCheckCommand(options = {}) {
    const args = ["exec", "tsc", "--noEmit"];
    if (options.project) {
        args.push("--project", options.project);
    }
    return { executable: "pnpm", args };
}

/**
 * Returns the Biome check command. When `write` is enabled, `--write` and
 * `--unsafe` flags are added to align with existing scripts.
 *
 * @param {{ write?: boolean; verbose?: boolean; extraArgs?: string[] }=} options
 * @returns {CommandDefinition}
 */
export function getBiomeCheckCommand(options = {}) {
    const args = ["exec", "biome", "check", "."];
    if (options.write) {
        args.push("--write", "--unsafe");
    }
    if (options.verbose) {
        args.push("--verbose");
    }
    if (options.extraArgs && options.extraArgs.length > 0) {
        args.push(...options.extraArgs);
    }
    return { executable: "pnpm", args };
}

/**
 * Convenience helper for Biome write commands to retain backwards
 * compatibility with scripts that expected a separate entry point.
 *
 * @returns {CommandDefinition}
 */
export function getBiomeWriteCommand() {
    return getBiomeCheckCommand({ write: true });
}
