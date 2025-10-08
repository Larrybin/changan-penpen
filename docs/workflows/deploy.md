# Workflow锛欴eploy Next.js App to Cloudflare锛圥roduction锛?

> 浣嶇疆锛歚.github/workflows/deploy.yml`銆傝礋璐ｄ富骞茬敓浜ч儴缃诧紝鍐呯疆璐ㄩ噺闂ㄣ€佹暟鎹簱杩佺Щ銆佸浠戒笌鍋ュ悍妫€鏌ャ€?

## 瑙﹀彂
- `push` 鍒?`main`
- `workflow_dispatch`锛堟墜鍔級

## 骞跺彂涓庡鐢?
- `concurrency: deploy-${{ github.ref }}` 閬垮厤骞惰閮ㄧ讲锛?
- 棣栦釜 Job `quality-gate-reusable` 鐩存帴 `uses: ./.github/workflows/ci.yml`锛屽畬鍏ㄥ鐢?CI銆?

## 鐢熶骇閮ㄧ讲锛坄deploy-production`锛?
1. 澶囦唤 D1锛歚wrangler d1 export` 骞朵笂浼?Artifact锛堜繚鐣?14 澶╋級锛?
2. 搴旂敤杩佺Щ + 鏍￠獙鍏抽敭琛紱
3. `wrangler deploy --env production`锛堜紶鍏?`CREEM_API_URL`銆乣NEXT_PUBLIC_APP_URL` 绛夛級锛?
4. 鍙€夊悓姝?Secrets锛氱敱 `vars.SYNC_PRODUCTION_SECRETS` 鎺у埗锛?
5. 绛夊緟 45s 鍚庢墽琛屽仴搴锋鏌ワ細`curl /api/health?fast=1`銆?

## Secrets / Vars
- 鍙傝 `docs/env-and-secrets.md` 涓殑鐭╅樀锛?
- 棰濆鍙橀噺锛?
  - `PRODUCTION_HEALTHCHECK_URL`锛堝彲閫夛紝瑕嗙洊榛樿 URL锛夛紱
  - `SYNC_PRODUCTION_SECRETS`锛坴ar锛屽瓧绗︿覆 `'true'` 鏃跺惎鐢?secret sync锛夛紱
  - `CREEM_API_URL_PRODUCTION`锛坴ar锛岀敓浜т笓鐢級銆?

## 鏉冮檺
- 榛樿浣跨敤 `GITHUB_TOKEN` + Cloudflare API Token锛堥渶 `Workers`, `D1`, `R2` 鏉冮檺锛夛紱
- 涓婁紶 Artifact锛歚actions/upload-artifact`锛?
- 鎵€鏈?Action 鍧囬攣瀹?commit SHA锛屼繚璇侀噸澶嶆瀯寤轰竴鑷淬€?

## 甯歌澶辫触椤?
| 姝ラ | 鎸囨爣 | 淇 |
| --- | --- | --- |
| Secret 妫€鏌?| Step 杈撳嚭 `Missing secrets` | 琛ラ綈 GitHub Secrets |
| Migrations | `wrangler` 鍛戒护闈?0 | 妫€鏌?SQL / Token 鏉冮檺 |
| 鍋ュ悍妫€鏌?| `curl` 杩斿洖闈?200 | 鏌ョ湅閮ㄧ讲鏃ュ織/`/api/health` JSON |
| Build | `pnpm build:cf` 澶辫触 | 鍏堝湪鏈湴璺戦€?`pnpm build:cf` |

## 鍥炴粴
- 閮ㄧ讲澶辫触 鈫?workflow 缁堟 鈫?瑙﹀彂 ``锛?
- 鍙湪 Cloudflare Dashboard 鈫?Workers 鈫?Deployments 閫夋嫨鍘嗗彶鐗堟湰鍥炴粴锛?
- 鏁版嵁搴撲娇鐢ㄥ浠芥枃浠?`backup_prod_<timestamp>.sql`銆?

## 鎵╁睍寤鸿
- 鍙姞鍏?Canary 姝ラ锛堟寜鏍囩閮ㄧ讲閮ㄥ垎娴侀噺锛夛紱
- 闇€瑕佸鐜鏃舵墿灞?`env.<name>` 鑺傜偣涓?CLI flags锛?
- 鑻ュ紑鍚?Playwright/鍚堟垚鐩戞帶锛屽湪鐢熶骇閮ㄧ讲鍚庤拷鍔?job銆?

---

淇敼閮ㄧ讲娴佺▼鏃讹紝璇峰悓姝ユ洿鏂?`docs/deployment/cloudflare-workers.md` 涓庢湰鏂囦欢锛岀‘淇濇枃妗ｄ笌宸ヤ綔娴佷竴鑷淬€?


