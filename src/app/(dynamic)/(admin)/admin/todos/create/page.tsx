import type { Metadata } from "next";

import { generateAdminMetadata } from "@/modules/admin/metadata";
import AdminTodoCreatePage from "@/modules/admin/todos/pages/todo-create.page";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin/todos/create",
        robots: { index: false, follow: false },
    });
}

export default function Page() {
    return <AdminTodoCreatePage />;
}
