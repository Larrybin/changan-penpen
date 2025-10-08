# 鏋舵瀯鎬昏锛圓rchitecture Overview锛?

> 鏈枃甯姪鏂版垚鍛樺湪 15 鍒嗛挓鍐呭紕娓呪€滀唬鐮侀暱浠€涔堟牱鈥濃€滆姹傛€庝箞璧扳€濃€滄敼鍔ㄨ鍔ㄥ摢閲屸€濄€傛秹鍙婄殑璺緞鍧囦綅浜?`src/`銆?

## 鎶€鏈爤閫熻
- **Next.js 15 App Router**锛氫娇鐢?Server Components + Server Actions锛屽叆鍙ｄ綅浜?`src/app`
- **Cloudflare Workers + OpenNext**锛氶€氳繃 `@opennextjs/cloudflare` 鏋勫缓锛屽叆鍙?Worker 鍦?`.open-next/worker.js`
- **鏁版嵁搴撳眰**锛欳loudflare D1锛屼娇鐢?Drizzle ORM锛坄src/db`銆乣src/drizzle`锛?
- **瀵硅薄瀛樺偍**锛欳loudflare R2锛堝皝瑁呭湪 `src/lib/r2.ts` 绛夊伐鍏峰唴锛?
- **璁よ瘉**锛欱etter Auth Google OAuth 闆嗘垚锛坄src/modules/auth`銆乣src/services/auth`锛?
- **UI 涓庣姸鎬?*锛歋hadcn UI銆丷eact Hook Form銆乑od銆乀anStack Query
- **缈昏瘧**锛氬熀浜庤嚜瀹氫箟鑴氭湰锛屾敮鎸?Gemini / OpenAI锛岃剼鏈湪 `scripts/` 涓?`src/services/translation`

## 杩愯鏃舵嫇鎵?
```
Browser 鈫?Next.js App Router (Edge) 鈫?Server Actions / Route Handlers
     鈹斺攢鈹€ 璋冪敤 Drizzle ORM 鈫?Cloudflare D1
     鈹斺攢鈹€ 璁块棶 Cloudflare R2 / AI bindings
     鈹斺攢鈹€ 鍏变韩 libs (璁よ瘉銆佺紦瀛樸€佹棩蹇?
```

- **Edge First**锛氭墍鏈夎姹傚湪 Cloudflare Workers 涓婃墽琛岋紝SSR銆丼erver Actions 鍧囪窇鍦ㄨ竟缂樸€?
- **闈欐€佽祫婧?*锛氱敱 OpenNext 鏋勫缓浜х墿 `.open-next/assets` 閫氳繃 Worker `ASSETS` binding 鎻愪緵銆?
- **API 璺敱**锛氫綅浜?`src/app/api/*/*.route.ts`锛屼笌椤甸潰缁勪欢鍏变韩鍚屼竴杩愯鏃躲€?
- **鍋ュ悍妫€鏌?*锛歚/api/health` 鎻愪緵 fast / strict 妯″紡锛岀敤浜庨儴缃茶川閲忛椄闂ㄣ€?

## 鐩綍瀵艰

| 鐩綍 | 璇存槑 |
| --- | --- |
| `src/app` | App Router 鍏ュ彛锛屽寘鍚〉闈€佸竷灞€銆丄PI route銆傛寜鐓?`(segment)` 缁勭粐鏉冮檺鍩燂紝濡?`(auth)`銆乣(admin)` |
| `src/modules/<feature>` | 涓氬姟妯″潡锛坅ctions/components/hooks/models/schemas/utils锛夛紝鍙湪椤甸潰涓粍鍚堝鐢?|
| `src/components` | 鍏ㄥ眬鍏辩敤缁勪欢锛堝惈 `ui/` 灏佽 shadcn锛夛紝浠ュ強 SEO/瀵艰埅绛夊熀纭€浠?|
| `src/lib` | 骞冲彴绾у伐鍏凤紙Cloudflare binding銆佹棩蹇椼€佺紦瀛樸€乭ttp client 绛夛級 |
| `src/db` | Drizzle schema + 鏌ヨ杈呭姪锛屼笅娓哥敱 `src/modules/*/services` 浣跨敤 |
| `src/drizzle` | 鏁版嵁搴撹縼绉伙紙SQL锛変笌 `drizzle.config.ts` 閰嶇疆 |
| `src/services` | 璺ㄦā鍧椾笟鍔℃湇鍔★紙渚嬪 `auth.service.ts`銆乣billing.service.ts`锛?|
| `scripts/` | 鏋勫缓銆佸浗闄呭寲銆侀澶勭悊鑴氭湰锛屽 `prebuild-cf.mjs`銆乣fix-i18n-encoding.mjs` |

### App Router 灞?
- `layout.tsx`锛氬叏灞€甯冨眬锛屾寕杞借瑷€鍖呫€佷富棰樸€佸叏灞€ provider銆?
- `(segment)/layout.tsx`锛氬尯鍩熺骇甯冨眬锛堜緥濡傚悗鍙扮鐞?`src/modules/admin/admin.layout.tsx`锛夈€?
- `page.tsx`锛氶〉闈㈠叆鍙ｏ紝浠ョ粍鍚堟ā鍧楃粍浠朵负涓汇€?
- `api/*/*.route.ts`锛歊ESTful 鏍峰紡鎴?Server Actions 鏆撮湶銆?

