import { beforeEach, describe, expect, it, vi } from "vitest";
import type { getDb } from "@/db";
import { consumeCredits } from "@/modules/billing/services/credits.service";
import { getUsageDaily, recordUsage } from "../usage.service";

vi.mock("@/modules/billing/services/credits.service", () => ({
    consumeCredits: vi.fn(),
}));

type Database = Awaited<ReturnType<typeof getDb>>;

type InsertBehavior = {
    returning?: Array<Record<string, unknown>>;
    skipConflict?: boolean;
    result?: unknown;
    onConflictResult?: unknown;
    capture?: (values: Record<string, unknown>) => void;
    captureConflict?: (config: Record<string, unknown>) => void;
};

type SelectBehavior = {
    result: Array<Record<string, unknown>>;
    captureFrom?: (arg: unknown) => void;
    captureWhere?: (arg: unknown) => void;
};

type UpdateBehavior = {
    captureSet?: (values: Record<string, unknown>) => void;
    captureWhere?: (arg: unknown) => void;
};

function createDbStub(
    config: {
        insert?: InsertBehavior[];
        select?: SelectBehavior[];
        update?: UpdateBehavior[];
    } = {},
) {
    const insertQueue = [...(config.insert ?? [])];
    const selectQueue = [...(config.select ?? [])];
    const updateQueue = [...(config.update ?? [])];

    const insert = vi.fn(() => {
        const behavior = insertQueue.shift();
        if (!behavior) {
            throw new Error("Unexpected insert invocation");
        }
        const returning = vi.fn().mockResolvedValue(behavior.returning ?? []);
        const onConflictDoUpdate = vi.fn((configArg: unknown) => {
            behavior.captureConflict?.(configArg as Record<string, unknown>);
            if (behavior.returning !== undefined) {
                return { returning };
            }
            return Promise.resolve(behavior.onConflictResult);
        });
        const values = vi.fn((value: Record<string, unknown>) => {
            behavior.capture?.(value);
            if (behavior.skipConflict) {
                return Promise.resolve(behavior.result);
            }
            return {
                onConflictDoUpdate,
                returning,
            };
        });
        return {
            values,
            onConflictDoUpdate,
            returning,
        };
    });

    const select = vi.fn(() => {
        const behavior = selectQueue.shift();
        if (!behavior) {
            throw new Error("Unexpected select invocation");
        }
        const orderBy = vi.fn(async () => behavior.result ?? []);
        const limit = vi.fn(async () => behavior.result ?? []);
        const where = vi.fn((arg: unknown) => {
            behavior.captureWhere?.(arg);
            return { limit, orderBy };
        });
        const from = vi.fn((arg: unknown) => {
            behavior.captureFrom?.(arg);
            return { where, limit, orderBy };
        });
        return { from, where, limit, orderBy };
    });

    const update = vi.fn(() => {
        const behavior = updateQueue.shift();
        if (!behavior) {
            throw new Error("Unexpected update invocation");
        }
        const where = vi.fn((arg: unknown) => {
            behavior.captureWhere?.(arg);
            return Promise.resolve();
        });
        const set = vi.fn((values: Record<string, unknown>) => {
            behavior.captureSet?.(values);
            return { where };
        });
        return { set, where };
    });

    return {
        db: {
            insert,
            select,
            update,
        } as unknown as Database,
        insert,
        select,
        update,
    };
}

describe("creem usage service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejects invalid usage payloads", async () => {
        await expect(
            recordUsage({
                userId: "user-1",
                feature: "",
                amount: 10,
                unit: "tokens",
            }),
        ).rejects.toThrow("Feature is required for usage records");

        await expect(
            recordUsage({
                userId: "user-1",
                feature: "ai.generate",
                amount: 10,
                unit: "",
            }),
        ).rejects.toThrow("Unit is required for usage records");

        await expect(
            recordUsage({
                userId: "user-1",
                feature: "ai.generate",
                amount: 0,
                unit: "tokens",
            }),
        ).rejects.toThrow("Usage amount must be a positive number");
    });

    it("records usage events and consumes credits when requested", async () => {
        vi.useFakeTimers();
        const now = new Date("2024-04-10T08:00:00.000Z");
        vi.setSystemTime(now);

        const events: Record<string, unknown>[] = [];
        const daily: Record<string, unknown>[] = [];
        const updates: Record<string, unknown>[] = [];
        const { db, insert, update } = createDbStub({
            insert: [
                {
                    skipConflict: true,
                    capture: (values) => events.push(values),
                },
                {
                    capture: (values) => daily.push(values),
                    captureConflict: vi.fn(),
                },
            ],
            update: [
                {
                    captureSet: (values) => updates.push(values),
                },
            ],
        });

        vi.mocked(consumeCredits).mockResolvedValue(80);

        const result = await recordUsage(
            {
                userId: "user-2",
                feature: "ai.generate",
                amount: 15,
                unit: "tokens",
                metadata: { model: "gpt" },
                consumeCredits: 20,
            },
            db,
        );

        vi.useRealTimers();

        expect(result).toEqual({
            ok: true,
            date: "2024-04-10",
            newCredits: 80,
        });
        expect(insert).toHaveBeenCalledTimes(2);
        expect(events[0]).toMatchObject({
            userId: "user-2",
            feature: "ai.generate",
            amount: 15,
            unit: "tokens",
            metadata: JSON.stringify({ model: "gpt" }),
        });
        expect(daily[0]).toMatchObject({
            userId: "user-2",
            feature: "ai.generate",
            totalAmount: 15,
            unit: "tokens",
            date: "2024-04-10",
        });
        expect(updates[0]).toMatchObject({
            credits: 80,
        });
        expect(consumeCredits).toHaveBeenCalledWith({
            userId: "user-2",
            amount: 20,
            description: "Usage: ai.generate",
        });
        expect(update).toHaveBeenCalledTimes(1);
    });

    it("skips credit deductions when consumeCredits is not provided", async () => {
        vi.useFakeTimers();
        const now = new Date("2024-04-11T09:30:00.000Z");
        vi.setSystemTime(now);

        const daily: Record<string, unknown>[] = [];
        const { db, insert, update } = createDbStub({
            insert: [
                { skipConflict: true },
                {
                    capture: (values) => daily.push(values),
                    captureConflict: vi.fn(),
                },
            ],
        });

        const result = await recordUsage(
            {
                userId: "user-3",
                feature: "storage.upload",
                amount: 2,
                unit: "files",
            },
            db,
        );

        vi.useRealTimers();

        expect(result).toEqual({
            ok: true,
            date: "2024-04-11",
            newCredits: undefined,
        });
        expect(insert).toHaveBeenCalledTimes(2);
        expect(daily[0]).toMatchObject({
            totalAmount: 2,
            unit: "files",
        });
        expect(consumeCredits).not.toHaveBeenCalled();
        expect(update).not.toHaveBeenCalled();
    });

    it("retrieves daily aggregates for a date range", async () => {
        const rows = [
            {
                date: "2024-04-10",
                feature: "ai.generate",
                totalAmount: 25,
                unit: "tokens",
            },
        ];

        const { db, select } = createDbStub({
            select: [{ result: rows }],
        });

        const result = await getUsageDaily(
            "user-4",
            "2024-04-09",
            "2024-04-12",
            db,
        );

        expect(result).toEqual(rows);
        expect(select).toHaveBeenCalledTimes(1);
    });
});
