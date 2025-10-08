# 鏋舵瀯鎬昏锛圓rchitecture Overview锛?
> 鏈枃甯姪鏂板悓浜嬪湪 15 鍒嗛挓鍐呭紕娓呪€滀唬鐮侀暱浠€涔堟牱鈥濃€滆姹傛€庝箞璧扳€濃€滄敼鍔ㄨ鍔ㄥ摢閲屸€濄€傛秹鍙婄殑璺緞鍧囦綅浜?`src/` 涓嬨€?> 鏈〉鎻愪緵浠ｇ爜浠撳簱鐨勫湴褰㈠浘锛氫粠杩愯鏃跺钩鍙般€佺洰褰曡鍒掋€佹牳蹇冩ā鍧楋紝鍒版暟鎹笌澶栭儴渚濊禆銆傚洟闃熸垚鍛樺湪淇敼鏋舵瀯銆佸鍔犳ā鍧楁垨璋冩暣閮ㄧ讲鏂瑰紡鏃讹紝鍔″繀鍏堟洿鏂版湰鏂囨。骞跺悓姝?`docs/00-index.md`銆?
## 1. 鎶€鏈爤閫熻
- Next.js 15 App Router锛氬叏閮ㄥ叆鍙ｄ綅浜?`src/app`锛屽箍娉涗娇鐢?Server Components 涓?Server Actions 瀹炵幇鏈嶅姟绔覆鏌撱€佽〃鍗曞鐞嗕笌鏁版嵁鍙樻洿锛堝弬鑰?`src/app/layout.tsx`銆乣src/app/page.tsx`锛夈€?- Cloudflare Workers + OpenNext锛氶€氳繃 `@opennextjs/cloudflare` 鎵撳寘 Worker锛堝叆鍙?`.open-next/worker.js`锛夛紝閮ㄧ讲鍙傛暟瀹氫箟鍦?`wrangler.jsonc`锛屽苟寮€鍚?`nodejs_compat` 浠ユ敮鎸?Node API锛堝弬鑰?`open-next.config.ts`銆乣wrangler.jsonc`锛夈€?- 鏁版嵁搴擄紙Cloudflare D1 + Drizzle ORM锛夛細`src/db/index.ts` 鎻愪緵 Worker 缁戝畾鐨?D1 瀹炰緥锛宍src/db/schema.ts` 鑱氬悎鍚勪笟鍔℃ā鍧楃殑琛ㄥ畾涔夛紝杩佺Щ鏂囦欢浣嶄簬 `src/drizzle/` 骞剁敱 `drizzle.config.ts` 绠＄悊銆傘€怓:src/db/index.tsL1-L11銆戙€怓:src/db/schema.tsL1-L25銆戙€怓:drizzle.config.tsL1-L19銆?- 瀵硅薄瀛樺偍锛圕loudflare R2锛夛細閫氳繃 `wrangler.jsonc` 涓殑 `r2_buckets` 缁戝畾锛岃闂皝瑁呭湪 `src/lib/r2.ts`锛岀敤浜庝笂浼犱笅杞介潤鎬佹垨鐢ㄦ埛璧勪骇銆傘€怓:wrangler.jsoncL10-L35銆戙€怓:src/lib/r2.tsL1-L120銆?- 韬唤璁よ瘉锛坆etter-auth锛夛細`src/lib/auth.ts` 鏆撮湶 `getAuth` 宸ュ叿锛宍src/modules/auth` 璐熻矗 UI銆丼erver Actions 涓?Zod schema锛岀粨鍚?`middleware.ts` 鐨勫彈淇濇姢璺敱鏍￠獙銆傘€怓:src/lib/auth.tsL1-L120銆戙€怓:src/modules/auth/actions/auth.action.tsL1-L80銆戙€怓:middleware.tsL1-L40銆?- 鍥介檯鍖栵紙next-intl锛夛細`next-intl.config.ts` + `src/i18n` 瀹氫箟鍙敤璇█锛宍middleware.ts` 璐熻矗璺敱鍓嶇紑澶勭悊锛宍LanguageSwitcher.tsx` 绛夌粍浠跺府鍔╁垏鎹㈣瑷€銆傘€怓:next-intl.config.tsL1-L21銆戙€怓:src/i18n/config.tsL1-L60銆戙€怓:src/components/LanguageSwitcher.tsxL1-L120銆?- UI 涓庣姸鎬佺鐞嗭細浣跨敤 shadcn/ui 缁勪欢搴擄紙灏佽浜?`src/components/ui`锛夈€丷eact Hook Form銆乀anStack Query銆乑od 鏍￠獙浠ュ強鏈湴鍖栫殑 SEO 宸ュ叿銆傘€怓:src/components/ui/button.tsxL1-L80銆戙€怓:package.jsonL7-L75銆戙€怓:src/lib/seo.tsL1-L120銆?- AI 涓庤嚜鍔ㄥ寲鏈嶅姟锛歚src/services/translation.service.ts`銆乣src/services/summarizer.service.ts` 鎻愪緵缈昏瘧涓庢憳瑕佽兘鍔涳紝瀵规帴 Gemini/OpenAI 涓?Workers AI锛涢厤濂楄剼鏈綅浜?`scripts/`銆傘€怓:src/services/translation.service.tsL1-L160銆戙€怓:scripts/translate-locales.tsL1-L200銆?- 缈昏瘧锛氳嚜瀹氫箟鑴氭湰锛屾敮鎸?Gemini / OpenAI锛堣 `scripts/` 涓?`src/services/translation.service.ts`锛?
## 2. 杩愯鏃惰姹傝矾寰?```
Browser 鈫?Next.js App Router (Edge) 鈫?Server Actions / Route Handlers
        鈫?Drizzle ORM 鈫?Cloudflare D1
        鈫?Cloudflare R2 / AI bindings
        鈫?Shared libs锛堣璇併€佺紦瀛樸€佹棩蹇楋級
