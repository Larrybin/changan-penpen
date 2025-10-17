import { config } from "@/config";

export interface PaginationOptions {
    page?: number;
    perPage?: number;
}

export interface PaginationDefaults {
    page: number;
    perPage: number;
}

const DEFAULT_PAGINATION: PaginationDefaults = {
    page: 1,
    perPage: config.pagination.defaultPageSize,
};

function clampPerPage(perPage: number): number {
    const { minPageSize, maxPageSize } = config.pagination;
    const min = Math.max(1, Math.floor(minPageSize));
    const max = Math.max(min, Math.floor(maxPageSize));
    return Math.min(Math.max(perPage, min), max);
}

function sanitizeDefaults(defaults: PaginationDefaults): PaginationDefaults {
    const page = Math.max(
        1,
        Math.floor(defaults.page ?? DEFAULT_PAGINATION.page),
    );
    const perPage = clampPerPage(
        Number.isFinite(defaults.perPage)
            ? Math.floor(defaults.perPage)
            : DEFAULT_PAGINATION.perPage,
    );

    return { page, perPage };
}

export function normalizePagination(
    options: PaginationOptions,
    defaults: PaginationDefaults = DEFAULT_PAGINATION,
): PaginationDefaults {
    const safeDefaults = sanitizeDefaults(defaults);

    const rawPage =
        typeof options.page === "number" && Number.isFinite(options.page)
            ? Math.floor(options.page)
            : safeDefaults.page;
    const page = Math.max(1, rawPage);

    const rawPerPage =
        typeof options.perPage === "number" && Number.isFinite(options.perPage)
            ? Math.floor(options.perPage)
            : safeDefaults.perPage;
    const perPage = clampPerPage(rawPerPage);

    return { page, perPage };
}

export function parsePaginationParams(
    searchParams: URLSearchParams,
    defaults: PaginationDefaults = DEFAULT_PAGINATION,
): PaginationDefaults {
    const rawPage = searchParams.get("page");
    const rawPerPage = searchParams.get("perPage");

    const page = rawPage === null ? undefined : Number(rawPage);
    const perPage = rawPerPage === null ? undefined : Number(rawPerPage);

    return normalizePagination({ page, perPage }, defaults);
}
