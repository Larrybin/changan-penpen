import type { Metadata } from "next";
import { generateDashboardTodosMetadata } from "@/modules/dashboard/metadata";
import EditTodoPage from "@/modules/todos/edit-todo.page";

interface PageProps {
    params: { id: string };
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { id } = params;
    return generateDashboardTodosMetadata(`/dashboard/todos/${id}/edit`);
}

export default async function Page({ params }: PageProps) {
    const { id } = params;
    return <EditTodoPage id={id} />;
}
