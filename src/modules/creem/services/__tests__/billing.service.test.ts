import { beforeEach, describe, expect, it, vi } from "vitest";
import { CREDIT_TRANSACTION_TYPE, type getDb } from "@/db";
import { addCredits } from "@/modules/billing/services/credits.service";
import {
    addCreditsToCustomer,
    createOrUpdateCustomer,
    createOrUpdateSubscription,
    getCustomerIdByUserId,
} from "../billing.service";

vi.mock("@/modules/billing/services/credits.service", () => ({
    addCredits: vi.fn(),
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

describe("creem billing service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("upserts customers using Creem identifiers", async () => {
        const captured: Record<string, unknown>[] = [];
        const { db, insert } = createDbStub({
            insert: [
                {
                    returning: [{ id: 42 }],
                    capture: (values) => captured.push(values),
                },
            ],
        });

        const id = await createOrUpdateCustomer(
            {
                id: "creem-1",
                email: "customer@example.com",
                name: "Creem Customer",
                country: "US",
            } as never,
            "user-1",
            db,
        );

        expect(id).toBe(42);
        expect(insert).toHaveBeenCalledTimes(1);
        expect(captured[0]).toMatchObject({
            creemCustomerId: "creem-1",
            userId: "user-1",
        });
    });

    it("falls back to user-based upsert when Creem match returns nothing", async () => {
        const { db, insert } = createDbStub({
            insert: [{ returning: [] }, { returning: [{ id: 87 }] }],
        });

        const id = await createOrUpdateCustomer(
            {
                id: "creem-2",
                email: "user@example.com",
                name: "Existing",
                country: "CA",
            } as never,
            "user-2",
            db,
        );

        expect(id).toBe(87);
        expect(insert).toHaveBeenCalledTimes(2);
    });

    it("performs manual lookup when upserts return empty results", async () => {
        const { db } = createDbStub({
            insert: [{ returning: [] }, { returning: [] }],
            select: [{ result: [{ id: 11 }] }],
        });

        const id = await createOrUpdateCustomer(
            {
                id: "creem-3",
                email: "lookup@example.com",
                name: "Lookup",
                country: "GB",
            } as never,
            "user-3",
            db,
        );

        expect(id).toBe(11);
    });

    it("throws when no customer record can be resolved", async () => {
        const { db } = createDbStub({
            insert: [{ returning: [] }, { returning: [] }],
            select: [{ result: [] }],
        });

        await expect(
            createOrUpdateCustomer(
                {
                    id: "creem-missing",
                    email: "missing@example.com",
                    name: "Missing",
                    country: "FR",
                } as never,
                "user-missing",
                db,
            ),
        ).rejects.toThrow("Failed to create or update customer record");
    });

    it("updates subscriptions when an existing record is found", async () => {
        const capturedUpdate: Record<string, unknown>[] = [];
        const { db, select, update } = createDbStub({
            select: [{ result: [{ id: 99 }] }],
            update: [
                {
                    captureSet: (values) => capturedUpdate.push(values),
                },
            ],
        });

        const resultId = await createOrUpdateSubscription(
            {
                id: "sub-1",
                product: { id: "product-7" },
                status: "active",
                current_period_start_date: "2024-01-01T00:00:00.000Z",
                current_period_end_date: "2024-02-01T00:00:00.000Z",
                canceled_at: null,
                metadata: { tier: "gold" },
            } as never,
            7,
            db,
        );

        expect(resultId).toBe(99);
        expect(select).toHaveBeenCalledTimes(1);
        expect(update).toHaveBeenCalledTimes(1);
        expect(capturedUpdate[0]).toMatchObject({
            customerId: 7,
            creemProductId: "product-7",
            status: "active",
        });
    });

    it("inserts subscriptions when no existing record matches", async () => {
        const captured: Record<string, unknown>[] = [];
        const { db, select, insert } = createDbStub({
            select: [{ result: [] }, { result: [{ id: 45 }] }],
            insert: [
                {
                    skipConflict: true,
                    capture: (values) => captured.push(values),
                },
            ],
        });

        const newId = await createOrUpdateSubscription(
            {
                id: "sub-new",
                product: "product-9",
                status: "trialing",
                current_period_start_date: "2024-05-01T00:00:00.000Z",
                current_period_end_date: "2024-06-01T00:00:00.000Z",
            } as never,
            12,
            db,
        );

        expect(newId).toBe(45);
        expect(select).toHaveBeenCalledTimes(2);
        expect(insert).toHaveBeenCalledTimes(1);
        expect(captured[0]).toMatchObject({
            customerId: 12,
            creemSubscriptionId: "sub-new",
        });
    });

    it("returns current balance when a duplicate credit order is detected", async () => {
        const { db, select, update, insert } = createDbStub({
            select: [{ result: [{ id: 1 }] }, { result: [{ credits: 125 }] }],
            update: [],
            insert: [],
        });

        const total = await addCreditsToCustomer(
            55,
            25,
            "order-1",
            "Repeat",
            db,
        );

        expect(total).toBe(125);
        expect(select).toHaveBeenCalledTimes(2);
        expect(update).not.toHaveBeenCalled();
        expect(insert).not.toHaveBeenCalled();
        expect(addCredits).not.toHaveBeenCalled();
    });

    it("updates balances, ledger, and history for new credit orders", async () => {
        const history: Record<string, unknown>[] = [];
        const updates: Record<string, unknown>[] = [];
        const { db, select, update, insert } = createDbStub({
            select: [
                { result: [] },
                { result: [{ credits: 50, userId: "user-10" }] },
            ],
            update: [
                {
                    captureSet: (values) => updates.push(values),
                },
            ],
            insert: [
                {
                    skipConflict: true,
                    capture: (values) => history.push(values),
                },
            ],
        });

        const total = await addCreditsToCustomer(
            88,
            30,
            "order-2",
            undefined,
            db,
        );

        expect(total).toBe(80);
        expect(select).toHaveBeenCalledTimes(2);
        expect(update).toHaveBeenCalledTimes(1);
        expect(insert).toHaveBeenCalledTimes(1);
        expect(updates[0]).toMatchObject({
            credits: 80,
        });
        expect(history[0]).toMatchObject({
            customerId: 88,
            amount: 30,
            type: "add",
            description: "Credits purchase",
            creemOrderId: "order-2",
        });
        expect(addCredits).toHaveBeenCalledWith({
            userId: "user-10",
            amount: 30,
            description: "Credits purchase",
            type: CREDIT_TRANSACTION_TYPE.PURCHASE,
            paymentIntentId: "order-2",
        });
    });

    it("throws when attempting to add credits for a missing customer", async () => {
        const { db } = createDbStub({
            select: [{ result: [] }, { result: [] }],
            update: [],
            insert: [],
        });

        await expect(
            addCreditsToCustomer(5, 10, undefined, undefined, db),
        ).rejects.toThrow("Customer not found");
    });

    it("looks up customer identifiers by user id", async () => {
        const { db } = createDbStub({
            select: [{ result: [{ id: 77 }] }],
        });

        await expect(getCustomerIdByUserId("user-77", db)).resolves.toBe(77);
    });

    it("returns null when a user has no associated customer record", async () => {
        const { db } = createDbStub({
            select: [{ result: [] }],
        });

        await expect(
            getCustomerIdByUserId("user-none", db),
        ).resolves.toBeNull();
    });
});
