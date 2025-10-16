# Server Action 状态同步指南

## 概述

实现了基于 `useServerAction` Hook 和 `nuqs` 的服务端操作状态同步系统，提供统一的 Server Actions 状态管理和 URL 查询参数同步。

## 核心特性

### 1. 状态管理
- **执行状态**: 跟踪 Server Action 的执行状态
- **错误处理**: 统一的错误捕获和处理机制
- **数据管理**: 自动管理操作结果数据
- **重试机制**: 支持自动重试失败的操作

### 2. URL 状态同步
- **查询参数**: 自动同步操作状态到 URL
- **页面刷新**: 保持状态在页面刷新后仍然有效
- **浏览器导航**: 支持浏览器前进/后退导航
- **深度链接**: 可以通过 URL 直接分享特定状态

### 3. 用户体验
- **Toast 通知**: 自动显示操作结果通知
- **加载状态**: 显示操作进度和防止重复提交
- **错误反馈**: 清晰的错误信息和处理建议

## 安装依赖

```bash
pnpm add nuqs
```

## 核心 Hook

### useServerAction

主要的 Hook，用于管理 Server Actions 的状态和副作用。

```tsx
import { useServerAction } from "@/hooks/use-server-action";

const { execute, isPending, isExecuting, error, data } = useServerAction({
    action: createTodo,
    queryKey: "createTodo",
    onSuccess: (data) => {
        console.log("操作成功:", data);
    },
    onError: (error) => {
        console.error("操作失败:", error);
    }
});
```

#### 参数说明

| 参数 | 类型 | 描述 |
|------|------|------|
| `action` | `(input: T) => Promise<R>` | Server Action 函数 |
| `queryKey` | `string \| string[]` | URL 查询参数键名 |
| `initialData` | `R \| null` | 初始数据 |
| `onSuccess` | `(data: R, input: T) => void` | 成功回调 |
| `onError` | `(error: Error, input: T) => void` | 错误回调 |
| `onExecute` | `(input: T) => void` | 执行前回调 |
| `onFinally` | `() => void` | 完成回调 |
| `showToast` | `boolean \| object` | 是否显示 Toast 通知 |
| `toastMessages` | `object` | 自定义 Toast 消息 |
| `resetQueryOnSuccess` | `boolean` | 成功后是否重置查询参数 |
| `retryCount` | `number` | 错误重试次数 |
| `retryDelay` | `number` | 重试延迟时间 (ms) |

#### 返回值

| 属性 | 类型 | 描述 |
|------|------|------|
| `execute` | `(input: T) => Promise<R \| undefined>` | 执行函数 |
| `isPending` | `boolean` | 是否正在执行 |
| `isExecuting` | `boolean` | 是否正在执行 (别名) |
| `error` | `Error \| null` | 错误信息 |
| `data` | `R \| null` | 操作结果数据 |
| `reset` | `() => void` | 重置状态 |
| `clearError` | `() => void` | 清除错误 |

## 预设 Hooks

### useCrudServerAction

针对创建、更新、删除等常见操作的统一 Hook，通过传入 `kind` 指定场景并提供默认文案。

```tsx
import { useCrudServerAction } from "@/hooks/use-server-action";

const createTodo = useCrudServerAction("create", createTodoAction, {
    onSuccess: (data) => {
        // 自定义成功处理
    }
});

const updateTodo = useCrudServerAction("update", updateTodoAction);

const deleteTodo = useCrudServerAction("delete", deleteTodoAction);
```

### useSimpleServerAction

简化版本的 Hook，适用于基本场景。

```tsx
import { useSimpleServerAction } from "@/hooks/use-server-action";

const simpleAction = useSimpleServerAction(myAction, {
    onSuccess: (data) => console.log("成功:", data)
});
```

## 使用示例

### 基本用法

```tsx
"use client";

import { useServerAction } from "@/hooks/use-server-action";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

// Server Action
async function createTodo(input: { title: string }) {
    "use server";

    // 数据库操作
    const todo = await db.todo.create({
        data: { title: input.title }
    });

    return todo;
}

export function CreateTodoForm() {
    const [title, setTitle] = useState("");

    const { execute, isPending, error } = useServerAction({
        action: createTodo,
        queryKey: "create",
        onSuccess: (data) => {
            toast.success(`任务 "${data.title}" 创建成功！`);
            setTitle("");
        },
        onError: (error) => {
            toast.error("创建失败");
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await execute({ title });
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="任务标题"
                disabled={isPending}
            />
            <Button type="submit" disabled={isPending}>
                {isPending ? "创建中..." : "创建任务"}
            </Button>
            {error && <p className="text-red-500">{error.message}</p>}
        </form>
    );
}
```

### 高级用法 - 查询参数同步

```tsx
import { useServerAction } from "@/hooks/use-server-action";
import { useQueryStates } from "nuqs";

// 查询参数解析器
const searchParamsParsers = {
    status: {
        defaultValue: "all" as "all" | "active" | "completed",
        parse: (value: string) => value as "all" | "active" | "completed",
    },
    page: {
        defaultValue: 1,
        parse: (value: string) => parseInt(value) || 1,
    }
};

export function TodoList() {
    const [filters, setFilters] = useQueryStates(searchParamsParsers);

    const { execute: deleteTodo } = useServerAction({
        action: deleteTodoAction,
        queryKey: ["delete", "id"], // 同步删除操作到 URL
        resetQueryOnSuccess: true, // 成功后重置查询参数
        onSuccess: (data, input) => {
            // 重新获取列表
            refetch();
        }
    });

    const handleDelete = async (id: number) => {
        await deleteTodo({ id });
    };

    return (
        <div>
            {/* 删除操作会同步到 URL */}
            {/* 例如: ?delete=123&id=456 */}
        </div>
    );
}
```

