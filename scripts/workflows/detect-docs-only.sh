#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: detect-docs-only.sh [--base <commit>] [--paths <pattern>]

Determines whether the diff from <base> to HEAD (or the merge base on PR events)
contains only documentation changes. Emits a `docs_only` key suitable for
GitHub Actions step output.
USAGE
}

BASE_REF=""
ALLOWED_PATTERN="^(README\\.md|docs/)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)
      BASE_REF="$2"
      shift 2
      ;;
    --paths)
      ALLOWED_PATTERN="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$BASE_REF" ]]; then
  if [[ -n "${GITHUB_BASE_REF:-}" ]]; then
    BASE_REF="${GITHUB_BASE_REF}"
  elif [[ -n "${GITHUB_EVENT_BEFORE:-}" && "${GITHUB_EVENT_BEFORE}" != "0000000000000000000000000000000000000000" ]]; then
    BASE_REF="${GITHUB_EVENT_BEFORE}"
  else
    BASE_REF=$(git rev-list HEAD~1 -n 1 2>/dev/null || true)
  fi
fi

if [[ -z "$BASE_REF" ]]; then
  echo "docs_only=false" > docs_only.txt
  exit 0
fi

FILES=$(git diff --name-only "${BASE_REF}"...HEAD | tr -d '\r' || true)

echo "Changed files:" >&2
printf '%s\n' "$FILES" >&2

if [[ -z "$FILES" ]]; then
  echo "docs_only=true" > docs_only.txt
  exit 0
fi

if echo "$FILES" | grep -Ev "$ALLOWED_PATTERN" >/dev/null 2>&1; then
  echo "docs_only=false" > docs_only.txt
else
  echo "docs_only=true" > docs_only.txt
fi
