import AdminTodoEditPage from "@/modules/admin/todos/pages/todo-edit.page";

export default function Page({ params }: { params: { id: string } }) {
    return <AdminTodoEditPage id={params.id} />;
}
