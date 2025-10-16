import { getCloudflareContext } from "@opennextjs/cloudflare";
import handleApiError from "@/lib/api-error";
import { createApiErrorResponse } from "@/lib/http-error";
import { getAuthInstance } from "@/modules/auth/utils/auth-utils";
import type { AiBinding } from "@/services/summarizer.service";
import {
    SummarizerService,
    summarizeRequestSchema,
} from "@/services/summarizer.service";

export async function POST(request: Request) {
    try {
        // Check authentication
        const auth = await getAuthInstance();
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user) {
            return createApiErrorResponse({
                status: 401,
                code: "UNAUTHORIZED",
                message: "Authentication required",
            });
        }

        const { env } = await getCloudflareContext({ async: true });

        function hasAI(e: unknown): e is { AI: AiBinding } {
            try {
                const rec = e as Record<string, unknown> | null | undefined;
                const aiVal = rec
                    ? (rec as Record<string, unknown>).AI
                    : undefined;
                const ai = aiVal as { run?: unknown } | undefined;
                return Boolean(ai && typeof ai.run === "function");
            } catch {
                return false;
            }
        }

        if (!hasAI(env)) {
            return createApiErrorResponse({
                status: 503,
                code: "SERVICE_UNAVAILABLE",
                message: "AI service is not available",
            });
        }

        // parse request body
        const body = await request.json();
        const validated = summarizeRequestSchema.parse(body);

        const summarizerService = new SummarizerService(env.AI);
        const result = await summarizerService.summarize(
            validated.text,
            validated.config,
        );

        return new Response(
            JSON.stringify({
                success: true,
                data: result,
                error: null,
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );
    } catch (error) {
        return handleApiError(error);
    }
}