```

- 1. 鍏ョ珯璇锋眰锛欳loudflare Worker 鎺ユ敹璇锋眰鍚庝氦鐢?Next.js App Router 澶勭悊锛岄潤鎬佽祫婧愰€氳繃 `ASSETS` 缁戝畾鐩存帴杩斿洖锛屽姩鎬佽矾寰勮繘鍏?Server Components 鎴?Route Handler銆傘€怓:wrangler.jsoncL10-L27銆戙€怓:src/app/api/health/route.tsL1-L80銆?- 2. 涓棿浠跺鐞嗭細`middleware.ts` 鍏堟墽琛屽浗闄呭寲璺敱锛屽啀鏍规嵁璺緞锛堝 `/dashboard`锛夎皟鐢?`getAuth()` 鏍￠獙浼氳瘽锛屾棤鏁堟椂閲嶅畾鍚戠櫥褰曢〉銆傘€怓:middleware.tsL1-L40銆?- 3. 椤甸潰鍔ㄤ綔鎵ц锛氶〉闈㈢粍浠剁粍缁?UI 骞惰皟鐢ㄦā鍧楀唴鐨?Server Actions锛屼緥濡?Todos 鐨?`createTodoAction` 浼氬湪鏈嶅姟灞傝闂?D1 鏁版嵁搴撱€傘€怓:src/modules/todos/todo-list.page.tsxL1-L120銆戙€怓:src/modules/todos/actions/create-todo.action.tsL1-L120銆?- 4. 鏁版嵁璁块棶锛氭墍鏈夋湇鍔￠€氳繃 `getDb()` 鑾峰彇 D1 杩炴帴锛屽鐢ㄥ湪 `src/modules/*/services` 鍐咃紝閬靛惊椤甸潰 鈫?鍔ㄤ綔/鏈嶅姟 鈫?db/lib 鐨勪緷璧栨柟鍚戯紝閬垮厤 UI 鐩存帴鎿嶄綔鏁版嵁灞傘€傘€怓:src/db/index.tsL1-L11銆戙€怓:src/modules/admin/services/report.service.tsL1-L160銆?- 5. 鍝嶅簲涓庣紦瀛橈細App Router 浣跨敤 Edge Runtime锛岀粨鍚?Next.js revalidate銆乀anStack Query 涓?Cloudflare 缂撳瓨绛栫暐鎻愬崌鍝嶅簲鎬ц兘锛涘闇€ R2 Incremental Cache 鍙湪 `open-next.config.ts` 鍚敤銆?
- Edge First锛氭墍鏈夎姹傚湪 Cloudflare Workers 涓婃墽琛岋紝SSR銆丼erver Actions 鍧囪窇鍦ㄨ竟缂?- 闈欐€佽祫婧愶細鐢?OpenNext 浜х墿 `.open-next/assets` 閫氳繃 Worker `ASSETS` binding 鎻愪緵
- API 璺敱锛氫綅浜?`src/app/api/**/route.ts`锛屼笌椤甸潰缁勪欢鍏变韩鍚屼竴杩愯鏃?- 鍋ュ悍妫€鏌ワ細`/api/health` 鎻愪緵 fast / strict 妯″紡锛岀敤浜庡彂甯冭川閲忛椄闂?
## 3. 浠ｇ爜鐩綍瀵艰

| 鐩綍 | 璇存槑 | 鏍稿績鍏ュ彛 |
| --- | --- | --- |
| `src/app` | Next.js App Router 椤甸潰銆佸竷灞€銆丄PI Route锛堝惈 `(auth)`銆乣(admin)` 绛夊垎缁勶級銆?| `layout.tsx`銆乣(auth)/login.page.tsx`銆乣api/**/route.ts`銆怓:src/app/layout.tsxL1-L80銆戙€怓:src/app/(auth)/login/page.tsxL1-L120銆?|
| `src/modules/<feature>` | 涓氬姟鍩熸ā鍧楋細鍖呭惈 `actions`锛圫erver Actions锛夈€乣components`銆乣schemas`锛圸od锛夈€乣services`锛堟暟鎹簱涓庡閮ㄨ皟鐢級銆乣utils`銆?| 渚嬪 `todos` 妯″潡鎻愪緵 CRUD 鍏ㄦ祦绋嬨€傘€怓:src/modules/todos/services/todo.service.tsL1-L160銆?|
| `src/components` | 鍏ㄥ眬澶嶇敤缁勪欢锛堝鑸€佽瑷€鍒囨崲銆丼EO 缁勪欢锛変笌 `ui/` 涓嬬殑 shadcn 灏佽銆?| `navigation.tsx`銆乣ui/button.tsx`銆怓:src/components/navigation.tsxL1-L200銆戙€怓:src/components/ui/button.tsxL1-L80銆?|
| `src/lib` | 骞冲彴绾у伐鍏凤紙璁よ瘉銆丷2銆丼EO銆丠TTP 閿欒澶勭悊銆侀€氱敤 util锛夛紝骞跺寘鍚崟鍏冩祴璇曘€?| `auth.ts`銆乣r2.ts`銆乣api-error.ts`銆怓:src/lib/auth.tsL1-L120銆戙€怓:src/lib/r2.tsL1-L120銆?|
| `src/constants` | 璺ㄦā鍧楀父閲忥紝濡傝〃鍗曟牎楠岄厤缃瓑銆?| `validation.constant.ts`銆怓:src/constants/validation.constant.tsL1-L120銆?|
| `src/services` | 涓庝笟鍔℃棤鍏崇殑閫氱敤鏈嶅姟锛堢炕璇戙€佹憳瑕侊級锛屽彲琚剼鏈垨 Server Actions 璋冪敤銆?| `translation.service.ts`銆乣summarizer.service.ts`銆怓:src/services/translation.service.tsL1-L160銆戙€怓:src/services/summarizer.service.tsL1-L160銆?|
| `src/drizzle` | D1 鏁版嵁搴撹縼绉昏剼鏈紙SQL锛夛紝涓?`drizzle.config.ts` 鑱斿姩銆?| `0000_initial_schemas_migration.sql` 绛夎縼绉绘枃浠?|
| `scripts` | 杈呭姪鑴氭湰锛歄penNext 棰勬瀯寤恒€乮18n 淇銆佹壒閲忕炕璇戠瓑銆?| `prebuild-cf.mjs`銆乣fix-i18n-encoding.mjs`銆怓:scripts/prebuild-cf.mjsL1-L120銆戙€怓:scripts/fix-i18n-encoding.mjsL1-L120銆?|
| `tests` & `src/lib/__tests__` | Vitest 娴嬭瘯涓庡叕鍏辨祴璇曞す鍏凤紝鑱氱劍骞冲彴宸ュ叿涓?API 閿欒澶勭悊銆?| `src/lib/__tests__/seo.test.ts`銆乣tests/fixtures/*`銆怓:src/lib/__tests__/seo.test.tsL1-L160銆?|

