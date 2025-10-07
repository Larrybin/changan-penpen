import { describe, expect, it } from "vitest";
import adminRoutes from "../admin.routes";

describe("adminRoutes", () => {
    it("defines static route segments", () => {
        expect(adminRoutes.root).toBe("/admin");
        expect(adminRoutes.todos.list).toBe("/admin/todos");
        expect(adminRoutes.dashboard.overview).toBe("/admin");
        expect(adminRoutes.settings.site).toBe("/admin/settings/site");
    });

    it("generates dynamic paths", () => {
        expect(adminRoutes.todos.edit(42)).toBe("/admin/todos/edit/42");
        expect(adminRoutes.todos.edit("abc")).toBe("/admin/todos/edit/abc");
        expect(adminRoutes.tenants.show("tenant-1")).toBe("/admin/tenants/tenant-1");
    });
});
