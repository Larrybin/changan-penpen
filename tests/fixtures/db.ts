import type { Database as SqliteInstance } from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import { randomUUID } from "node:crypto";
import * as schema from "@/db";

export type TestDatabase = BetterSQLite3Database<typeof schema>;

export interface CreateTestDbOptions {
    /**
     * 自定义迁移目录，默认使用项目内 `src/drizzle`。
     */
    migrationsFolder?: string;
}

export interface TestDbContext {
    /** Drizzle 实例，可直接传给模块服务 */
    db: TestDatabase;
    /** 原始 better-sqlite3 连接，必要时可执行原生 SQL */
    connection: SqliteInstance;
    /** 清空所有业务表，保留 Schema，用于每个用例前重置状态 */
    reset: () => void;
    /** 关闭连接（在 Vitest `afterAll` 中调用） */
    cleanup: () => void;
    /**
     * 快捷插入用户记录，避免手写重复字段。
     * 返回插入后的主键，便于后续构造 todos/categories 等数据。
     */
    insertUser: (
        overrides?: Partial<typeof schema.user.$inferInsert>,
    ) => typeof schema.user.$inferSelect;
}

const DEFAULT_MIGRATIONS_FOLDER = path.resolve(
    process.cwd(),
    "src",
    "drizzle",
);

/**
 * 创建一份独立的内存数据库，用于 Vitest 中的业务测试。
 */
type BetterSqliteModule = typeof import("better-sqlite3");

let betterSqliteModule: BetterSqliteModule | null = null;

async function getBetterSqliteModule(): Promise<BetterSqliteModule> {
    if (betterSqliteModule) {
        return betterSqliteModule;
    }

    try {
        betterSqliteModule = await import("better-sqlite3");
        return betterSqliteModule;
    } catch (error) {
        const message =
            error instanceof Error ? error.message : String(error ?? "");
        throw new Error(
            `better-sqlite3 binding is unavailable. Did you run 'pnpm rebuild better-sqlite3'? (${message})`,
        );
    }
}

export async function createTestDb(
    options: CreateTestDbOptions = {},
): Promise<TestDbContext> {
    const { default: Database } = await getBetterSqliteModule();
    const connection = new Database(":memory:");

    // 确保外键等约束与生产环境一致
    connection.pragma("journal_mode = WAL");
    connection.pragma("foreign_keys = ON");

    const db = drizzle(connection, { schema });

    const migrationsFolder = options.migrationsFolder ?? DEFAULT_MIGRATIONS_FOLDER;

    migrate(db, { migrationsFolder });

    const reset = () => {
        connection.pragma("foreign_keys = OFF");

        const tables = connection
            .prepare<unknown[], { name: string }>(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';",
            )
            .all();

        for (const { name } of tables) {
            connection.prepare(`DELETE FROM "${name}";`).run();
            // 重置自增序列（若存在）
            connection
                .prepare("DELETE FROM sqlite_sequence WHERE name = ?;")
                .run(name);
        }

        connection.pragma("foreign_keys = ON");
    };

    const cleanup = () => {
        connection.close();
    };

    const insertUser = (
        overrides: Partial<typeof schema.user.$inferInsert> = {},
    ): typeof schema.user.$inferSelect => {
        const id = overrides.id ?? randomUUID();
        const now = new Date();

        const baseRecord: typeof schema.user.$inferInsert = {
            id,
            name: "Test User",
            email: `${id}@example.com`,
            emailVerified: false,
            image: null,
            createdAt: now,
            updatedAt: now,
            ...overrides,
        };

        const inserted = db
            .insert(schema.user)
            .values(baseRecord)
            .returning()
            .get();

        if (!inserted) {
            throw new Error("Failed to insert test user");
        }

        return inserted;
    };

    return {
        db,
        connection,
        reset,
        cleanup,
        insertUser,
    };
}
