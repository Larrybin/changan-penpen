import type { Metadata } from "next";
import { generateDashboardTodosMetadata } from "@/modules/dashboard/metadata";
import NewTodoPage from "@/modules/todos/new-todo.page";

export async function generateMetadata(): Promise<Metadata> {
    return generateDashboardTodosMetadata("/dashboard/todos/new");
}

export default async function Page() {
    return <NewTodoPage />;
}
