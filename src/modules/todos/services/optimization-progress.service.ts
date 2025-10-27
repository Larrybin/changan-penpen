import { unstable_cacheLife, unstable_cacheTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/cache/cache-tags";

import rawData from "../../../../config/optimization-progress.json";

export type OptimizationTodoStatus = "done" | "in-progress" | "todo" | "blocked";

export interface OptimizationTodoItem {
    id: string;
    title: string;
    status: OptimizationTodoStatus;
    summary: string;
    updatedAt?: string;
}

const parsedItems: OptimizationTodoItem[] = Array.isArray(rawData.items)
    ? rawData.items.map((item) => ({
          id: String(item.id ?? ""),
          title: String(item.title ?? ""),
          status: (item.status ?? "todo") as OptimizationTodoStatus,
          summary: String(item.summary ?? ""),
          updatedAt: item.updatedAt ? String(item.updatedAt) : undefined,
      }))
    : [];

export async function getOptimizationTodos(): Promise<OptimizationTodoItem[]> {
    "use cache";
    unstable_cacheTag(CACHE_TAGS.optimizationProgress);
    unstable_cacheLife("hours");
    return parsedItems;
}
