/**
 * 健康检查API测试
 * 测试 /api/health 端点的功能
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { apiRequest, expectSuccessResponse } from "../setup";

describe("/api/health", () => {
    describe("GET /api/health", () => {
        it("应该返回健康状态", async () => {
            const response = await apiRequest("/api/health", {
                method: "GET",
            });

            expectSuccessResponse(response, 200);
            expect(response.data).toHaveProperty("status", "ok");
            expect(response.data).toHaveProperty("timestamp");
            expect(response.data).toHaveProperty("uptime");
            expect(typeof response.data.timestamp).toBe("string");
            expect(typeof response.data.uptime).toBe("number");
        });

        it("应该返回正确的Content-Type头", async () => {
            const response = await apiRequest("/api/health", {
                method: "GET",
            });

            expect(response.headers.get("content-type")).toMatch(/json/);
        });

        it("应该返回有效的时间戳", async () => {
            const response = await apiRequest("/api/health", {
                method: "GET",
            });

            const timestamp = new Date(response.data.timestamp);
            expect(timestamp.getTime()).not.toBeNaN();

            // 验证时间戳在合理范围内（最近24小时内）
            const now = new Date();
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            expect(timestamp.getTime()).toBeGreaterThanOrEqual(oneDayAgo.getTime());
            expect(timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
        });

        it("应该返回有效的运行时间", async () => {
            const response = await apiRequest("/api/health", {
                method: "GET",
            });

            expect(response.data.uptime).toBeGreaterThanOrEqual(0);
            expect(typeof response.data.uptime).toBe("number");
        });
    });

    describe("POST /api/health", () => {
        it("应该拒绝POST请求", async () => {
            const response = await apiRequest("/api/health", {
                method: "POST",
                body: JSON.stringify({ test: "data" }),
            });

            expect(response.status).toBe(405); // Method Not Allowed
            expect(response.ok).toBe(false);
        });
    });

    describe("PUT /api/health", () => {
        it("应该拒绝PUT请求", async () => {
            const response = await apiRequest("/api/health", {
                method: "PUT",
                body: JSON.stringify({ test: "data" }),
            });

            expect(response.status).toBe(405);
            expect(response.ok).toBe(false);
        });
    });

    describe("DELETE /api/health", () => {
        it("应该拒绝DELETE请求", async () => {
            const response = await apiRequest("/api/health", {
                method: "DELETE",
            });

            expect(response.status).toBe(405);
            expect(response.ok).toBe(false);
        });
    });
});