import { eq } from "drizzle-orm";
import { contentPages, coupons, products } from "@/db";
import { getDb } from "@/db";
import { recordAdminAuditLog } from "@/modules/admin/services/system-audit.service";

const now = () => new Date().toISOString();

export async function listProducts() {
    const db = await getDb();
    const rows = await db.select().from(products).orderBy(products.createdAt);
    return rows;
}

export async function getProductById(id: number) {
    const db = await getDb();
    const rows = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);
    return rows[0] ?? null;
}

export interface ProductInput {
    slug: string;
    name: string;
    description?: string;
    priceCents?: number;
    currency?: string;
    type?: string;
    status?: string;
    metadata?: string;
}

export async function createProduct(input: ProductInput, adminEmail: string) {
    const db = await getDb();
    const timestamp = now();
    const [inserted] = await db
        .insert(products)
        .values({
            slug: input.slug,
            name: input.name,
            description: input.description ?? "",
            priceCents: input.priceCents ?? 0,
            currency: input.currency ?? "USD",
            type: input.type ?? "one_time",
            status: input.status ?? "draft",
            metadata: input.metadata ?? "",
            createdAt: timestamp,
            updatedAt: timestamp,
        })
        .returning();

    await recordAdminAuditLog({
        adminEmail,
        action: "create_product",
        targetType: "product",
        targetId: `${inserted.id}`,
        metadata: JSON.stringify(input),
    });

    return inserted;
}

export async function updateProduct(
    id: number,
    input: ProductInput,
    adminEmail: string,
) {
    const db = await getDb();
    const [updated] = await db
        .update(products)
        .set({
            slug: input.slug,
            name: input.name,
            description: input.description ?? "",
            priceCents: input.priceCents ?? 0,
            currency: input.currency ?? "USD",
            type: input.type ?? "one_time",
            status: input.status ?? "draft",
            metadata: input.metadata ?? "",
            updatedAt: now(),
        })
        .where(eq(products.id, id))
        .returning();

    await recordAdminAuditLog({
        adminEmail,
        action: "update_product",
        targetType: "product",
        targetId: `${id}`,
        metadata: JSON.stringify(input),
    });

    return updated;
}

export async function deleteProduct(id: number, adminEmail: string) {
    const db = await getDb();
    await db.delete(products).where(eq(products.id, id));
    await recordAdminAuditLog({
        adminEmail,
        action: "delete_product",
        targetType: "product",
        targetId: `${id}`,
    });
}

export interface CouponInput {
    code: string;
    description?: string;
    discountType?: string;
    discountValue?: number;
    maxRedemptions?: number | null;
    startsAt?: string | null;
    endsAt?: string | null;
    status?: string;
}

export async function listCoupons() {
    const db = await getDb();
    return db.select().from(coupons).orderBy(coupons.createdAt);
}

export async function getCouponById(id: number) {
    const db = await getDb();
    const rows = await db
        .select()
        .from(coupons)
        .where(eq(coupons.id, id))
        .limit(1);
    return rows[0] ?? null;
}

export async function createCoupon(input: CouponInput, adminEmail: string) {
    const db = await getDb();
    const timestamp = now();
    const [inserted] = await db
        .insert(coupons)
        .values({
            code: input.code,
            description: input.description ?? "",
            discountType: input.discountType ?? "percentage",
            discountValue: input.discountValue ?? 0,
            maxRedemptions: input.maxRedemptions ?? null,
            redeemedCount: 0,
            startsAt: input.startsAt ?? null,
            endsAt: input.endsAt ?? null,
            status: input.status ?? "inactive",
            createdAt: timestamp,
            updatedAt: timestamp,
        })
        .returning();

    await recordAdminAuditLog({
        adminEmail,
        action: "create_coupon",
        targetType: "coupon",
        targetId: `${inserted.id}`,
        metadata: JSON.stringify(input),
    });

    return inserted;
}

export async function updateCoupon(
    id: number,
    input: CouponInput,
    adminEmail: string,
) {
    const db = await getDb();
    const [updated] = await db
        .update(coupons)
        .set({
            code: input.code,
            description: input.description ?? "",
            discountType: input.discountType ?? "percentage",
            discountValue: input.discountValue ?? 0,
            maxRedemptions: input.maxRedemptions ?? null,
            startsAt: input.startsAt ?? null,
            endsAt: input.endsAt ?? null,
            status: input.status ?? "inactive",
            updatedAt: now(),
        })
        .where(eq(coupons.id, id))
        .returning();

    await recordAdminAuditLog({
        adminEmail,
        action: "update_coupon",
        targetType: "coupon",
        targetId: `${id}`,
        metadata: JSON.stringify(input),
    });

    return updated;
}

export async function deleteCoupon(id: number, adminEmail: string) {
    const db = await getDb();
    await db.delete(coupons).where(eq(coupons.id, id));
    await recordAdminAuditLog({
        adminEmail,
        action: "delete_coupon",
        targetType: "coupon",
        targetId: `${id}`,
    });
}

export interface ContentPageInput {
    title: string;
    slug: string;
    summary?: string;
    language?: string;
    status?: string;
    content?: string;
    publishedAt?: string | null;
}

export async function listContentPages() {
    const db = await getDb();
    return db.select().from(contentPages).orderBy(contentPages.createdAt);
}

export async function getContentPageById(id: number) {
    const db = await getDb();
    const rows = await db
        .select()
        .from(contentPages)
        .where(eq(contentPages.id, id))
        .limit(1);
    return rows[0] ?? null;
}

export async function createContentPage(
    input: ContentPageInput,
    adminEmail: string,
) {
    const db = await getDb();
    const timestamp = now();
    const [inserted] = await db
        .insert(contentPages)
        .values({
            title: input.title,
            slug: input.slug,
            summary: input.summary ?? "",
            language: input.language ?? "en",
            status: input.status ?? "draft",
            content: input.content ?? "",
            publishedAt: input.publishedAt ?? null,
            createdAt: timestamp,
            updatedAt: timestamp,
        })
        .returning();

    await recordAdminAuditLog({
        adminEmail,
        action: "create_content_page",
        targetType: "content_page",
        targetId: `${inserted.id}`,
        metadata: JSON.stringify(input),
    });

    return inserted;
}

export async function updateContentPage(
    id: number,
    input: ContentPageInput,
    adminEmail: string,
) {
    const db = await getDb();
    const [updated] = await db
        .update(contentPages)
        .set({
            title: input.title,
            slug: input.slug,
            summary: input.summary ?? "",
            language: input.language ?? "en",
            status: input.status ?? "draft",
            content: input.content ?? "",
            publishedAt: input.publishedAt ?? null,
            updatedAt: now(),
        })
        .where(eq(contentPages.id, id))
        .returning();

    await recordAdminAuditLog({
        adminEmail,
        action: "update_content_page",
        targetType: "content_page",
        targetId: `${id}`,
        metadata: JSON.stringify(input),
    });

    return updated;
}

export async function deleteContentPage(id: number, adminEmail: string) {
    const db = await getDb();
    await db.delete(contentPages).where(eq(contentPages.id, id));
    await recordAdminAuditLog({
        adminEmail,
        action: "delete_content_page",
        targetType: "content_page",
        targetId: `${id}`,
    });
}
