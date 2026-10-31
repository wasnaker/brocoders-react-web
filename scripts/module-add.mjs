#!/usr/bin/env node
/**
 * Salin satu modul dari repo modul ke `src/modules/<alias>/`, lalu bangun ulang
 * registry.
 *
 * Kenapa COPY dan bukan symlink:
 *   Symlink keluar project root ditolak Turbopack ("points out of the
 *   filesystem root"), dan import di dalam modul ikut me-resolve dari realpath
 *   sehingga `node_modules` search tidak pernah sampai ke core (Node mencari ke
 *   atas dari realpath, bukan dari symlink). Copy menghilangkan keduanya tanpa
 *   menyentuh next.config.
 *
 * Bentuk sumber yang diharapkan (satu module = satu repo):
 *   <repo-modul>/<alias>/web/src/modules/<alias>/module.manifest.ts
 *   <repo-modul>/<alias>/web/src/services/i18n/locales/<lang>/module-<alias>.json
 *
 * Pemakaian:
 *   npm run module:add -- regions
 *   npm run module:add -- regions --from /path/lain/ke/repo-modul
 *   npm run module:list
 *   npm run module:rm   -- regions
 */
import { cpSync, existsSync, readdirSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MODULES_REPO = resolve(root, "../brocoders-modules");
const DEST_DIR = join(root, "src/modules");
const LOCALES_DIR = join(root, "src/services/i18n/locales");

// Nama yang dipakai core — bukan kandidat install maupun penghapusan.
const RESERVED = new Set(["core"]);

function fail(message) {
  console.error(`[module:add] ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const positional = [];
  let from = MODULES_REPO;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--from") {
      const value = argv[++i];
      if (!value) fail("--from butuh path");
      from = resolve(value);
    } else {
      positional.push(argv[i]);
    }
  }
  return { positional, from };
}

function regenerateRegistry() {
  execFileSync(
    process.execPath,
    [join(root, "scripts/generate-module-registry.mjs")],
    { stdio: "inherit" }
  );
}

function listDirEntries(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true });
}

function copyLocaleFiles(moduleRoot, alias) {
  // Terjemahan modul ikut disalin ke locale core: loader i18n repo memakai
  // dynamic import per-namespace (`./locales/${language}/${namespace}.json`),
  // jadi namespace baru dari modul langsung ditemukan tanpa konfigurasi.
  const source = join(moduleRoot, "web/src/services/i18n/locales");
  if (!existsSync(source)) {
    console.log(`[module:add] tidak ada folder i18n di ${source}, lewati`);
    return [];
  }

  const copied = [];
  for (const lang of listDirEntries(source)) {
    if (!lang.isDirectory()) continue;
    const file = join(source, lang.name, `module-${alias}.json`);
    if (!existsSync(file)) continue;

    const destDir = join(LOCALES_DIR, lang.name);
    if (!existsSync(destDir)) {
      console.warn(
        `[module:add] lewati ${lang.name}: locale tidak ada di core`
      );
      continue;
    }
    cpSync(file, join(destDir, `module-${alias}.json`));
    copied.push(lang.name);
  }
  return copied;
}

function cmdAdd(alias, from) {
  if (RESERVED.has(alias)) {
    fail(`"${alias}" dipakai core, ganti nama modul`);
  }
  // Alias ikut jadi nama folder DAN jadi import path, jadi karakter aneh di sini
  // akan menggagalkan build dengan pesan yang tidak jelas.
  if (!/^[a-z][a-z0-9-]*$/.test(alias)) {
    fail(
      `alias tidak valid: "${alias}" — pola yang diterima: huruf kecil, angka, ` +
        `tanda hubung (contoh: regions)`
    );
  }

  const moduleRoot = join(from, alias);
  const src = join(moduleRoot, "web/src/modules", alias);
  if (!existsSync(src)) {
    const available = existsSync(from)
      ? readdirSync(from).join(", ") || "(kosong)"
      : "(folder tidak ada)";
    fail(
      `sumber tidak ditemukan: ${src}\n` +
        `  repo modul yang dicek: ${from}\n` +
        `  isinya: ${available}`
    );
  }
  if (!existsSync(join(src, "module.manifest.ts"))) {
    fail(
      `${join(src, "module.manifest.ts")} tidak ada — file inilah yang membuat ` +
        `folder dikenali sebagai modul`
    );
  }

  const dest = join(DEST_DIR, alias);
  if (existsSync(dest)) {
    fail(
      `${dest} sudah ada — hapus dulu (npm run module:rm -- ${alias}) lalu ` +
        `pasang ulang`
    );
  }

  cpSync(src, dest, { recursive: true });
  console.log(`[module:add] ${alias}: menyalin ${src}`);

  const locales = copyLocaleFiles(moduleRoot, alias);
  console.log(
    locales.length > 0
      ? `[module:add] ${alias}: i18n ${locales.length} locale (${locales.join(", ")})`
      : `[module:add] ${alias}: tidak ada i18n yang disalin`
  );

  regenerateRegistry();
  console.log(`[module:add] selesai. Restart dev server agar modul termuat.`);
}

function cmdRm(alias) {
  if (RESERVED.has(alias)) fail(`"${alias}" milik core, tidak boleh dihapus`);

  const dest = join(DEST_DIR, alias);
  if (!existsSync(dest)) fail(`${dest} tidak ada`);

  rmSync(dest, { recursive: true, force: true });
  for (const lang of listDirEntries(LOCALES_DIR)) {
    if (!lang.isDirectory()) continue;
    rmSync(join(LOCALES_DIR, lang.name, `module-${alias}.json`), {
      force: true,
    });
  }

  regenerateRegistry();
  console.log(`[module:add] ${alias} dihapus dari tree`);
}

function cmdList() {
  const installed = listDirEntries(DEST_DIR)
    .filter((d) => d.isDirectory() && !RESERVED.has(d.name))
    .map((d) => d.name);
  console.log(
    installed.length > 0
      ? `modul terpasang: ${installed.join(", ")}`
      : "belum ada modul terpasang (core saja)"
  );
}

const { positional, from } = parseArgs(process.argv.slice(2));
const [command, alias] = positional;

if (command === "add") {
  if (!alias) fail("pemakaian: npm run module:add -- <alias> [--from <path>]");
  cmdAdd(alias, from);
} else if (command === "rm") {
  if (!alias) fail("pemakaian: npm run module:rm -- <alias>");
  cmdRm(alias);
} else if (command === "list") {
  cmdList();
} else {
  fail(
    "perintah tidak dikenal.\n" +
      "  npm run module:add  -- <alias> [--from <path repo modul>]\n" +
      "  npm run module:rm   -- <alias>\n" +
      "  npm run module:list"
  );
}
