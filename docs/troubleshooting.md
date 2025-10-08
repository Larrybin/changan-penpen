# 鏁呴殰鎺掓煡鎵嬪唽

> 鏀堕泦甯歌閿欒涓庝慨澶嶆楠わ紝閬囧埌鏂伴棶棰樻椂璇疯ˉ鍏呮湰鎵嬪唽骞跺湪 PR 涓紩鐢ㄣ€?

## 1. GitHub Actions / YAML
- **鐥囩姸**锛歚Invalid workflow file`銆乣mapping values are not allowed`
  - 妫€鏌ョ缉杩涙槸鍚︿负绌烘牸锛堢鐢?Tab锛?
  - 浣跨敤 LF 鎹㈣锛堝彲杩愯 `pnpm exec biome format` 鑷姩淇锛?
- **鐥囩姸**锛歚/bin/bash^M: bad interpreter`
  - Windows CRLF 鎹㈣瀵艰嚧锛屾墽琛?`pnpm exec biome format` 鎴?`git config core.autocrlf false`
- **Action 鏈浐瀹?SHA**锛氬繀椤讳娇鐢?`owner/repo@<commit>`锛屽惁鍒欏畨鍏ㄦ鏌ヤ笉閫氳繃锛堣褰曞湪 `docs/security.md`锛?

## 2. pnpm / 渚濊禆
- `ERR_PNPM_OUTDATED_LOCKFILE`锛氳繍琛?`pnpm install --no-frozen-lockfile`锛屾彁浜ゆ洿鏂板悗鐨?`pnpm-lock.yaml`
- `UND_ERR_CONNECT / ETIMEDOUT`锛氱綉缁滄姈鍔紝閲嶈瘯鎴栦娇鐢ㄥ叕鍙镐唬鐞嗭紱CI 涓?`pnpm dedupe`
- 鐗堟湰鍐茬獊锛氭鏌?`pnpm overrides`锛堝湪 `package.json`锛夛紝閬垮厤绉佷笅鍗囩骇 breaking 渚濊禆

## 3. D1 鏁版嵁搴?
- `database is locked`锛堟湰鍦帮級锛氬仠姝㈠叾浠?`wrangler dev` 瀹炰緥锛屽垹闄?`.wrangler/state`锛岄噸鏂?`pnpm db:migrate:local`
- `no such table`锛氱‘璁ゆ槸鍚︽墽琛屼簡瀵瑰簲鐜鐨?`pnpm db:migrate:*`
- 杩滅▼杩佺Щ澶辫触 `AuthenticationError`锛氭鏌?API Token 鏄惁鍚?`Account - D1:Edit/Read`
- 鏁版嵁鎹熷潖锛氫娇鐢?`docs/db-d1.md` 鐨勫浠芥仮澶嶆祦绋?

## 4. Cloudflare 鏂囨。 鈫?宸ヤ綔娴佷笉鍚屾
- 淇敼 `wrangler.jsonc`銆乣workflows/*` 鎴?`.dev.vars.example` 鍚庯紝CI 浼氬湪 Step Summary 鎻愮ず鍚屾鏂囨。
- 濡傛灉蹇樿鏇存柊锛孯eview 鏃惰琛ラ綈 `docs/deployment/cloudflare-workers.md`銆乣docs/env-and-secrets.md` 绛?

## 5. 鏉冮檺/璁よ瘉
- 绠＄悊鍚庡彴杩斿洖 403锛氭鏌?`.dev.vars` 涓?`ADMIN_ALLOWED_EMAILS` 鏄惁鍖呭惈褰撳墠璐﹀彿
- OAuth 澶辫触锛氱‘璁?`BETTER_AUTH_URL` 涓庡疄闄呰姹傚煙鍚嶄竴鑷达紙鐢熶骇鍩熷悕鎴栬嚜瀹氫箟鍩燂級
- GitHub auto merge 鏃犳硶鍚敤锛氫粨搴撴湭寮€鍚嚜鍔ㄥ悎骞讹紝`GitHub auto merge 未启用：请通过常规 PR 审阅流程手动合并
