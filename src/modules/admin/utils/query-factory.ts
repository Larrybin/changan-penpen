import type { SQL } from "drizzle-orm";
import { and, or } from "drizzle-orm";

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

export interface PaginatedQueryOptions<TRow> {
    page: number;
    perPage: number;
    filters?: WhereExpression[];
    operator?: BooleanOperator;
    fetchRows: (options: {
        limit: number;
        offset: number;
        where?: SQL;
    }) => Promise<TRow[]>;
    fetchTotal: (where?: SQL) => Promise<number>;
}

export interface PaginatedQueryResult<TRow> {
    page: number;
    perPage: number;
    rows: TRow[];
    total: number;
    where?: SQL;
}

export async function executePaginatedQuery<TRow>(
    options: PaginatedQueryOptions<TRow>,
): Promise<PaginatedQueryResult<TRow>> {
    const page = Math.max(1, options.page);
    const perPage = Math.max(1, options.perPage);
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
