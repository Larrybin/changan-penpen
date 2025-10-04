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
    perPage: 20,
};

export function normalizePagination(
    options: PaginationOptions,
    defaults: PaginationDefaults = DEFAULT_PAGINATION,
): PaginationDefaults {
    const page =
        typeof options.page === "number" &&
        Number.isFinite(options.page) &&
        !Number.isNaN(options.page)
            ? options.page
            : defaults.page;

    const perPage =
        typeof options.perPage === "number" &&
        Number.isFinite(options.perPage) &&
        !Number.isNaN(options.perPage)
            ? options.perPage
            : defaults.perPage;

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
