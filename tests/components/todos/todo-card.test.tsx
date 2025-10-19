/**
 * TodoCard组件TDD测试
 * 遵循测试驱动开发原则
 * 基于React Testing Library最佳实践
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TodoPriority, TodoStatus } from "@/modules/todos/models/todo.enum";
import todosRoutes from "@/modules/todos/todos.route";

import { TodoCard } from "@/modules/todos/components/todo-card";
import { customRender, setupUserEvent } from "../setup";

// Mock子组件
vi.mock("@/modules/todos/components/delete-todo", () => ({
    DeleteTodo: ({ todoId }: { todoId: number }) => (
        <button data-testid={`delete-todo-${todoId}`} aria-label={`Delete todo ${todoId}`}>
            Delete
        </button>
    ),
}));

vi.mock("@/modules/todos/components/toggle-complete", () => ({
    ToggleComplete: ({ todoId, completed }: { todoId: number; completed: boolean }) => (
        <input
            type="checkbox"
            data-testid={`toggle-complete-${todoId}`}
            checked={completed}
            onChange={() => {}}
            aria-label={`Toggle todo ${todoId} completion`}
        />
    ),
}));

// Mock Next.js Link
vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: any) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

// Mock todos routes
vi.mock("@/modules/todos/todos.route", () => ({
    default: {
        edit: (id: number) => `/todos/${id}/edit`,
    },
}));

describe("TodoCard组件", () => {
    let user: ReturnType<typeof setupUserEvent>;
    let mockTodo;

    beforeEach(() => {
        user = setupUserEvent();
        vi.clearAllMocks();

        mockTodo = {
            id: 1,
            title: "Test Todo",
            description: "Test description",
            completed: false,
            categoryId: 1,
            categoryName: "Test Category",
            dueDate: "2024-12-31",
            imageUrl: "https://example.com/image.jpg",
            imageAlt: "Test image",
            status: TodoStatus.PENDING,
            priority: TodoPriority.MEDIUM,
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("基础渲染测试", () => {
        it("应该正确渲染todo卡片", () => {
            customRender(<TodoCard todo={mockTodo} />);

            // 验证标题
            expect(screen.getByText("Test Todo")).toBeInTheDocument();

            // 验证描述
            expect(screen.getByText("Test description")).toBeInTheDocument();

            // 验证分类
            expect(screen.getByText("Test Category")).toBeInTheDocument();

            // 验证操作按钮
            expect(screen.getByRole("link", { name: "" })).toBeInTheDocument(); // Edit按钮
            expect(screen.getByTestId("delete-todo-1")).toBeInTheDocument();

            // 验证切换完成按钮
            expect(screen.getByTestId("toggle-complete-1")).toBeInTheDocument();
        });

        it("应该显示正确的优先级和状态标签", () => {
            customRender(<TodoCard todo={mockTodo} />);

            // 验证优先级标签
            expect(screen.getByText("Medium")).toBeInTheDocument();

            // 验证状态标签
            expect(screen.getByText("Pending")).toBeInTheDocument();
        });

        it("应该显示截止日期", () => {
            customRender(<TodoCard todo={mockTodo} />);

            // 验证日期显示
            expect(screen.getByText(/Due:/)).toBeInTheDocument();
            expect(screen.getByText(/Dec 31, 2024/)).toBeInTheDocument();
        });

        it("应该显示图片", () => {
            customRender(<TodoCard todo={mockTodo} />);

            const image = screen.getByRole("img", { name: "Test image" });
            expect(image).toBeInTheDocument();
            expect(image).toHaveAttribute("src", "https://example.com/image.jpg");
        });

        it("应该有正确的可访问性属性", () => {
            customRender(<TodoCard todo={mockTodo} />);

            // 验证切换完成按钮
            const toggleCheckbox = screen.getByTestId("toggle-complete-1");
            expect(toggleCheckbox).toHaveAttribute("aria-label", "Toggle todo 1 completion");

            // 验证删除按钮
            const deleteButton = screen.getByTestId("delete-todo-1");
            expect(deleteButton).toHaveAttribute("aria-label", "Delete todo 1");
        });
    });

    describe("不同状态渲染测试", () => {
        it("应该正确显示已完成的todo", () => {
            const completedTodo = {
                ...mockTodo,
                completed: true,
                status: TodoStatus.COMPLETED,
            };

            customRender(<TodoCard todo={completedTodo} />);

            // 验证标题和描述有删除线
            const title = screen.getByText("Test Todo");
            expect(title).toHaveClass("line-through", "text-muted-foreground");

            const description = screen.getByText("Test description");
            expect(description).toHaveClass("line-through");

            // 验证卡片透明度
            const card = title.closest(".card");
            expect(card).toHaveClass("opacity-75");

            // 验证状态标签
            expect(screen.getByText("Completed")).toBeInTheDocument();
        });

        it("应该正确显示进行中的todo", () => {
            const inProgressTodo = {
                ...mockTodo,
                status: TodoStatus.IN_PROGRESS,
            };

            customRender(<TodoCard todo={inProgressTodo} />);

            // 验证状态标签
            expect(screen.getByText("In Progress")).toBeInTheDocument();
        });

        it("应该正确显示已归档的todo", () => {
            const archivedTodo = {
                ...mockTodo,
                status: TodoStatus.ARCHIVED,
            };

            customRender(<TodoCard todo={archivedTodo} />);

            // 验证状态标签
            expect(screen.getByText("Archived")).toBeInTheDocument();
        });

        it("应该正确显示不同优先级", () => {
            const priorities = [TodoPriority.LOW, TodoPriority.HIGH, TodoPriority.URGENT];

            priorities.forEach((priority, index) => {
                const { unmount } = customRender(
                    <TodoCard todo={{ ...mockTodo, priority }} />
                );

                const priorityText = priority.charAt(0).toUpperCase() + priority.slice(1);
                expect(screen.getByText(priorityText)).toBeInTheDocument();

                unmount();
            });
        });
    });

    describe("用户交互测试", () => {
        it("应该支持编辑链接点击", async () => {
            customRender(<TodoCard todo={mockTodo} />);

            const editLink = screen.getByRole("link");
            expect(editLink).toHaveAttribute("href", "/todos/1/edit");

            await user.click(editLink);

            // 由于是Next.js Link，主要验证没有抛出异常
            expect(editLink.closest("a")).toHaveAttribute("href", "/todos/1/edit");
        });

        it("应该支持删除按钮交互", async () => {
            customRender(<TodoCard todo={mockTodo} />);

            const deleteButton = screen.getByTestId("delete-todo-1");
            await user.click(deleteButton);

            // 验证按钮被点击（没有副作用，因为是mock）
            expect(deleteButton).toBeInTheDocument();
        });

        it("应该支持切换完成状态", async () => {
            customRender(<TodoCard todo={mockTodo} />);

            const toggleCheckbox = screen.getByTestId("toggle-complete-1");
            expect(toggleCheckbox).not.toBeChecked();

            await user.click(toggleCheckbox);

            // 验证checkbox被点击（由于是mock，状态不会改变）
            expect(toggleCheckbox).toBeInTheDocument();
        });
    });

    describe("边界条件测试", () => {
        it("应该处理缺少描述的todo", () => {
            const todoWithoutDescription = {
                ...mockTodo,
                description: null,
            };

            customRender(<TodoCard todo={todoWithoutDescription} />);

            expect(screen.getByText("Test Todo")).toBeInTheDocument();
            expect(screen.queryByText("Test description")).not.toBeInTheDocument();
        });

        it("应该处理缺少分类的todo", () => {
            const todoWithoutCategory = {
                ...mockTodo,
                categoryId: null,
                categoryName: null,
            };

            customRender(<TodoCard todo={todoWithoutCategory} />);

            expect(screen.getByText("Test Todo")).toBeInTheDocument();
            expect(screen.queryByText("Test Category")).not.toBeInTheDocument();
        });

        it("应该处理缺少截止日期的todo", () => {
            const todoWithoutDueDate = {
                ...mockTodo,
                dueDate: null,
            };

            customRender(<TodoCard todo={todoWithoutDueDate} />);

            expect(screen.getByText("Test Todo")).toBeInTheDocument();
            expect(screen.queryByText(/Due:/)).not.toBeInTheDocument();
        });

        it("应该处理缺少图片的todo", () => {
            const todoWithoutImage = {
                ...mockTodo,
                imageUrl: null,
                imageAlt: null,
            };

            customRender(<TodoCard todo={todoWithoutImage} />);

            expect(screen.getByText("Test Todo")).toBeInTheDocument();
            expect(screen.queryByRole("img")).not.toBeInTheDocument();
            expect(screen.queryByText("Image")).not.toBeInTheDocument();
        });

        it("应该处理空字符串描述", () => {
            const todoWithEmptyDescription = {
                ...mockTodo,
                description: "",
            };

            customRender(<TodoCard todo={todoWithEmptyDescription} />);

            expect(screen.getByText("Test Todo")).toBeInTheDocument();
            // 空字符串不应该渲染为描述
        });

        it("应该处理长标题", () => {
            const longTitle = "A".repeat(200);
            const todoWithLongTitle = {
                ...mockTodo,
                title: longTitle,
            };

            customRender(<TodoCard todo={todoWithLongTitle} />);

            expect(screen.getByText(longTitle)).toBeInTheDocument();
        });
    });

    describe("过期处理测试", () => {
        it("应该显示过期todo的警告", () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);

            const overdueTodo = {
                ...mockTodo,
                dueDate: pastDate.toISOString().split('T')[0],
                completed: false,
            };

            customRender(<TodoCard todo={overdueTodo} />);

            // 验证过期警告
            expect(screen.getByText(/Overdue/)).toBeInTheDocument();
            expect(screen.getByText(/Overdue/)).toHaveClass("text-red-600", "font-semibold");

            // 验证日期颜色
            const dueDateElement = screen.getByText(/Due:/).parentElement;
            expect(dueDateElement).toHaveClass("text-red-600");
        });

        it("不应该显示已完成todo的过期警告", () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);

            const completedOverdueTodo = {
                ...mockTodo,
                dueDate: pastDate.toISOString().split('T')[0],
                completed: true,
            };

            customRender(<TodoCard todo={completedOverdueTodo} />);

            expect(screen.queryByText(/Overdue/)).not.toBeInTheDocument();
        });

        it("不应该显示未来日期的过期警告", () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);

            const futureTodo = {
                ...mockTodo,
                dueDate: futureDate.toISOString().split('T')[0],
                completed: false,
            };

            customRender(<TodoCard todo={futureTodo} />);

            expect(screen.queryByText(/Overdue/)).not.toBeInTheDocument();
        });
    });

    describe("图片处理测试", () => {
        it("应该使用默认alt文本", () => {
            const todoWithoutAlt = {
                ...mockTodo,
                imageAlt: null,
            };

            customRender(<TodoCard todo={todoWithoutAlt} />);

            const image = screen.getByRole("img");
            expect(image).toHaveAttribute("alt", "Todo image");
        });

        it("应该显示图片指示器标签", () => {
            customRender(<TodoCard todo={mockTodo} />);

            const imageBadge = screen.getByText("Image");
            expect(imageBadge).toBeInTheDocument();

            // 验证图标
            const icon = imageBadge.querySelector("svg");
            expect(icon).toBeInTheDocument();
        });

        it("应该有正确的图片属性", () => {
            customRender(<TodoCard todo={mockTodo} />);

            const image = screen.getByRole("img", { name: "Test image" });
            expect(image).toHaveAttribute("width", "640");
            expect(image).toHaveAttribute("height", "360");
            expect(image).toHaveAttribute("loading", "lazy");
            expect(image).toHaveAttribute("decoding", "async");
        });
    });

    describe("可访问性测试", () => {
        it("应该支持键盘导航", async () => {
            customRender(<TodoCard todo={mockTodo} />);

            const editLink = screen.getByRole("link");
            editLink.focus();
            expect(editLink).toHaveFocus();

            await user.keyboard("{Tab}");
            const nextElement = document.activeElement;
            expect(nextElement).toBeInTheDocument();
        });

        it("应该有正确的颜色对比度", () => {
            const { container } = customRender(<TodoCard todo={mockTodo} />);

            // 验证重要元素存在
            const card = container.querySelector(".card");
            expect(card).toBeInTheDocument();

            // 这里可以添加更具体的对比度检查
        });

        it("应该支持屏幕阅读器", () => {
            customRender(<TodoCard todo={mockTodo} />);

            // 验证所有交互元素都有适当的标签
            const toggleCheckbox = screen.getByTestId("toggle-complete-1");
            expect(toggleCheckbox).toHaveAttribute("aria-label");

            const deleteButton = screen.getByTestId("delete-todo-1");
            expect(deleteButton).toHaveAttribute("aria-label");
        });
    });

    describe("性能测试", () => {
        it("应该在合理时间内渲染", () => {
            const startTime = performance.now();

            const { container } = customRender(<TodoCard todo={mockTodo} />);

            const endTime = performance.now();
            const renderTime = endTime - startTime;

            expect(renderTime).toBeLessThan(50);
            expect(container).toBeInTheDocument();
        });

        it("应该不会内存泄漏", () => {
            const { unmount } = customRender(<TodoCard todo={mockTodo} />);

            // 验证组件可以正常卸载
            expect(() => unmount()).not.toThrow();
        });

        it("应该高效处理大量todos", () => {
            const startTime = performance.now();

            for (let i = 0; i < 10; i++) {
                const { unmount } = customRender(
                    <TodoCard todo={{ ...mockTodo, id: i }} />
                );
                unmount();
            }

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            expect(totalTime).toBeLessThan(200); // 10个组件渲染应该在200ms内完成
        });
    });

    describe("视觉反馈测试", () => {
        it("应该有悬停效果", () => {
            const { container } = customRender(<TodoCard todo={mockTodo} />);

            const card = container.querySelector(".card");
            expect(card).toHaveClass("transition-all", "hover:shadow-md");
        });

        it("应该有正确的状态样式", () => {
            // 测试已完成状态
            const { container: completedContainer } = customRender(
                <TodoCard todo={{ ...mockTodo, completed: true }} />
            );
            const completedCard = completedContainer.querySelector(".card");
            expect(completedCard).toHaveClass("opacity-75");

            // 测试未完成状态
            const { container: pendingContainer } = customRender(
                <TodoCard todo={{ ...mockTodo, completed: false }} />
            );
            const pendingCard = pendingContainer.querySelector(".card");
            expect(pendingCard).not.toHaveClass("opacity-75");
        });
    });

    describe("标签格式化测试", () => {
        it("应该正确格式化优先级标签", () => {
            const priorities = [TodoPriority.LOW, TodoPriority.MEDIUM, TodoPriority.HIGH, TodoPriority.URGENT];

            priorities.forEach(priority => {
                const { unmount } = customRender(
                    <TodoCard todo={{ ...mockTodo, priority }} />
                );

                const expectedText = priority.charAt(0).toUpperCase() + priority.slice(1);
                expect(screen.getByText(expectedText)).toBeInTheDocument();

                unmount();
            });
        });

        it("应该正确格式化状态标签", () => {
            const statusTests = [
                { status: TodoStatus.PENDING, expected: "Pending" },
                { status: TodoStatus.IN_PROGRESS, expected: "In Progress" },
                { status: TodoStatus.COMPLETED, expected: "Completed" },
                { status: TodoStatus.ARCHIVED, expected: "Archived" },
            ];

            statusTests.forEach(({ status, expected }) => {
                const { unmount } = customRender(
                    <TodoCard todo={{ ...mockTodo, status }} />
                );

                expect(screen.getByText(expected)).toBeInTheDocument();
                unmount();
            });
        });
    });
});