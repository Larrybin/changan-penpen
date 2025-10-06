import type { Metadata } from "next";
import TodoListPage from "@/modules/todos/todo-list.page";
import { generateDashboardTodosMetadata } from "@/modules/dashboard/metadata";

export async function generateMetadata(): Promise<Metadata> {
    return generateDashboardTodosMetadata("/dashboard/todos");
}

export default async function Page() {
    return <TodoListPage />;
}
