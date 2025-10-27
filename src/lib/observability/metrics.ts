interface MetricTags {
    [key: string]: string | number | boolean | undefined;
}

interface MetricRecord {
    name: string;
    value: number;
    tags: MetricTags;
    timestamp: number;
}

const bufferedMetrics: MetricRecord[] = [];
const MAX_BUFFER_SIZE = 200;

export function recordMetric(
    name: string,
    value = 1,
    tags: MetricTags = {},
): void {
    bufferedMetrics.push({ name, value, tags, timestamp: Date.now() });
    if (bufferedMetrics.length > MAX_BUFFER_SIZE) {
        bufferedMetrics.shift();
    }
}

export function getBufferedMetrics(): MetricRecord[] {
    return [...bufferedMetrics];
}

export function drainMetrics(): MetricRecord[] {
    const snapshot = [...bufferedMetrics];
    bufferedMetrics.length = 0;
    return snapshot;
}

export function logMetrics(prefix = "metrics") {
    const snapshot = drainMetrics();
    if (snapshot.length === 0) {
        return;
    }

    console.info(`[${prefix}] flushed metrics`, snapshot);
}
