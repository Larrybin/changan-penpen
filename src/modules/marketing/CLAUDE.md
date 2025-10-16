[根目录](../../../../CLAUDE.md) > [src/modules](../../) > **marketing**

# Marketing 模块 - 营销页面系统

## 模块职责

负责项目的公共营销页面，包括着陆页、关于页面、联系方式等，专注于品牌展示和用户转化。

## 入口与启动

### 核心入口文件
- **Landing Page**: `landing.page.tsx` - 主要营销着陆页
- **Services**: `services/sitemap.service.ts` - SEO 和站点地图服务

### 页面路由
- `/` - 营销着陆页（根路径）
- `/about` - 关于我们页面
- `/contact` - 联系方式页面
- `/privacy` - 隐私政策页面
- `/terms` - 服务条款页面

## 对外接口

### 着陆页组件
```typescript
// landing.page.tsx
export default function MarketingLandingPage({
  appUrl: string,
  structuredDataImage: string,
  siteName?: string,
}: MarketingLandingPageProps): JSX.Element
```

### Sitemap 服务
```typescript
// services/sitemap.service.ts
export async function generateSitemap(): Promise<string>
export async function getSitemapEntries(): Promise<SitemapEntry[]>
```

## 关键依赖与配置

### 核心依赖
- **next-intl**: 国际化支持
- **next/script**: 脚本优化加载
- **@/components/ui**: UI 组件库
- **@/lib/seo**: SEO 工具函数

### 国际化配置
- 支持多语言：`en`, `de`, `fr`, `pt`
- 动态语言切换
- 本地化内容管理

### SEO 配置
- 结构化数据 (JSON-LD)
- 元标签优化
- Open Graph 支持
- 多语言 SEO

## 组件架构

### 主要组件
- `MarketingLandingPage` - 主着陆页
- `PublicHeader` - 公共页头
- `PublicFooter` - 公共页脚
- `Playground` - 产品演示区

### 功能区块
- **Hero Section**: 主标题区域
- **Features Section**: 功能特性展示
- **Why Section**: 选择理由
- **FAQ Section**: 常见问题
- **CTA Section**: 行动号召

### UI 组件使用
- `Card`, `CardContent` - 内容卡片
- `Button` - 行动按钮
- `Badge` - 标签徽章
- `Separator` - 分隔线

## 样式系统

### 设计 Tokens
```css
/* 营销页面专用设计变量 */
--background: #000000;
--foreground: #fefce8;
--border: #facc15;
--primary: var(--token-color-accent);
--button-bg: var(--token-color-accent);
--button-fg: #000;
--accent: var(--token-color-accent);
--accent-foreground: #000;
--font-family-sans: var(--font-inter);
```

### 色彩主题
- **主色调**: 黑色背景 + 黄色强调色
- **品牌色**: `#facc15` (黄色)
- **文字色**: `#fefce8` (浅黄)
- **渐变效果**: 按钮和卡片悬停效果

### 响应式设计
```css
/* 容器设置 */
--container-max-w: 1200px;
--container-px: 1rem;
--grid-gap-section: 2rem;

/* 响应式网格 */
grid xs:grid-cols-2 lg-narrow:grid-cols-3
```

## 国际化 (i18n)

### 支持语言
- **English (en)**: 默认语言
- **Deutsch (de)**: 德语
- **Français (fr)**: 法语
- **Português (pt)**: 葡萄牙语

### 翻译结构
```typescript
// i18n 消息结构
interface MarketingMessages {
  hero: {
    title: string;
    description: string;
    badge: string;
    emoji: string;
    primaryCta: string;
    secondaryCta: string;
    support: Record<string, string>;
  };
  features: {
    title: string;
    items: Array<{
      title: string;
      description: string;
    }>;
  };
  why: {
    title: string;
    items: Array<{
      title: string;
      description: string;
    }>;
  };
  faq: {
    title: string;
    items: Array<{
      question: string;
      answer: string;
    }>;
  };
  cta: {
    title: string;
    description: string;
    primaryCta: string;
  };
  structuredData: {
    name: string;
    description: string;
    tagline: string;
    featureList: string[];
  };
}
```

## SEO 优化

### 结构化数据
```typescript
const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: t("structuredData.name"),
  url: appUrl,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  description: t("structuredData.description"),
  featureList: t.raw("structuredData.featureList") as string[],
  image: structuredDataImage,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: currency,
  },
  // ... 更多结构化数据字段
};
```

### Meta 标签
- 动态标题生成
- 描述优化
- 关键词标签
- Open Graph 标签
- Twitter Card 支持

### Sitemap 生成
- 自动生成站点地图
- 多语言页面支持
- 优先级和更新频率设置

## 性能优化

### 脚本优化
```typescript
// 使用 Next.js Script 组件
<Script
  id="marketing-structured-data"
  type="application/ld+json"
>
  {JSON.stringify(structuredData)}
</Script>
```

### 图片优化
- Next.js Image 组件
- 响应式图片
- 懒加载支持
- WebP 格式支持

### 字体优化
- Google Fonts 集成
- 字体预加载
- FOUT/FOIT 优化

