"use client";

import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                // 基础样式
                "relative overflow-hidden",
                // 圆角令牌
                "rounded-[var(--token-radius-md)]",
                // 背景色令牌
                "bg-[var(--color-muted)]",
                // 现代渐变遮罩
                "before:-translate-x-full",
                "before:absolute",
                "before:inset-0",
                "before:bg-gradient-to-r before:from-transparent before:via-[var(--color-background)/60] before:to-transparent",
                "before:animate-[shimmer_2s_infinite]",
                // 渐入动画
                "fade-in",
                // 基础脉冲动画
                "animate-pulse",
                // 过渡动画
                "transition-[background-color,transform] duration-[var(--token-motion-duration-normal)] ease-[var(--token-motion-ease-standard)]",
                className,
            )}
            {...props}
        />
    );
}

export default Skeleton;
