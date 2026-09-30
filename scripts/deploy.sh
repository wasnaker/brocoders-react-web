#!/usr/bin/env bash
# Deploy brocoders-react-web dengan build-version yang selalu segar.
#
# Kenapa harus ada: `NEXT_PUBLIC_BUILD_VERSION` di-inline Next.js ke dalam
# bundle SAAT BUILD. Kalau nilainya tidak di-regenerate sebelum build, `/api/build-id`
# mengembalikan versi lama yang sama dengan yang ter-bake di bundle -> banner
# "versi baru tersedia" tidak pernah muncul, dan kalau diisi manual sekali
# saja, nilainya cepat basi dan diam-diam tidak berguna lagi.
#
# Env var ini hanya untuk UMUM, bukan rahasia, dan `.env.local` sudah
# gitignored — jadi aman ditulis di sini.
#
# Deploy harus lewat systemd. JANGAN pernah `next start` manual: proses
# kedua di port yang sama menyebabkan bundle lama dan baru dilayani bergantian
# (gejala: `GET /_next/static/css/<hash-lama>.css 400 Bad Request`).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"
SERVICE="brocoders-react-web.service"
BUILD_VERSION="$(date -u +%Y%m%dT%H%M%SZ)"

cd "$ROOT"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "error: $ENV_FILE tidak ada — tidak mau menebak isinya" >&2
  exit 1
fi

# Ganti key yang sudah ada, atau tambahkan di akhir kalau belum ada.
if grep -q '^NEXT_PUBLIC_BUILD_VERSION=' "$ENV_FILE"; then
  sed -i "s|^NEXT_PUBLIC_BUILD_VERSION=.*|NEXT_PUBLIC_BUILD_VERSION=${BUILD_VERSION}|" "$ENV_FILE"
else
  printf '\n# Di-generate oleh scripts/deploy.sh — jangan di-edit manual\nNEXT_PUBLIC_BUILD_VERSION=%s\n' \
    "$BUILD_VERSION" >> "$ENV_FILE"
fi

echo "==> NEXT_PUBLIC_BUILD_VERSION=${BUILD_VERSION}"

echo "==> stop ${SERVICE}"
sudo systemctl stop "$SERVICE"

echo "==> build (env ter-bake ke bundle)"
npm run build

echo "==> start ${SERVICE}"
sudo systemctl start "$SERVICE"

sleep 3
if ! sudo systemctl is-active --quiet "$SERVICE"; then
  echo "error: service tidak aktif setelah start" >&2
  sudo systemctl status "$SERVICE" --no-pager >&2
  exit 1
fi

echo "==> OK — build ${BUILD_VERSION}, service active"
