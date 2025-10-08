const DEFAULT_SDK_INFO = {
  name: "@sentry/nextjs-stub",
  version: "0.1.0",
};

const state = {
  options: undefined,
};

const noop = () => {};

const generateEventId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "");
  }

  return Math.random().toString(16).slice(2, 34).padEnd(32, "0");
};

const parseDsn = (dsn) => {
  if (!dsn) {
    return undefined;
  }

  try {
    const url = new URL(dsn);
    const segments = url.pathname.replace(/^\/+/, "").split("/").filter(Boolean);
    const projectId = segments.pop();

    if (!projectId) {
      return undefined;
    }

    const basePath = segments.length > 0 ? `/${segments.join("/")}` : "";
    return {
      envelopeUrl: `${url.protocol}//${url.host}${basePath}/api/${projectId}/envelope/?sentry_key=${url.username}&sentry_version=7`,
    };
  } catch (_error) {
    return undefined;
  }
};

const buildEvent = (input, level = "error") => {
  const event = typeof input === "object" && input && input.event_id ? { ...input } : {};
  const eventId = event.event_id ?? generateEventId();

  if (!event.event_id) {
    event.event_id = eventId;
  }

  if (!event.timestamp) {
    event.timestamp = new Date().toISOString();
  }

  if (typeof input === "string") {
    event.message = { formatted: input };
  } else if (input instanceof Error) {
    event.exception = {
      values: [
        {
          type: input.name || "Error",
          value: input.message || input.toString(),
          stacktrace: input.stack ? { frames: [{ function: "unknown", filename: input.stack }] } : undefined,
        },
      ],
    };
  }

  if (!event.level) {
    event.level = level;
  }

  const { options } = state;
  if (options) {
    if (options.environment && !event.environment) {
      event.environment = options.environment;
    }

    if (options.release && !event.release) {
      event.release = options.release;
    }
  }

  return event;
};

const dispatchEnvelope = async (envelope) => {
  const { options } = state;

  if (!options?.enabled || !options.dsn) {
    return;
  }

  const dsn = parseDsn(options.dsn);
  if (!dsn) {
    if (options.debug) {
      console.warn("[sentry-stub] Failed to parse DSN");
    }
    return;
  }

  try {
    await fetch(dsn.envelopeUrl, {
      method: "POST",
      body: envelope,
      headers: {
        "content-type": "application/x-sentry-envelope",
      },
    });
  } catch (error) {
    if (options.debug) {
      console.warn("[sentry-stub] Failed to send event", error);
    }
  }
};

const sendEvent = async (event) => {
  const header = {
    sent_at: new Date().toISOString(),
    sdk: DEFAULT_SDK_INFO,
  };

  const envelope = `${JSON.stringify(header)}\n${JSON.stringify({ type: "event" })}\n${JSON.stringify(event)}`;
  await dispatchEnvelope(envelope);
  return event.event_id;
};

export const init = (options = {}) => {
  state.options = {
    enabled: options.enabled ?? Boolean(options.dsn),
    dsn: options.dsn,
    environment: options.environment,
    release: options.release,
    tracesSampleRate: options.tracesSampleRate,
    profilesSampleRate: options.profilesSampleRate,
    debug: options.debug ?? false,
    sendDefaultPii: options.sendDefaultPii ?? false,
    autoSessionTracking: options.autoSessionTracking ?? false,
  };
};

export const captureException = (error, _captureContext) => {
  if (!state.options?.enabled) {
    return undefined;
  }

  const event = buildEvent(error, "error");
  void sendEvent(event);
  return event.event_id;
};

export const captureMessage = (message, captureContext) => {
  if (!state.options?.enabled) {
    return undefined;
  }

  const level = typeof captureContext === "object" && captureContext?.level ? captureContext.level : "info";
  const event = buildEvent(message, level);
  void sendEvent(event);
  return event.event_id;
};

export const captureEvent = (event) => {
  if (!state.options?.enabled) {
    return undefined;
  }

  const enriched = buildEvent(event, event.level || "error");
  void sendEvent(enriched);
  return enriched.event_id;
};

export const withSentryConfig = (nextConfig) => nextConfig;

export const withSentry = (handler, options = {}) => {
  const name = typeof options === "string" ? options : options?.name;

  return async function sentryWrapped(...args) {
    try {
      return await handler.apply(this, args);
    } catch (error) {
      captureException(error, { functionName: name || handler.name });
      throw error;
    }
  };
};

export const flush = () => Promise.resolve(true);
export const close = () => {
  state.options = undefined;
  return Promise.resolve(true);
};

export const addBreadcrumb = noop;
export const setUser = noop;
export const configureScope = (callback = noop) => {
  try {
    callback({
      setContext: noop,
      setTag: noop,
      setUser: noop,
    });
  } catch (_error) {
    // ignore
  }
};

export const startSpan = (_options, callback) => callback();
export const startInactiveSpan = startSpan;
export const getCurrentHub = () => ({ getClient: () => undefined });
export const withMonitor = (_options, callback) => callback();
export const withSentryInstrumentation = (callback) => callback();

export default {
  init,
  captureException,
  captureMessage,
  captureEvent,
  withSentry,
  withSentryConfig,
  flush,
  close,
  addBreadcrumb,
  configureScope,
  startSpan,
  startInactiveSpan,
};
