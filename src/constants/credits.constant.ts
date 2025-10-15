export const CREDIT_PACKAGES = [
    { id: "starter", credits: 500, priceCents: 5000 },
    { id: "growth", credits: 1200, priceCents: 10000 },
    { id: "scale", credits: 3000, priceCents: 20000 },
] as const;

export const FREE_MONTHLY_CREDITS = Math.floor(
    CREDIT_PACKAGES[0].credits * 0.1,
);
