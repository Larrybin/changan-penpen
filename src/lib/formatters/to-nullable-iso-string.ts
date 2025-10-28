/**
 * Safely converts date-like values to ISO 8601 strings.
 *
 * Accepts {@link Date} instances, finite epoch millisecond numbers, and string
 * values. String inputs are normalized when they represent valid dates and
 * produce `null` otherwise, allowing callers to gracefully handle missing or
 * invalid timestamps without special casing.
 */
export function toNullableIsoString(value: unknown): string | null {
    if (value === null || value === undefined) {
        return null;
    }

    if (value instanceof Date) {
        const timestamp = value.getTime();
        return Number.isNaN(timestamp) ? null : value.toISOString();
    }

    if (typeof value === "number") {
        if (!Number.isFinite(value)) {
            return null;
        }

        const date = new Date(value);
        const timestamp = date.getTime();
        return Number.isNaN(timestamp) ? null : date.toISOString();
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed.length) {
            return null;
        }

        const parsed = new Date(trimmed);
        return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    }

    return null;
}
