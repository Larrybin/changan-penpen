import type { JSX } from "react";
import type { ListUsersOptions } from "@/modules/admin/services/user.service";
import { listUsers } from "@/modules/admin/services/user.service";
import { UsersListClient } from "@/modules/users-admin/components/users-list-client";
import { parsePaginationParams } from "@/modules/admin-shared/utils/pagination";

function toURLSearchParams(
    searchParams?: Record<string, string | string[] | undefined>,
): URLSearchParams {
    const params = new URLSearchParams();
    if (!searchParams) {
        return params;
    }

    for (const [key, value] of Object.entries(searchParams)) {
        if (Array.isArray(value)) {
            value.forEach((entry) => {
                if (entry !== undefined) {
                    params.append(key, entry);
                }
            });
        } else if (value !== undefined) {
            params.set(key, value);
        }
    }

    return params;
}

export interface UsersListPageProps {
    searchParams?: Record<string, string | string[] | undefined>;
}

export async function UsersListPage({
    searchParams,
}: UsersListPageProps): Promise<JSX.Element> {
    const params = toURLSearchParams(searchParams);
    const { page, perPage } = parsePaginationParams(params);

    const email = params.get("email") ?? undefined;
    const name = params.get("name") ?? undefined;

    const result = await listUsers({
        page,
        perPage,
        email,
        name,
    } satisfies ListUsersOptions);

    return (
        <UsersListClient
            data={result.data}
            total={result.total}
            page={result.page}
            perPage={result.perPage}
            searchQuery={email ?? ""}
        />
    );
}
