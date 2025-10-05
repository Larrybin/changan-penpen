function normalizeSegment(segment) {
    if (segment == null) {
        return "";
    }
    if (typeof segment === "object") {
        if (typeof segment.key !== "undefined") {
            return String(segment.key);
        }
        if (typeof segment.name !== "undefined") {
            return String(segment.name);
        }
    }
    return String(segment);
}

export function getDotPath(issue) {
    if (!issue || typeof issue !== "object") {
        return "";
    }

    const value =
        issue.path ??
        issue.paths ??
        issue.key ??
        issue.field ??
        issue.property ??
        issue.pointer;

    if (Array.isArray(value)) {
        const path = value
            .map(normalizeSegment)
            .filter((part) => part.length > 0);
        if (path.length > 0) {
            return path.join(".");
        }
    }

    if (typeof value === "string" && value.length > 0) {
        return value;
    }

    if (typeof value === "number") {
        return String(value);
    }

    if (typeof issue.message === "string") {
        const match = issue.message.match(/"([^"]+)"/);
        if (match) {
            return match[1];
        }
    }

    return "";
}

export default {
    getDotPath,
};
