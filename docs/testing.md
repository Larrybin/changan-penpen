# 娴嬭瘯绛栫暐锛圱esting Strategy锛?
鏈粨搴撳凡闆嗘垚 Vitest 娴嬭瘯鏍堬紝骞跺湪 CI 涓繍琛屻€備互涓嬬粰鍑虹幇鐘躲€佺害瀹氫笌瀹炶返寤鸿锛岀‘淇濆姛鑳藉叿澶囧彲鍥炲綊鎬с€?
## 1. 鐜扮姸姒傝
- 杩愯鍣細Vitest 3锛坄vitest`锛?- 鏂█涓庡尮閰嶅櫒锛歚@testing-library/jest-dom`锛堝湪 `vitest.setup.ts` 閫氳繃 `@testing-library/jest-dom/vitest` 鍚敤锛?- 缁勪欢娴嬭瘯锛歚@testing-library/react`
- DOM 鐜锛歚jsdom`锛坴27锛?- 閰嶇疆锛歚vitest.config.ts` 浣跨敤 `environment: "jsdom"`銆乣setupFiles: "./vitest.setup.ts"`銆乣globals: true`锛屽苟閰嶇疆鍒悕 `@ -> src`
- 绀轰緥鐢ㄤ緥锛歚src/modules/auth/components/__tests__/` 涓?3 涓粍浠舵祴璇曟枃浠?- CI锛歚.github/workflows/ci.yml` 涓寘鍚?鈥淭est (Vitest)鈥?姝ラ锛坄pnpm test`锛?
## 2. 鎺ㄨ崘宸ュ叿涓庣害瀹?- 娴嬭瘯杩愯鍣細Vitest锛堣交閲忋€佷笌 Vite 鐢熸€佸吋瀹癸級
- 鏂█鎵╁睍锛歚@testing-library/jest-dom`
- 缁勪欢娴嬭瘯锛歚@testing-library/react`
- Mock锛氫紭鍏堜娇鐢ㄦā鍧楃骇鍒殑 `vi.mock()`锛涘澶栭儴缃戠粶璋冪敤浣跨敤鑷畾涔?`fetch` mock 鎴?`msw`
- 鍛藉悕涓庝綅缃細娴嬭瘯鏂囦欢涓庤娴嬪崟鍏冨悓鐩綍锛屽懡鍚?`*.test.ts` / `*.test.tsx`

## 3. 鍩虹鍛戒护
```bash
pnpm test                  # 鍗曟杩愯
pnpm test -- --watch       # 鐩戝惉妯″紡
pnpm test -- -u            # 鏇存柊蹇収锛堝鏈夛級
```