## 4. 鏍稿績涓氬姟妯″潡鎽樿

- Todos 妯″潡锛堟紨绀?CRUD 涓?Server Actions锛?  - 鍒楄〃涓庨〉闈細`src/modules/todos/todo-list.page.tsx`
  - 鍔ㄤ綔涓庢湇鍔★細`src/modules/todos/actions/create-todo.action.ts`銆乣src/modules/todos/services/todo.service.ts`
  - 琛ㄥ崟涓庣粍浠讹細`src/modules/todos/components/todo-form.tsx`
  - 鍙傝€冦€怓:src/modules/todos/todo-list.page.tsxL1-L120銆戙€怓:src/modules/todos/actions/create-todo.action.tsL1-L120銆戙€怓:src/modules/todos/services/todo.service.tsL1-L160銆?
- Admin 妯″潡锛堝悗鍙扮鐞嗕笌鎶ヨ〃/鐩綍/绔欑偣璁剧疆锛?  - 绠＄悊鍏ュ彛涓庤矾鐢憋細`src/modules/admin/components/admin-refine-app.tsx`銆乣src/modules/admin/routes/admin.routes.ts`
  - 鍏稿瀷鏈嶅姟锛歚catalog.service.ts`銆乣report.service.ts`銆乣site-settings.service.ts`
  - 鍙傝€冦€怓:src/modules/admin/components/admin-refine-app.tsxL1-L200銆戙€怓:src/modules/admin/routes/admin.routes.tsL1-L160銆戙€怓:src/modules/admin/services/catalog.service.tsL1-L160銆?
- Auth 妯″潡锛坆etter-auth 闆嗘垚锛?  - 杈呭姪涓?API锛歚src/lib/auth.ts`銆乣src/app/api/auth/[...all]/route.ts`銆乣middleware.ts`
  - 琛ㄥ崟缁勪欢锛歚src/modules/auth/components/login-form.tsx`銆乣signup-form.tsx`
  - 鍙傝€冦€怓:src/lib/auth.tsL1-L120銆戙€怓:src/app/api/auth/[...all]/route.tsL1-L80銆戙€怓:middleware.tsL1-L40銆?
