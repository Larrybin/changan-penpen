/**
 * Server Action Demo - useServerAction 使用示例
 *
 * 演示如何结合 nuqs 实现服务端操作状态同步
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    useCreateServerAction,
    useServerAction,
    useUpdateServerAction,
} from "@/hooks/use-server-action";
import { toast } from "@/lib/toast";

interface DemoTodo {
    id: number;
    title: string;
    description?: string;
    createdAt: string;
    updatedAt?: string;
}

// 模拟的 Server Actions
async function createTodoAction(input: { title: string; description: string }) {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 模拟随机失败 (20% 概率)
    if (Math.random() < 0.2) {
        throw new Error("创建任务失败：服务器错误");
    }

    return {
        id: Date.now(),
        title: input.title,
        description: input.description,
        createdAt: new Date().toISOString(),
    };
}

async function updateTodoAction(input: { id: number; title: string }) {
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (Math.random() < 0.15) {
        throw new Error("更新任务失败：网络错误");
    }

    return {
        ...input,
        updatedAt: new Date().toISOString(),
    };
}

async function deleteTodoAction(input: { id: number }) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (Math.random() < 0.1) {
        throw new Error("删除任务失败：权限不足");
    }

    return { success: true, deletedId: input.id };
}

export function ServerActionDemo() {
    const [todos, setTodos] = useState<DemoTodo[]>([]);
    const [formData, setFormData] = useState({ title: "", description: "" });

    // 使用创建任务的 Server Action
    const createTodo = useCreateServerAction(createTodoAction, {
        onSuccess: (data) => {
            setTodos((prev) => [...prev, data]);
            setFormData({ title: "", description: "" });
            toast.success("任务创建成功！");
        },
        queryKey: "create",
    });

    // 使用更新任务的 Server Action
    const updateTodo = useUpdateServerAction(updateTodoAction, {
        onSuccess: (data) => {
            setTodos((prev) =>
                prev.map((todo) =>
                    todo.id === data.id ? { ...todo, ...data } : todo,
                ),
            );
            toast.success("任务更新成功！");
        },
        queryKey: "update",
    });

    // 使用删除任务的 Server Action
    const deleteTodo = useServerAction(deleteTodoAction, {
        onSuccess: (_data, input) => {
            setTodos((prev) => prev.filter((todo) => todo.id !== input.id));
            toast.success("任务删除成功！");
        },
        onError: (error) => {
            toast.error(`删除失败: ${error.message}`);
        },
        queryKey: "delete",
    });

    const handleCreate = async () => {
        if (!formData.title.trim()) {
            toast.error("请输入任务标题");
            return;
        }

        await createTodo.execute({
            title: formData.title,
            description: formData.description,
        });
    };

    const handleUpdate = async (id: number, title: string) => {
        const newTitle = prompt("输入新标题:", title);
        if (newTitle?.trim()) {
            await updateTodo.execute({ id, title: newTitle.trim() });
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("确定要删除这个任务吗？")) {
            await deleteTodo.execute({ id });
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Server Action 状态同步演示</CardTitle>
                    <CardDescription>
                        演示 useServerAction Hook 结合 nuqs 查询参数状态同步
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* 创建任务表单 */}
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                        <h3 className="font-semibold">创建新任务</h3>
                        <div className="grid gap-2">
                            <Input
                                placeholder="任务标题"
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        title: e.target.value,
                                    }))
                                }
                                disabled={createTodo.isExecuting}
                            />
                            <Input
                                placeholder="任务描述（可选）"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        description: e.target.value,
                                    }))
                                }
                                disabled={createTodo.isExecuting}
                            />
                            <Button
                                onClick={handleCreate}
                                disabled={
                                    createTodo.isExecuting ||
                                    !formData.title.trim()
                                }
                                className="w-full"
                            >
                                {createTodo.isExecuting
                                    ? "正在创建..."
                                    : "创建任务"}
                            </Button>
                        </div>

                        {createTodo.error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                                错误: {createTodo.error.message}
                            </div>
                        )}
                    </div>

                    {/* 任务列表 */}
                    <div className="space-y-2">
                        <h3 className="font-semibold">
                            任务列表 ({todos.length})
                        </h3>
                        {todos.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">
                                暂无任务，创建一个试试吧！
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {todos.map((todo) => (
                                    <div
                                        key={todo.id}
                                        className="p-3 border rounded-lg flex items-center justify-between"
                                    >
                                        <div className="flex-1">
                                            <h4 className="font-medium">
                                                {todo.title}
                                            </h4>
                                            {todo.description && (
                                                <p className="text-sm text-gray-600">
                                                    {todo.description}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400">
                                                创建时间:{" "}
                                                {new Date(
                                                    todo.createdAt,
                                                ).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleUpdate(
                                                        todo.id,
                                                        todo.title,
                                                    )
                                                }
                                                disabled={
                                                    updateTodo.isExecuting
                                                }
                                            >
                                                {updateTodo.isExecuting
                                                    ? "..."
                                                    : "编辑"}
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() =>
                                                    handleDelete(todo.id)
                                                }
                                                disabled={
                                                    deleteTodo.isExecuting
                                                }
                                            >
                                                {deleteTodo.isExecuting
                                                    ? "..."
                                                    : "删除"}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 状态信息 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 border rounded-lg">
                        <div className="text-center">
                            <h4 className="font-semibold text-blue-700">
                                创建操作
                            </h4>
                            <p className="text-sm text-blue-600">
                                状态:{" "}
                                {createTodo.isExecuting
                                    ? "执行中"
                                    : createTodo.error
                                      ? "失败"
                                      : "空闲"}
                            </p>
                        </div>
                        <div className="text-center">
                            <h4 className="font-semibold text-blue-700">
                                更新操作
                            </h4>
                            <p className="text-sm text-blue-600">
                                状态:{" "}
                                {updateTodo.isExecuting
                                    ? "执行中"
                                    : updateTodo.error
                                      ? "失败"
                                      : "空闲"}
                            </p>
                        </div>
                        <div className="text-center">
                            <h4 className="font-semibold text-blue-700">
                                删除操作
                            </h4>
                            <p className="text-sm text-blue-600">
                                状态:{" "}
                                {deleteTodo.isExecuting
                                    ? "执行中"
                                    : deleteTodo.error
                                      ? "失败"
                                      : "空闲"}
                            </p>
                        </div>
                    </div>

                    {/* 使用说明 */}
                    <div className="p-4 bg-gray-50 border rounded-lg text-sm">
                        <h4 className="font-semibold mb-2">功能说明:</h4>
                        <ul className="space-y-1 text-gray-600">
                            <li>• 自动显示加载状态和错误信息</li>
                            <li>• Toast 通知反馈操作结果</li>
                            <li>• 支持错误重试机制</li>
                            <li>• URL 查询参数状态同步</li>
                            <li>• 防止重复提交</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default ServerActionDemo;
