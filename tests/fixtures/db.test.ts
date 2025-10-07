import { describe, expect, it } from "vitest";
import { createTestDb } from "./db";

// better-sqlite3 在部分环境下需要预先构建原生绑定；
// 运行此测试前请确认依赖已就绪，再将 skip 去掉。
describe.skip("createTestDb fixture", () => {
    it("inserts and resets user records", async () => {
        const ctx = await createTestDb();

        const inserted = ctx.insertUser({ name: "Alice" });
        expect(inserted.name).toBe("Alice");

        ctx.reset();
        ctx.cleanup();
    });
});

