import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/config";
import { createMetadata, getMetadataContext } from "@/lib/seo-metadata";
import TodoListPage from "@/modules/todos/todo-list.page";

export async function generateMetadata(): Promise<Metadata> {
    const locale = (await getLocale()) as AppLocale;
    const context = await getMetadataContext(locale);
    const { dashboardTodos } = context.messages;
    return createMetadata(context, {
        path: "/dashboard/todos",
        title: dashboardTodos.title,
        description: dashboardTodos.description,
    });
}

export default async function Page() {
    return <TodoListPage />;
}
