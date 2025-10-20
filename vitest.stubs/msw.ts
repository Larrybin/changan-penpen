// Temporary compatibility layer that adapts msw@2's http handlers to the legacy
// `rest` API used throughout our test suite. It converts the modern handler
// signature into the `(req, res, ctx)` helpers that the tests expect while
// delegating to the actual msw runtime for request interception.
import * as core from "../node_modules/msw/lib/core/index.mjs";

export * from "../node_modules/msw/lib/core/index.mjs";

type LegacyStrictRequest = core.StrictRequest<core.DefaultBodyType>;

const isStringArray = (value: unknown): value is readonly string[] =>
    Array.isArray(value);

const parseRequestBody = async (request: Request | LegacyStrictRequest) => {
    const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

    if (!contentType) {
        return undefined;
    }

    const cloned = request.clone() as Request;

    try {
        if (contentType.includes("application/json")) {
            return await cloned.json();
        }

        if (contentType.includes("application/x-www-form-urlencoded")) {
            const text = await cloned.text();
            return Object.fromEntries(new URLSearchParams(text));
        }

        if (contentType.includes("text/")) {
            return await cloned.text();
        }

        if (contentType.includes("multipart/form-data")) {
            return await cloned.formData();
        }
    } catch {
        if (contentType.includes("application/json")) {
            return {};
        }
        return undefined;
    }

    return undefined;
};

const createLegacyContext = (state: {
    status: number;
    headers: Headers;
    body: BodyInit | null;
}) => {
    return {
        status: (value: number) => (responseState: typeof state) => {
            responseState.status = value;
            return responseState;
        },
        json: (data: unknown) => (responseState: typeof state) => {
            responseState.body = JSON.stringify(data);
            responseState.headers.set("Content-Type", "application/json");
            return responseState;
        },
        text: (data: string) => (responseState: typeof state) => {
            responseState.body = data;
            return responseState;
        },
        set: (name: string, value: string) => (responseState: typeof state) => {
            responseState.headers.set(name, value);
            return responseState;
        },
    };
};

const createLegacyResponseFactory = (state: {
    status: number;
    headers: Headers;
    body: BodyInit | null;
}) => {
    return (...transformers: Array<(responseState: typeof state) => unknown>) => {
        for (const transformer of transformers) {
            const result = transformer(state);
            if (result && typeof result === "object" && result !== state) {
                if ("status" in result && typeof (result as any).status === "number") {
                    state.status = (result as any).status;
                }
                if ((result as any).headers instanceof Headers) {
                    state.headers = (result as any).headers;
                }
                if (Object.prototype.hasOwnProperty.call(result, "body")) {
                    state.body = (result as any).body;
                }
            }
        }

        return new core.HttpResponse(state.body ?? null, {
            status: state.status,
            headers: state.headers,
        });
    };
};

const createLegacyRequest = async (
    request: LegacyStrictRequest,
    params: Record<string, string | readonly string[] | undefined>,
) => {
    const url = new URL(request.url);
    const normalizedParams: Record<string, string | undefined> = {};

    for (const [key, value] of Object.entries(params)) {
        if (isStringArray(value)) {
            normalizedParams[key] = value[value.length - 1];
        } else if (typeof value === "string") {
            normalizedParams[key] = value;
        } else {
            normalizedParams[key] = undefined;
        }
    }

    return {
        url,
        method: request.method,
        headers: request.headers,
        params: normalizedParams,
        body: await parseRequestBody(request),
    };
};

const createRestHandler = <Method extends keyof typeof core.http>(method: Method) => {
    return (
        path: Parameters<(typeof core.http)[Method]>[0],
        resolver: (req: any, res: any, ctx: any) => Promise<Response> | Response,
    ) => {
        return core.http[method](path as string, async ({ request, params }) => {
            const legacyState = {
                status: 200,
                headers: new Headers(),
                body: null as BodyInit | null,
            };
            const legacyCtx = createLegacyContext(legacyState);
            const legacyRes = createLegacyResponseFactory(legacyState);
            const legacyReq = await createLegacyRequest(request, params ?? {});

            try {
                const response = await resolver(legacyReq, legacyRes, legacyCtx);
                if (response instanceof core.HttpResponse) {
                    return response;
                }

                if (response === undefined) {
                    return new core.HttpResponse(legacyState.body ?? null, {
                        status: legacyState.status,
                        headers: legacyState.headers,
                    });
                }

                return response;
            } catch (error) {
                console.error("[msw legacy adapter] handler error", error);
                throw error;
            }
        });
    };
};

export const rest = {
    get: createRestHandler("get"),
    post: createRestHandler("post"),
    put: createRestHandler("put"),
    patch: createRestHandler("patch"),
    delete: createRestHandler("delete"),
    options: createRestHandler("options"),
    head: createRestHandler("head"),
    all: createRestHandler("all"),
};
