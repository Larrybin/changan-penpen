import { describe, expect, it } from "vitest";
import { config } from "@/config";
import { normalizePagination, parsePaginationParams } from "./pagination";

describe("pagination utils", () => {
    describe("normalizePagination", () => {
        it("使用默认值处理非法输入", () => {
            expect(
                normalizePagination({ page: Number.NaN, perPage: Infinity }),
            ).toEqual({
                page: 1,
                perPage: config.pagination.defaultPageSize,
            });
        });

        it("允许自定义默认值", () => {
            const customDefaults = {
                page: 2,
                perPage: config.pagination.maxPageSize + 25,
            } as const;

            expect(normalizePagination({}, customDefaults)).toEqual({
                page: 2,
                perPage: config.pagination.maxPageSize,
            });
        });

        it("保留有效数字", () => {
            expect(normalizePagination({ page: 3, perPage: 5 })).toEqual({
                page: 3,
                perPage: Math.max(config.pagination.minPageSize, 5),
            });
        });

        it("将每页数量限制在阈值之间", () => {
            expect(
                normalizePagination({
                    page: 1,
                    perPage: config.pagination.maxPageSize * 10,
                }),
            ).toEqual({
                page: 1,
                perPage: config.pagination.maxPageSize,
            });

            expect(
                normalizePagination({
                    page: 1,
                    perPage: -100,
                }),
            ).toEqual({
                page: 1,
                perPage: config.pagination.minPageSize,
            });
        });
    });

    describe("parsePaginationParams", () => {
        it("解析缺省参数", () => {
            const params = new URLSearchParams("");
            expect(parsePaginationParams(params)).toEqual({
                page: 1,
                perPage: config.pagination.defaultPageSize,
            });
        });

        it("仅提供 page 或 perPage 时回退默认", () => {
            expect(
                parsePaginationParams(new URLSearchParams("page=5")),
            ).toEqual({
                page: 5,
                perPage: config.pagination.defaultPageSize,
            });
            expect(
                parsePaginationParams(new URLSearchParams("perPage=10")),
            ).toEqual({
                page: 1,
                perPage: Math.max(
                    config.pagination.minPageSize,
                    Math.min(10, config.pagination.maxPageSize),
                ),
            });
        });

        it("处理非数字", () => {
            const params = new URLSearchParams("page=abc&perPage=9999999999");
            expect(
                parsePaginationParams(params, { page: 2, perPage: 30 }),
            ).toEqual({
                page: 2,
                perPage: config.pagination.maxPageSize,
            });
        });
    });
});
