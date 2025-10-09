#!/usr/bin/env node
/*
 Auto-fix + self-check + push helper
 - Applies Biome fixes
 - Generates Cloudflare types + TSC typecheck
 - Verifies Biome again (no errors)
 - Auto-commits any remaining changes
 - Pulls with rebase then pushes current branch
*/

import { execSync, spawnSync } from "node:child_process";

function run(cmd, opts = {}) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
}

function tryRun(cmd, opts = {}) {
  try {
    run(cmd, opts);
    return true;
  } catch (e) {
    return false;
  }
}

function getOutput(cmd) {
  const res = spawnSync(cmd, { shell: true, encoding: "utf8" });
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error(res.stderr || `Command failed: ${cmd}`);
  return (res.stdout || "").trim();
}

// 1) Generate types and apply formatting fixes
tryRun("pnpm run cf-typegen");
tryRun("pnpm exec biome check . --apply --unsafe");

// 2) Type check
run("pnpm exec tsc --noEmit");

// 3) Final Biome check (no errors allowed)
run("pnpm exec biome check .");

// 4) Auto-commit changes if any
const status = getOutput("git status --porcelain");
if (status) {
  run("git add -A");
  // allow commit to succeed even if no staged change (no-op commit will fail gracefully)
  tryRun("git commit -m \"chore: auto-fix lint & types\" --no-verify");
}

// 5) Rebase latest remote then push
tryRun("git pull --rebase --autostash");
run("git push");

console.log("\n✅ Auto-fix + self-check + push completed.");

