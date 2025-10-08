# Workflow锛欴eploy Next.js App to Cloudflare锛圥roduction锛?

> 瀵瑰簲鏂囦欢锛歚.github/workflows/deploy.yml`銆傝礋璐ｅ湪閫氳繃璐ㄩ噺闂ㄥ悗锛屽皢 OpenNext 鏋勫缓鐨勫簲鐢ㄩ儴缃插埌 Cloudflare Workers銆?

## 瑙﹀彂
- `push` 鍒?`main`锛堝拷鐣ョ函鏂囨。鏀瑰姩锛夈€?
- `pull_request` 瑙﹀彂浠呯敤浜庨獙璇佽川閲忛棬锛堜笉浼氭墽琛岄儴缃诧級銆?
- `workflow_dispatch` 鏀寔鎵嬪姩杩愯鐢熶骇閮ㄧ讲銆?

## 骞跺彂涓庡鐢?
- `concurrency: deploy-${{ github.ref }}`锛氬悓涓€鍒嗘敮浠呬繚鐣欐渶鏂拌繍琛岋紝閬垮厤閲嶅閮ㄧ讲銆?
- 绗竴涓?Job `quality-gate-reusable` 鐩存帴 `uses: ./.github/workflows/ci.yml`锛屼笌 CI 淇濇寔瀹屽叏涓€鑷淬€?

## deploy-production Job 鎷嗚В
| 姝ラ | 璇存槑 |
| --- | --- |
| Checkout / Setup | 鍥哄畾 SHA 鐨?`actions/checkout`銆乣pnpm/action-setup`銆乣actions/setup-node`锛屽苟寮€鍚?pnpm 缂撳瓨銆?|
| Secrets 鏍￠獙 | 鑷畾涔夎剼鏈鏌ョ敓浜ч儴缃插繀椤荤殑 Secrets锛圕loudflare銆丄uth銆丷2銆丆reem锛夈€傜己澶辨椂鐩存帴澶辫触銆?|
| 妫€鏌?`NEXT_PUBLIC_APP_URL` | 绂佹鍦ㄧ敓浜т娇鐢?localhost銆?|
| 瀹夎渚濊禆 | 澶嶇敤 `./.github/actions/install-and-heal`锛坄pnpm install --frozen-lockfile`锛屽け璐ユ椂 `pnpm dedupe` 鍚庨噸璇曪級銆?|
| 鐢熸垚绫诲瀷 | `pnpm run cf-typegen` 鏇存柊 `cloudflare-env.d.ts`锛屼笌 Cloudflare 缁戝畾淇濇寔涓€鑷淬€?|
| 璇婃柇鏋勫缓 | `pnpm run build` 浣滀负鏃╂湡澶辫触淇″彿銆?|
| OpenNext 鏋勫缓 | `pnpm run build:cf` 鐢熸垚 `.open-next` Worker 浜х墿銆?|
| 澶囦唤鏁版嵁搴?| `wrangler d1 export`锛岀敓鎴?`backup_prod_<timestamp>.sql` 骞朵笂浼?artifact銆?|
| 杩佺Щ楠岃瘉 | `d1 migrations apply/list` 涓?`d1 execute` 鏍￠獙鍏抽敭琛ㄥ瓨鍦ㄣ€?|
| 閮ㄧ讲 | `wrangler deploy --env production --var ...`锛屽悓姝ュ繀瑕佺殑杩愯鏃跺彉閲忋€?|
| Secret 鍚屾 | 鏍规嵁 `vars.SYNC_PRODUCTION_SECRETS` 璋冪敤 `wrangler secret put`銆?|
| 鍋ュ悍妫€鏌?| `sleep 45` 鍚?`curl /api/health?fast=1`锛屾敮鎸佽嚜瀹氫箟 URL銆?|
| 鐗堟湰纭 | `wrangler-action --version`锛岀敤浜庤褰?CLI 鐗堟湰锛堟帓鏌ラ棶棰橈級銆?|

