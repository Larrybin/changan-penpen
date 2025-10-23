"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const Table = React.forwardRef<
    HTMLTableElement,
    React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
    <div className={cn(
        // 基础容器样式
        "relative w-full overflow-auto",
        // 圆角和边框
        "rounded-[var(--token-radius-card,var(--token-radius-md))] border border-[var(--color-border,var(--color-muted-foreground)/10)]",
        // 阴影
        "shadow-[var(--shadow-sm)]",
        // 渐入动画
        "fade-in"
    )}>
        <table
            ref={ref}
            className={cn(
                // 基础表格样式
                "w-full caption-bottom",
                // 排版令牌
                "text-[var(--token-text-sm)] leading-[var(--token-line-height-normal)]",
                // 边框-collapse
                "border-separate border-spacing-0",
                // 渐入动画
                "fade-in",
                className
            )}
            {...props}
        />
    </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <thead
        ref={ref}
        className={cn(
            // 表头基础样式
            "bg-[var(--color-muted)]/30",
            // 边框样式
            "[&_tr]:border-b-[var(--color-border,var(--color-muted-foreground)/10)] [&_tr:last-child]:border-b-0",
            // 渐入动画
            "fade-in",
            className
        )}
        {...props}
    />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <tbody
        ref={ref}
        className={cn(
            // 表体基础样式
            "[&_tr:last-child]:border-b-0",
            // 分割线样式
            "[&_tr]:border-b border-[var(--color-border,var(--color-muted-foreground)/5)]",
            // 渐入动画
            "fade-in",
            className
        )}
        {...props}
    />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <tfoot
        ref={ref}
        className={cn(
            // 表脚基础样式
            "border-t border-[var(--color-border,var(--color-muted-foreground)/10)]",
            // 背景色
            "bg-[var(--color-muted)]/50",
            // 排版
            "font-[var(--token-font-weight-medium)] text-[var(--color-foreground)]",
            // 边框处理
            "[&>tr]:last:border-b-0 [&>tr]:border-b border-[var(--color-border,var(--color-muted-foreground)/5)]",
            // 内边距
            "[&>tr>th]:p-[var(--token-spacing-4)] [&>tr>td]:p-[var(--token-spacing-4)]",
            // 渐入动画
            "fade-in",
            className
        )}
        {...props}
    />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
    HTMLTableRowElement,
    React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
    <tr
        ref={ref}
        className={cn(
            // 基础行样式
            "transition-[background-color,color,border-color] duration-[var(--token-motion-duration-fast)] ease-[var(--token-motion-ease-standard)]",
            // 悬停状态
            "hover:bg-[var(--color-accent)]/40 data-[state=selected]:bg-[var(--color-accent)]/60",
            // 边框
            "border-b border-[var(--color-border,var(--color-muted-foreground)/5)]",
            // 过渡动画
            "color-transition",
            // 最后一个行样式
            "last:border-b-0",
            className
        )}
        {...props}
    />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
    HTMLTableCellElement,
    React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
    <th
        ref={ref}
        className={cn(
            // 表头单元格样式
            "align-middle font-[var(--token-font-weight-semibold)] text-[var(--color-muted-foreground)]",
            // 内边距令牌
            "px-[var(--token-spacing-4)] py-[var(--token-spacing-3)]",
            // 文本对齐
            "text-left",
            // 垂直居中
            "align-middle",
            // 特殊处理checkbox列
            "[&:has([role=checkbox])]:pr-0 [&:has([role=checkbox])]:w-[var(--token-spacing-10)]",
            // 渐入动画
            "fade-in",
            className
        )}
        {...props}
    />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
    HTMLTableCellElement,
    React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
    <td
        ref={ref}
        className={cn(
            // 表格单元格样式
            "align-middle text-[var(--color-foreground)]",
            // 内边距令牌
            "p-[var(--token-spacing-4)]",
            // 垂直居中
            "align-middle",
            // 过渡动画
            "color-transition transition-[background-color,color] duration-[var(--token-motion-duration-fast)] ease-[var(--token-motion-ease-standard)]",
            // 特殊处理checkbox列
            "[&:has([role=checkbox])]:pr-0",
            // 渐入动画
            "fade-in",
            className
        )}
        {...props}
    />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
    HTMLTableCaptionElement,
    React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
    <caption
        ref={ref}
        className={cn(
            // 表格标题样式
            "mt-[var(--token-spacing-4)] text-[var(--token-text-sm)] leading-[var(--token-line-height-normal)]",
            // 颜色令牌
            "text-[var(--color-muted-foreground)]",
            // 文本对齐
            "text-left",
            // 渐入动画
            "fade-in",
            className
        )}
        {...props}
    />
));
TableCaption.displayName = "TableCaption";

// 额外的Table组件变体
const TableActions = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            // 表格操作区域
            "flex items-center justify-between gap-[var(--token-spacing-4)]",
            // 内边距
            "px-[var(--token-spacing-4)] py-[var(--token-spacing-3)]",
            // 边框
            "border-b border-[var(--color-border,var(--color-muted-foreground)/10)]",
            // 背景色
            "bg-[var(--color-muted)]/20",
            // 圆角（仅顶部）
            "rounded-t-[var(--token-radius-card,var(--token-radius-md))]",
            // 渐入动画
            "fade-in",
            className
        )}
        {...props}
    />
));
TableActions.displayName = "TableActions";

const TableEmpty = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            // 空状态容器
            "flex flex-col items-center justify-center gap-[var(--token-spacing-3)]",
            // 内边距
            "p-[var(--token-spacing-8)]",
            // 文本样式
            "text-[var(--token-text-sm)] text-[var(--color-muted-foreground)] text-center",
            // 渐入动画
            "fade-in",
            className
        )}
        {...props}
    />
));
TableEmpty.displayName = "TableEmpty";

const TableLoading = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            // 加载状态容器
            "flex items-center justify-center gap-[var(--token-spacing-2)]",
            // 内边距
            "p-[var(--token-spacing-6)]",
            // 文本样式
            "text-[var(--token-text-sm)] text-[var(--color-muted-foreground)]",
            // 渐入动画
            "fade-in",
            className
        )}
        {...props}
    />
));
TableLoading.displayName = "TableLoading";

export {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
    TableCaption,
    TableActions,
    TableEmpty,
    TableLoading,
};