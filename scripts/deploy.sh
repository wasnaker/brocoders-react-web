#!/usr/bin/env bash
# Deploy brocoders-react-web dengan build-version yang berbasis ISI SOURCE.
#
# Kenapa hash, bukan timestamp: pola crm-web memakai content hash dari Vite
# manifest, jadi rebuild yang tidak mengubah output TIDAK memunculkan banner
# "versi baru tersedia". Timestamp akan selalu berubah — dependency bump,
# whitespace, atau rebuild sia-sia semuanya akan membangun ulang user dengan
# banner yang tidak berguna. Hash hanya berubah kalau isinya berubah.
#
# Trade-off yang disadari: hash dihitung dari SOURCE, bukan dari manifest
# aset yang benar-benar ter-emit. Jadi perubahan pada file yang tidak memengaruhi
# bundle (mis. storybook yang tidak terpakai, halaman yang tidak lagi dirujuk)
# tetap mengubah hash dan memunculkan banner. False positive ini murah — banner
# bisa ditutup — tapi tidak sepresis crm-web. Menepatkannya butuh hash dari
# manifest SETELAH build, yang berarti build dua kali.
#
# Env var ini hanya untuk UMUM, bukan rahasia, dan `.env.local` sudah
# gitignored — jadi aman ditulis di sini.
#
# Sengaja TIDAK memakai prefix NEXT_PUBLIC_: prefix itu membuat Next.js
# meng-inline nilainya ke bundle browser. Deteksi build membaca versi dari
# <meta> yang di-render server, jadi client tidak perlu nilai itu sama sekali.
#
# Deploy harus lewat systemd. JANGAN pernah `next start` manual: proses
# kedua di port yang sama menyebabkan bundle lama dan baru dilayani bergantian
# (gejala: `GET /_next/static/css/<hash-lama>.css 400 Bad Request`).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"
SERVICE="brocoders-react-web.service"

cd "$ROOT"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "error: $ENV_FILE tidak ada — tidak mau menebak isinya" >&2
  exit 1
fi

# Hash konten deterministik: daftar file diurutkan (sort -z) supaya urutan
# filesystem tidak memengaruhi hasil. Hanya file yang bisa memengaruhi bundle.
content_hash() {
  {
    find src -type f \
      \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.mjs' \
         -o -name '*.css' -o -name '*.json' \) -print0 \
      | sort -z \
      | xargs -0 sha256sum
    for f in package.json package-lock.json next.config.js postcss.config.mjs; do
      [[ -f "$f" ]] && sha256sum "$f"
    done
  } | sha256sum | cut -c1-16
}

BUILD_VERSION="$(content_hash)"

# Buang key lama (NEXT_PUBLIC_BUILD_VERSION) supaya tidak menyesatkan — versi
# sekarang hanya dibaca server, bukan di-inline ke bundle.
sed -i '/^NEXT_PUBLIC_BUILD_VERSION=/d' "$ENV_FILE"

if grep -q '^BUILD_VERSION=' "$ENV_FILE"; then
  sed -i "s|^BUILD_VERSION=.*|BUILD_VERSION=${BUILD_VERSION}|" "$ENV_FILE"
else
  printf '\n# Di-generate oleh scripts/deploy.sh — jangan di-edit manual\nBUILD_VERSION=%s\n' \
    "$BUILD_VERSION" >> "$ENV_FILE"
fi

echo "==> BUILD_VERSION=${BUILD_VERSION} (dari hash source)"

echo "==> stop ${SERVICE}"
sudo systemctl stop "$SERVICE"

echo "==> build"
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