## 4. 娴嬭瘯鍒嗗眰
| 绫诲瀷 | 鍦烘櫙 | 绾﹀畾 |
| --- | --- | --- |
| 鍗曞厓娴嬭瘯 | 绾嚱鏁?/ utils / hooks | Vitest + 绾?mock锛岄伩鍏嶈闂湡瀹炲閮ㄤ緷璧?|
| 缁勪欢娴嬭瘯 | UI 缁勪欢 / 琛ㄥ崟 | 浣跨敤 RTL锛坄render`/`screen`/`user-event`锛夛紝灏戦噺蹇収锛屼粎鐢ㄤ簬鍏抽敭缁撴瀯 |
| Server Action | `src/modules/*/actions` | 閫氳繃 `vi.mock()` 妯℃嫙 Auth銆丏1/R2 绛夎竟鐣屼緷璧?|
| 闆嗘垚娴嬭瘯锛堝彲閫夛級 | API Route | 鐩存帴璋冪敤 handler 鎴栦娇鐢ㄩ€傞厤宸ュ叿锛堟寜闇€寮曞叆锛?|

## 5. Mock 绛栫暐
- D1锛氬彲鐢ㄥ唴瀛?SQLite锛堝 `better-sqlite3`锛夋垨灏佽娴嬭瘯宸ュ巶锛堜緥濡?`createTestDb()`锛?- R2锛氱敤绠€鍗曠殑 in-memory Map 瀹炵幇 `get`/`put` 鎺ュ彛
- Workers AI锛氳繑鍥炲浐瀹氬搷搴旓紝閬垮厤鐪熷疄璋冪敤
- Auth锛氬湪 `tests/fixtures/` 涓嬮泦涓瀯閫犱吉 session 涓庝笂涓嬫枃锛堝悗缁ˉ鍏咃級

## 6. 浠ｇ爜瑕嗙洊鐜?- Provider锛歚v8`锛坄@vitest/coverage-v8`锛?- Reporter锛歚text`銆乣html`
- 缁熻鑼冨洿锛歚src/modules/**`銆乣src/services/**`銆乣src/lib/**`
- 鎺掗櫎锛氭祴璇曟枃浠躲€乣__tests__` 鐩綍銆乣mocks/`銆乣stories/`銆佸０鏄庢枃浠?- `vitest.config.ts` 涓殑鍏抽敭鐗囨锛?```ts
coverage: {
    provider: "v8",
    reporter: ["text", "html", "json-summary"],
    reportsDirectory: "coverage",
    all: true,
    include: [
        "src/modules/**/*.{ts,tsx}",
        "src/services/**/*.{ts,tsx}",
        "src/lib/**/*.{ts,tsx}",
        "src/app/**/route.ts",
    ],
    exclude: [
        "**/__tests__/**",
        "src/**/?(*.)test.ts?(x)",
        "src/modules/**/mocks/**",
        "src/modules/**/stories/**",
        "src/lib/stubs/**",
        "**/*.page.tsx",
        "**/*.layout.tsx",
        "**/*.d.ts",
    ],
    thresholds: {
        lines: 3,
        statements: 3,
        branches: 10,
        functions: 10,
    },
},
```
- 杩愯鍛戒护锛歚pnpm test -- --coverage`
- 濡傞渶鍚敤鍩轰簬 D1 鐨勫唴瀛樻暟鎹簱澶瑰叿锛坄tests/fixtures/db.ts`锛夛紝璇风‘淇濇湰鍦板凡鎵ц `pnpm rebuild better-sqlite3` 浠ョ紪璇戝師鐢熺粦瀹氥€?
## 7. 璺嚎鍥?- 鐜扮姸锛氬凡鎻愪緵 3 涓粍浠舵祴璇曟牱渚嬶紙Auth 琛ㄥ崟/鎸夐挳锛?- 杩戞湡锛氫负鍏抽敭 Server Actions 涓庢牳蹇?`utils` 澧炲姞鍗曟祴
- 涓湡锛氳ˉ榻愭ā鍧楃骇闆嗘垚娴嬭瘯銆侀敊璇満鏅笌鏉冮檺鏍￠獙
- 杩滄湡锛氭寜闇€寮曞叆 E2E锛圥laywright锛夌敤浜庡仴搴锋鏌ヤ笌鍏抽敭鐢ㄦ埛鏃呯▼

## 8. 甯歌闂
- `ReferenceError: Request is not defined`锛氬湪 Node 娴嬭瘯鐜涓己灏?Workers API锛涗负浣跨敤澶勬坊鍔?polyfill 鎴栧湪娴嬭瘯涓?mock
- 缁勪欢娴嬭瘯鎵句笉鍒伴€夋嫨鍣細浼樺厛浣跨敤鍙闂€ф煡璇紙`getByRole`/`getByLabelText`锛?- 蹇収棰戠箒鍙樺寲锛氬噺灏?UI 缁嗚妭蹇収锛屼繚鐣欐渶灏忕粨鏋勬柇瑷€

---

鎻愪氦鏂板姛鑳芥椂锛岃鍚屾琛ュ厖鎴栨洿鏂扮浉搴旀祴璇曪紝骞跺湪 PR 鎻忚堪涓檮涓?`pnpm test` 缁撴灉锛圕I 浼氳嚜鍔ㄦ墽琛岋級銆?
# Testing Strategy

This repository uses Vitest for unit and component tests and runs them in CI. This guide describes the current setup, conventions, and practical tips to keep features regression‑safe.

## 1) Current Setup
- Test runner: Vitest 3 (`vitest`)
- Assertions: `@testing-library/jest-dom` (enabled in `vitest.setup.ts` via `@testing-library/jest-dom/vitest`)
- Component tests: `@testing-library/react`
- DOM environment: `jsdom`
- Config: `vitest.config.ts` sets `environment: "jsdom"`, `setupFiles: "./vitest.setup.ts"`, `globals: true`, and alias `@ -> src`
- Example tests: see `src/modules/auth/components/__tests__/` and other module tests
- CI: `.github/workflows/ci.yml` includes a “Test (Vitest)” step (`pnpm test`)

## 2) Recommended Tools & Conventions
- Runner: Vitest (fast, Vite‑friendly)
- Assertions: `@testing-library/jest-dom`
- Components: `@testing-library/react` with `user-event`
- Mocks: prefer `vi.mock()` at the module boundary; for network use light `fetch` stubs or `msw` when needed
- File placement: co‑locate tests with sources and name them `*.test.ts` / `*.test.tsx`

## 3) Commands
```bash
pnpm test                  # one‑off run
pnpm test -- --watch       # watch mode
pnpm test -- -u            # update snapshots (if any)
pnpm test -- --coverage    # explicit coverage (coverage is enabled by default in config)
```

## 4) Test Layers
| Type | Scope | Guidance |
| --- | --- | --- |
| Unit | pure functions / utils / hooks | Vitest + mocks; avoid real external deps |
| Component | UI components / forms | RTL (`render`/`screen`/`user-event`); keep snapshots minimal for structural checks only |
| Server Action | `src/modules/*/actions` | Mock boundaries (Auth, D1/R2, Workers AI) with `vi.mock()` |
| Integration (optional) | API routes | Call the handler directly; add adapters only if needed |

## 5) Mocking Guidelines
- D1: use in‑memory SQLite (e.g., `better-sqlite3`) or a small factory (`createTestDb()`)
- R2: in‑memory map for `get`/`put`
- Workers AI: return fixed payloads; don’t hit real endpoints
- Auth: centralize fake sessions and contexts under `tests/fixtures/` (to be expanded)
- Cloudflare env: mock `@opennextjs/cloudflare` → `getCloudflareContext`
- Next APIs: mock `next/navigation` (`redirect`) and `next/headers` (`cookies`) where needed

## 6) Coverage
Coverage is configured in `vitest.config.ts` and enabled by default.

```ts
coverage: {
    enabled: true,
    provider: "v8",
    reporter: ["text", "html", "json-summary"],
    reportsDirectory: "coverage",
    all: true,
    include: [
        "src/modules/**/*.{ts,tsx}",
        "src/services/**/*.{ts,tsx}",
        "src/lib/**/*.{ts,tsx}",
        "src/app/**/route.ts",
    ],
    exclude: [
        "**/__tests__/**",
        "src/**/?(*.)test.ts?(x)",
        "src/modules/**/mocks/**",
        "src/modules/**/stories/**",
        "src/lib/stubs/**",
        "**/*.page.tsx",
        "**/*.layout.tsx",
        "**/*.d.ts",
    ],
    thresholds: {
        lines: 3,
        statements: 3,
        branches: 10,
        functions: 10,
    },
},
```

Notes:
- Coverage output: text summary in console, full HTML under `coverage/`
- We commit `coverage/coverage-summary.json` only (see `.gitignore`), not the full HTML output
- If using `better-sqlite3` fixtures locally, remember `pnpm rebuild better-sqlite3` to compile native bindings

## 7) Roadmap
- Now: examples exist for auth UI and core service utilities
- Near term: unit tests for critical Server Actions and core `utils`
- Mid term: module‑level integration tests, error paths, and permissions
- Long term: selective E2E (Playwright) for health checks and key user journeys

## 8) Troubleshooting
- `ReferenceError: Request is not defined`: Node test env lacks Workers APIs; polyfill at use sites or mock in tests
- Can’t find component selectors: use accessibility queries (`getByRole`, `getByLabelText`)
- Flaky/large snapshots: reduce; prefer explicit assertions on structure and text

---

When adding features, include or update tests and paste `pnpm test` output in the PR description (CI runs it automatically).
