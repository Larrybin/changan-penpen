export interface SentryOptions {
  dsn?: string;
  enabled?: boolean;
  environment?: string;
  release?: string;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
  tunnel?: string;
  debug?: boolean;
  sendDefaultPii?: boolean;
  autoSessionTracking?: boolean;
}

export interface CaptureContext {
  level?: "fatal" | "error" | "warning" | "log" | "info" | "debug" | "critical";
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

export interface SentryEvent {
  event_id?: string;
  message?: { formatted?: string } | string;
  level?: CaptureContext["level"];
  timestamp?: string;
  environment?: string;
  release?: string;
  exception?: {
    values: Array<{
      type?: string;
      value?: string;
      stacktrace?: unknown;
    }>;
  };
  [key: string]: unknown;
}

export type AnyFunction<TArgs extends unknown[] = unknown[], TResult = unknown> = (
  ...args: TArgs
) => TResult | Promise<TResult>;

export declare const init: (options?: SentryOptions) => void;
export declare const captureException: (
  error: unknown,
  captureContext?: CaptureContext
) => string | undefined;
export declare const captureMessage: (
  message: string,
  captureContext?: CaptureContext
) => string | undefined;
export declare const captureEvent: (event: SentryEvent) => string | undefined;
export declare const flush: () => Promise<boolean>;
export declare const close: () => Promise<boolean>;
export declare const addBreadcrumb: (breadcrumb: Record<string, unknown>) => void;
export declare const configureScope: (
  callback: (scope: {
    setContext: (key: string, context: unknown) => void;
    setTag: (key: string, value: string) => void;
    setUser: (user: Record<string, unknown>) => void;
  }) => void
) => void;
export declare const startSpan: <T>(options: Record<string, unknown>, callback: () => T) => T;
export declare const startInactiveSpan: typeof startSpan;
export declare const getCurrentHub: () => { getClient: () => unknown };
export declare const withMonitor: <T>(
  options: Record<string, unknown>,
  callback: () => T
) => T;
export declare const withSentryInstrumentation: <T>(callback: () => T) => T;

export interface WithSentryOptions {
  name?: string;
}

export declare const withSentry: <TArgs extends unknown[], TResult>(
  handler: AnyFunction<TArgs, TResult>,
  options?: WithSentryOptions | string
) => AnyFunction<TArgs, TResult>;

export declare const withSentryConfig: <T>(
  nextConfig: T,
  options?: Record<string, unknown>,
  sentryWebpackPluginOptions?: Record<string, unknown>
) => T;

declare const _default: {
  init: typeof init;
  captureException: typeof captureException;
  captureMessage: typeof captureMessage;
  captureEvent: typeof captureEvent;
  withSentry: typeof withSentry;
  withSentryConfig: typeof withSentryConfig;
  flush: typeof flush;
  close: typeof close;
  addBreadcrumb: typeof addBreadcrumb;
  configureScope: typeof configureScope;
  startSpan: typeof startSpan;
  startInactiveSpan: typeof startInactiveSpan;
};
export default _default;
