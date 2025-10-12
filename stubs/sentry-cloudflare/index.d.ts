export interface SentryCloudflareOptions {
    dsn?: string;
    release?: string;
    environment?: string;
    sendDefaultPii?: boolean;
    enableLogs?: boolean;
    tracesSampleRate?: number;
}

type FetchHandler<Env> = {
    fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>;
};

type MaybeFetchHandler<Env> = FetchHandler<Env> | FetchHandler<Env>["fetch"];

type OptionsFactory<Env> = (
    env: Env,
    request: Request,
    ctx: ExecutionContext,
) => SentryCloudflareOptions | Promise<SentryCloudflareOptions>;

export declare const withSentry: <Env>(
    options: SentryCloudflareOptions | OptionsFactory<Env>,
    handler: MaybeFetchHandler<Env>,
) => FetchHandler<Env>;

export declare const init: () => void;

declare const _default: {
    withSentry: typeof withSentry;
    init: typeof init;
};

export default _default;
