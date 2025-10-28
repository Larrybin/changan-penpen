import type {
    CrudFilter,
    CrudFilters,
    CrudSorting,
    GetListParams,
} from "@/lib/crud/types";

export interface BuildListSearchParamsOptions {
    pagination?: GetListParams["pagination"];
    filters?: CrudFilters;
    sorters?: CrudSorting;
    view?: string | null;
    fields?: readonly string[] | null;
}

function appendFilter(entries: Array<[string, string]>, filter: CrudFilter) {
    if (!filter) {
        return;
    }

    if (filter.operator === "or" || filter.operator === "and") {
        const values = Array.isArray(filter.value) ? filter.value : [];
        values.forEach((child) => {
            appendFilter(entries, child as CrudFilter);
        });
        return;
    }

    if (filter.field === undefined || filter.value === undefined) {
        return;
    }

    const value = filter.value as unknown;
    if (
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.length === 0)
    ) {
        return;
    }

    if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        entries.push([String(filter.field), String(value)]);
    }
}

function appendFilters(
    entries: Array<[string, string]>,
    filters?: CrudFilters,
) {
    if (!filters || filters.length === 0) {
        return;
    }

    filters.forEach((filter) => {
        appendFilter(entries, filter);
    });
}

function appendSorters(
    entries: Array<[string, string]>,
    sorters?: CrudSorting,
) {
    if (!sorters || sorters.length === 0) {
        return;
    }

    const [first] = sorters;
    if (!first || !first.field || !first.order) {
        return;
    }

    entries.push(["sortBy", String(first.field)]);
    entries.push(["sortOrder", first.order]);
}

export function buildListSearchParams(
    options: BuildListSearchParamsOptions = {},
): URLSearchParams {
    const entries: Array<[string, string]> = [];

    if (options.pagination) {
        const { current, page, pageSize } = options.pagination;
        const resolvedPage = current ?? page;
        if (resolvedPage) {
            entries.push(["page", String(resolvedPage)]);
        }
        if (pageSize) {
            entries.push(["perPage", String(pageSize)]);
        }
    }

    appendFilters(entries, options.filters);
    appendSorters(entries, options.sorters);

    if (options.view) {
        const trimmedView = options.view.trim();
        if (trimmedView.length > 0) {
            entries.push(["view", trimmedView]);
        }
    }

    if (options.fields && options.fields.length > 0) {
        const seen = new Set<string>();
        options.fields.forEach((field) => {
            const trimmed = field.trim();
            if (trimmed.length === 0 || seen.has(trimmed)) {
                return;
            }
            seen.add(trimmed);
            entries.push(["fields", trimmed]);
        });
    }

    const searchParams = new URLSearchParams();
    entries.forEach(([key, value]) => {
        searchParams.append(key, value);
    });

    return searchParams;
}
