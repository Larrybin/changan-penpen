export interface MetricTags {
    [key: string]: string | number | boolean | undefined;
}

export interface MetricRecord {
    name: string;
    value: number;
    tags: MetricTags;
    timestamp: number;
}

export interface MetricsReporterConfig {
    endpoint: string;
    method?: string;
    headers?: Record<string, string>;
    fetcher?: typeof fetch;
    flushIntervalMs?: number;
    maxBufferSize?: number;
    payloadBuilder?: (batch: MetricRecord[]) => unknown;
}

type MetricsReporter = (batch: MetricRecord[]) => Promise<void>;

const bufferedMetrics: MetricRecord[] = [];
const DEFAULT_MAX_BUFFER_SIZE = 200;
const DEFAULT_FLUSH_INTERVAL_MS = 15_000;

let reporter: MetricsReporter | null = null;
let maxBufferSize = DEFAULT_MAX_BUFFER_SIZE;
let flushIntervalMs = DEFAULT_FLUSH_INTERVAL_MS;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushInFlight: Promise<void> | null = null;

function enforceBufferLimit() {
    if (bufferedMetrics.length <= maxBufferSize) {
        return;
    }
    const overflow = bufferedMetrics.length - maxBufferSize;
    bufferedMetrics.splice(0, overflow);
}

function cancelFlushTimer() {
    if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
    }
}

function scheduleFlushTimer() {
    if (flushTimer || bufferedMetrics.length === 0 || !reporter) {
        return;
    }
    flushTimer = setTimeout(() => {
        flushTimer = null;
        flushMetrics().catch((error) => {
            console.error("[metrics] scheduled flush failed", { error });
        });
    }, flushIntervalMs);
}

function requeueBatch(batch: MetricRecord[]) {
    if (!batch.length) {
        return;
    }
    bufferedMetrics.unshift(...batch);
    enforceBufferLimit();
}

async function dispatchBatch(batch: MetricRecord[]): Promise<void> {
    if (!batch.length) {
        return;
    }

    if (!reporter) {
        console.info("[metrics] dispatch (no reporter configured)", batch);
        return;
    }

    await reporter(batch);
}

export function configureMetricsReporter(
    config: MetricsReporterConfig,
): void {
    if (!config || !config.endpoint) {
        throw new Error("Metrics reporter requires an endpoint");
    }

    const fetcher = config.fetcher ?? globalThis.fetch;
    if (typeof fetcher !== "function") {
        throw new Error(
            "Metrics reporter requires a fetch implementation (provide config.fetcher)",
        );
    }

    const payloadBuilder =
        config.payloadBuilder ??
        ((batch: MetricRecord[]) => ({
            metrics: batch,
            sentAt: new Date().toISOString(),
        }));

    reporter = async (batch: MetricRecord[]) => {
        await fetcher(config.endpoint, {
            method: config.method ?? "POST",
            headers: {
                "content-type": "application/json",
                ...config.headers,
            },
            body: JSON.stringify(payloadBuilder(batch)),
        });
    };

    if (
        typeof config.maxBufferSize === "number" &&
        Number.isFinite(config.maxBufferSize) &&
        config.maxBufferSize > 0
    ) {
        maxBufferSize = Math.floor(config.maxBufferSize);
    } else {
        maxBufferSize = DEFAULT_MAX_BUFFER_SIZE;
    }

    flushIntervalMs =
        typeof config.flushIntervalMs === "number" &&
        Number.isFinite(config.flushIntervalMs) &&
        config.flushIntervalMs > 0
            ? Math.floor(config.flushIntervalMs)
            : DEFAULT_FLUSH_INTERVAL_MS;

    enforceBufferLimit();
    cancelFlushTimer();
    scheduleFlushTimer();
}

export function isMetricsReporterConfigured(): boolean {
    return reporter !== null;
}

export function recordMetric(
    name: string,
    value = 1,
    tags: MetricTags = {},
): void {
    bufferedMetrics.push({ name, value, tags, timestamp: Date.now() });
    enforceBufferLimit();

    if (bufferedMetrics.length >= maxBufferSize) {
        flushMetrics().catch((error) => {
            console.error("[metrics] flush on max buffer failed", { error });
        });
        return;
    }

    scheduleFlushTimer();
}

export function drainMetrics(): MetricRecord[] {
    if (bufferedMetrics.length === 0) {
        return [];
    }
    cancelFlushTimer();
    const snapshot = [...bufferedMetrics];
    bufferedMetrics.length = 0;
    return snapshot;
}

export async function flushMetrics(): Promise<void> {
    if (flushInFlight) {
        await flushInFlight;
        return;
    }

    if (bufferedMetrics.length === 0) {
        cancelFlushTimer();
        return;
    }

    const batch = drainMetrics();
    const pending = (async () => {
        try {
            await dispatchBatch(batch);
        } catch (error) {
            requeueBatch(batch);
            scheduleFlushTimer();
            throw error;
        }
    })();

    flushInFlight = pending;
    try {
        await pending;
    } finally {
        if (flushInFlight === pending) {
            flushInFlight = null;
        }
        if (bufferedMetrics.length > 0) {
            scheduleFlushTimer();
        }
    }
}

export async function logMetrics(prefix = "metrics"): Promise<void> {
    if (bufferedMetrics.length === 0) {
        return;
    }

    console.info(`[${prefix}] pending metrics`, [...bufferedMetrics]);
    try {
        await flushMetrics();
    } catch (error) {
        console.error("[metrics] failed to flush after log", { error });
    }
}
