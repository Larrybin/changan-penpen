import type { SQL } from "drizzle-orm";
import { and, or, sql } from "drizzle-orm";

import { getDb, user } from "@/db";
import {
    normalizePagination,
    type PaginationDefaults,
    type PaginationOptions,
} from "@/modules/admin-shared/utils/pagination";

export type WhereExpression = SQL | undefined;
export type BooleanOperator = "and" | "or";

function composeWhereClause(
    expressions: WhereExpression[] | undefined,
    operator: BooleanOperator,
): SQL | undefined {
    if (!expressions?.length) {
        return undefined;
    }

    const defined = expressions.filter(Boolean) as SQL[];
    if (defined.length === 0) {
        return undefined;
    }
    if (defined.length === 1) {
        return defined[0];
    }

    return operator === "or" ? or(...defined) : and(...defined);
}

export interface PaginatedQueryContext {
    limit: number;
    offset: number;
    where?: SQL;
}

export interface RunPaginatedQueryOptions<TRow> extends PaginationOptions {
    defaults?: PaginationDefaults;
    filters?: WhereExpression[];
    operator?: BooleanOperator;
    fetchRows: (context: PaginatedQueryContext) => Promise<TRow[]>;
    fetchTotal: (where?: SQL) => Promise<number>;
}

export interface PaginatedQueryResult<TRow> {
    page: number;
    perPage: number;
    rows: TRow[];
    total: number;
    where?: SQL;
}

export async function runPaginatedQuery<TRow>(
    options: RunPaginatedQueryOptions<TRow>,
): Promise<PaginatedQueryResult<TRow>> {
    const { page, perPage } = normalizePagination(
        { page: options.page, perPage: options.perPage },
        options.defaults,
    );
    const whereClause = composeWhereClause(
        options.filters,
        options.operator ?? "and",
    );
    const offset = (page - 1) * perPage;

    const [rows, total] = await Promise.all([
        options.fetchRows({ limit: perPage, offset, where: whereClause }),
        options.fetchTotal(whereClause),
    ]);

    return { page, perPage, rows, total, where: whereClause };
}

export type TenantPaginationOptions = PaginationOptions & {
    tenantId?: string;
};

export type FilterableBuilder<TResult> = PromiseLike<TResult>;

type DbClient = Awaited<ReturnType<typeof getDb>>;

export interface UserDirectoryQueryOptions<TRow>
    extends PaginationOptions,
        Pick<RunPaginatedQueryOptions<TRow>, "filters" | "operator"> {
    db: DbClient;
    defaults?: PaginationDefaults;
    buildBaseQuery: (
        db: DbClient,
        pagination: { limit: number; offset: number; where?: SQL },
    ) => Promise<TRow[]>;
}

export async function runUserDirectoryQuery<TRow>(
    options: UserDirectoryQueryOptions<TRow>,
): Promise<PaginatedQueryResult<TRow>> {
    const { db, buildBaseQuery, defaults, filters, operator, page, perPage } =
        options;

    return await runPaginatedQuery({
        page,
        perPage,
        defaults,
        filters,
        operator,
        fetchRows: async ({ limit, offset, where }) =>
            buildBaseQuery(db, { limit, offset, where }),
        fetchTotal: async (where) => {
            const totalQuery = db
                .select({ count: sql<number>`count(*)` })
                .from(user);
            const totalRows = where
                ? await totalQuery.where(where)
                : await totalQuery;
            return totalRows[0]?.count ?? 0;
        },
    });
}

interface PaginatedQueryFactoryOptions<TData> {
    buildBaseQuery: (
        db: Awaited<ReturnType<typeof getDb>>,
        pagination: { limit: number; offset: number },
    ) => FilterableBuilder<TData[]>;
    buildTotalQuery: (
        db: Awaited<ReturnType<typeof getDb>>,
    ) => FilterableBuilder<Array<{ count: number }>>;
    applyTenantFilter?: <TResult>(
        builder: FilterableBuilder<TResult>,
        tenantId: string,
    ) => FilterableBuilder<TResult>;
}

export function createPaginatedQuery<
    TOptions extends TenantPaginationOptions,
    TData,
>(config: PaginatedQueryFactoryOptions<TData>) {
    return async function run(options: TOptions = {} as TOptions) {
        const db = await getDb();
        const { page, perPage } = normalizePagination(options);

        const applyTenantFilter = <TResult>(
            builder: FilterableBuilder<TResult>,
        ): FilterableBuilder<TResult> => {
            if (!options.tenantId || !config.applyTenantFilter) {
                return builder;
            }

            return config.applyTenantFilter(builder, options.tenantId);
        };

        const { rows, total } = await runPaginatedQuery({
            page,
            perPage,
            fetchRows: async ({ limit, offset }) => {
                const query = config.buildBaseQuery(db, { limit, offset });
                const filtered = applyTenantFilter(query);
                return await filtered;
            },
            fetchTotal: async () => {
                const query = config.buildTotalQuery(db);
                const filtered = applyTenantFilter(query);
                const result = (await filtered) as Array<{ count: number }>;
                return result[0]?.count ?? 0;
            },
        });

        return {
            data: rows,
            total,
        };
    };
}

interface SimplePaginatedListConfig<TRow> {
    buildBaseQuery: (
        db: DbClient,
        pagination: { limit: number; offset: number },
    ) => Promise<TRow[]>;
    buildTotalQuery: (
        db: DbClient,
    ) => Promise<Array<{ count: number }>>;
    defaults?: PaginationDefaults;
}

export function createSimplePaginatedList<TRow>(
    config: SimplePaginatedListConfig<TRow>,
) {
    return async function run(
        options: PaginationOptions = {},
    ): Promise<{ data: TRow[]; total: number }> {
        const db = await getDb();
        const { rows, total } = await runPaginatedQuery({
            page: options.page,
            perPage: options.perPage,
            defaults: config.defaults,
            fetchRows: async ({ limit, offset }) =>
                config.buildBaseQuery(db, { limit, offset }),
            fetchTotal: async () => {
                const result = await config.buildTotalQuery(db);
                return result[0]?.count ?? 0;
            },
        });

        return {
            data: rows,
            total,
        };
    };
}
