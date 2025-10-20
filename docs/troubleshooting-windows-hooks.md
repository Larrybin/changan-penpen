# Troubleshooting: Husky Git Hooks on Windows (PowerShell)

Problem
- Pre-commit or pre-push fails with: "The argument '/d' is not recognized" and the hook aborts.

Cause
- Shell invocation mismatch under PowerShell when running husky scripts. Some flags intended for `cmd.exe`/Bash are incompatible with `pwsh`.

Workarounds
- Temporarily bypass hooks: `git commit --no-verify` and/or `git push --no-verify`.
- Prefer project helper if available: `pnpm push` (executes push flow via Node).
- Switch terminal to Git Bash for hook execution.

Fix (optional, local)
- Update husky hook scripts to explicitly call `pwsh -NoProfile -Command` or switch to Node-based wrappers where possible.
- Avoid shell-specific flags. Keep cross-platform commands or rely on Node scripts.
