#!/usr/bin/env bash
# Test merge layout dashboard tanpa unit test runner.
#
# Repo ini tidak punya jestest/vitest, dan `resolve-layout.ts` sengaja dibuat
# tanpa import React/fetch supaya bisa dikompilasi standalone:
#   tsc -> JS murni -> node (self-check di dalam file).
#
# Fail = exit code bukan 0, jadi bisa dipakai di CI nanti.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/src/core/dashboard/resolve-layout.ts"
OUT="$ROOT/node_modules/.cache/dashboard-merge-test"

rm -rf "$OUT"
mkdir -p "$OUT"

echo "› compile $SRC"
"$ROOT/node_modules/.bin/tsc" "$SRC" \
  --outDir "$OUT" \
  --target es2020 \
  --module commonjs \
  --lib es2020,dom \
  --strict \
  --skipLibCheck

echo "› run self-check"
node "$OUT/resolve-layout.js"
