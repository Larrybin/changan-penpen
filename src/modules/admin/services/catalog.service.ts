import { eq, type SQL } from "drizzle-orm";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
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
    list?: {
        defaultOrderBy?: (table: TTable) => Array<SQL | AnySQLiteColumn>;
        views?: Record<string, readonly (keyof InferSelect<TTable>)[]>;
        requiredFields?: readonly (keyof InferSelect<TTable>)[];
    };
}

interface ListAllOptions<TTable extends CatalogTable> {
    fields?: readonly (keyof InferSelect<TTable>)[] | null;
    view?: string | null;
}

function isSelectableColumn(value: unknown): value is AnySQLiteColumn {
    return Boolean(
        value &&
            typeof value === "object" &&
            "name" in (value as Record<string, unknown>),
    );
}

function buildCrudService<TInput, TTable extends CatalogTable>({
    table,
    buildCreateValues,
    buildUpdateValues,
    audit,
    list,
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
        async listAll(options?: ListAllOptions<TTable>) {
            const db = await getDb();
            const orderByExpressions = list?.defaultOrderBy?.(table) ?? [];
            const requestedFields = new Set<string>();
            const normalizedView = options?.view?.trim().toLowerCase();
            const viewFields =
                normalizedView && list?.views
                    ? list.views[normalizedView] ?? null
                    : null;

            const mandatory = list?.requiredFields ?? [
                "id" as keyof InferSelect<TTable>,
            ];
            mandatory.forEach((field) => requestedFields.add(String(field)));
            viewFields?.forEach((field) => requestedFields.add(String(field)));
            options?.fields?.forEach((field) => {
                if (field) {
                    requestedFields.add(String(field));
                }
            });

            const selectionEntries: Array<[string, AnySQLiteColumn]> = [];
            requestedFields.forEach((field) => {
                const candidate = table[field as keyof typeof table];
                if (isSelectableColumn(candidate)) {
                    selectionEntries.push([field, candidate as AnySQLiteColumn]);
                }
            });

            const selection = selectionEntries.length > 0
                ? (Object.fromEntries(selectionEntries) as Record<
                      string,
                      AnySQLiteColumn
                  >)
                : null;

            const baseQuery = selection
                ? db.select(selection).from(table)
                : db.select().from(table);
            const rows = await (orderByExpressions.length > 0
                ? baseQuery.orderBy(...orderByExpressions)
                : baseQuery);
            return rows as InferSelect<TTable>[];
        },
        async getById(id: number) {
            const db = await getDb();
            const rows = await db
                .select()
                .from(table)
                .where(eq(table.id, id))
                .limit(1);
            return (rows[0] ?? null) as InferSelect<TTable> | null;
        },
    };
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

const productListViews: Record<
    string,
    readonly (keyof typeof products.$inferSelect)[]
> = {
    summary: [
        "id",
        "name",
        "slug",
        "priceCents",
        "currency",
        "status",
    ],
};

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
    list: {
        defaultOrderBy: (table) => [table.createdAt],
        views: productListViews,
        requiredFields: ["id"],
    },
});

export const createProduct = productCrud.create;
export const updateProduct = productCrud.update;
export const deleteProduct = productCrud.delete;
export function listProducts(
    options?: ListAllOptions<typeof products>,
) {
    return productCrud.listAll(options);
}
export const getProductById = productCrud.getById;

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
    list: {
        defaultOrderBy: (table) => [table.createdAt],
    },
});

export const createCoupon = couponCrud.create;
export const updateCoupon = couponCrud.update;
export const deleteCoupon = couponCrud.delete;
export const listCoupons = couponCrud.listAll;
export const getCouponById = couponCrud.getById;

export interface ContentPageInput {
    title: string;
    slug: string;
    summary?: string;
    language?: string;
    status?: string;
    content?: string;
    publishedAt?: string | null;
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

const contentPageCrud = buildCrudService<ContentPageInput, typeof contentPages>(
    {
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
        list: {
            defaultOrderBy: (table) => [table.createdAt],
        },
    },
);

export const createContentPage = contentPageCrud.create;
export const updateContentPage = contentPageCrud.update;
export const deleteContentPage = contentPageCrud.delete;
export const listContentPages = contentPageCrud.listAll;
export const getContentPageById = contentPageCrud.getById;
