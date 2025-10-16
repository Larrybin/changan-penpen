import { eq } from "drizzle-orm";
import { contentPages, coupons, getDb, products } from "@/db";
import { recordAdminAuditLog } from "@/modules/admin/services/system-audit.service";

const now = () => new Date().toISOString();

type CatalogTable = typeof products | typeof coupons | typeof contentPages;

interface AuditConfig {
    targetType: string;
    create: string;
    update: string;
    delete: string;
}

type InferInsert<TTable extends CatalogTable> = TTable["$inferInsert"];
type InferSelect<TTable extends CatalogTable> = TTable["$inferSelect"];

interface CrudConfig<TInput, TTable extends CatalogTable> {
    table: TTable;
    buildCreateValues: (
        input: TInput,
        timestamp: string,
    ) => InferInsert<TTable>;
    buildUpdateValues: (
        input: TInput,
        timestamp: string,
    ) => Partial<InferInsert<TTable>>;
    audit: AuditConfig;
}

function buildCrudService<TInput, TTable extends CatalogTable>({
    table,
    buildCreateValues,
    buildUpdateValues,
    audit,
}: CrudConfig<TInput, TTable>) {
    return {
        async create(input: TInput, adminEmail: string) {
            const db = await getDb();
            const timestamp = now();
            const [inserted] = await db
                .insert(table)
                .values(
                    buildCreateValues(input, timestamp) as InferInsert<TTable>,
                )
                .returning();

            await recordAdminAuditLog({
                adminEmail,
                action: audit.create,
                targetType: audit.targetType,
                targetId: `${inserted.id}`,
                metadata: JSON.stringify(input),
            });

            return inserted as InferSelect<TTable>;
        },
        async update(id: number, input: TInput, adminEmail: string) {
            const db = await getDb();
            const [updated] = await db
                .update(table)
                .set(buildUpdateValues(input, now()) as never)
                .where(eq(table.id, id))
                .returning();

            await recordAdminAuditLog({
                adminEmail,
                action: audit.update,
                targetType: audit.targetType,
                targetId: `${id}`,
                metadata: JSON.stringify(input),
            });

            return updated as InferSelect<TTable>;
        },
        async delete(id: number, adminEmail: string) {
            const db = await getDb();
            await db.delete(table).where(eq(table.id, id));

            await recordAdminAuditLog({
                adminEmail,
                action: audit.delete,
                targetType: audit.targetType,
                targetId: `${id}`,
            });
        },
    };
}

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

const normalizeProductInput = (
    input: ProductInput,
): Omit<typeof products.$inferInsert, "createdAt" | "updatedAt"> => ({
    slug: input.slug,
    name: input.name,
    description: input.description ?? "",
    priceCents: input.priceCents ?? 0,
    currency: input.currency ?? "USD",
    type: input.type ?? "one_time",
    status: input.status ?? "draft",
    metadata: input.metadata ?? "",
});

const productCrud = buildCrudService<ProductInput, typeof products>({
    table: products,
    buildCreateValues: (input, timestamp) =>
        ({
            ...normalizeProductInput(input),
            createdAt: timestamp,
            updatedAt: timestamp,
        }) satisfies typeof products.$inferInsert,
    buildUpdateValues: (input, timestamp) =>
        ({
            ...normalizeProductInput(input),
            updatedAt: timestamp,
        }) satisfies Partial<typeof products.$inferInsert>,
    audit: {
        targetType: "product",
        create: "create_product",
        update: "update_product",
        delete: "delete_product",
    },
});

export const createProduct = productCrud.create;
export const updateProduct = productCrud.update;
export const deleteProduct = productCrud.delete;

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

const normalizeCouponInput = (
    input: CouponInput,
): Omit<
    typeof coupons.$inferInsert,
    "createdAt" | "updatedAt" | "redeemedCount"
> => ({
    code: input.code,
    description: input.description ?? "",
    discountType: input.discountType ?? "percentage",
    discountValue: input.discountValue ?? 0,
    maxRedemptions: input.maxRedemptions ?? null,
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null,
    status: input.status ?? "inactive",
});

const couponCrud = buildCrudService<CouponInput, typeof coupons>({
    table: coupons,
    buildCreateValues: (input, timestamp) =>
        ({
            ...normalizeCouponInput(input),
            redeemedCount: 0,
            createdAt: timestamp,
            updatedAt: timestamp,
        }) satisfies typeof coupons.$inferInsert,
    buildUpdateValues: (input, timestamp) =>
        ({
            ...normalizeCouponInput(input),
            updatedAt: timestamp,
        }) satisfies Partial<typeof coupons.$inferInsert>,
    audit: {
        targetType: "coupon",
        create: "create_coupon",
        update: "update_coupon",
        delete: "delete_coupon",
    },
});

export const createCoupon = couponCrud.create;
export const updateCoupon = couponCrud.update;
export const deleteCoupon = couponCrud.delete;

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

const normalizeContentPageInput = (
    input: ContentPageInput,
): Omit<typeof contentPages.$inferInsert, "createdAt" | "updatedAt"> => ({
    title: input.title,
    slug: input.slug,
    summary: input.summary ?? "",
    language: input.language ?? "en",
    status: input.status ?? "draft",
    content: input.content ?? "",
    publishedAt: input.publishedAt ?? null,
});

const contentPageCrud = buildCrudService<ContentPageInput, typeof contentPages>({
    table: contentPages,
    buildCreateValues: (input, timestamp) =>
        ({
            ...normalizeContentPageInput(input),
            createdAt: timestamp,
            updatedAt: timestamp,
        }) satisfies typeof contentPages.$inferInsert,
    buildUpdateValues: (input, timestamp) =>
        ({
            ...normalizeContentPageInput(input),
            updatedAt: timestamp,
        }) satisfies Partial<typeof contentPages.$inferInsert>,
    audit: {
        targetType: "content_page",
        create: "create_content_page",
        update: "update_content_page",
        delete: "delete_content_page",
    },
});

export const createContentPage = contentPageCrud.create;
export const updateContentPage = contentPageCrud.update;
export const deleteContentPage = contentPageCrud.delete;
