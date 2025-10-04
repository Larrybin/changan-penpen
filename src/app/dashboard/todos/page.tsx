import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import TodoListPage from "@/modules/todos/todo-list.page";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Metadata");
    return {
        title: t("dashboardTodos.title"),
        description: t("dashboardTodos.description"),
    };
}

export default async function Page() {
    return <TodoListPage />;
}
