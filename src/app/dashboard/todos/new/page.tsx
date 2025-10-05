import type { Metadata } from "next";

import NewTodoPage from "@/modules/todos/new-todo.page";
import { generateDashboardTodosMetadata } from "@/modules/dashboard/metadata";

export async function generateMetadata(): Promise<Metadata> {
    return generateDashboardTodosMetadata("/dashboard/todos/new");
}

export default async function Page() {
    return <NewTodoPage />;
}
