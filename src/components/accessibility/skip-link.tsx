"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface SkipLinkProps {
  className?: string;
  customLinks?: Array<{
    href: string;
    label: string;
  }>;
}

/**
 * 跳转到主要内容的可访问性链接
 *
 * 功能：
 * - 为键盘用户提供快速跳转到主要内容的导航
 * - 支持自定义跳转链接
 * - 符合WCAG 2.1 AA级别标准
 * - 仅在获得焦点时显示
 *
 * 使用方法：
 * ```tsx
 * <SkipLink />
 * ```
 */
export function SkipLink({ className, customLinks = [] }: SkipLinkProps) {
  const pathname = usePathname();
  const t = useTranslations("Accessibility");

  // 默认跳转链接
  const defaultLinks = [
    { href: "#main-content", label: t("skipToMain") },
    { href: "#navigation", label: t("skipToNavigation") },
  ];

  // 合并默认和自定义链接
  const allLinks = [...defaultLinks, ...customLinks].filter(link => {
    // 检查目标元素是否存在于当前页面
    if (typeof document !== "undefined") {
      const target = document.querySelector(link.href);
      return target !== null;
    }
    return true; // 在SSR阶段假设存在
  });

  // 如果没有有效链接，不显示组件
  if (allLinks.length === 0) {
    return null;
  }

  return (
    <div className={cn("fixed top-0 left-0 z-[9999] flex flex-col gap-1", className)}>
      {allLinks.map((link, index) => (
        <a
          key={`${link.href}-${index}`}
          href={link.href}
          className="skip-link bg-primary text-primary-foreground px-4 py-2 text-sm font-medium rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={(e) => {
            e.preventDefault();
            const target = document.querySelector(link.href) as HTMLElement;
            if (target) {
              target.focus();
              target.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

/**
 * 焦点管理Hook
 * 用于管理模态框和下拉菜单的焦点陷阱
 */
export function useFocusTrap(isActive: boolean = false) {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isActive || event.key !== "Tab") return;

    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  return { handleKeyDown };
}

/**
 * 实时区域组件
 * 用于屏幕阅读器宣布动态内容变化
 */
export function LiveRegion({
  children,
  politeness = "polite",
  atomic = false,
  busy = false,
}: {
  children: React.ReactNode;
  politeness?: "polite" | "assertive" | "off";
  atomic?: boolean;
  busy?: boolean;
}) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      aria-busy={busy}
      className="sr-only live-region"
    >
      {children}
    </div>
  );
}

/**
 * 可访问性公告组件
 * 用于向屏幕阅读器用户宣布重要信息
 */
export function A11yAnnouncement({
  message,
  politeness = "polite",
  timeout = 1000,
}: {
  message: string;
  politeness?: "polite" | "assertive" | "off";
  timeout?: number;
}) {
  const [announcement, setAnnouncement] = React.useState<string>("");

  React.useEffect(() => {
    if (message) {
      setAnnouncement(message);
      const timer = setTimeout(() => {
        setAnnouncement("");
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [message, timeout]);

  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}

/**
 * 键盘导航增强Hook
 * 为组件添加键盘导航支持
 */
export function useKeyboardNavigation(
  items: Array<{ id: string; element?: HTMLElement }>,
  options: {
    loop?: boolean;
    orientation?: "horizontal" | "vertical";
  } = {}
) {
  const { loop = true, orientation = "vertical" } = options;
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);

  const handleKeyDown = (event: KeyboardEvent) => {
    const isVertical = orientation === "vertical";
    const nextKey = isVertical ? "ArrowDown" : "ArrowRight";
    const prevKey = isVertical ? "ArrowUp" : "ArrowLeft";

    switch (event.key) {
      case nextKey:
        event.preventDefault();
        setActiveIndex((prev) => {
          const next = prev + 1;
          return next >= items.length ? (loop ? 0 : prev) : next;
        });
        break;
      case prevKey:
        event.preventDefault();
        setActiveIndex((prev) => {
          const prevIndex = prev - 1;
          return prevIndex < 0 ? (loop ? items.length - 1 : prev) : prevIndex;
        });
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(items.length - 1);
        break;
      case "Escape":
        setActiveIndex(-1);
        break;
    }
  };

  React.useEffect(() => {
    if (activeIndex >= 0 && items[activeIndex]?.element) {
      items[activeIndex].element!.focus();
    }
  }, [activeIndex, items]);

  return { activeIndex, handleKeyDown, setActiveIndex };
}