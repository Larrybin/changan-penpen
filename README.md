![Banner](banner.svg)

# Full-Stack Next.js + Cloudflare Template

[![CI](https://github.com/ifindev/fullstack-next-cloudflare/actions/workflows/ci.yml/badge.svg)](https://github.com/ifindev/fullstack-next-cloudflare/actions/workflows/ci.yml) [![Deploy](https://github.com/ifindev/fullstack-next-cloudflare/actions/workflows/deploy.yml/badge.svg)](https://github.com/ifindev/fullstack-next-cloudflare/actions/workflows/deploy.yml) ![Docs](https://img.shields.io/badge/docs-up_to_date-1E90FF)

Production-ready template for building full-stack applications on Next.js 15 + Cloudflare Workers. Covers D1, R2, Workers AI, authentication, CI/CD, automatic healing, and health checks so teams can scale from MVP to enterprise with edge-first performance.

---

## TL;DR锛? 鍒嗛挓璺戣捣鏉ワ級
1. `pnpm install`
2. `cp .dev.vars.example .dev.vars` 骞惰ˉ鍏?Cloudflare / Auth 閰嶇疆
3. `pnpm dev`
4. 鎵撳紑 `http://localhost:3000`

闇€瑕佺敓浜ч儴缃诧紵鍓嶅線 Actions 瑙﹀彂 `Deploy` 宸ヤ綔娴侊紝鎴栨墽琛?`pnpm deploy:cf`銆備娇鐢?`gh run watch` 璺熻釜 CI 鐘舵€併€?

---

## 鏍稿績鐗规€?
- Edge 鍘熺敓浣撻獙锛歄penNext 鏋勫缓锛岄儴缃插埌 Cloudflare Workers锛?00+ PoP锛?
- 鏁版嵁灞?+ 瀛樺偍锛欳loudflare D1 + R2锛屼娇鐢?Drizzle ORM 灏佽
- CI/CD 濂椾欢锛欱iome Lint銆乂itest锛堝凡闆嗘垚锛夈€佺敓浜у彂甯?
- 鑷姩淇 & 鍚堝苟锛歚auto-fix` + `auto-merge-lite` 宸ヤ綔娴佹敮鎸佺櫧鍚嶅崟婊氬姩 PR
- 鍋ュ悍妫€鏌ワ細`/api/health` fast/strict 妯″紡锛岄儴缃插墠鑷姩楠岃瘉
- Observability锛歐orkers Analytics銆佸彲閫?Sentry銆佹棩蹇楄仛鍚?
- 鍥介檯鍖栦笌 AI 缈昏瘧锛氬唴缃璇█涓?Gemini/OpenAI 缈昏瘧鑴氭湰

---

## 蹇€熸寚鍗?

### 鏈湴寮€鍙?
- `pnpm dev`锛歂ode runtime 蹇€熻凯浠?
- `pnpm dev:cf`锛歄penNext + Wrangler锛屾ā鎷?Workers 琛屼负
- `pnpm lint` / `pnpm test`锛氭彁浜ゅ墠璐ㄩ噺闂紙宸叉彁渚涘熀纭€鍗曟祴锛?
- 璇︾粏璋冭瘯璇存槑瑙?`docs/local-dev.md`

### 鐢熶骇閮ㄧ讲
- 榛樿瀵?`main` 鍒嗘敮 push 瑙﹀彂 `Deploy` 宸ヤ綔娴?
- 鑷姩鎵ц锛氭瀯寤?鈫?杩佺Щ 鈫?鍋ュ悍妫€鏌ワ紙`/api/health?fast=1`锛夆啋 鍙戝竷
- 澶辫触浼氳Е鍙戝洖婊氫笌閫氱煡锛岃瑙?`docs/deployment/cloudflare-workers.md`

---

## 鏋舵瀯涓€瑙?
- App Router锛氱粍缁囧湪 `src/app`锛屾寜 `(segment)` 鍒囧垎鏉冮檺
- 涓氬姟妯″潡锛歚src/modules/<feature>` 鎻愪緵 actions/components/services 绛夊垎灞?
- 鏁版嵁璁块棶锛歚src/db` + `src/drizzle` 缁存姢 Schema 涓庤縼绉?
- 鍏变韩鑳藉姏锛歚src/lib` 灏佽 Cloudflare binding銆佹棩蹇椼€佺紦瀛樼瓑宸ュ叿
- 鏇村璇︽儏锛氬弬瑙?`docs/architecture-overview.md`

---

## 鏂囨。鍦板浘
| 涓婚 | 鏂囨。 |
| --- | --- |
| 蹇€熷紑濮?| `docs/getting-started.md` |
| 鏈湴璋冭瘯 | `docs/local-dev.md` |
| 鐜/瀵嗛挜鐭╅樀 | `docs/env-and-secrets.md` |
| 娴嬭瘯绛栫暐 | `docs/testing.md` |
| 閮ㄧ讲娴佺▼ | `docs/deployment/cloudflare-workers.md` |
| CI/CD | `docs/ci-cd.md`锛圡3-M4 琛ラ綈锛?|
| 瑙傚療鎬т笌鍋ュ悍 | `docs/health-and-observability.md` |
| 鏁呴殰鎺掓煡 | `docs/troubleshooting.md` |
| 璐＄尞瑙勮寖 | `docs/contributing.md` |
| 鍏ㄩ噺绱㈠紩 | `docs/00-index.md` |

---

## 娴嬭瘯
- 杩愯锛歚pnpm test`锛堝崟娆★級銆乣pnpm test -- --watch`锛堢洃鍚級
- 鎶€鏈爤锛歏itest 3 + jsdom + Testing Library锛坄@testing-library/react` / `@testing-library/jest-dom`锛?
- 閰嶇疆鏂囦欢锛歚vitest.config.ts`銆乣vitest.setup.ts`锛堝凡璁剧疆 `globals: true` 涓?`@ -> src` 鍒悕锛?
- 绀轰緥鐢ㄤ緥锛歚src/modules/auth/components/__tests__/` 涓嬬殑 3 涓粍浠舵祴璇?
- CI 闆嗘垚锛歚.github/workflows/ci.yml` 宸插寘鍚?鈥淭est (Vitest)鈥?姝ラ

---

## 鑷姩鍖栦笌 DevOps
- `.github/workflows/ci.yml`锛欱iome銆乀ypeScript銆乂itest
- `.github/workflows/deploy.yml`锛氱敓浜ч儴缃叉祦姘寸嚎锛屽寘鍚暟鎹簱杩佺Щ銆佸仴搴锋鏌?
- `.github/workflows/auto-fix.yml`锛氶拡瀵圭櫧鍚嶅崟鏂囦欢鑷姩鍒涘缓淇 PR
- `.github/workflows/auto-merge-lite.yml`锛氭弧瓒虫潯浠惰嚜鍔ㄥ悎骞?
- `.github/workflows/ops-notify.yml`锛氬け鏁?鎭㈠鏃堕€氱煡骞剁淮鎶?Tracker Issue

鏇村缁嗚妭鍙婃潈闄愮煩闃碉紝璇峰弬鑰?`docs/ci-cd.md` 涓?`docs/workflows/*.md`锛堟寜閲岀▼纰戦€愭瀹屽杽锛夈€?

---

## 璐＄尞 & 绀惧尯
- 閬靛惊 TypeScript銆丳ascalCase 缁勪欢銆丅iome 椋庢牸
- 璐＄尞娴佺▼銆丳R 妯℃澘銆佹祴璇曡姹傦細瑙?`docs/contributing.md`
- 鑻ヤ慨鏀?Cloudflare 缁戝畾鎴栧伐浣滄祦锛屽姟蹇呭悓姝ユ洿鏂扮浉鍏虫枃妗ｅ苟鍦?PR 鎻忚堪涓鏄?

娆㈣繋 Issues / PR锛屽苟浣跨敤 `gh run watch` 闄勪笂 CI 缁撴灉锛屼究浜?Reviewer 蹇€熼獙璇併€?

---


## 提交/推送前自动检查（团队约定）

为确保提交质量并减少来回修复，我们在本地与 CI 均启用了统一的自检流程：

- 提交前（pre-commit）
  - 仅对暂存文件运行 Biome 自动修复（lint-staged）
  - 运行 TypeScript 类型检查（	sc --noEmit）
- 推送前（pre-push）
  - 运行 check:all（Biome 检查 + TSC）
  - 快速执行关键用例（itest -t "health|creem"，默认不阻断，可按需改为强制）
- 一键自检与推送
  - pnpm push：自动执行 Biome 自动修复 → 生成 Cloudflare 类型 → TSC → Biome 严检 → 自动提交变更 → rebase 并 push。

常用脚本：

- pnpm biome:apply：自动修复格式/简单问题
- pnpm typecheck：生成 CF 类型并做 TSC 检查
- pnpm check:all：Biome 检查 + TSC
- pnpm push：本地一键修复+检查+推送

注意事项：

- 若新增/调整 Cloudflare 绑定或密钥，提交前先执行 pnpm cf-typegen 或直接跑 pnpm typecheck（已包含）
- 未使用的 catch (error) 请写作 catch (_error) 以避免告警
- 严禁随意使用 ny，读取 env 请用受限类型收窄或 CloudflareEnv

---
## 璁稿彲

MIT 漏 2025 Muhammad Arifin
