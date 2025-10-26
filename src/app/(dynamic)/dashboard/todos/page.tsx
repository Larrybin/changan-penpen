import type { Metadata } from "next";
import { generateDashboardTodosMetadata } from "@/modules/dashboard/metadata";
import TodoListPage from "@/modules/todos/todo-list.page";

export async function generateMetadata(): Promise<Metadata> {
    return generateDashboardTodosMetadata("/dashboard/todos");
}

export default async function Page() {
    return <TodoListPage />;
}
