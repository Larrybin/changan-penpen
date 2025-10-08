import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    TranslationError,
    TranslationService,
    createTranslationServiceFromEnv,
} from "./translation.service";

describe("translation service", () => {
    let envSnapshot: NodeJS.ProcessEnv;

    beforeEach(() => {
        envSnapshot = { ...process.env };
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.unstubAllGlobals();
        vi.useRealTimers();
        process.env = { ...envSnapshot };
    });

    it("缺少 GEMINI_API_KEY 时抛错", () => {
        expect(() =>
            createTranslationServiceFromEnv({}, { provider: "gemini" }),
        ).toThrowError(TranslationError);
    });

    it("缺少 OPENAI_API_KEY 时抛错", () => {
        expect(() =>
            createTranslationServiceFromEnv({}, { provider: "gpt" }),
        ).toThrowError(TranslationError);
    });

    it("未知 provider 抛错", () => {
        expect(() =>
            createTranslationServiceFromEnv(
                { GEMINI_API_KEY: "a" },
                { provider: "unknown" as any },
            ),
        ).toThrowError(TranslationError);
    });

    it("OpenAI 提供商能容错解析 JSON", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [
                    {
                        message: {
                            content:
                                "噪声前缀 {\"welcome\": \"你好\"}\n多余文本",
                        },
                    },
                ],
            }),
        });
        vi.stubGlobal("fetch", fetchMock);

        const service = createTranslationServiceFromEnv(
            { OPENAI_API_KEY: "token" },
            { provider: "gpt" },
        );
        const result = await service.translateBatch({
            entries: [{ key: "welcome", text: "hello" }],
            sourceLocale: "en",
            targetLocale: "zh-CN",
        });
        expect(result).toEqual([
            { key: "welcome", translatedText: "你好" },
        ]);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("OpenAI 请求失败抛出 TranslationError", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            statusText: "error",
        });
        vi.stubGlobal("fetch", fetchMock);
        const service = createTranslationServiceFromEnv(
            { OPENAI_API_KEY: "token" },
            { provider: "gpt" },
        );
        const promise = service.translateBatch({
            entries: [{ key: "k", text: "v" }],
            sourceLocale: "en",
            targetLocale: "fr",
        });
        const captured = promise.catch((error) => error);
        await vi.runAllTimersAsync();
        await expect(captured).resolves.toBeInstanceOf(TranslationError);
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("空 entries 直接返回空数组", async () => {
        const provider = { translateBatch: vi.fn() };
        const service = new TranslationService(provider as any);
        const result = await service.translateBatch({
            entries: [],
            sourceLocale: "en",
            targetLocale: "fr",
        });
        expect(result).toEqual([]);
        expect(provider.translateBatch).not.toHaveBeenCalled();
    });

    it("失败重试后成功", async () => {
        const provider = {
            translateBatch: vi
                .fn()
                .mockRejectedValueOnce(new Error("boom"))
                .mockRejectedValueOnce(new Error("boom2"))
                .mockResolvedValue([{ key: "a", translatedText: "b" }]),
        };
        const service = new TranslationService(provider as any);
        const promise = service.translateBatch({
            entries: [{ key: "a", text: "A" }],
            sourceLocale: "en",
            targetLocale: "de",
        });
        await vi.runAllTimersAsync();
        expect(await promise).toEqual([{ key: "a", translatedText: "b" }]);
        expect(provider.translateBatch).toHaveBeenCalledTimes(3);
    });

    it("重试耗尽后抛错", async () => {
        const provider = {
            translateBatch: vi.fn().mockRejectedValue(new Error("fail")),
        };
        const service = new TranslationService(provider as any);
        const promise = service.translateBatch({
            entries: [{ key: "x", text: "X" }],
            sourceLocale: "en",
            targetLocale: "de",
        });
        const captured = promise.catch((error) => error);
        await vi.runAllTimersAsync();
        await expect(captured).resolves.toBeInstanceOf(TranslationError);
        expect(provider.translateBatch).toHaveBeenCalledTimes(3);
    });
});
