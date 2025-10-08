import { describe, expect, it } from "vitest";
import { normalizePagination, parsePaginationParams } from "./pagination";

describe("pagination utils", () => {
    describe("normalizePagination", () => {
        it("使用默认值处理非法输入", () => {
            expect(
                normalizePagination({ page: Number.NaN, perPage: Infinity }),
            ).toEqual({ page: 1, perPage: 20 });
        });

        it("允许自定义默认值", () => {
            expect(normalizePagination({}, { page: 2, perPage: 15 })).toEqual({
                page: 2,
                perPage: 15,
            });
        });

        it("保留有效数字", () => {
            expect(normalizePagination({ page: 3, perPage: 50 })).toEqual({
                page: 3,
                perPage: 50,
            });
        });
    });

    describe("parsePaginationParams", () => {
        it("解析缺省参数", () => {
            const params = new URLSearchParams("");
            expect(parsePaginationParams(params)).toEqual({
                page: 1,
                perPage: 20,
            });
        });

        it("仅提供 page 或 perPage 时回退默认", () => {
            expect(
                parsePaginationParams(new URLSearchParams("page=5")),
            ).toEqual({ page: 5, perPage: 20 });
            expect(
                parsePaginationParams(new URLSearchParams("perPage=10")),
            ).toEqual({ page: 1, perPage: 10 });
        });

        it("处理非数字", () => {
            const params = new URLSearchParams("page=abc&perPage=9999999999");
            expect(
                parsePaginationParams(params, { page: 2, perPage: 30 }),
            ).toEqual({
                page: 2,
                perPage: 9999999999,
            });
        });
    });
});

