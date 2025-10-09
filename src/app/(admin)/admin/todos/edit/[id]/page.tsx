import type { Metadata } from "next";

import { generateAdminMetadata } from "@/modules/admin/metadata";
import AdminTodoEditPage from "@/modules/admin/todos/pages/todo-edit.page";

interface Params {
    id: string;
}

export async function generateMetadata({
    params,
}: {
    params: Params;
}): Promise<Metadata> {
    const { id } = params;
    const path = id
        ? `/admin/todos/${encodeURIComponent(id)}/edit`
        : "/admin/todos";
    return generateAdminMetadata({
        path,
        robots: { index: false, follow: false },
    });
}

export default async function Page({ params }: { params: Params }) {
    const { id } = params;
    return <AdminTodoEditPage id={id} />;
}
