import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchAdminList } from "../list";

const originalFetch = global.fetch;
const fetchMock = vi.fn<typeof fetch>();

describe("fetchAdminList", () => {
    beforeEach(() => {
        fetchMock.mockReset();
        global.fetch = fetchMock as unknown as typeof fetch;
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it("requests list data with pagination and filters", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify({ data: [{ id: 1 }], total: 5 }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }),
        );

        const result = await fetchAdminList<{ id: number }>({
            resource: "users",
            pagination: { pageIndex: 1, pageSize: 10 },
            filters: [{ field: "email", operator: "contains", value: "foo" }],
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/admin/users?page=2&perPage=10&email=foo",
            {
                method: "GET",
                credentials: "include",
            },
        );
        expect(result.items).toEqual([{ id: 1 }]);
        expect(result.total).toBe(5);
    });

    it("forwards the abort signal", async () => {
        const controller = new AbortController();
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify({ data: [], total: 0 }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }),
        );

        await fetchAdminList({ resource: "users", signal: controller.signal });

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/admin/users",
            expect.objectContaining({ signal: controller.signal }),
        );
    });
});
