"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ImageOptimizerProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
  decorative?: boolean; // 装饰性图片
}

/**
 * SEO优化的图片组件
 *
 * 使用方法：
 * ```tsx
 * <ImageOptimizer
 *   src="/hero-image.webp"
 *   alt="专业的SaaS产品管理平台界面展示"
 *   width={800}
 *   height={400}
 *   priority={isLCPImage}
 *   sizes="(max-width: 768px) 100vw, 50vw"
 *   className="rounded-lg"
 * />
 * ```
 */
export function ImageOptimizer({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  quality = 85,
  placeholder = "blur",
  blurDataURL,
  onLoad,
  onError,
  style,
  decorative = false,
  ...props
}: ImageOptimizerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // 生成默认的blurDataURL（简单的渐变占位符）
  const generateBlurDataURL = useCallback(() => {
    if (blurDataURL) return blurDataURL;

    // 生成简单的SVG占位符
    const svg = `
      <svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <rect width="100%" height="100%" fill="url(#gradient)"/>
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#e5e7eb;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#d1d5db;stop-opacity:1" />
          </linearGradient>
        </defs>
      </svg>
    `;

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }, [width, height, blurDataURL]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  }, [onError]);

  // 验证alt文本（SEO要求）
  if (!decorative && !alt.trim()) {
    console.warn('ImageOptimizer: alt文本不能为空，请提供描述性的alt属性', { src });
  }

  // 装饰性图片的处理
  if (decorative) {
    return (
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        width={width}
        height={height}
        fill={fill}
        sizes={sizes}
        quality={quality}
        placeholder="empty"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        style={style}
        {...props}
      />
    );
  }

  // 错误状态显示
  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted border border-dashed border-border rounded-md",
          className
        )}
        style={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
          ...style,
        }}
        role="img"
        aria-label={alt}
      >
        <span className="text-muted-foreground text-sm">图片加载失败</span>
      </div>
    );
  }

  // 正常图片显示
  return (
    <div className={cn("relative", fill && "absolute inset-0")}>
      {isLoading && (
        <div
          className={cn(
            "absolute inset-0 bg-muted animate-pulse rounded-md",
            className
          )}
          aria-hidden="true"
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        sizes={sizes}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={placeholder === "blur" ? generateBlurDataURL() : undefined}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        style={style}
        {...props}
      />
    </div>
  );
}

// 预设的常用尺寸配置
export const ImageSizes = {
  // Hero图片（全宽）
  hero: "(max-width: 768px) 100vw, 85vw",

  // 卡片图片
  card: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",

  // 缩略图
  thumbnail: "(max-width: 768px) 100vw, 150px",

  // 头像
  avatar: "64px",

  // 图标
  icon: "24px",

  // 内容图片
  content: "(max-width: 768px) 100vw, 800px",
} as const;

// 便捷的组件变体
export function HeroImage(props: Omit<ImageOptimizerProps, "sizes" | "priority">) {
  return <ImageOptimizer {...props} sizes={ImageSizes.hero} priority />;
}

export function CardImage(props: Omit<ImageOptimizerProps, "sizes">) {
  return <ImageOptimizer {...props} sizes={ImageSizes.card} />;
}

export function ThumbnailImage(props: Omit<ImageOptimizerProps, "sizes">) {
  return <ImageOptimizer {...props} sizes={ImageSizes.thumbnail} />;
}

export function AvatarImage(props: Omit<ImageOptimizerProps, "sizes">) {
  return <ImageOptimizer {...props} sizes={ImageSizes.avatar} />;
}

export function DecorativeImage(props: Omit<ImageOptimizerProps, "alt" | "decorative">) {
  return <ImageOptimizer {...props} decorative />;
}