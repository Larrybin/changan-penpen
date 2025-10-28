export function parseDurationToMs(
    value: string | number | null | undefined,
): number | undefined {
    if (value === null || value === undefined) {
        return undefined;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
        return Math.max(0, Math.floor(value));
    }

    if (typeof value !== "string") {
        return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return undefined;
    }

    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
        return Math.max(0, Math.floor(numeric));
    }

    const match = trimmed.toLowerCase().match(/^([0-9]+(?:\.[0-9]+)?)(ms|s|m|h)$/u);
    if (!match) {
        return undefined;
    }

    const amount = Number(match[1]);
    const unit = match[2];

    if (!Number.isFinite(amount)) {
        return undefined;
    }

    const multipliers: Record<string, number> = {
        ms: 1,
        s: 1000,
        m: 60_000,
        h: 3_600_000,
    };

    const multiplier = multipliers[unit];
    if (!multiplier) {
        return undefined;
    }

    return Math.max(0, Math.round(amount * multiplier));
}
