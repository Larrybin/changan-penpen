import { eq } from "drizzle-orm";
import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import * as dbModule from "@/db";
import {
    creditsHistory,
    customers,
    subscriptions,
} from "@/modules/creem/schemas/billing.schema";
import type { TestDbContext } from "../../../../../tests/fixtures/db";
import { createTestDb } from "../../../../../tests/fixtures/db";
import {
    addCreditsToCustomer,
    createOrUpdateCustomer,
    createOrUpdateSubscription,
    getCustomerIdByUserId,
} from "../billing.service";

interface TestContext extends TestDbContext {
    userId: string;
}

describe("creem billing service", () => {
    let ctx: TestContext;
    let getDbSpy: ReturnType<typeof vi.spyOn> | undefined;
    let shouldSkip = false;

    const skipIfUnavailable = () => shouldSkip;

    beforeAll(async () => {
        try {
            const baseCtx = await createTestDb();
            ctx = { ...baseCtx, userId: "" } as TestContext;
            getDbSpy = vi
                .spyOn(dbModule, "getDb")
                .mockImplementation(
                    async () =>
                        ctx.db as unknown as Awaited<
                            ReturnType<typeof dbModule.getDb>
                        >,
                );
        } catch (error) {
            shouldSkip = true;
            console.warn(
                "Skipping creem billing service tests because better-sqlite3 bindings are unavailable:",
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
            id: "billing-user",
            email: "billing-user@example.com",
            name: "Billing User",
        });
        ctx.userId = user.id;
        getDbSpy?.mockClear();
        getDbSpy?.mockImplementation(
            async () =>
                ctx.db as unknown as Awaited<ReturnType<typeof dbModule.getDb>>,
        );
    });

    afterAll(() => {
        if (getDbSpy) {
            getDbSpy.mockRestore();
        }
        if (!shouldSkip) {
            ctx.cleanup();
        }
    });

    it("creates or updates customer records based on Creem payload", async () => {
        if (skipIfUnavailable()) {
            return;
        }

        const customerPayload = {
            id: "creem-customer-1",
            email: "customer@example.com",
            name: "Creem Customer",
            country: "US",
        } as const;

        const firstId = await createOrUpdateCustomer(
            customerPayload,
            ctx.userId,
        );
        expect(firstId).toBeGreaterThan(0);

        const created = ctx.db
            .select()
            .from(customers)
            .where(eq(customers.id, firstId))
            .get();
        expect(created?.email).toBe("customer@example.com");

        const secondId = await createOrUpdateCustomer(
            { ...customerPayload, email: "updated@example.com" },
            ctx.userId,
        );
        expect(secondId).toBe(firstId);

        const updated = ctx.db
            .select()
            .from(customers)
            .where(eq(customers.id, firstId))
            .get();
        expect(updated?.email).toBe("updated@example.com");
    });

    it("creates or updates subscriptions for customers", async () => {
        if (skipIfUnavailable()) {
            return;
        }

        const customerId = await createOrUpdateCustomer(
            {
                id: "creem-sub-customer",
                email: "sub@example.com",
            },
            ctx.userId,
        );

        const subscriptionPayload = {
            id: "sub-1",
            customer: "creem-sub-customer",
            product: { id: "product-1" },
            status: "active",
            current_period_start_date: "2024-01-01T00:00:00.000Z",
            current_period_end_date: "2024-02-01T00:00:00.000Z",
            metadata: { tier: "pro" },
        } as const;

        const subscriptionId = await createOrUpdateSubscription(
            subscriptionPayload,
            customerId,
        );
        expect(subscriptionId).toBeGreaterThan(0);

        const created = ctx.db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.id, subscriptionId))
            .get();
        expect(created?.status).toBe("active");
        expect(created?.creemProductId).toBe("product-1");

        const updatedId = await createOrUpdateSubscription(
            { ...subscriptionPayload, status: "past_due" },
            customerId,
        );
        expect(updatedId).toBe(subscriptionId);

        const updated = ctx.db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.id, subscriptionId))
            .get();
        expect(updated?.status).toBe("past_due");
    });

    it("adds credits and avoids double counting duplicate orders", async () => {
        if (skipIfUnavailable()) {
            return;
        }

        const customerId = await createOrUpdateCustomer(
            {
                id: "creem-credit-customer",
                email: "credit@example.com",
            },
            ctx.userId,
        );

        const firstBalance = await addCreditsToCustomer(
            customerId,
            100,
            "order-1",
            "Initial purchase",
        );
        expect(firstBalance).toBe(100);

        const duplicate = await addCreditsToCustomer(customerId, 50, "order-1");
        expect(duplicate).toBe(100);

        const secondBalance = await addCreditsToCustomer(
            customerId,
            25,
            "order-2",
            "Top up",
        );
        expect(secondBalance).toBe(125);

        const history = ctx.db
            .select()
            .from(creditsHistory)
            .where(eq(creditsHistory.customerId, customerId))
            .all();
        expect(history).toHaveLength(2);
        expect(history.map((item) => item.creemOrderId)).toEqual([
            "order-1",
            "order-2",
        ]);
    });

    it("throws when adding credits to a missing customer", async () => {
        if (skipIfUnavailable()) {
            return;
        }

        await expect(addCreditsToCustomer(9999, 50)).rejects.toThrow(
            "Customer not found",
        );
    });

    it("fetches customer id by user id", async () => {
        if (skipIfUnavailable()) {
            return;
        }

        const customerId = await createOrUpdateCustomer(
            {
                id: "creem-customer-lookup",
                email: "lookup@example.com",
            },
            ctx.userId,
        );

        const found = await getCustomerIdByUserId(ctx.userId);
        expect(found).toBe(customerId);

        const missing = await getCustomerIdByUserId("non-existent");
        expect(missing).toBeNull();
    });
});
