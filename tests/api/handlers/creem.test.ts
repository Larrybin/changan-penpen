/**
 * Creem支付API测试
 * 测试支付和订阅相关的API端点
 */

import { describe, it, expect, beforeEach } from "vitest";
import { server } from "../../../vitest.setup";
import { rest } from "msw";
import { apiRequest, authenticatedApiRequest, expectSuccessResponse, expectErrorResponse } from "../setup";

describe("Creem支付API", () => {
    const MOCK_PAYMENT_SECRET = "pi_test_1234567890_secret_test123"; // gitleaks:allow mock stripe client secret

    const mockPaymentIntent = {
        id: "pi_test_1234567890",
        amount: 9999, // 99.99 USD in cents
        currency: "usd",
        status: "requires_payment_method",
        client_secret: MOCK_PAYMENT_SECRET,
        created: Math.floor(Date.now() / 1000),
    };

    const mockSubscription = {
        id: "sub_test_1234567890",
        status: "active",
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
        customer: "cus_test_1234567890",
        items: [
            {
                id: "si_test_1234567890",
                price: {
                    id: "price_test_1234567890",
                    unit_amount: 9999,
                    currency: "usd",
                    recurring: {
                        interval: "month",
                        interval_count: 1,
                    },
                },
                quantity: 1,
            },
        ],
    };

    beforeEach(() => {
        // 设置支付API mock
        server.use(
            rest.post("/api/creem/create-payment-intent", (req, res, ctx) => {
                const authHeader = req.headers.get("authorization");
                if (!authHeader) {
                    return res(
                        ctx.status(401),
                        ctx.json({ error: "Unauthorized" })
                    );
                }

                const { amount, currency = "usd" } = req.body as any;

                if (!amount || amount <= 0) {
                    return res(
                        ctx.status(400),
                        ctx.json({ error: "Invalid amount" })
                    );
                }

                const paymentIntent = {
                    ...mockPaymentIntent,
                    amount: amount * 100, // Convert to cents
                    currency: currency.toLowerCase(),
                };

                return res(
                    ctx.status(200),
                    ctx.json({
                        success: true,
                        payment_intent: paymentIntent,
                    })
                );
            }),

            rest.post("/api/creem/create-subscription", (req, res, ctx) => {
                const authHeader = req.headers.get("authorization");
                if (!authHeader) {
                    return res(
                        ctx.status(401),
                        ctx.json({ error: "Unauthorized" })
                    );
                }

                const { price_id, payment_method_id } = req.body as any;

                if (!price_id || !payment_method_id) {
                    return res(
                        ctx.status(400),
                        ctx.json({ error: "Missing required fields" })
                    );
                }

                return res(
                    ctx.status(200),
                    ctx.json({
                        success: true,
                        subscription: mockSubscription,
                    })
                );
            }),

            rest.get("/api/creem/subscription/:id", (req, res, ctx) => {
                const authHeader = req.headers.get("authorization");
                if (!authHeader) {
                    return res(
                        ctx.status(401),
                        ctx.json({ error: "Unauthorized" })
                    );
                }

                const subscriptionId = req.params.id as string;

                if (subscriptionId === "not_found") {
                    return res(
                        ctx.status(404),
                        ctx.json({ error: "Subscription not found" })
                    );
                }

                return res(
                    ctx.status(200),
                    ctx.json({
                        success: true,
                        subscription: mockSubscription,
                    })
                );
            }),

            rest.post("/api/creem/cancel-subscription/:id", (req, res, ctx) => {
                const authHeader = req.headers.get("authorization");
                if (!authHeader) {
                    return res(
                        ctx.status(401),
                        ctx.json({ error: "Unauthorized" })
                    );
                }

                const subscriptionId = req.params.id as string;
                const { immediate = false } = req.body as any;

                if (subscriptionId === "not_found") {
                    return res(
                        ctx.status(404),
                        ctx.json({ error: "Subscription not found" })
                    );
                }

                const canceledSubscription = {
                    ...mockSubscription,
                    id: subscriptionId,
                    status: immediate ? "canceled" : "active",
                    cancel_at_period_end: !immediate,
                };

                return res(
                    ctx.status(200),
                    ctx.json({
                        success: true,
                        subscription: canceledSubscription,
                    })
                );
            }),

            rest.get("/api/creem/payment-methods", (req, res, ctx) => {
                const authHeader = req.headers.get("authorization");
                if (!authHeader) {
                    return res(
                        ctx.status(401),
                        ctx.json({ error: "Unauthorized" })
                    );
                }

                const mockPaymentMethods = [
                    {
                        id: "pm_test_1234567890",
                        type: "card",
                        card: {
                            brand: "visa",
                            last4: "4242",
                            exp_month: 12,
                            exp_year: 2025,
                        },
                        created: Math.floor(Date.now() / 1000),
                    },
                ];

                return res(
                    ctx.status(200),
                    ctx.json({
                        success: true,
                        payment_methods: mockPaymentMethods,
                    })
                );
            }),

            rest.post("/api/creem/webhook", (req, res, ctx) => {
                const signature = req.headers.get("stripe-signature");
                if (!signature) {
                    return res(
                        ctx.status(400),
                        ctx.json({ error: "Missing signature" })
                    );
                }

                // 在实际应用中，这里会验证webhook签名
                const event = req.body as any;

                if (!event.type) {
                    return res(
                        ctx.status(400),
                        ctx.json({ error: "Invalid event" })
                    );
                }

                return res(
                    ctx.status(200),
                    ctx.json({
                        received: true,
                        type: event.type,
                    })
                );
            })
        );
    });

    describe("POST /api/creem/create-payment-intent", () => {
        it("应该创建支付意图", async () => {
            const paymentData = {
                amount: 99.99,
                currency: "USD",
            };

            const response = await authenticatedApiRequest("/api/creem/create-payment-intent", {
                method: "POST",
                body: JSON.stringify(paymentData),
            });

            expectSuccessResponse(response, 200);
            expect(response.data).toHaveProperty("success", true);
            expect(response.data).toHaveProperty("payment_intent");
            expect(response.data.payment_intent).toHaveProperty("id");
            expect(response.data.payment_intent).toHaveProperty("client_secret");
            expect(response.data.payment_intent.amount).toBe(9999); // 99.99 USD in cents
            expect(response.data.payment_intent.currency).toBe("usd");
        });

        it("应该拒绝无效金额", async () => {
            const invalidData = {
                amount: -10,
                currency: "USD",
            };

            const response = await authenticatedApiRequest("/api/creem/create-payment-intent", {
                method: "POST",
                body: JSON.stringify(invalidData),
            });

            expectErrorResponse(response, 400);
        });

        it("应该拒绝未认证的请求", async () => {
            const paymentData = {
                amount: 99.99,
                currency: "USD",
            };

            const response = await apiRequest("/api/creem/create-payment-intent", {
                method: "POST",
                body: JSON.stringify(paymentData),
            });

            expectErrorResponse(response, 401);
        });
    });

    describe("POST /api/creem/create-subscription", () => {
        it("应该创建订阅", async () => {
            const subscriptionData = {
                price_id: "price_test_1234567890",
                payment_method_id: "pm_test_1234567890",
            };

            const response = await authenticatedApiRequest("/api/creem/create-subscription", {
                method: "POST",
                body: JSON.stringify(subscriptionData),
            });

            expectSuccessResponse(response, 200);
            expect(response.data).toHaveProperty("success", true);
            expect(response.data).toHaveProperty("subscription");
            expect(response.data.subscription).toHaveProperty("id");
            expect(response.data.subscription).toHaveProperty("status", "active");
        });

        it("应该拒绝缺少必需字段的请求", async () => {
            const incompleteData = {
                price_id: "price_test_1234567890",
                // 缺少 payment_method_id
            };

            const response = await authenticatedApiRequest("/api/creem/create-subscription", {
                method: "POST",
                body: JSON.stringify(incompleteData),
            });

            expectErrorResponse(response, 400);
        });
    });

    describe("GET /api/creem/subscription/:id", () => {
        it("应该返回订阅信息", async () => {
            const response = await authenticatedApiRequest("/api/creem/subscription/sub_test_1234567890", {
                method: "GET",
            });

            expectSuccessResponse(response, 200);
            expect(response.data).toHaveProperty("success", true);
            expect(response.data).toHaveProperty("subscription");
            expect(response.data.subscription).toHaveProperty("id");
            expect(response.data.subscription).toHaveProperty("status");
        });

        it("应该返回404当订阅不存在", async () => {
            const response = await authenticatedApiRequest("/api/creem/subscription/not_found", {
                method: "GET",
            });

            expectErrorResponse(response, 404);
        });

        it("应该拒绝未认证的请求", async () => {
            const response = await apiRequest("/api/creem/subscription/sub_test_1234567890", {
                method: "GET",
            });

            expectErrorResponse(response, 401);
        });
    });

    describe("POST /api/creem/cancel-subscription/:id", () => {
        it("应该取消订阅", async () => {
            const cancelData = {
                immediate: false,
            };

            const response = await authenticatedApiRequest("/api/creem/cancel-subscription/sub_test_1234567890", {
                method: "POST",
                body: JSON.stringify(cancelData),
            });

            expectSuccessResponse(response, 200);
            expect(response.data).toHaveProperty("success", true);
            expect(response.data.subscription).toHaveProperty("cancel_at_period_end", true);
        });

        it("应该立即取消订阅", async () => {
            const cancelData = {
                immediate: true,
            };

            const response = await authenticatedApiRequest("/api/creem/cancel-subscription/sub_test_1234567890", {
                method: "POST",
                body: JSON.stringify(cancelData),
            });

            expectSuccessResponse(response, 200);
            expect(response.data.subscription).toHaveProperty("status", "canceled");
        });
    });

    describe("GET /api/creem/payment-methods", () => {
        it("应该返回支付方式列表", async () => {
            const response = await authenticatedApiRequest("/api/creem/payment-methods", {
                method: "GET",
            });

            expectSuccessResponse(response, 200);
            expect(response.data).toHaveProperty("success", true);
            expect(response.data).toHaveProperty("payment_methods");
            expect(Array.isArray(response.data.payment_methods)).toBe(true);
        });

        it("应该拒绝未认证的请求", async () => {
            const response = await apiRequest("/api/creem/payment-methods", {
                method: "GET",
            });

            expectErrorResponse(response, 401);
        });
    });

    describe("POST /api/creem/webhook", () => {
        it("应该处理webhook事件", async () => {
            const webhookEvent = {
                type: "payment_intent.succeeded",
                data: {
                    object: {
                        id: "pi_test_1234567890",
                        status: "succeeded",
                    },
                },
            };

            const response = await apiRequest("/api/creem/webhook", {
                method: "POST",
                headers: {
                    "stripe-signature": "test-signature",
                },
                body: JSON.stringify(webhookEvent),
            });

            expectSuccessResponse(response, 200);
            expect(response.data).toHaveProperty("received", true);
            expect(response.data).toHaveProperty("type", webhookEvent.type);
        });

        it("应该拒绝缺少签名的请求", async () => {
            const webhookEvent = {
                type: "payment_intent.succeeded",
            };

            const response = await apiRequest("/api/creem/webhook", {
                method: "POST",
                body: JSON.stringify(webhookEvent),
            });

            expectErrorResponse(response, 400);
        });

        it("应该拒绝无效事件", async () => {
            const invalidEvent = {
                // 缺少type字段
            };

            const response = await apiRequest("/api/creem/webhook", {
                method: "POST",
                headers: {
                    "stripe-signature": "test-signature",
                },
                body: JSON.stringify(invalidEvent),
            });

            expectErrorResponse(response, 400);
        });
    });
});