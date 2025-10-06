import type { Metadata } from "next";

import { generateAdminMetadata } from "@/modules/admin/metadata";
import AdminTodoListPage from "@/modules/admin/todos/pages/todo-list.page";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin/todos",
        robots: { index: false, follow: false },
    });
}

export default function Page() {
    return <AdminTodoListPage />;
}
