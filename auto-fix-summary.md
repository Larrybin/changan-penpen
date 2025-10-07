## Auto-fix Summary
- Source workflow: Deploy Next.js App to Cloudflare (run #141)
- Run URL: https://github.com/Larrybin/fullstack-next-cloudflare-main/actions/runs/18304214193
- Head SHA: 2771db16d4c74b83fa09d420ba7b882659c88729

### Dependency install
+ next-intl 4.3.9
+ react 19.1.0
+ react-dom 19.1.0
+ react-hook-form 7.62.0
+ react-hot-toast 2.6.0
+ tailwind-merge 3.3.1
+ zod 4.1.8

devDependencies:
+ @biomejs/biome 2.2.4
+ @tailwindcss/postcss 4.1.13
+ @testing-library/jest-dom 6.9.1
+ @testing-library/react 16.3.0
+ @types/node 20.19.13
+ @types/react 19.1.12
+ @types/react-dom 19.1.9
+ drizzle-kit 0.31.4
+ jsdom 26.1.0
+ tailwindcss 4.1.13
+ tw-animate-css 1.3.8
+ typescript 5.9.2
+ vitest 1.6.1
+ wrangler 4.42.0

Done in 9.8s using pnpm v9.15.9
### biome format --write
Formatted 233 files in 126ms. Fixed 1 file.
### biome check --write
Checked 233 files in 742ms. Fixed 1 file.
### next lint --fix
? How would you like to configure ESLint? https://nextjs.org/docs/app/api-reference/config/eslint
[?25l❯  Strict (recommended)
   Base
   Cancel ⚠ If you set up ESLint yourself, we recommend adding the Next.js ESLint plugin. See https://nextjs.org/docs/app/api-reference/config/eslint#migrating-existing-config
### tsc --noEmit

### Command status
| Command | Result |
| --- | --- |
| pnpm install | success |
| pnpm dedupe | not-run |
| biome format --write | success |
| biome check --write | success |
| next lint --fix | failed |
| tsc --noEmit | success |
