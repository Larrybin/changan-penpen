import { getDb } from "@/db";
import { normalizePagination } from "@/modules/admin-shared/utils/pagination";

interface PaginationArgs {
    page?: number;
    perPage?: number;
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

export type TenantPaginationOptions = PaginationArgs & {
    tenantId?: string;
};

export type FilterableBuilder<TResult> = PromiseLike<TResult>;

export function createPaginatedQuery<
    TOptions extends TenantPaginationOptions,
    TData,
>(config: PaginatedQueryFactoryOptions<TData>) {
    return async function run(options: TOptions = {} as TOptions) {
        const db = await getDb();
        const { page, perPage } = normalizePagination(options);
        const currentPage = Math.max(page, 1);
        const limit = Math.max(perPage, 1);
        const offset = (currentPage - 1) * limit;

        const applyFilter = <TResult>(
            builder: FilterableBuilder<TResult>,
        ): FilterableBuilder<TResult> => {
            if (!options.tenantId || !config.applyTenantFilter) {
                return builder;
            }
            return config.applyTenantFilter(builder, options.tenantId);
        };

        const dataQuery = applyFilter(
            config.buildBaseQuery(db, { limit, offset }),
        );
        const rows = await dataQuery;

        const totalQuery = applyFilter(config.buildTotalQuery(db));
        const totalRows = await totalQuery;

        return {
            data: rows,
            total: totalRows[0]?.count ?? 0,
        };
    };
}