## 内容管理

### 静态内容
- 翻译文件: `src/i18n/messages/[lang].json`
- 组件硬编码内容
- 配置化内容管理

### 动态内容
- 产品特性列表
- 价格信息
- FAQ 内容
- 用户评价

## 营销功能

### 转化优化
- 清晰的行动号召 (CTA)
- 多个转化入口
- A/B 测试支持
- 用户行为追踪

### 社交证明
- 用户评价展示
- 使用统计
- 客户案例
- 社交媒体集成

### 邮件营销集成
- 邮件订阅表单
- 潜客收集
- 自动化邮件序列

## 分析与追踪

### 页面分析
- Google Analytics 集成
- 用户行为追踪
- 转化漏斗分析
- 热图分析

### 性能监控
- Core Web Vitals
- 页面加载时间
- 用户交互性能
- 错误监控

## 测试与质量

### 测试覆盖
- ⚠️ **组件测试**: 需补充营销组件测试
- ⚠️ **国际化测试**: 需补充多语言测试
- ⚠️ **SEO 测试**: 需补充 SEO 验证测试
- ⚠️ **性能测试**: 需补充页面性能测试

### 质量保证
- 多语言内容验证
- 链接完整性检查
- 图片优化验证
- 可访问性检查

## 可访问性 (Accessibility)

### ARIA 支持
- 语义化 HTML 结构
- 键盘导航支持
- 屏幕阅读器优化
- 高对比度支持

### 用户体验
- 清晰的导航结构
- 一致的交互模式
- 错误状态处理
- 加载状态反馈

## 常见问题 (FAQ)

### Q: 如何添加新的营销页面？
A: 在 `src/app/` 下创建新页面目录，复用公共组件和样式。

### Q: 如何自定义品牌色彩？
A: 修改 `landing.page.tsx` 中的 CSS 变量和设计 tokens。

### Q: 如何添加新的支持语言？
A: 在 i18n 配置中添加新语言，创建对应的翻译文件。

### Q: 如何优化页面加载性能？
A: 使用 Next.js Image、Script 组件，优化资源加载顺序。

### Q: 如何集成第三方营销工具？
A: 在组件中添加相应脚本，或使用 Next.js Script 组件。

## 相关文件清单

### 核心文件
- `landing.page.tsx` - 主着陆页
- `services/sitemap.service.ts` - SEO 服务

### 组件文件
- `components/public-header.tsx` - 公共页头
- `components/public-footer.tsx` - 公共页脚
- `components/playground.tsx` - 产品演示区

### 页面文件
- `../../app/(marketing)/page.tsx` - 首页
- `../../app/about/page.tsx` - 关于页面
- `../../app/contact/page.tsx` - 联系页面
- `../../app/privacy/page.tsx` - 隐私政策
- `../../app/terms/page.tsx` - 服务条款

### i18n 文件
- `../../i18n/messages/en.json` - 英文翻译
- `../../i18n/messages/de.json` - 德文翻译
- `../../i18n/messages/fr.json` - 法文翻译
- `../../i18n/messages/pt.json` - 葡文翻译

### 样式文件
- `../../app/globals.css` - 全局样式
- CSS 变量定义在组件内部

## 使用示例

### 创建新的营销页面
```typescript
// src/app/features/page.tsx
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PublicHeader } from "@/modules/marketing/components/public-header";
import { PublicFooter } from "@/modules/marketing/components/public-footer";

export default function FeaturesPage() {
  const t = useTranslations("Features");

  return (
    <div className="min-h-screen">
      <PublicHeader />

      <main className="py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-8">
            {t("title")}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 功能内容 */}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
```

### 添加新的翻译键
```json
// src/i18n/messages/en.json
{
  "Features": {
    "title": "Product Features",
    "subtitle": "Everything you need to succeed",
    "items": [
      {
        "title": "Feature 1",
        "description": "Description of feature 1"
      }
    ]
  }
}
```

### 自定义样式主题
```typescript
// 创建不同的主题变体
const lightTheme = {
  "--background": "#ffffff",
  "--foreground": "#000000",
  "--primary": "#3b82f6",
};

const darkTheme = {
  "--background": "#000000",
  "--foreground": "#ffffff",
  "--primary": "#facc15",
};

// 在组件中应用主题
<div style={isDarkMode ? darkTheme : lightTheme}>
  {/* 内容 */}
</div>
```

## 下一步开发计划

### 短期目标
- [ ] 添加组件单元测试
- [ ] 优化移动端体验
- [ ] 集成分析工具
- [ ] 添加 A/B 测试支持

### 长期目标
- [ ] 内容管理系统 (CMS) 集成
- [ ] 个性化内容推荐
- [ ] 高级 SEO 功能
- [ ] 多地区本地化

---

## 变更记录 (Changelog)

### 2025-10-16 01:48:57 - 文档初始化
- ✅ 创建营销模块文档
- ✅ 组件架构和样式系统说明
- ✅ 国际化和 SEO 配置描述
- ✅ 营销功能特性说明
- 📋 待完成：补充测试用例和性能优化

---

*此文档由AI自动生成，请根据实际代码变化及时更新。*