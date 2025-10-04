import AdminTodoEditPage from "@/modules/admin/todos/pages/todo-edit.page";

interface Params {
    id: string;
}

export default async function Page({ params }: { params: Promise<Params> }) {
    const { id } = await params;
    return <AdminTodoEditPage id={id} />;
}
