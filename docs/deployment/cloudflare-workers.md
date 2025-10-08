# Cloudflare Workers 閮ㄧ讲鎵嬪唽

> 璇存槑鐢熶骇鐜鐨勯儴缃叉祦绋嬨€佸仴搴锋鏌ャ€佹暟鎹簱绛栫暐涓庡洖婊氭柟娉曘€傚搴斿伐浣滄祦浣嶄簬 `.github/workflows/deploy.yml`銆?

## 1. 娴佺▼鎬昏
閮ㄧ讲椤哄簭锛欳heckout 鈫?瀹夎渚濊禆 鈫?`pnpm run build`锛堣瘖鏂級鈫?`pnpm run build:cf` 鈫?澶囦唤 D1 鈫?搴旂敤杩佺Щ 鈫?`wrangler deploy` 鈫?鍚屾 Secrets锛堝彲閫夛級鈫?`/api/health?fast=1`銆?

- **鏋勫缓**锛歚@opennextjs/cloudflare build` 鐢熸垚 `.open-next` Worker 浜х墿銆?
- **閮ㄧ讲**锛歚wrangler deploy --env production`锛岄檮甯?`--var` 娉ㄥ叆杩愯鏃跺彉閲忋€?
- **鍋ュ悍妫€鏌?*锛歚curl /api/health?fast=1`锛岀‘淇濈粦瀹氫笌鐜鍙橀噺鐢熸晥銆?
- **鏃ュ織**锛氶€氳繃 `wrangler tail` 鎴?Cloudflare Dashboard 杩借釜銆?

## 2. 閮ㄧ讲鍓嶆鏌?
1. `pnpm lint`銆乣pnpm test` 鏈湴閫氳繃锛圕I 浜︿細鎵ц锛夈€?
2. 鑻ユ敼鍔ㄦ暟鎹簱锛岀‘璁よ縼绉诲凡鐢熸垚骞跺湪鏈湴鎵ц杩?`pnpm db:migrate:local`銆?
3. Secrets / Variables 宸插湪 GitHub Actions 涓?Cloudflare 涓洿鏂般€?
4. 鍙樻洿缁戝畾鍚庢墽琛?`pnpm cf-typegen`锛屾彁浜?`cloudflare-env.d.ts`銆?
5. 妫€鏌?`NEXT_PUBLIC_APP_URL` 鏄惁鎸囧悜鐪熷疄鍩熷悕锛堢敓浜х姝?localhost锛夈€?
6. `docs/deployment/cloudflare-workers.md`銆乣docs/env-and-secrets.md` 鏄惁宸插悓姝ユ洿鏂版祦绋嬩笌鐭╅樀銆?

## 3. 瑙﹀彂鏂瑰紡
- 鎺ㄩ€佸埌 `main`锛堝拷鐣ョ函鏂囨。鍙樻洿锛夈€?
- GitHub 鎵嬪姩杩愯 `Deploy Next.js App to Cloudflare`锛岄€夋嫨 `production` 鐩爣銆?
- 鏈湴璋冭瘯锛歚pnpm deploy:cf`锛堥渶瑕?Cloudflare 鐧诲綍涓庡繀瑕?Secrets锛夈€?

