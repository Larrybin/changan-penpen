import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { adminDataProvider } from "../data-provider";

const originalFetch = global.fetch;
const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();

describe("adminDataProvider", () => {
    beforeEach(() => {
        fetchMock.mockReset();
        global.fetch = fetchMock as unknown as typeof fetch;
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    it("builds queries with pagination, filters, and sorters", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify({ data: [{ id: 1, name: "Item" }], total: 10 }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }),
        );

        const result = await adminDataProvider.getList({
            resource: "todos",
            pagination: { current: 2, pageSize: 10 },
            filters: [
                { field: "status", operator: "eq", value: "open" },
                {
                    operator: "or",
                    value: [
                        { field: "priority", operator: "eq", value: "high" },
                        { field: "priority", operator: "eq", value: "low" },
                    ],
                },
            ],
            sorters: [{ field: "createdAt", order: "desc" }],
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/admin/todos?page=2&perPage=10&status=open&priority=high&priority=low&sortBy=createdAt&sortOrder=desc",
            {
                method: "GET",
                credentials: "include",
            },
        );
        expect(result.total).toBe(10);
        expect(result.data).toHaveLength(1);
    });

    it("falls back to array length when total is missing", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify({ data: [{ id: 1 }, { id: 2 }] }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }),
        );

        const result = await adminDataProvider.getList({
            resource: "todos",
            pagination: { page: 1, perPage: 20 },
        });

        expect(result.total).toBe(2);
    });

    it("throws errors from parseResponse when response is not ok", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify({ message: "Not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            }),
        );

        await expect(
            adminDataProvider.getOne({ resource: "todos", id: 1 }),
        ).rejects.toThrow("Not found");
    });

    it("performs create and update requests with JSON bodies", async () => {
        fetchMock
            .mockResolvedValueOnce(
                new Response(JSON.stringify({ data: { id: 1 } }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                }),
            )
            .mockResolvedValueOnce(
                new Response(JSON.stringify({ data: { id: 1, name: "Updated" } }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                }),
            );

        await adminDataProvider.create({
            resource: "todos",
            variables: { title: "Task" },
        });
        expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/admin/todos", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Task" }),
        });

        await adminDataProvider.update({
            resource: "todos",
            id: 1,
            variables: { title: "Updated" },
        });
        expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/admin/todos/1", {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Updated" }),
        });
    });

    it("deletes resources and returns deleted id", async () => {
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

        const result = await adminDataProvider.deleteOne({
            resource: "todos",
            id: 7,
        });
        expect(fetchMock).toHaveBeenCalledWith("/api/admin/todos/7", {
            method: "DELETE",
            credentials: "include",
        });
        expect(result.data).toEqual({ id: 7 });
    });

    it("supports custom requests with meta headers", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }),
        );

        const result = await adminDataProvider.custom({
            url: "/reports",
            method: "POST",
            payload: { type: "summary" },
            meta: { headers: { Authorization: "Bearer token" } },
        });

        expect(fetchMock).toHaveBeenCalledWith("/api/admin/reports", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer token",
            },
            body: JSON.stringify({ type: "summary" }),
        });
        expect(result).toEqual({ ok: true });
    });
});
