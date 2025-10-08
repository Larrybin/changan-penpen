# Workflow锛欳I

> 浣嶇疆锛歚.github/workflows/ci.yml`銆傝礋璐ｈ繍琛?Biome銆乀ypeScript銆乂itest 涓?Next 鏋勫缓锛屼綔涓烘墍鏈夐儴缃插墠鐨勮川閲忛棬銆?
## 瑙﹀彂
- `push` 鍒伴潪 `main` 鍒嗘敮锛堝拷鐣?`README.md`銆乣docs/**`锛?- `pull_request` 鐩爣涓?`main`
- `workflow_dispatch`
- `workflow_call`锛堣 `deploy.yml` 澶嶇敤锛?
## 鏉冮檺 & 骞跺彂
- `permissions.contents: read`
- `concurrency: ci-${{ github.ref }}`锛堢浉鍚屽垎鏀棫杩愯浼氳鍙栨秷锛?
## 鐜鍙橀噺
- `NODE_VERSION=20`
- `PNPM_VERSION=9`
- `NEXT_PUBLIC_APP_URL`锛堟潵鑷?GitHub Vars锛岄粯璁?`http://localhost:3000`锛?
## 姝ラ鎷嗚В
1. Checkout锛堝浐瀹?SHA 鐨?`actions/checkout`锛?2. 瀹夎 pnpm銆丯ode锛堝唴缃?pnpm 缂撳瓨锛?3. 澶嶇敤 composite action锛歚./.github/actions/install-and-heal`
4. 缂撳瓨 `.next/cache`
5. `pnpm run fix:i18n` + diff 鏍￠獙锛堟湭瑙勮寖鍖栨椂闃诲锛?6. `pnpm exec biome check .`
7. `pnpm exec tsc --noEmit`
8. `pnpm exec vitest run --coverage`锛堜骇鍑?json-summary锛?9. 鎵撳嵃 `NEXT_PUBLIC_APP_URL`锛堣瘖鏂級
10. `pnpm build`

## 澶辫触鎺掓煡寤鸿
- i18n 鏈鑼冨寲锛氭湰鍦拌繍琛?`pnpm run fix:i18n`
- Biome 鎶ラ敊锛氭墽琛?`pnpm exec biome check . --write`
- tsc/Vitest 澶辫触锛氬叧娉ㄦ棩蹇椾腑鐨勫鍏ヨ矾寰勬垨鏈?mock 鐨?D1/R2
- Build 澶辫触锛氭鏌?OpenNext 鍏煎鎬ф垨缂哄け鐨勭幆澧冨彉閲?
## 涓庡叾浠栧伐浣滄祦鐨勫叧绯?- `deploy.yml` 棣栦釜 job 鐩存帴 `uses` 璇ュ伐浣滄祦锛岄伩鍏嶉噸澶嶇淮鎶ゃ€?
## 缁存姢鎻愰啋
- 鍗囩骇 Node/PNPM 鏃跺悓姝ユ洿鏂版枃妗ｄ笌 `package.json` 鐨?engines锛堣嫢浣跨敤锛?- 鑻ユ柊澧炴楠わ紙渚嬪瑕嗙洊鐜囦笂浼狅級锛岃鏇存柊 `docs/ci-cd.md` 涓庢鏂囨。
- 纭繚鎵€鏈夌涓夋柟 Action 鍥哄畾涓?commit SHA锛屽畾鏈熷贰妫€

---

闇€瑕佽皟璇曟垨鎵╁睍 CI锛屽彲鍦ㄦ湰鍦颁慨鏀瑰悗閫氳繃 `act -j build-and-test` 鎵ц锛堥儴鍒?Cloudflare 姝ラ闇€璺宠繃锛夈€?
