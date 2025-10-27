export interface RetryOptions {
    attempts: number;
    initialDelayMs?: number;
    backoffFactor?: number;
    shouldRetry?: (error: unknown, attempt: number) => boolean;
    onRetry?: (context: { error: unknown; attempt: number }) => void;
}

const sleep = (durationMs: number) =>
    new Promise((resolve) => setTimeout(resolve, durationMs));

export async function retry<T>(
    action: (attempt: number) => Promise<T>,
    options: RetryOptions,
): Promise<T> {
    const attempts = Math.max(1, options.attempts);
    let delay = Math.max(0, options.initialDelayMs ?? 200);
    const backoffFactor = options.backoffFactor ?? 2;
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            return await action(attempt);
        } catch (error) {
            lastError = error;
            const shouldRetry = options.shouldRetry?.(error, attempt) ?? true;
            if (attempt >= attempts || !shouldRetry) {
                break;
            }

            options.onRetry?.({ error, attempt });
            if (delay > 0) {
                await sleep(delay);
            }
            delay *= backoffFactor;
        }
    }

    throw lastError;
}