## 4. 鍋ュ悍妫€鏌ョ瓥鐣?
- 榛樿 `fast` 妯″紡鏍￠獙锛氱幆澧冨彉閲忋€丷2 缁戝畾銆乣NEXT_PUBLIC_APP_URL` 瑙ｆ瀽銆?
- 涓ユ牸妯″紡 `/api/health` 棰濆楠岃瘉 D1 鏌ヨ銆佸閮ㄦ湇鍔★紙Creem锛夛紝骞舵牴鎹幆澧冨彉閲?`HEALTH_REQUIRE_DB/R2/EXTERNAL` 鍐冲畾鏄惁闃绘柇銆?
- 鎺ㄨ崘鍛戒护锛?
  ```bash
  curl -fsS --retry 3 --retry-all-errors --retry-delay 5 \
    --connect-timeout 5 --max-time 20 \
    "https://<domain>/api/health?fast=1"
  ```
- 鑻ュ仴搴锋鏌ュけ璐ワ紝閮ㄧ讲浼氳繑鍥為潪 0锛岄渶鏌ョ湅 Worker 鏃ュ織鎴?Secrets 閰嶇疆銆?

## 5. 鏁版嵁搴撶瓥鐣?
1. 閮ㄧ讲鍓嶈嚜鍔ㄦ墽琛?`wrangler d1 export`锛岀敓鎴?`backup_prod_<timestamp>.sql` 骞朵笂浼犱负 artifact锛堜繚鐣?14 澶╋級銆?
2. 杩佺Щ姝ラ锛?
   ```bash
   wrangler d1 migrations apply next-cf-app --env production --remote
   wrangler d1 migrations list next-cf-app --env production --remote
   wrangler d1 execute next-cf-app --env production --remote \
     --command "SELECT name FROM sqlite_master WHERE type='table' AND name='site_settings';"
   ```
3. 鏂板杩佺Щ鍚庡姟蹇呭湪 PR 鎻忚堪闄勪笂鎵ц璇存槑锛屽苟纭繚鏈湴 / 杩滅▼鍧囬獙璇侀€氳繃銆?

## 6. 鍥炴粴娴佺▼
1. 绔嬪嵆鍋滄鑷姩鍖栵細鍏抽棴姝ｅ湪杩愯鐨?Deploy workflow 鎴栭樆姝㈣繘涓€姝ユ帹閫併€?
2. 浣跨敤 `wrangler deploy --env production --rollback <deployment-id>` 鍥炴粴浠ｇ爜銆?
3. 濡傞渶鎭㈠鏁版嵁搴擄紝涓嬭浇鏈€杩戠殑 `backup_prod_*.sql`锛屾墽琛?`wrangler d1 execute ... --file` 杩涜鎭㈠鎴栨墜鍔ㄥ鍏ャ€?
4. 鍦?`release.md` 涓庣浉鍏?Issue 涓褰曚簨鏁呫€佹仮澶嶆楠や笌鍚庣画鏀硅繘銆?

## 7. 鏃ュ織涓庡彲瑙傛祴鎬?
- `wrangler tail next-cf-app --env production`锛氬疄鏃?Worker 鏃ュ織銆?
- Cloudflare Dashboard 鈫?Workers 鈫?Deployments锛氭煡鐪嬪巻鍙茬増鏈笌娴侀噺鍥俱€?
- D1 Insights / Logs锛氭鏌ユ參鏌ヨ鎴栧け璐ャ€?
- 鑻ュ惎鐢?Sentry/Logpush锛岃鍦?`docs/health-and-observability.md` 涓悓姝ヨ鏄庛€?

## 8. 鏉冮檺涓?Secrets
- 蹇呴』鐨?GitHub Secrets锛歚CLOUDFLARE_API_TOKEN`銆乣CLOUDFLARE_ACCOUNT_ID`銆乣BETTER_AUTH_SECRET`銆乣GOOGLE_CLIENT_ID`銆乣GOOGLE_CLIENT_SECRET`銆乣CLOUDFLARE_R2_URL`銆乣CREEM_API_KEY`銆乣CREEM_WEBHOOK_SECRET`銆乣OPENAI_API_KEY`锛堣嫢鍚敤 AI锛夈€?
- 鍙€?Vars锛歚NEXT_PUBLIC_APP_URL`銆乣CREEM_API_URL_PRODUCTION`銆乣PRODUCTION_HEALTHCHECK_URL`銆乣SYNC_PRODUCTION_SECRETS`銆乣TRANSLATION_PROVIDER`銆乣OPENAI_BASE_URL`銆?
- `SYNC_PRODUCTION_SECRETS='true'` 鏃讹紝浼氳皟鐢?`wrangler secret put` 鍚屾 Secrets 鍒?Workers锛岃纭繚鏈湴/鐢熶骇鍙ｄ护涓€鑷淬€?

## 9. 瀹￠槄娓呭崟
- [ ] PR 鎻忚堪鍒楀嚭閮ㄧ讲褰卞搷銆佹暟鎹簱杩佺Щ涓庢枃妗ｆ洿鏂般€?
- [ ] `pnpm lint` / `pnpm test` / `pnpm build` 缁撴灉宸查檮涓娿€?
- [ ] 鏂板鎴栦慨鏀圭殑 Secrets / Vars 宸插湪 PR 涓爣璁帮紝骞跺湪 GitHub 璁剧疆瀹屾垚閰嶇疆銆?
- [ ] 蹇呰鐨勫仴搴锋鏌ユ楠わ紙鐧诲綍銆丆RUD銆佹敮浠樺洖璋冪瓑锛夊凡鍦?`docs/health-and-observability.md` 鏇存柊銆?
- [ ] 閮ㄧ讲鍚庢墽琛?`curl /api/health?fast=1` 骞跺皢缁撴灉闄勫湪璇勮鎴?Issue 涓€?

---

閮ㄧ讲绛栫暐濡傛湁璋冩暣锛岃鍦ㄥ悎骞跺墠鏇存柊鏈枃涓?`docs/workflows/deploy.md`锛屼繚鎸?Runbook 涓庤嚜鍔ㄥ寲娴佺▼涓€鑷淬€?

