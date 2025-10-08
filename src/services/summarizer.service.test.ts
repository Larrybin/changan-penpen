import { describe, expect, it, vi } from "vitest";
import { SummarizerService } from "./summarizer.service";

describe("SummarizerService", () => {
    it("使用默认配置生成摘要", async () => {
        const ai = {
            run: vi.fn().mockResolvedValue({ response: " Summary text " }),
        } satisfies {
            run: ConstructorParameters<typeof SummarizerService>[0]["run"];
        };
        const service = new SummarizerService(
            ai as unknown as ConstructorParameters<typeof SummarizerService>[0],
        );
        const text = "a".repeat(100);
        const result = await service.summarize(text);
        expect(ai.run).toHaveBeenCalledWith("@cf/meta/llama-3.2-1b-instruct", {
            messages: expect.arrayContaining([
                expect.objectContaining({ role: "system" }),
                expect.objectContaining({ role: "user" }),
            ]),
        });
        expect(result.summary).toBe("Summary text");
        expect(result.originalLength).toBe(text.length);
        expect(result.summaryLength).toBe("Summary text".length);
        expect(result.tokensUsed.input).toBeGreaterThan(0);
        expect(result.tokensUsed.output).toBe(
            Math.ceil("Summary text".length / 4),
        );
    });

    it("自定义配置会反映在系统提示中", async () => {
        const ai = {
            run: vi.fn().mockResolvedValue({ response: "Bullet list" }),
        } satisfies {
            run: ConstructorParameters<typeof SummarizerService>[0]["run"];
        };
        const service = new SummarizerService(
            ai as unknown as ConstructorParameters<typeof SummarizerService>[0],
        );
        const text = "b".repeat(120);
        await service.summarize(text, {
            maxLength: 150,
            style: "bullet-points",
            language: "中文",
        });
        const systemMessage = ai.run.mock.calls[0]?.[1]?.messages?.[0]?.content;
        expect(systemMessage).toContain("bullet points");
        expect(systemMessage).toContain("中文");
        expect(systemMessage).toContain("150");
    });
});

