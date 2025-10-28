import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import getAllTodos from "@/modules/todos/actions/get-todos.action";
import { OptimizationProgressList } from "@/modules/todos/components/optimization-progress";
import { TodoCard } from "@/modules/todos/components/todo-card";
import todosRoutes from "./todos.route";

export default async function TodoListPage() {
    const todos = await getAllTodos();

    return (
        <>
            <div className="mb-8 flex w-full items-center justify-between">
                <div>
                    <h1 className="font-bold text-title-sm">Todos</h1>
                    <p className="mt-1 text-muted-foreground">
                        Manage your tasks and stay organized
                    </p>
                </div>
                <Link href={todosRoutes.new}>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Todo
                    </Button>
                </Link>
            </div>

            <div className="mb-8">
                <OptimizationProgressList />
            </div>

            {todos.length === 0 ? (
                <div className="w-full py-12 text-center">
                    <div className="mb-4 text-6xl text-muted-foreground">
                        📝
                    </div>
                    <h3 className="mb-2 font-semibold text-muted-foreground text-xl">
                        No todos yet
                    </h3>
                    <p className="mb-6 text-muted-foreground">
                        Create your first todo to get started
                    </p>
                    <Link href={todosRoutes.new}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create First Todo
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {todos.map((todo) => (
                        <TodoCard key={todo.id} todo={todo} />
                    ))}
                </div>
            )}
        </>
    );
}