## Secrets / Vars
- **蹇呴』**锛圫ecrets锛夛細`CLOUDFLARE_API_TOKEN`銆乣CLOUDFLARE_ACCOUNT_ID`銆乣BETTER_AUTH_SECRET`銆乣GOOGLE_CLIENT_ID`銆乣GOOGLE_CLIENT_SECRET`銆乣CLOUDFLARE_R2_URL`銆乣CREEM_API_KEY`銆乣CREEM_WEBHOOK_SECRET`銆乣OPENAI_API_KEY`锛堣嫢浣跨敤 Workers AI / OpenAI锛夈€?
- **蹇呴』**锛圴ars锛夛細`NEXT_PUBLIC_APP_URL`锛堢敓浜у煙鍚嶏級銆?
- **鍙€?*锛歚CREEM_API_URL_PRODUCTION`銆乣PRODUCTION_HEALTHCHECK_URL`銆乣SYNC_PRODUCTION_SECRETS`銆乣TRANSLATION_PROVIDER`銆乣OPENAI_BASE_URL`銆?

## 甯歌澶辫触淇″彿
| 鍦烘櫙 | 鏃ュ織琛ㄧ幇 | 澶勭悊鍔炴硶 |
| --- | --- | --- |
| 蹇呰 Secrets 缂哄け | `Production deployment aborted. Missing secrets: ...` | 鍦ㄤ粨搴?Settings 鈫?Secrets and variables 鈫?Actions 琛ラ綈銆?|
| `pnpm run build` 澶辫触 | Next.js 鏋勫缓鎶ラ敊 | 鏈湴澶嶇幇锛岀‘璁や緷璧栥€佺幆澧冨彉閲忔垨 API 鍏煎鎬с€?|
| 杩佺Щ澶辫触 | Wrangler 姝ラ閫€鍑虹爜闈?0锛屾棩蹇楀寘鍚?SQL 閿欒 | 妫€鏌?`src/drizzle` 杩佺Щ涓庣洰鏍囨暟鎹簱鐘舵€併€?|
| 鍋ュ悍妫€鏌ュけ璐?| `curl` 杩斿洖闈?2xx 鎴栬秴鏃?| 浣跨敤 `wrangler tail`銆乣/api/health` JSON 鎺掓煡鐜鍙橀噺/缁戝畾銆?|
| Secret 鍚屾澶辫触 | `wrangler secret put` 鎶涢敊 | 纭 API Token 鏄惁鍏峰 `Workers Scripts:Edit` 鏉冮檺銆?|

## 鍥炴粴
1. 璁板綍澶辫触閮ㄧ讲鐨?commit / Deployment ID銆?
2. 鍦?Cloudflare Dashboard 鎴?CLI 鎵ц `wrangler deploy --env production --rollback <id>`銆?
3. 鑻ユ暟鎹簱鍙楀奖鍝嶏紝涓嬭浇瀵瑰簲 artifact 骞舵墽琛屾仮澶嶏紙鍙傝€?`docs/deployment/cloudflare-workers.md`锛夈€?
4. 鍦?`release.md` 涓庣浉鍏?Issue 涓ˉ鍏呬簨鏁呰褰曘€?

## 鍚庣画鏀硅繘寤鸿
- 鏀寔 Canary/Preview 鐜锛氬紩鍏ラ澶?`env.<name>` 閰嶇疆涓庤Е鍙戞潯浠躲€?
- 澧炲姞 D1 缁撴瀯 diff 鎶ュ憡鎴?Slack 閫氱煡銆?
- 瑙嗛渶瑕佹帴鍏?Playwright 鍐掔儫娴嬭瘯锛屾斁鍦ㄥ仴搴锋鏌ヤ箣鍚庛€?

---

淇敼宸ヤ綔娴佹椂锛屽姟蹇呭悓姝ユ洿鏂版湰鏂囥€乣docs/deployment/cloudflare-workers.md` 涓?`docs/ci-cd.md`锛屼繚鎸佹枃妗ｄ笌鑷姩鍖栦竴鑷淬€?

