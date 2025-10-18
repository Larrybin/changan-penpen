# Design System Overview

> Draft written while aligning the UI/UX stack with the reference SaaS template.  
> Last updated: 2025-10-15

## 1. Theme Tokens

The global tokens live in `src/app/globals.css`. They already expose:

- **Color palette:** `--primary`, `--secondary`, `--muted`, `--accent`, `--sidebar-*`, status colors (`--color-success`, `--color-warning`, `--color-info`, `--color-danger`).
- **Typography & spacing:** `--token-font-family-sans`, `--token-spacing-*`, `--token-text-title`, etc.
- **Layout helpers:** `--container-max-w`, `--container-px`, `--grid-gap-section`.
- **Page layout:** `--layout-page-padding-y`, `--layout-sidebar-width` keep outer shells consistent across Admin/Marketing 页面。
- **Motion & focus:** `--token-motion-*`, `--token-focus-ring-*`.

Action items:

- [ ] Document any future token changes here to keep design + engineering aligned.
- [ ] Add dark-mode equivalents when we decide to support a dark theme.
- [ ] Publish a short table of “preferred spacing combinations” once the UI refactor lands.

## 2. Core Layout Components (to be shared)

| Component               | Location (Target)                         | Notes / TODO                                                                |
| ----------------------- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| `PageHeader`            | `src/components/layout/page-header.tsx`   | Replicate the reference layout (breadcrumbs, sidebar trigger, title block). |
| `PageContainer`         | `src/components/layout/page-container.tsx`| Provides responsive max-width + padding using design tokens.                |
| `SidebarLayout`         | `src/components/layout/sidebar-layout.tsx`| Wraps Admin pages, reuses existing `AdminShell`.                             |
| `DataTable`             | `src/components/data/data-table.tsx`      | Migrated with TanStack table, column toggles, server pagination support.    |
| Card variants           | `src/components/ui/card.tsx` (already)    | Ensure consistent padding / media queries.                                  |
| Skeleton loader         | `src/components/ui/skeleton.tsx` (new)    | Lightweight placeholder for loading states.                                 |

We will migrate Admin/User dashboard pages onto these components during Stage 1.

## 3. Usage Guidelines

1. **Page structure**
   - Use `<PageContainer>` to wrap page级内容，自动应用 `max-w-[var(--container-max-w)]`、`px-[var(--container-px)]` 与 `py-[var(--layout-page-padding-y)]`。
   - 主要内容区域统一采用 `flex flex-col gap-[var(--grid-gap-section)]` 的节奏。
2. **Cards & tables**
   - Use shadcn/ui cards for data blocks; ensure table headers are uppercase, 12px, `text-muted-foreground`.
   - All tables should render loading skeletons + empty states.
3. **Typography**
   - Titles: `text-title-sm` (`--token-text-title-sm`).
   - Subheadings: `text-subtitle`.
   - Body text: `text-sm` or `text-base` as default; secondary text uses `text-muted-foreground`.
4. **Responsive**
   - Grid layouts adopt `md:grid-cols-2/3` patterns; avoid hard-coded pixel values.

### Form controls

- **Checkbox** – `src/components/ui/checkbox.tsx`
  - Built on `@radix-ui/react-checkbox`; default size `16px` with `rounded-[4px]` corners and the shared focus-ring tokens. Keep labels wired via `FormField`/`FormItem` so `aria-describedby` works out of the box.
  - Visual states follow the token palette: checked state fills with `bg-primary`, invalid state uses the destructive ring helpers, and disabled state applies `opacity-50`.
  - When placing multiple checkboxes inline, wrap them with `flex gap-[var(--token-spacing-3)]` to preserve breathing room and align indicator + label baselines.
- **Select** – `src/components/ui/select.tsx`
  - The popover switches to a mobile-friendly bottom sheet automatically below the `640px` breakpoint. You can override via the new `mobileLayout` prop (`"auto" | "popover" | "sheet"`) if a screen needs a specific presentation.
  - Long option lists are capped by default using `mobileMaxHeight`; adjust per use case (e.g. `mobileMaxHeight={320}`) while keeping scrollable overflow for accessibility.
  - Reuse `SelectTrigger` with existing button variants when a chevron is not desired: pass `asChild` from the consumer and slot your own trigger component.
- **DropdownMenu types** – upstream `@radix-ui/react-dropdown-menu` already ships type definitions, so the legacy shim under `types/` has been removed. If the Radix API changes, prefer updating the package instead of maintaining a local declaration.
- **RadioGroup** – `src/components/ui/radio-group.tsx`
  - Now powered by `@radix-ui/react-radio-group` and styled with spacing tokens. `RadioGroupItem` accepts a `label` prop or child content, ensuring consistent indicator sizing and focus rings in both horizontal and vertical layouts.
- **Switch** – `src/components/ui/switch.tsx`
  - Wraps `@radix-ui/react-switch` with token-driven track/thumb sizing. Supports theming via CSS variables (`--switch-track-height/width`) while preserving focus rings and disabled state parity with the rest of the form controls.
- **NavigationMenu** – `src/components/ui/navigation-menu.tsx`
  - Provides a marketing-style mega menu using `NavigationMenuTrigger`, `NavigationMenuContent`, and a token-styled `NavigationMenuViewport`. Leans on Radix motion states to animate between panels while keeping focus management intact.
  - Pair `NavigationMenuLink` with `asChild` to slot existing buttons/links; use the exported `NavigationMenuIndicator` for the caret underline when the design calls for it.
- **Menubar** – `src/components/ui/menubar.tsx`
  - Covers application menu patterns (command bars, tool menus) with checkbox/radio helpers and shortcut slots. All menu surfaces reuse the shared popover tokens for borders, radius, and focus styling.
  - Attach the menubar to toolbars or table actions when a persistent navigation pattern is needed; triggers share the same button radius and focus ring tokens so they blend with other controls.

## 4. Roadmap & Checklist

- [ ] Stage 1 (Design System): port `PageHeader`, `DataTable`, grid spacing, skeleton loaders.
    - [x] Upgrade `DataTable` to the TanStack-powered version and apply it to the Admin users list page.
    - [x] 通过 `PageContainer` / `AdminShell` 应用布局 token，并在 Admin 用户详情页落地 Skeleton 加载态。
    - [x] Admin 仪表盘、积分流水与 Todo 列表接入 `PageHeader` + Skeleton，统一加载反馈。
    - [x] Admin 报表与租户列表/详情延伸同一布局与 Skeleton 体系。
- [ ] Stage 2 (Forms): unify `Form` components and convert existing forms.
- [ ] Stage 3 (Feedback): mount `sonner` provider, adopt `useServerAction + nuqs`.
- [ ] Stage 4 (Cleanup): re-run audit, document patterns, add Storybook snippets (optional).

Open to feedback—please update this document as the refactor progresses.
