import type { Metadata } from "next";
import { generateDashboardTodosMetadata } from "@/modules/dashboard/metadata";
import EditTodoPage from "@/modules/todos/edit-todo.page";

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { id } = await params;
    return generateDashboardTodosMetadata(`/dashboard/todos/${id}/edit`);
}

export default async function Page({ params }: PageProps) {
    const { id } = await params;
    return <EditTodoPage id={id} />;
}
