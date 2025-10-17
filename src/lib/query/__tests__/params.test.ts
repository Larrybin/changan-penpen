import { describe, expect, it } from "vitest";
import type { CrudFilters } from "@/lib/crud/types";

import { buildListSearchParams } from "@/lib/query/params";

describe("buildListSearchParams", () => {
    it("returns empty params when no options provided", () => {
        const params = buildListSearchParams();
        expect(params.toString()).toBe("");
    });

    it("includes pagination data when provided", () => {
        const params = buildListSearchParams({
            pagination: { current: 2, pageSize: 50 },
        });
        expect(params.get("page")).toBe("2");
        expect(params.get("perPage")).toBe("50");
    });

    it("serializes simple filters", () => {
        const filters: CrudFilters = [
            {
                field: "email",
                operator: "contains",
                value: "example",
            },
            {
                field: "isActive",
                operator: "eq",
                value: true,
            },
        ];
        const params = buildListSearchParams({ filters });
        expect(params.getAll("email")).toEqual(["example"]);
        expect(params.getAll("isActive")).toEqual(["true"]);
    });

    it("flattens logical filter groups", () => {
        const filters: CrudFilters = [
            {
                operator: "or",
                value: [
                    { field: "name", operator: "contains", value: "foo" },
                    { field: "name", operator: "contains", value: "bar" },
                ],
            },
        ];
        const params = buildListSearchParams({ filters });
        expect(params.getAll("name")).toEqual(["foo", "bar"]);
    });

    it("includes sorting parameters", () => {
        const params = buildListSearchParams({
            sorters: [
                {
                    field: "createdAt",
                    order: "desc",
                },
            ],
        });
        expect(params.get("sortBy")).toBe("createdAt");
        expect(params.get("sortOrder")).toBe("desc");
    });
});