### 错误重试

```tsx
const { execute, error } = useServerAction({
    action: unreliableAction,
    retryCount: 3, // 重试 3 次
    retryDelay: 1000, // 每次重试间隔 1 秒
    onError: (error, input) => {
        console.log(`操作失败，正在重试... (${input})`);
    }
});
```

### 自定义 Toast 消息

```tsx
const { execute } = useServerAction({
    action: customAction,
    toastMessages: {
        success: (data) => `成功创建了 ${data.name}`,
        error: (error) => `操作失败: ${error.message}`,
        loading: "正在处理，请稍候..."
    },
    showToast: {
        success: true,
        error: true
    }
});
```

## 查询参数状态

### 支持的查询参数

系统会自动为不同的操作生成查询参数：

| 操作类型 | 查询参数格式 | 示例 |
|----------|-------------|------|
| 创建 | `?create=1` | `?create=1` |
| 更新 | `?update=1&id=123` | `?update=1&id=123` |
| 删除 | `?delete=1&id=123` | `?delete=1&id=123` |
| 自定义 | `?{action}=1&{params}` | `?export=1&type=pdf` |

### 查询参数配置

```tsx
// 自定义查询参数键
const { execute } = useServerAction({
    action: exportData,
    queryKey: ["export", "type", "format"], // ?export=1&type=report&format=pdf
    resetQueryOnSuccess: false // 保持查询参数
});
```

## 最佳实践

### 1. 合理使用查询参数

- **临时操作**: 使用查询参数跟踪创建、更新、删除操作
- **持久状态**: 使用 `resetQueryOnSuccess: false` 保持状态
- **避免污染**: 不要为每个操作都添加查询参数

### 2. 错误处理

```tsx
const { execute, error } = useServerAction({
    action: riskyOperation,
    onError: (error, input) => {
        // 记录错误
        console.error("操作失败:", error.message);

        // 用户友好的错误提示
        if (error.message.includes("权限")) {
            toast.error("权限不足，请联系管理员");
        } else {
            toast.error("操作失败，请稍后重试");
        }
    },
    retryCount: 1 // 网络错误可以重试一次
});
```

### 3. 加载状态管理

```tsx
const { execute, isPending } = useServerAction({
    action: longRunningAction,
    onExecute: (input) => {
        // 显示进度指示器
        toast.loading("正在处理，这可能需要一些时间...");
    }
});

// 在 UI 中禁用相关元素
<Button
    onClick={() => execute(data)}
    disabled={isPending}
>
    {isPending ? "处理中..." : "开始处理"}
</Button>
```

### 4. 数据同步

```tsx
const { execute: createItem } = useServerAction({
    action: createItemAction,
    onSuccess: (newItem) => {
        // 更新本地状态
        setItems(prev => [...prev, newItem]);

        // 或者重新获取数据
        queryClient.invalidateQueries(["items"]);
    }
});
```

## 性能优化

### 1. 避免不必要的重新渲染

```tsx
// 使用 useCallback 稳定化函数
const handleSubmit = useCallback(async (data: FormData) => {
    await execute(data);
}, [execute]);
```

### 2. 防抖处理

```tsx
import { useDebouncedCallback } from "use-debounce";

const debouncedExecute = useDebouncedCallback(execute, 500);

// 搜索场景中使用
const handleSearch = (query: string) => {
    debouncedExecute({ query });
};
```

### 3. 批量操作

```tsx
const { execute: batchUpdate } = useServerAction({
    action: batchUpdateAction,
    onSuccess: () => {
        // 批量操作完成后统一刷新
        queryClient.refetchQueries(["items"]);
    }
});
```

## 故障排除

### 常见问题

1. **查询参数不更新**
   - 检查 `queryKey` 是否正确设置
   - 确认 `useQueryStates` 解析器配置正确

2. **Toast 不显示**
   - 检查 `showToast` 配置
   - 确认 Toast 组件已在根布局中渲染

3. **状态不同步**
   - 检查 Server Action 是否正确返回数据
   - 确认 `onSuccess` 回调是否正确设置

4. **重试不工作**
   - 检查 `retryCount` 和 `retryDelay` 设置
   - 确认错误是可重试的类型

### 调试技巧

```tsx
const { execute, isPending, error, data } = useServerAction({
    action: debugAction,
    onExecute: (input) => {
        console.log("开始执行:", input);
    },
    onSuccess: (data, input) => {
        console.log("执行成功:", data, input);
    },
    onError: (error, input) => {
        console.error("执行失败:", error, input);
    }
});
```

## 迁移指南

### 从传统的 useState 迁移

```tsx
// 旧方式
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
        const result = await createItem(data);
        toast.success("创建成功");
    } catch (err) {
        setError(err.message);
        toast.error("创建失败");
    } finally {
        setIsLoading(false);
    }
};

// 新方式
const { execute, isPending, error } = useServerAction({
    action: createItem,
    onSuccess: () => toast.success("创建成功"),
    onError: (err) => toast.error("创建失败")
});

const handleSubmit = async (data: FormData) => {
    await execute(data);
};
```

## 总结

useServerAction + nuqs 状态同步系统提供了：

- ✅ **统一的状态管理**: 一致的 API 和行为模式
- ✅ **URL 状态同步**: 状态持久化和分享能力
- ✅ **自动错误处理**: 重试机制和用户友好的错误提示
- ✅ **Toast 集成**: 自动化的操作反馈
- ✅ **性能优化**: 防重复提交和智能缓存
- ✅ **类型安全**: 完整的 TypeScript 支持

这个系统大大简化了 Server Actions 的使用复杂度，提供了更好的用户体验和开发体验。

---

*更新时间: 2025-10-16*
*版本: 1.0*