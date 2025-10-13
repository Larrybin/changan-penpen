import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export async function getDb() {
    const { env } = await getCloudflareContext({ async: true });
    // 通过宽化断言读取 D1 绑定，避免对全局 CloudflareEnv 声明次序的敏感依赖
    const db = (env as unknown as { next_cf_app: D1Database }).next_cf_app;
    return drizzle(db, { schema });
}

export * from "./schema";
