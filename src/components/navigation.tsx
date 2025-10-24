import { CheckSquare, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import todosRoutes from "@/modules/todos/todos.route";
import LogoutButton from "../modules/auth/components/logout-button";

export function Navigation() {
    return (
        <nav className="sticky top-0 z-[var(--z-nav)] border-border border-b bg-background">
            <div className="mx-auto max-w-[var(--container-max-w)] px-[var(--container-px)] py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <Link
                            href="/"
                            className="font-bold text-primary text-xl"
                        >
                            TodoApp
                        </Link>
                        <div className="hidden items-center space-x-4 md:flex">
                            <Link href="/">
                                <Button variant="ghost" size="sm">
                                    <Home className="mr-2 h-4 w-4" />
                                    Home
                                </Button>
                            </Link>
                            <Link href={todosRoutes.list}>
                                <Button variant="ghost" size="sm">
                                    <CheckSquare className="mr-2 h-4 w-4" />
                                    Todos
                                </Button>
                            </Link>
                        </div>
                    </div>
                    <LogoutButton />
                </div>
            </div>
        </nav>
    );
}
