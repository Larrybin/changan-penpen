[根目录](../../../../CLAUDE.md) > [src/modules](../../) > **todos**

# Todos 模块 - 任务管理系统

## 模块职责

提供完整的任务管理功能，包括任务的创建、编辑、删除、分类管理和状态跟踪。

## 入口与启动

### 核心入口文件
- **Service**: `todo.service.ts` - 核心业务逻辑服务
- **Actions**: `actions/` 目录下的各种 Server Actions
- **Route**: `todos.route.ts` - 路由配置
- **Models**: `models/todo.enum.ts` - 枚举定义

### 路由入口
```typescript
// todos.route.ts
const todosRoutes = {
  list: "/dashboard/todos",
  new: "/dashboard/todos/new",
  edit: (id: string | number) => `/dashboard/todos/${id}/edit`,
} as const;
```

## 对外接口

### Server Actions (CRUD)
```typescript
// 创建任务
export const createTodo = async (input: TodoCreateInput): Promise<TodoWithCategory>

// 获取任务列表
export const getTodos = async (pagination?: PaginationParams): Promise<TodoWithCategory[]>

// 获取单个任务
export const getTodoById = async (id: number): Promise<TodoWithCategory | null>

// 更新任务
export const updateTodo = async (id: number, input: TodoUpdateInput): Promise<TodoWithCategory>

// 删除任务
export const deleteTodo = async (id: number): Promise<void>

// 切换完成状态
export const toggleComplete = async (id: number): Promise<TodoWithCategory>
```

### 分类管理 Actions
```typescript
// 获取分类列表
export const getCategories = async (): Promise<Category[]>

// 创建分类
export const createCategory = async (input: CategoryCreateInput): Promise<Category>
```

### Service 层接口
```typescript
// 用户任务操作
export const listTodosForUser = (userId: string, pagination?: PaginationParams)
export const createTodoForUser = (userId: string, input: TodoCreateInput)
export const updateTodoForUser = (userId: string, todoId: number, input: TodoUpdateInput)

// 管理员操作
export const listTodosForAdmin = (options?: ListTodosForAdminOptions)
export const createTodoForTenant = (tenantId: string, input: TodoCreateInput)
```

## 关键依赖与配置

### 核心依赖
- **drizzle-orm**: `^0.44.6` - 数据库ORM
- **zod**: `^4.1.12` - 数据验证
- **@hookform/resolvers**: `^5.2.2` - 表单验证集成

### 数据库表结构
- **todos**: 任务主表
  - `id`, `title`, `description`, `status`, `priority`
  - `categoryId`, `userId`, `completed`, `dueDate`
  - `imageUrl`, `imageAlt`, `createdAt`, `updatedAt`
- **categories**: 任务分类表
  - `id`, `name`, `color`, `description`, `userId`

### Schema 定义
```typescript
// todo.schema.ts
export const todos = sqliteTable("todos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id),
  userId: text("user_id").notNull(),
  status: text("status").default("pending"),
  priority: text("priority").default("medium"),
  completed: integer("completed", { mode: "boolean" }).default(false),
  dueDate: text("due_date"),
  imageUrl: text("image_url"),
  imageAlt: text("image_alt"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
```

## 组件架构

### 页面组件
- `TodoListPage` - 任务列表页面
- `NewTodoPage` - 新建任务页面
- `EditTodoPage` - 编辑任务页面

### 功能组件
- `TodoCard` - 任务卡片展示
- `TodoForm` - 任务表单组件
- `AddCategory` - 添加分类组件
- `DeleteTodo` - 删除任务组件
- `ToggleComplete` - 切换完成状态组件

### 表单验证
```typescript
// todo.schema.ts
export const insertTodoSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  categoryId: z.number().optional(),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imageAlt: z.string().optional(),
});
```

## 数据模型

### 任务模型 (Todo)
```typescript
interface Todo {
  id: number;
  title: string;
  description?: string;
  categoryId?: number;
  userId: string;
  status: TodoStatusType;
  priority: TodoPriorityType;
  completed: boolean;
  dueDate?: string;
  imageUrl?: string;
  imageAlt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 带分类的任务 (TodoWithCategory)
```typescript
interface TodoWithCategory extends Todo {
  categoryName?: string | null;
}
```

### 管理员视图任务 (AdminTodoRecord)
```typescript
interface AdminTodoRecord extends TodoWithCategory {
  userEmail?: string | null;
}
```

### 枚举类型
```typescript
enum TodoStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed"
}

