## Auto-fix Summary
- Source workflow: CI (run #38)
- Run URL: https://github.com/Larrybin/fullstack-next-cloudflare-main/actions/runs/18332049195
- Head SHA: 218abd21523ee02eca8152b46996d872b78da557

### Dependency install
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
+ @vitest/coverage-v8 3.2.4
+ drizzle-kit 0.31.4
+ jsdom 27.0.0
+ tailwindcss 4.1.13
+ tw-animate-css 1.3.8
+ typescript 5.9.2
+ vitest 3.2.4
+ wrangler 4.42.0

Done in 9.4s using pnpm v9.15.9
### biome format --write
Formatted 246 files in 131ms. No fixes applied.
### biome check --write
Checked 246 files in 761ms. No fixes applied.
### tsc --noEmit
src/modules/admin/providers/__tests__/auth-provider.test.ts(5,25): error TS2558: Expected 0-1 type arguments, but got 2.
src/modules/admin/providers/__tests__/data-provider.test.ts(5,25): error TS2558: Expected 0-1 type arguments, but got 2.
src/modules/admin/providers/__tests__/data-provider.test.ts(28,30): error TS2722: Cannot invoke an object which is possibly 'undefined'.
src/modules/admin/providers/__tests__/data-provider.test.ts(28,30): error TS18048: 'adminDataProvider.getList' is possibly 'undefined'.
src/modules/admin/providers/__tests__/data-provider.test.ts(63,30): error TS2722: Cannot invoke an object which is possibly 'undefined'.
src/modules/admin/providers/__tests__/data-provider.test.ts(63,30): error TS18048: 'adminDataProvider.getList' is possibly 'undefined'.
src/modules/admin/providers/__tests__/data-provider.test.ts(65,36): error TS2353: Object literal may only specify known properties, and 'perPage' does not exist in type 'Pagination'.
src/modules/admin/providers/__tests__/data-provider.test.ts(80,13): error TS2722: Cannot invoke an object which is possibly 'undefined'.
src/modules/admin/providers/__tests__/data-provider.test.ts(102,15): error TS2722: Cannot invoke an object which is possibly 'undefined'.
src/modules/admin/providers/__tests__/data-provider.test.ts(113,15): error TS2722: Cannot invoke an object which is possibly 'undefined'.
src/modules/admin/providers/__tests__/data-provider.test.ts(129,30): error TS2722: Cannot invoke an object which is possibly 'undefined'.
src/modules/admin/providers/__tests__/data-provider.test.ts(129,30): error TS18048: 'adminDataProvider.deleteOne' is possibly 'undefined'.
src/modules/admin/providers/__tests__/data-provider.test.ts(148,30): error TS2722: Cannot invoke an object which is possibly 'undefined'.
src/modules/admin/providers/__tests__/data-provider.test.ts(148,30): error TS18048: 'adminDataProvider.custom' is possibly 'undefined'.
src/modules/creem/services/__tests__/billing.service.test.ts(43,49): error TS2322: Type 'Promise<TestDatabase>' is not assignable to type 'Promise<DrizzleD1Database<typeof import("/home/runner/work/fullstack-next-cloudflare-main/fullstack-next-cloudflare-main/src/db/schema")> & { $client: D1Database; }>'.
  Type 'TestDatabase' is not assignable to type 'DrizzleD1Database<typeof import("/home/runner/work/fullstack-next-cloudflare-main/fullstack-next-cloudflare-main/src/db/schema")> & { $client: D1Database; }'.
    Property 'batch' is missing in type 'BetterSQLite3Database<typeof import("/home/runner/work/fullstack-next-cloudflare-main/fullstack-next-cloudflare-main/src/db/index")>' but required in type 'DrizzleD1Database<typeof import("/home/runner/work/fullstack-next-cloudflare-main/fullstack-next-cloudflare-main/src/db/schema")>'.
src/modules/creem/services/__tests__/usage.service.test.ts(31,49): error TS2322: Type 'Promise<TestDatabase>' is not assignable to type 'Promise<DrizzleD1Database<typeof import("/home/runner/work/fullstack-next-cloudflare-main/fullstack-next-cloudflare-main/src/db/schema")> & { $client: D1Database; }>'.
  Type 'TestDatabase' is not assignable to type 'DrizzleD1Database<typeof import("/home/runner/work/fullstack-next-cloudflare-main/fullstack-next-cloudflare-main/src/db/schema")> & { $client: D1Database; }'.
    Property 'batch' is missing in type 'BetterSQLite3Database<typeof import("/home/runner/work/fullstack-next-cloudflare-main/fullstack-next-cloudflare-main/src/db/index")>' but required in type 'DrizzleD1Database<typeof import("/home/runner/work/fullstack-next-cloudflare-main/fullstack-next-cloudflare-main/src/db/schema")>'.
src/modules/todos/services/__tests__/category.service.test.ts(33,49): error TS2322: Type 'Promise<TestDatabase>' is not assignable to type 'Promise<DrizzleD1Database<typeof import("/home/runner/work/fullstack-next-cloudflare-main/fullstack-next-cloudflare-main/src/db/schema")> & { $client: D1Database; }>'.
  Type 'TestDatabase' is not assignable to type 'DrizzleD1Database<typeof import("/home/runner/work/fullstack-next-cloudflare-main/fullstack-next-cloudflare-main/src/db/schema")> & { $client: D1Database; }'.
    Property 'batch' is missing in type 'BetterSQLite3Database<typeof import("/home/runner/work/fullstack-next-cloudflare-main/fullstack-next-cloudflare-main/src/db/index")>' but required in type 'DrizzleD1Database<typeof import("/home/runner/work/fullstack-next-cloudflare-main/fullstack-next-cloudflare-main/src/db/schema")>'.
src/modules/todos/services/__tests__/todo.service.test.ts(58,49): error TS2322: Type 'Promise<TestDatabase>' is not assignable to type 'Promise<DrizzleD1Database<typeof import("/home/runner/work/fullstack-next-cloudflare-main/fullstack-next-cloudflare-main/src/db/schema")> & { $client: D1Database; }>'.
  Type 'TestDatabase' is not assignable to type 'DrizzleD1Database<typeof import("/home/runner/work/fullstack-next-cloudflare-main/fullstack-next-cloudflare-main/src/db/schema")> & { $client: D1Database; }'.
    Property 'batch' is missing in type 'BetterSQLite3Database<typeof import("/home/runner/work/fullstack-next-cloudflare-main/fullstack-next-cloudflare-main/src/db/index")>' but required in type 'DrizzleD1Database<typeof import("/home/runner/work/fullstack-next-cloudflare-main/fullstack-next-cloudflare-main/src/db/schema")>'.
src/modules/todos/services/__tests__/todo.service.test.ts(100,13): error TS2322: Type 'string' is not assignable to type 'number'.
tests/fixtures/db.ts(1,49): error TS7016: Could not find a declaration file for module 'better-sqlite3'. '/home/runner/work/fullstack-next-cloudflare-main/fullstack-next-cloudflare-main/node_modules/.pnpm/better-sqlite3@12.2.0/node_modules/better-sqlite3/lib/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/better-sqlite3` if it exists or add a new declaration (.d.ts) file containing `declare module 'better-sqlite3';`
tests/fixtures/db.ts(44,41): error TS7016: Could not find a declaration file for module 'better-sqlite3'. '/home/runner/work/fullstack-next-cloudflare-main/fullstack-next-cloudflare-main/node_modules/.pnpm/better-sqlite3@12.2.0/node_modules/better-sqlite3/lib/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/better-sqlite3` if it exists or add a new declaration (.d.ts) file containing `declare module 'better-sqlite3';`
tests/fixtures/db.ts(54,43): error TS7016: Could not find a declaration file for module 'better-sqlite3'. '/home/runner/work/fullstack-next-cloudflare-main/fullstack-next-cloudflare-main/node_modules/.pnpm/better-sqlite3@12.2.0/node_modules/better-sqlite3/lib/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/better-sqlite3` if it exists or add a new declaration (.d.ts) file containing `declare module 'better-sqlite3';`
tests/fixtures/db.ts(117,13): error TS2322: Type 'number' is not assignable to type 'Date'.
tests/fixtures/db.ts(118,13): error TS2322: Type 'number' is not assignable to type 'Date'.
