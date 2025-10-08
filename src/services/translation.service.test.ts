import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
    TranslationProvider,
    TranslationProviderName,
} from "./translation.service";
import {
    createTranslationServiceFromEnv,
    TranslationError,
    TranslationService,
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
        const invalidProvider = "unknown" as unknown as TranslationProviderName;
        expect(() =>
            createTranslationServiceFromEnv(
                { GEMINI_API_KEY: "a" },
                { provider: invalidProvider },
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
                            content: '噪声前缀 {"welcome": "你好"}\n多余文本',
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
        expect(result).toEqual([{ key: "welcome", translatedText: "你好" }]);
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
        const translateBatch = vi.fn<TranslationProvider["translateBatch"]>();
        const provider = { translateBatch } satisfies TranslationProvider;
        const service = new TranslationService(provider);
        const result = await service.translateBatch({
            entries: [],
            sourceLocale: "en",
            targetLocale: "fr",
        });
        expect(result).toEqual([]);
        expect(translateBatch).not.toHaveBeenCalled();
    });

    it("失败重试后成功", async () => {
        const translateBatch = vi
            .fn<TranslationProvider["translateBatch"]>()
            .mockRejectedValueOnce(new Error("boom"))
            .mockRejectedValueOnce(new Error("boom2"))
            .mockResolvedValue([{ key: "a", translatedText: "b" }]);
        const provider = { translateBatch } satisfies TranslationProvider;
        const service = new TranslationService(provider);
        const promise = service.translateBatch({
            entries: [{ key: "a", text: "A" }],
            sourceLocale: "en",
            targetLocale: "de",
        });
        await vi.runAllTimersAsync();
        expect(await promise).toEqual([{ key: "a", translatedText: "b" }]);
        expect(translateBatch).toHaveBeenCalledTimes(3);
    });

    it("重试耗尽后抛错", async () => {
        const translateBatch = vi
            .fn<TranslationProvider["translateBatch"]>()
            .mockRejectedValue(new Error("fail"));
        const provider = { translateBatch } satisfies TranslationProvider;
        const service = new TranslationService(provider);
        const promise = service.translateBatch({
            entries: [{ key: "x", text: "X" }],
            sourceLocale: "en",
            targetLocale: "de",
        });
        const captured = promise.catch((error) => error);
        await vi.runAllTimersAsync();
        await expect(captured).resolves.toBeInstanceOf(TranslationError);
        expect(translateBatch).toHaveBeenCalledTimes(3);
    });
});
