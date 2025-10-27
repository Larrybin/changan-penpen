import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
    getOptimizationTodos,
    type OptimizationTodoItem,
} from "@/modules/todos/services/optimization-progress.service";

function resolveBadgeVariant(status: OptimizationTodoItem["status"]) {
    switch (status) {
        case "done":
            return "secondary" as const;
        case "in-progress":
            return "default" as const;
        case "blocked":
            return "destructive" as const;
        default:
            return "outline" as const;
    }
}

function resolveStatusLabel(status: OptimizationTodoItem["status"]) {
    switch (status) {
        case "done":
            return "Done";
        case "in-progress":
            return "In progress";
        case "blocked":
            return "Blocked";
        default:
            return "Todo";
    }
}

export async function OptimizationProgressList() {
    const todos = await getOptimizationTodos();
    if (!todos.length) {
        return null;
    }

    return (
        <Card className="border-dashed border-border/70 bg-muted/30">
            <CardHeader>
                <CardTitle className="text-base font-semibold">
                    Optimization rollout tracker
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {todos.map((item) => (
                    <div key={item.id} className="space-y-1 rounded-lg border border-border/60 bg-background/60 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="font-medium text-foreground text-sm md:text-base">
                                {item.title}
                            </h3>
                            <Badge variant={resolveBadgeVariant(item.status)}>
                                {resolveStatusLabel(item.status)}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            {item.summary}
                        </p>
                        {item.updatedAt ? (
                            <p className="text-muted-foreground text-xs">
                                Updated {item.updatedAt}
                            </p>
                        ) : null}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
