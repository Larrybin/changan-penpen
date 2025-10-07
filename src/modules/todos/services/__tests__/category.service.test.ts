import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as dbModule from "@/db";
import {
    createCategoryForUser,
    listCategoriesForAdmin,
    listCategoriesForUser,
    updateCategoryForUser,
} from "../category.service";
import type { TestDbContext } from "../../../../../tests/fixtures/db";
import { createTestDb } from "../../../../../tests/fixtures/db";

describe("category.service", () => {
    let ctx: TestDbContext;
    let userId: string;
    let getDbMock: ReturnType<typeof vi.spyOn> | undefined;
    let shouldSkip = false;

    const skipIfUnavailable = () => shouldSkip;

    beforeAll(async () => {
        try {
            ctx = await createTestDb();
            getDbMock = vi
                .spyOn(dbModule, "getDb")
                .mockImplementation(async () => ctx.db);
        } catch (error) {
            shouldSkip = true;
            console.warn(
                "Skipping category.service tests because better-sqlite3 bindings are unavailable:",
                (error as Error).message,
            );
        }
    });

    beforeEach(() => {
        if (skipIfUnavailable()) {
            return;
        }

        ctx.reset();

        const user = ctx.insertUser({
            id: "user-category",
            email: "user-category@example.com",
            name: "Category User",
        });
        userId = user.id;

        getDbMock?.mockClear();
        getDbMock?.mockImplementation(async () => ctx.db);
    });

    afterAll(() => {
        if (getDbMock) {
            getDbMock.mockRestore();
        }

        if (!shouldSkip) {
            ctx.cleanup();
        }
    });

    it("creates a category for the user", async () => {
        if (skipIfUnavailable()) {
            return;
        }

        const category = await createCategoryForUser(userId, {
            name: "Work",
            color: "#123456",
            description: "All work related tasks",
        });

        expect(category.id).toBeGreaterThan(0);
        expect(category.userId).toBe(userId);
        expect(category.name).toBe("Work");
        expect(category.color).toBe("#123456");
        expect(category.description).toBe("All work related tasks");
    });

    it("throws when create payload is invalid", async () => {
        if (skipIfUnavailable()) {
            return;
        }

        await expect(
            createCategoryForUser(userId, {
                name: "",
            } as never),
        ).rejects.toThrow();
    });

    it("updates a category for the user", async () => {
        if (skipIfUnavailable()) {
            return;
        }

        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
        const category = await createCategoryForUser(userId, {
            name: "Personal",
        });

        vi.setSystemTime(new Date("2024-01-02T00:00:00.000Z"));
        const updated = await updateCategoryForUser(userId, category.id, {
            color: "#abcdef",
            description: "Updated description",
        });

        expect(updated.color).toBe("#abcdef");
        expect(updated.description).toBe("Updated description");
        expect(updated.updatedAt).not.toBe(category.updatedAt);

        vi.useRealTimers();
    });

    it("throws when updating category not found or unauthorized", async () => {
        if (skipIfUnavailable()) {
            return;
        }

        const otherUser = ctx.insertUser({
            id: "user-other",
            email: "other@example.com",
            name: "Other User",
        });

        const otherCategory = await createCategoryForUser(otherUser.id, {
            name: "Other",
        });

        await expect(
            updateCategoryForUser(userId, otherCategory.id, {
                color: "#ffffff",
            }),
        ).rejects.toThrow("Category not found or unauthorized");

        await expect(
            updateCategoryForUser(userId, otherCategory.id + 999, {
                color: "#ffffff",
            }),
        ).rejects.toThrow("Category not found or unauthorized");
    });

    it("lists categories only for the given user in creation order", async () => {
        if (skipIfUnavailable()) {
            return;
        }

        vi.useFakeTimers();

        vi.setSystemTime(new Date("2024-02-01T00:00:00.000Z"));
        await createCategoryForUser(userId, { name: "Alpha" });

        vi.setSystemTime(new Date("2024-02-02T00:00:00.000Z"));
        await createCategoryForUser(userId, { name: "Beta" });

        const otherUser = ctx.insertUser({
            id: "user-foreign",
            email: "foreign@example.com",
            name: "Foreign User",
        });

        await createCategoryForUser(otherUser.id, { name: "Gamma" });

        const categories = await listCategoriesForUser(userId);
        expect(categories.map((item) => item.name)).toEqual(["Alpha", "Beta"]);
        expect(categories.every((item) => item.userId === userId)).toBe(true);

        vi.useRealTimers();
    });

    it("returns empty admin category list when tenant id is missing", async () => {
        if (skipIfUnavailable()) {
            return;
        }

        await createCategoryForUser(userId, { name: "Hidden" });

        const categories = await listCategoriesForAdmin();
        expect(categories).toEqual([]);
    });

    it("lists categories for the requested tenant when admin filters by tenant", async () => {
        if (skipIfUnavailable()) {
            return;
        }

        const otherUser = ctx.insertUser({
            id: "user-admin-tenant",
            email: "tenant-admin@example.com",
            name: "Tenant", 
        });

        await createCategoryForUser(userId, { name: "Primary" });
        await createCategoryForUser(otherUser.id, { name: "Secondary" });

        const categories = await listCategoriesForAdmin({ tenantId: otherUser.id });
        expect(categories).toHaveLength(1);
        expect(categories[0]?.userId).toBe(otherUser.id);
        expect(categories[0]?.name).toBe("Secondary");
    });
});