- 璁㈤槄/璁¤垂锛圕reem 闆嗘垚锛?  - 鍓嶇鎿嶄綔锛歚src/modules/creem/components/billing-actions.tsx`
  - API 涓庡洖璋冿細`/api/creem/create-checkout`銆乣/api/webhooks/creem`
  - 鍙傝€冦€怓:src/app/api/creem/create-checkout/route.tsL1-L200銆戙€怓:src/app/api/webhooks/creem/route.tsL1-L200銆?
- Marketing/Landing锛堣惤鍦伴〉涓庡叕鍏辩粍浠讹級
  - 椤甸潰涓庡叕鍏卞尯鍧楋細`src/modules/marketing/landing.page.tsx`銆乣src/modules/marketing/components/*`
  - 鍙傝€冦€怓:src/modules/marketing/landing.page.tsxL1-L160銆?
### App Router 璇存槑
- `layout.tsx`锛氬叏灞€甯冨眬锛屾寕杞借瑷€鍖呫€佷富棰樸€佸叏灞€ provider
- `(segment)/layout.tsx`锛氬尯鍩熺骇甯冨眬锛堜緥濡傚悗鍙扮鐞?`src/modules/admin/admin.layout.tsx`锛?- `page.tsx`锛氶〉闈㈠叆鍙ｏ紝浠ョ粍鍚堟ā鍧楃粍浠朵负涓?- `api/**/route.ts`锛歊ESTful 椋庢牸鎴?Server Actions 鐨勮矾鐢卞鐞嗗櫒

## 5. 妯″潡鍒嗗眰璇存槑
浠?`src/modules/todos` 涓轰緥锛?- `actions/`锛歋erver Actions锛屽皝瑁呰緭鍏ユ牎楠?+ 璋冩湇鍔″眰
- `components/`锛歎I 缁勪欢锛屽彲琚〉闈€佸叾浠栫粍浠跺鐢?- `schemas/`锛歓od schema锛岀敤浜庡墠鍚庣鍏变韩
- `services/`锛氭墽琛屼笟鍔￠€昏緫锛岃皟鐢?`src/db` 鎴栧閮ㄦ湇鍔?- `utils/`锛氭ā鍧楃骇宸ュ叿鍑芥暟

瑙勮寖锛氳皟鐢ㄤ粠 `page` 鈫?`module components` 鈫?`actions/services` 鈫?`db/lib`锛岄伩鍏嶇粍浠剁洿鎺ヨ闂暟鎹簱銆?
## 6. 鏁版嵁娴佽鏄?1. 璇锋眰杩涘叆锛欵dge runtime 鎺ユ敹骞跺尮閰嶅埌椤甸潰鎴?API 璺敱
2. 閴存潈娉ㄥ叆锛欱etter Auth 涓?`middleware`锛堣 `src/middleware.ts`锛夊湪杈圭紭鎷︽埅锛屾敞鍏ヤ細璇?鐢ㄦ埛
3. 涓氬姟鎵ц锛氶〉闈㈣Е鍙?Server Action 鎴?`modules/*/actions` 璋冪敤 `services`/`db`
4. 鏁版嵁璁块棶锛歚src/db/index.ts` 鏆撮湶 `getDb()`锛屾寜鐜杩炴帴鍒?D1
5. 缂撳瓨涓庡苟鍙戯細TanStack Query + Next.js `revalidate`锛屽疄鐜板鎴风缂撳瓨涓?ISR
6. 闈欐€佽祫婧愶細R2 閫氳繃 binding `next_cf_app_bucket` 璁块棶锛屽皝瑁呬簬 `src/lib/r2.ts`

## 7. 鐜涓庣粦瀹?- Worker bindings 瀹氫箟鍦?`wrangler.jsonc`锛歚next_cf_app`锛圖1锛夈€乣next_cf_app_bucket`锛圧2锛夈€乣AI`锛圵orkers AI锛?- 鏂板/鍙樻洿 bindings 鍚庯紝杩愯 `pnpm cf-typegen` 鏇存柊绫诲瀷鑷?`cloudflare-env.d.ts`
- 鐢熶骇鐜娌跨敤椤跺眰閰嶇疆锛涙湰鍦板彉閲忚鍙傝€?`.dev.vars.example`

## 8. 鍏抽敭鎵ц璺緞
1. 鏈湴寮€鍙戯細`pnpm dev`锛圢ode runtime锛夋垨 `pnpm dev:cf`锛圤penNext + Workers锛?2. 鏋勫缓閮ㄧ讲锛歚pnpm build`/`pnpm start` 鎴?`pnpm deploy:cf`锛圤penNext 鏋勫缓 + Wrangler 鍙戝竷锛?3. 杩佺Щ鎵ц锛歚pnpm db:migrate:local` 搴旂敤鏈湴 D1 杩佺Щ锛堢敓浜ф祦绋嬪弬瑙?CI/CD 鏂囨。锛?
## 9. 甯歌鎵╁睍
- 鏂伴〉闈細鍦?`src/app/<route>/page.tsx` 鍒涘缓锛屽鐢ㄦā鍧楃粍浠?- 鏂颁笟鍔″煙锛氬湪 `src/modules/<feature>` 涓嬭ˉ鍏?`components | services | schemas` 瀛愮洰褰?- 鏂?API锛氫紭鍏堜娇鐢?Server Actions锛涜嫢闇€ REST endpoint锛屽垯鍦?`src/app/api/<name>/route.ts`
- 瀹氭椂浠诲姟锛氶€氳繃 Cron Triggers锛堣鍒掍腑锛夋垨鐙珛 Worker锛屽畬鎴愬悗鍚屾鏇存柊 `docs/`

## 10. 鍏煎鎬ф彁绀?- OpenNext 绾︽潫锛氫笉鏀寔 `fs` 鍐欐搷浣滐紱闇€鐢?Node API 鏃跺惎鐢?`nodejs_compat`锛堝凡鍦?`wrangler.jsonc` 閰嶇疆锛?- 杈圭紭杩愯锛氶伩鍏嶉暱鏃?CPU 浠诲姟锛涘閮ㄨ姹備娇鐢?`fetch` 骞惰缃秴鏃?
---

濡傞渶鏇存柊鏋舵瀯锛堟柊澧炴ā鍧椼€佽皟鏁寸洰褰曪級锛岃鍚屾淇敼鏈枃浠朵笌 `docs/00-index.md`锛屽苟鍦?PR 妯℃澘涓嬀閫夆€滄枃妗ｅ凡鏇存柊鈥濄€?
