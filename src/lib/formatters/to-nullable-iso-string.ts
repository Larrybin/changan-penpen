/**
 * Safely converts date-like values to ISO 8601 strings.
 *
 * Accepts {@link Date} instances, finite epoch millisecond numbers, and string
 * values. String inputs are normalized when they represent valid dates while
 * preserving the original value when parsing fails. Unsupported inputs result
 * in `null` so callers can gracefully handle missing or invalid timestamps.
 */
export function toNullableIsoString(
    value: Date | number | string | null | undefined,
): string | null {
    if (value === null || value === undefined) {
        return null;
    }

    if (value instanceof Date) {
        const timestamp = value.getTime();
        return Number.isNaN(timestamp) ? null : value.toISOString();
    }

    if (typeof value === "number") {
        return Number.isFinite(value) ? new Date(value).toISOString() : null;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed.length) {
            return null;
        }

        const parsed = new Date(trimmed);
        return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
    }

    return null;
}
