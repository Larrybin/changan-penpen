# Cloudflare Workers 閮ㄧ讲鎵嬪唽

> 鏈枃瀹氫箟鐢熶骇閮ㄧ讲鐨勬爣鍑嗘祦绋嬨€佽川閲忛椄闂ㄤ笌鍥炴粴绛栫暐銆侰I 宸ヤ綔娴佷綅浜?`.github/workflows/deploy.yml`銆?

## 1. 鎬昏
娴佺▼椤哄簭锛歚Checkout 鈫?Setup PNPM 鈫?Install 鈫?Build (OpenNext) 鈫?DB Migrate 鈫?Deploy 鈫?Health Check 鈫?閫氱煡`

- **鏋勫缓**锛歚@opennextjs/cloudflare build` 鐢熸垚 `.open-next`
- **鍙戝竷**锛歚wrangler deploy`锛堢敓浜?`--env production`锛?
- **鍋ュ悍妫€鏌?*锛歚/api/health?fast=1`
- **鏃ュ織**锛欳loudflare Workers Dashboard銆乣wrangler tail`

## 2. 棰勯儴缃叉鏌ワ紙鎵嬪姩/CI锛?
1. 纭繚 `pnpm lint`銆乣pnpm test`锛堣嫢鏈夛級閫氳繃
2. 杩佺Щ鏂囦欢涓?`src/db/schema.ts` 涓€鑷?
3. Secrets/Variables 宸插湪 GitHub Actions & Wrangler 涓洿鏂?
4. 杩愯 `pnpm cf-typegen` 鍚庢彁浜?`cloudflare-env.d.ts`
5. 鍑嗗鍋ュ悍妫€鏌ユ墍闇€璧勬簮锛圧2/D1/AI锛?

## 3. 瑙﹀彂鏂瑰紡
-锛堝凡绉婚櫎棰勮閮ㄧ讲锛?
- **鐢熶骇**锛?
  ```bash
  pnpm deploy:cf                # CLI
  gh workflow run deploy.yml -f target=production
  git push origin main          # 榛樿瑙﹀彂
  ```

## 4. 鍋ュ悍妫€鏌?
- 鍒濆鍙墽琛?fast 妯″紡锛歚GET https://<domain>/api/health?fast=1`
- Fast 妯″紡鏍￠獙锛?
  - Cloudflare bindings 宸插姞杞?
  - 蹇呴渶鐜鍙橀噺瀛樺湪
  - R2/AI 杩炴帴灏辩华锛堣交閲忔帰娴嬶級
- Strict 妯″紡锛堜汉宸?澶滈棿浠诲姟鎵ц锛夛細`/api/health`锛岄澶栨鏌?D1 鏌ヨ銆佸閮ㄤ緷璧?
- 寤鸿鍦?`health-and-observability.md` 涓淮鎶?curl 绀轰緥锛?
  ```bash
  curl -fsS --retry 3 --connect-timeout 2 --max-time 5 \
    "https://<domain>/api/health?fast=1"
  ```

## 5. 杩佺Щ绛栫暐
2. 鐢熶骇閮ㄧ讲鍓嶏細`pnpm db:migrate:prod`
3. 鑻ユ秹鍙婄牬鍧忔€у彉鏇达紝闇€鍦?`release.md` 闄勪笂鍥炴粴 SQL / 澶囦唤璁″垝

## 6. 鍥炴粴娴佺▼
1. 鍋ュ悍妫€鏌ュけ璐?鈫?宸ヤ綔娴佽嚜鍔ㄦ爣璁板け璐ュ苟瑙﹀彂 ``
2. 鎵嬪姩鎵ц `wrangler deploy --env production --rollback <id>` 鎴栧湪 Dashboard 閫夋嫨鍘嗗彶鐗堟湰
3. 鍥炴粴鏁版嵁搴擄細浣跨敤 D1 澶囦唤锛堣瑙?`docs/db-d1.md`锛?
4. 鍦?`release.md` 璁板綍鏁呴殰鏃堕棿绾夸笌閲囧彇鎺柦

## 7. 鏃ュ織涓庣洃鎺?
- 璋冪敤 `wrangler tail next-cf-app` 瀹炴椂鏌ョ湅鏃ュ織
- Cloudflare Dashboard 鈫?Workers 鈫?Deployments 鏌ョ湅鍘嗗彶
- 寤鸿鍦ㄥ悗缁凯浠ｆ帴鍏?Sentry 鎴?Logpush锛屽苟鍦?`health-and-observability.md` 涓褰?

## 8. 鏉冮檺涓庡畨鍏?
- GitHub Actions 闇€瑕佸叿鏈変互涓嬫潈闄愮殑 Token锛?
  - `Account.Access:Workers Scripts:Edit`
  - `Account.Access:D1:Edit/Read`
  - `Account.Access:R2:Edit`
- 鍦?`security.md` 涓淮鎶?Token 杞崲涓庢潈闄愮煩闃?
- 绂佹鍦ㄥ伐浣滄祦鏃ュ織涓緭鍑烘晱鎰熸暟鎹紝蹇呰鏃朵娇鐢?`::add-mask::` 闅愯棌

## 9. 瀹℃牳娓呭崟
- [ ] PR 鎻忚堪鍒楀嚭閮ㄧ讲褰卞搷涓庡搴旀枃妗?
- [ ] `docs/deployment/cloudflare-workers.md` 濡傛湁娴佺▼鍙樺姩闇€鍚屾鏇存柊
- [ ] 闄勪笂 `gh run watch` 鎴浘鎴栬緭鍑?
- [ ] 閮ㄧ讲鍚庨獙璇佹牳蹇冭矾寰勶紙鐧婚檰銆丆RUD銆佹敮浠樺洖璋冿級

---

閮ㄧ讲閾捐矾璋冩暣鏃讹紝鍔″繀鍚屾 `docs/ci-cd.md`銆乣docs/workflows/deploy.md` 涓?`docs-maintenance.md`锛屼繚鎸佲€滄枃妗?鈫?鍛戒护鈥濅竴鑷淬€?