### 妯″潡鍒嗗眰
浠?`src/modules/todos` 涓轰緥锛?
- `actions/`锛歋erver Actions锛屽皝瑁呰緭鍏ラ獙璇?+ 璋冩湇鍔″眰銆?
- `components/`锛歎I 缁勪欢锛屽彲琚〉闈€佸叾浠栫粍浠跺鐢ㄣ€?
- `schemas/`锛歓od schema锛岀敤浜庡墠鍚庣鍏变韩銆?
- `services/`锛氭墽琛屼笟鍔￠€昏緫锛岃皟鐢?`src/db` 鎴栧閮ㄦ湇鍔°€?
- `utils/`锛氭ā鍧楃骇宸ュ叿鍑芥暟銆?

瑙勮寖锛氳皟鐢ㄤ粠 `page` 鈫?`module components` 鈫?`actions/services` 鈫?`db/lib`锛岄伩鍏嶇粍浠剁洿鎺ヨЕ杈炬暟鎹簱銆?

## 鏁版嵁娴佽鏄?
1. **璇锋眰杩涙潵**锛歂ext.js Edge runtime 鎺ユ敹锛屾寜 route 鍖归厤椤甸潰鎴?API銆?
2. **閴存潈**锛欱etter Auth 鐨?middleware锛坄src/middleware.ts`锛夊湪杈圭紭鎷︽埅銆佹敞鍏?session銆?
3. **涓氬姟閫昏緫**锛氶〉闈㈣Е鍙?Server Action 鈫?`modules/*/actions` 璋冪敤 `services` 鈫?`db`銆?
4. **鏁版嵁璁块棶**锛歚src/db/index.ts` 鏆撮湶 `db` 瀹炰緥锛岃嚜鍔ㄨ繛鎺ュ埌瀵瑰簲鐜鐨?D1銆?
5. **缂撳瓨涓庡苟鍙?*锛歍anStack Query + Next.js revalidate锛屽疄鐜板鎴风缂撳瓨涓?ISR銆?
6. **闈欐€佽祫婧?*锛歊2 閫氳繃 binding `next_cf_app_bucket` 鏌ヨ锛屽皝瑁呭湪 `src/lib`銆?

## 鐜涓庣粦瀹?
- Worker bindings 瀹氫箟浜?`wrangler.jsonc`锛歚next_cf_app`锛圖1锛夈€乣next_cf_app_bucket`锛圧2锛夈€乣AI`锛圵orkers AI锛夈€?
- 鐢熶骇鐜浣跨敤榛樿椤跺眰閰嶇疆銆?
- 浠讳綍鏂板 binding 鍚庡繀椤昏繍琛?`pnpm cf-typegen` 浠ュ埛鏂?`cloudflare-env.d.ts`銆?

## 鍏抽敭鎵ц璺緞
1. **鏈湴寮€鍙?*锛歚pnpm dev`锛圢ode runtime锛夋垨 `pnpm dev:cf`锛圤penNext + Workers 妯℃嫙锛夈€?
2. **鏋勫缓閮ㄧ讲**锛欸itHub Actions `deploy.yml` 鎴栨墜鍔?`pnpm deploy:cf` 鈫?瑙﹀彂 OpenNext 鏋勫缓 鈫?Wrangler 鍙戝竷銆?
3. **杩佺Щ鎵ц**锛歚pnpm db:migrate:local|prod` 閫氳繃 Wrangler 璋冪敤 D1 migrations銆?\n
## 甯歌鎵╁睍鐐?
- 鏂伴〉闈細鍦?`src/app/<route>/page.tsx` 鍒涘缓锛屽鐢ㄦā鍧楃粍浠躲€?
- 鏂颁笟鍔″煙锛氬湪 `src/modules/<feature>` 涓嬭ˉ榻?`components | services | schemas` 瀛愮洰褰曘€?
- 鏂?API锛氫紭鍏堜娇鐢?Server Action锛涜嫢闇€瑕?REST endpoint锛屽垯鍦?`src/app/api/<name>/<verb>.route.ts`銆?
- 瀹氭椂浠诲姟锛氶€氳繃 Cron Triggers锛堝悗缁鍒掞級鎴栧閮?Worker锛屾枃妗ｆ洿鏂板悗鍚屾鑷?`docs/`.

## 鍏煎鎬ф彁绀?
- **OpenNext 绾︽潫**锛氫笉鏀寔 `fs` 鍐欐搷浣滐紱渚濊禆 Node API 鏃堕渶鍚敤 `nodejs_compat`锛堝凡鍦?`wrangler.jsonc` 閰嶇疆锛夈€?
- **杈圭紭杩愯**锛氬敖閲忛伩鍏嶉暱鏃?CPU 浠诲姟锛汚I/澶栭儴璇锋眰浣跨敤 `fetch` 骞惰缃秴鏃躲€?


---

濡傞渶鏇存柊鏋舵瀯锛堟柊澧炴ā鍧椼€佽皟鏁寸洰褰曪級锛岃鍚屾淇敼鏈枃浠朵笌 `docs/00-index.md`锛屽苟鍦?PR 妯℃澘涓嬀閫夆€滄枃妗ｅ凡鏇存柊鈥濄€?


