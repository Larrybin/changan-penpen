# 鐜鍙橀噺涓庡瘑閽ョ鐞嗭紙Env & Secrets锛?
> 鐩爣锛氭竻鏅扮煡閬撴瘡涓彉閲忓瓨鏀惧湪鍝€佽皝璐熻矗缁存姢銆佸彉鏇村悗闇€瑕佸仛浠€涔堛€傞€傜敤浜庢湰鍦颁笌鐢熶骇涓ゅ鐜銆?

## 1. 鍙橀噺鐭╅樀锛堟湰鍦?鐢熶骇锛?

| 鍙橀噺 | 浣滅敤 | 鏈湴锛?dev.vars锛?| 鐢熶骇锛圙itHub / Cloudflare锛?| 缁存姢浜?|
| --- | --- | --- | --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 璐﹀彿鏍囪瘑 | 鎵嬪姩濉啓 | GitHub Secret | DevOps |
| `CLOUDFLARE_API_TOKEN` | Wrangler 閮ㄧ讲 Token | 鍙暀绌猴紙鏈湴鐢?CLI 鐧诲綍锛?| GitHub Secret / Wrangler Secret | DevOps |
| `CLOUDFLARE_D1_TOKEN` | Drizzle 杩佺Щ Token | 鎵嬪姩濉啓 | GitHub Secret | 鏁版嵁搴撹礋璐ｄ汉 |
| `BETTER_AUTH_SECRET` | 浼氳瘽绛惧悕瀵嗛挜 | 鐢熸垚闅忔満鍊?| GitHub Secret / Wrangler Secret | 鍚庣 |
| `BETTER_AUTH_URL` | Auth 鍥炶皟鍦板潃 | `http://localhost:3000` | 姝ｅ紡鍩熷悕锛圙itHub Variable锛?| 鍚庣 |
| `GOOGLE_CLIENT_ID` / `SECRET` | Google OAuth | 鍙€?| GitHub Secret / Wrangler Secret | 鍚庣 |
| `CREEM_API_URL` | 鏀粯 API 鍦板潃 | 鍙€?| GitHub Variable | 涓氬姟璐熻矗浜?|
| `CREEM_API_KEY` | Creem 鎺堟潈 | 鍙€?| GitHub Secret / Wrangler Secret | 涓氬姟璐熻矗浜?|
| `CREEM_WEBHOOK_SECRET` | Webhook 鏍￠獙 | 鍙€?| GitHub Secret / Wrangler Secret | 涓氬姟璐熻矗浜?|
| `CREEM_SUCCESS_URL` / `CANCEL_URL` | 鍥炶皟鍦板潃 | 鍙€?| GitHub Variable | 浜у搧 |
| `CLOUDFLARE_R2_URL` | 瀵硅薄瀛樺偍璁块棶 URL | 鍙€?| GitHub Variable | DevOps |
| `TRANSLATION_PROVIDER` | 缈昏瘧渚涘簲鍟?| 鍙€?| 鍙€夛紙榛樿 gemini锛?| 缈昏瘧缁存姢浜?|
| `GEMINI_API_KEY` / `OPENAI_API_KEY` | 缈昏瘧/AI Key | 鍙€?| 鍙厤锛坅uto-fix/缈昏瘧绛夛級 | AI 缁存姢浜?|
| `ADMIN_ALLOWED_EMAILS` / `ADMIN_ENTRY_TOKEN` | 绠＄悊绔櫧鍚嶅崟 | 鍙€?| `wrangler secret put` | 浜у搧/杩愮淮 |

> 鉁?浠ｈ〃蹇呴』閰嶇疆銆侴itHub Secret 浼氶€氳繃宸ヤ綔娴佸啓鍏?`wrangler secret put`锛孏itHub Variable 浼氬湪宸ヤ綔娴佷腑浣滀负 `env` 娉ㄥ叆銆?

## 2. 鍙樻洿娴佺▼
1. 璋冩暣 `.dev.vars.example`锛岀‘淇濈ず渚嬪€间笌娉ㄩ噴鍚屾锛?
2. 鏇存柊 `.dev.vars` 鏈湴娴嬭瘯锛?
3. 鑻ユ柊澧?Cloudflare binding锛屼慨鏀?`wrangler.jsonc` 骞惰繍琛岋細
   ```bash
   pnpm cf-typegen
   git add cloudflare-env.d.ts worker-configuration.d.ts
   ```
4. 鍦?PR 涓彁閱?DevOps 鍚屾 GitHub Secrets / Variables锛屽苟鍦ㄥ悎骞跺悗杩愯锛?
   ```bash
   pnpm run cf:secret <NAME>    # 浜や簰寮忓啓鍏?Wrangler Secret
   ```
5. 璁板綍鍒?`docs-maintenance.md` 鐨勨€滃彉鏇存棩蹇椻€濄€?

## 3. 杞崲绛栫暐
- 鍛ㄦ湡锛氳嚦灏戞瘡 90 澶╄疆鎹竴娆℃晱鎰熷瘑閽ワ紙Auth銆丄PI Token锛夈€?
- 瑙﹀彂锛氫汉鍛樼鑱屻€佹潈闄愬彉鏇淬€佽祫婧愬崌绾ф椂蹇呴』杞崲銆?
- 鎵ц锛氬厛鍦?Cloudflare / 绗笁鏂圭敓鎴愭柊瀵嗛挜 鈫?鏇存柊 GitHub Secret 鈫?杩愯 `pnpm cf-typegen`锛堝鏈?binding 鍙樺寲锛夆啋 瑙﹀彂 `Deploy`锛坧roduction锛夈€?
- 鐣欑棔锛氬湪 PR 鎻忚堪涓檮涓婅疆鎹㈣褰曪紝骞跺湪 `release.md` 鐨勨€滆繍缁磋褰曗€濇坊鍔犳潯鐩€?

## 4. 甯歌闂
- CI 鎻愮ず缂哄皯鍙橀噺锛氭鏌?GitHub Actions 鏃ュ織 `Required secret missing`锛岃ˉ榻愬悗閲嶆柊杩愯宸ヤ綔娴侊紱
- `wrangler dev` 鎵句笉鍒板彉閲忥細纭鏄惁鍐欏叆 `.dev.vars` 鎴栭€氳繃 `wrangler secret put`锛?
- `cf-typegen` 鏈洿鏂帮細鑻ユ柊澧炵粦瀹氫絾鏈繍琛?`pnpm cf-typegen`锛孴ypeScript 鏃犳硶鎰熺煡鏂板瓧娈碉紝瀵艰嚧缂栬瘧澶辫触銆?

## 5. 瀹¤涓庤褰?
- 鎵€鏈夌幆澧冨彉閲忔敼鍔ㄩ渶鍦?PR 鎻忚堪涓鏄庢潵婧愩€佺敤閫斻€佸奖鍝嶈寖鍥达紱
- 寤鸿浣跨敤 `docs-maintenance.md` 涓殑 Checklist 姣忔湀鏍稿 GitHub Secrets 涓庡疄闄?Cloudflare Dashboard 閰嶇疆锛?
- 鏁忔劅淇℃伅绂佹鍐欏叆浠撳簱锛沗.dev.vars` 宸插垪鍏?`.gitignore`锛岃鍕块€氳繃鍏朵粬鏂囦欢娉勯湶銆?

---

濡傞渶鏂板鐜锛岃鎵╁睍鏈煩闃碉紝骞跺湪 `docs/00-index.md` 涓悓姝ラ摼鎺ャ€?

