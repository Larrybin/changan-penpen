# 鍋ュ悍妫€鏌ヤ笌鍙娴嬫€?
> 鏈枃瀹氫箟 `/api/health` 鐨勪娇鐢ㄦ柟寮忋€佺洃鎺ф寚鏍囥€佹棩蹇楁敹闆嗕笌鏁呴殰鎺掓煡璺緞銆?
## 1. 鍋ュ悍妫€鏌ユ帴鍙?- 璺緞锛歚/api/health`
- 杩愯鏃讹細`runtime = "nodejs"`锛堜繚璇佸湪 Workers 涓彲鐢級
- 妫€鏌ラ」锛?  - **fast 妯″紡**锛坄?fast=1` 鎴?`?mode=fast`锛夛細楠岃瘉鐜鍙橀噺銆丷2 缁戝畾
  - **strict 妯″紡**锛氶澶栨鏌?D1 杞婚噺鏌ヨ銆佸閮ㄤ緷璧栵紙濡?Creem API锛?  - 鐜鍙橀噺 `HEALTH_REQUIRE_DB/R2/EXTERNAL` 鎺у埗鏄惁寮哄埗閫氳繃
- 鍝嶅簲绀轰緥锛?```json
{
  "ok": true,
  "time": "2025-10-07T12:34:56.789Z",
  "durationMs": 42,
  "checks": {
    "db": {"ok": true},
    "r2": {"ok": true},
    "env": {"ok": true},
    "appUrl": {"ok": true},
    "external": {"ok": true}
  }
}
```

## 2. curl 绀轰緥
```bash
# Fast 鍋ュ悍锛堥儴缃茬閬撲娇鐢級
curl -fsS --retry 3 --retry-all-errors --retry-delay 5 \
  --connect-timeout 3 --max-time 8 \
  "https://<domain>/api/health?fast=1"

# Strict 鍋ュ悍锛堜汉宸?瀹氭椂浠诲姟锛?curl -fsS --retry 2 --retry-delay 3 \
  "https://<domain>/api/health"
```

## 3. 鐩戞帶寤鸿
| 鎸囨爣 | 鎻忚堪 | 閲囬泦閫斿緞 |
| --- | --- | --- |
| 鍋ュ悍妫€鏌ュ搷搴旀椂闂?| `durationMs` | CI銆丆ron銆佸閮ㄧ洃鎺?|
| Workers 璇锋眰閿欒鐜?| HTTP status銆乪xceptions | Cloudflare Workers Analytics |
| D1 鏌ヨ鑰楁椂 / 閿欒 | 鎴愬姛鐜囥€侀攣绛夊緟 | `wrangler d1 insights` / Dashboard |
| R2 鎿嶄綔 | `put/get` 鎴愬姛鐜?| R2 Analytics |
| AI 璋冪敤 | 鎴愬姛/澶辫触娆℃暟銆佽垂鐢?| Cloudflare Workers AI Dashboard 鎴栬嚜瀹氫箟鏃ュ織 |

## 4. 鏃ュ織鏂规
- **Cloudflare Workers Tail**锛?  ```bash
  wrangler tail next-cf-app --env production
  ```
- **Structured Logging**锛氬缓璁粺涓€浣跨敤 `console.log(JSON.stringify({level:'info', ...}))`
- **Logpush / 澶栭儴瀛樺偍**锛氬彲閰嶇疆鑷?R2銆並afka銆丼plunk锛堝悗缁墿灞曪級
- **Sentry**锛堝缓璁級锛?  - 閫氳繃 `@sentry/nextjs` Edge 鏀寔
  - 鍦?`env-and-secrets.md` 涓柊澧?DSN 骞舵洿鏂板仴搴锋鏌ュ彲閫夐」

## 5. 鍛婅绛栫暐
- **鍗虫椂鍛婅**锛氬仴搴锋鏌ュけ璐?鈫?`外部告警` Issue + 閭欢/Slack锛堥渶瑕佹坊鍔犻澶栨楠わ級
- **瓒嬪娍鍛婅**锛氶€氳繃 Cloudflare Analytics 璁惧畾闃堝€煎憡璀︼紙閿欒鐜囥€丆PU 鏃堕棿锛?- **鎵嬪姩宸℃**锛歚docs-maintenance.md` 鍒楀嚭浜嗘湀搴︽鏌ユ竻鍗?
## 6. 鏁呴殰鎺掓煡娓呭崟
1. 鏌ョ湅 `外部告警` Tracker Issue 鎴?PR 璇勮
2. 浣跨敤 `wrangler tail` 鑾峰彇瀹炴椂鏃ュ織
3. 鍛戒护琛岄獙璇侊細
   ```bash
   wrangler d1 execute next-cf-app --remote --command "SELECT COUNT(*) FROM todos;"
   wrangler r2 object list next-cf-app-bucket --limit 1
   ```
4. 妫€鏌ユ渶杩戦儴缃诧紙Cloudflare Dashboard 鈫?Workers 鈫?Deployments锛?5. 鑻ュ閮ㄤ緷璧栧紓甯革紝纭 `HEALTH_REQUIRE_EXTERNAL` 鏄惁褰卞搷鍙敤鎬?
## 7. 瀹氭湡浠诲姟寤鸿
- 姣忔棩/姣忓皬鏃讹細鐩戞帶 `/api/health?fast=1`锛屽け璐ヨ嚜鍔ㄩ€氱煡
- 姣忔棩锛氳繍琛?Strict 鍋ュ悍 + 鍏抽敭涓氬姟娴佺▼锛堝彲浣跨敤 Playwright锛?- 姣忓懆锛氭鏌?Workers Analytics銆丏1 Insights
- 姣忔湀锛氭墜宸ラ獙璇佸浠?鎭㈠娴佺▼锛堣瑙?`docs/db-d1.md`锛?
---

鏂板鐩戞帶椤规垨鏇存敼鍋ュ悍妫€鏌ラ€昏緫鏃讹紝璇峰悓姝ユ洿鏂版湰鏂囦笌 `docs/deployment/cloudflare-workers.md`銆?