enum TodoPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high"
}
```

## 测试与质量

### 测试覆盖
- ✅ **服务层测试**: `services/__tests__/todo.service.test.ts`
- ✅ **分类服务测试**: `services/__tests__/category.service.test.ts`
- ✅ **Actions 测试**: `actions/__tests__/todo-actions.test.ts`
- ✅ **工具函数测试**: `utils/pagination.test.ts`

### 测试用例类型
- CRUD 操作测试
- 权限验证测试
- 数据验证测试
- 分页功能测试
- 边界条件测试

### 质量保证
- Zod schema 验证
- TypeScript 类型安全
- 数据库事务处理
- 错误边界处理

## API 路由

### 管理 API
```typescript
// src/app/api/admin/todos/route.ts
export async function GET(request: Request) // 获取任务列表
export async function POST(request: Request) // 创建任务

// src/app/api/admin/todos/[id]/route.ts
export async function GET(request: Request, { params }) // 获取单个任务
export async function PUT(request: Request, { params }) // 更新任务
export async function DELETE(request: Request, { params }) // 删除任务
```

### 分类 API
```typescript
// src/app/api/admin/categories/route.ts
export async function GET(request: Request) // 获取分类列表
export async function POST(request: Request) // 创建分类
```

## 分页与查询

### 分页参数
```typescript
interface PaginationParams {
  page?: number;
  perPage?: number;
}

// 默认配置
const defaultPagination = {
  page: 1,
  perPage: 20,
};
```

### 查询优化
- 使用数据库索引优化查询
- JOIN 查询减少数据传输
- 分页查询避免大数据集
- 条件查询提高性能

## 权限控制

### 用户级权限
- 用户只能操作自己的任务
- 自动注入 userId 到查询条件
- 防止越权访问

### 管理员权限
- 可查看所有用户的任务
- 可为用户代创建任务
- 支持按租户筛选数据

## 常见问题 (FAQ)

### Q: 如何添加新的任务状态？
A: 修改 `todo.enum.ts` 中的 `TodoStatus` 枚举，并更新相关的 schema 和组件。

### Q: 如何实现任务搜索？
A: 在 service 层添加搜索方法，使用数据库的 LIKE 查询或全文搜索。

### Q: 如何处理任务图片上传？
A: 集成 R2 存储服务，在表单提交前上传图片并获取 URL。

### Q: 如何实现任务排序？
A: 在查询方法中添加排序参数，支持按创建时间、优先级、截止日期等排序。

### Q: 如何批量操作任务？
A: 在 service 层添加批量操作方法，并创建相应的 Server Actions。

## 相关文件清单

### 核心文件
- `todo.service.ts` - 核心业务逻辑
- `todos.route.ts` - 路由配置
- `models/todo.enum.ts` - 枚举定义

### Actions
- `actions/get-todos.action.ts`
- `actions/get-todo-by-id.action.ts`
- `actions/create-todo.action.ts`
- `actions/update-todo.action.ts`
- `actions/delete-todo.action.ts`
- `actions/get-categories.action.ts`
- `actions/create-category.action.ts`

### Schemas
- `schemas/todo.schema.ts` - 任务数据模式
- `schemas/category.schema.ts` - 分类数据模式

### Services
- `services/todo.service.ts` - 任务服务
- `services/category.service.ts` - 分类服务

### 组件
- `components/todo-card.tsx` - 任务卡片
- `components/todo-form.tsx` - 任务表单
- `components/add-category.tsx` - 添加分类
- `components/delete-todo.tsx` - 删除任务
- `components/toggle-complete.tsx` - 切换完成状态

### 页面
- `todo-list.page.tsx` - 任务列表页
- `new-todo.page.tsx` - 新建任务页
- `edit-todo.page.tsx` - 编辑任务页

### 测试文件
- `actions/__tests__/todo-actions.test.ts`
- `services/__tests__/todo.service.test.ts`
- `services/__tests__/category.service.test.ts`

## 使用示例

### 创建任务
```typescript
import { createTodo } from "@/modules/todos/actions/create-todo.action";
import { insertTodoSchema } from "@/modules/todos/schemas/todo.schema";

const todoData = insertTodoSchema.parse({
  title: "学习 Next.js",
  description: "完成 Next.js 15 的学习",
  priority: "high",
  dueDate: "2025-12-31"
});

const newTodo = await createTodo(todoData);
```

### 获取任务列表
```typescript
import { getTodos } from "@/modules/todos/actions/get-todos.action";

const todos = await getTodos({
  page: 1,
  perPage: 10
});
```

### 在组件中使用
```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { getTodos } from "@/modules/todos/actions/get-todos.action";

export function TodoList() {
  const { data: todos, isLoading } = useQuery({
    queryKey: ["todos"],
    queryFn: () => getTodos()
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {todos?.map(todo => (
        <TodoCard key={todo.id} todo={todo} />
      ))}
    </div>
  );
}
```

---

## 变更记录 (Changelog)

### 2025-10-16 01:48:57 - 文档初始化
- ✅ 创建任务管理模块文档
- ✅ 详细的 CRUD API 说明
- ✅ 数据模型和 schema 说明
- ✅ 权限控制机制说明
- ✅ 测试覆盖情况说明

---

*此文档由AI自动生成，请根据实际代码变化及时更新。*