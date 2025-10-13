import { getCloudflareContext } from "@opennextjs/cloudflare";
import handleApiError from "@/lib/api-error";
import { getAuthInstance } from "@/modules/auth/utils/auth-utils";
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
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Authentication required",
                    data: null,
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        const { env } = await getCloudflareContext({ async: true });

        type AiLike = {
            run: (model: string, options?: unknown) => Promise<any>;
        };
        function hasAI(e: unknown): e is { AI: AiLike } {
            try {
                const rec = e as Record<string, unknown> | null | undefined;
                const ai = (rec as any)?.AI as { run?: unknown } | undefined;
                return !!ai && typeof ai.run === "function";
            } catch {
                return false;
            }
        }

        if (!hasAI(env)) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "AI service is not available",
                    data: null,
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
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
