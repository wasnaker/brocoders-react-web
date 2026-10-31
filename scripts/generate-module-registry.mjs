import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
} from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "src/generated/module-registry.ts");

// Manifest discovery memindai DISK, bukan file index. Alasannya: `src/modules/`
// ada di .gitignore (isi modul datang dari repo terpisah lewat
// `scripts/module-add.mjs`), jadi tidak boleh ada file core yang mendaftarkan
// modul eksternal — file itu akan menunjuk folder yang hilang di fresh clone.
//
// Dua sumber, dibedakan letak foldernya:
//   core        src/core/manifests/*.manifest.ts   — tracked, selalu ikut
//   eksternal   src/modules/<alias>/module.manifest.ts — hasil module-add
const CORE_MANIFEST_DIR = join(root, "src/core/manifests");
const EXTERNAL_MODULES_DIR = join(root, "src/modules");

/**
 * Kembalikan daftar manifest yang harus di-import, sebagai alias path '@/…'.
 * Nama file sudah diurutkan supaya output stabil antar-run — tanpa itu registry
 * bisa bergeser urutan tiap build dan menghasilkan diff palsu.
 */
function discoverManifests() {
  const found = [];

  // Core: hanya file *.manifest.ts langsung di folder, bukan subfolder.
  if (existsSync(CORE_MANIFEST_DIR)) {
    for (const name of readdirSync(CORE_MANIFEST_DIR).sort()) {
      if (name.endsWith(".manifest.ts")) {
        found.push({
          alias: `@/core/manifests/${basename(name, ".ts")}`,
          file: join(CORE_MANIFEST_DIR, name),
        });
      }
    }
  }

  // Eksternal: satu folder per alias, manifest HARUS bernama module.manifest.ts.
  // Folder tanpa manifest adalah kesalahan (module:add yang gagal di tengah),
  // bukan "modul yang belumJadi" — diamkan saja akan menghasilkan modul hilang
  // tanpa jejak saat runtime.
  if (existsSync(EXTERNAL_MODULES_DIR)) {
    for (const alias of readdirSync(EXTERNAL_MODULES_DIR, {
      withFileTypes: true,
    })) {
      if (!alias.isDirectory()) continue;
      const file = join(EXTERNAL_MODULES_DIR, alias.name, "module.manifest.ts");
      if (!existsSync(file)) {
        console.error(
          `[module-registry] src/modules/${alias.name}/ tidak punya module.manifest.ts — ` +
            `folder dibuang. Jalankan ulang 'npm run module:add ${alias.name}'.`
        );
        process.exit(1);
      }
      found.push({ alias: `@/modules/${alias.name}/module.manifest`, file });
    }
  }

  return found;
}

const manifests = discoverManifests();

if (manifests.length === 0) {
  console.warn("[module-registry] tidak ada manifest ditemukan");
}

// Pesan error selalu menyebut file yang bermasalah supaya jelas mana yang
// harus diperbaiki. File ini sengaja tanpa try/catch: kegagalan validasi
// harus menghentikan proses, bukan diteruskan diam-diam.
function fail(file, message) {
  console.error(`[module-registry] ${file}: ${message}`);
  process.exit(1);
}

// Lompati string (quote tunggal, double, template) agar kurung di dalam
// teks tidak dihitung sebagai struktur kode.
function skipString(src, i) {
  const quote = src[i];
  for (let j = i + 1; j < src.length; j++) {
    if (src[j] === "\\") {
      j++;
      continue;
    }
    if (src[j] === quote) return j;
  }
  return src.length;
}

// Baca satu blok yang diawali '[' atau '{' (atau '(') dan kembalikan isi
// serta indeks penutupnya. Mengembalikan null kalau kurung tidak seimbang —
// pemanggil wajib melaporkan itu, bukan mengabaikannya.
function readBlock(src, openIdx) {
  const closing = { "[": "]", "{": "}", "(": ")" };
  const stack = [];
  for (let i = openIdx; i < src.length; i++) {
    const ch = src[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      i = skipString(src, i);
      continue;
    }
    if (closing[ch]) {
      stack.push(closing[ch]);
      continue;
    }
    if (ch === "]" || ch === "}" || ch === ")") {
      if (stack.pop() !== ch) return null;
      if (stack.length === 0)
        return { body: src.slice(openIdx + 1, i), end: i };
    }
  }
  return null;
}

// Kumpulkan setiap objek literal `{...}` di dalam isi sebuah array.
function objectLiterals(body) {
  const found = [];
  for (let i = 0; i < body.length; i++) {
    if (body[i] !== "{") continue;
    const block = readBlock(body, i);
    if (block === null) return null;
    found.push(block.body);
    i = block.end;
  }
  return found;
}

const NUMBER = /^-?\d+(\.\d+)?$/;

function validateManifest(file, src) {
  // 1. alias wajib ada.
  if (!/\balias\s*:\s*["'][^"']+["']/.test(src)) {
    fail(file, 'manifest tidak punya "alias"');
  }

  // 2. Manifest harus dibungkus defineModuleManifest.
  if (!/\bdefineModuleManifest\s*\(/.test(src)) {
    fail(file, "manifest tidak dibungkus defineModuleManifest()");
  }

  // 5. position harus angka literal, bukan string atau ekspresi.
  for (const m of src.matchAll(/\bposition\s*:\s*([^\s,}]+)/g)) {
    if (!NUMBER.test(m[1])) {
      fail(file, `position bukan number: ${m[1]}`);
    }
  }

  // 3 + 4. Tab kind "fields" harus punya fields terisi dan tiap field punya key.
  for (const kindMatch of src.matchAll(/\bkind\s*:\s*["']fields["']/g)) {
    const rest = src.slice(kindMatch.index);
    const fieldsMatch = /\bfields\s*:\s*\[/.exec(rest);
    if (fieldsMatch === null) {
      fail(file, 'tab kind "fields" tidak punya array fields');
    }
    const openIdx =
      kindMatch.index + fieldsMatch.index + fieldsMatch[0].length - 1;
    const block = readBlock(src, openIdx);
    if (block === null) {
      fail(file, 'tab kind "fields" punya array fields yang tidak bisa dibaca');
    }
    if (block.body.trim() === "") {
      fail(file, 'tab kind "fields" punya fields: [] (kosong)');
    }
    const fields = objectLiterals(block.body);
    if (fields === null) {
      fail(file, 'array fields pada tab kind "fields" tidak bisa dibaca');
    }
    for (const fieldSrc of fields) {
      if (!/\bkey\s*:\s*["'][^"']+["']/.test(fieldSrc)) {
        fail(file, 'field tanpa "key" pada tab kind "fields"');
      }
    }
  }
}

// Validasi per manifest. Slug dikumpulkan lintas core DAN eksternal supaya
// tab "general" milik core dan tab "general" milik modul tetap dianggap bentrok.
const slugs = new Map();
for (const { alias, file } of manifests) {
  const src = readFileSync(file, "utf8");
  validateManifest(`${alias}.ts`, src);
  for (const m of src.matchAll(/slug:\s*["']([^"']+)["']/g)) {
    if (slugs.has(m[1])) {
      console.error(
        `[module-registry] slug duplikat "${m[1]}" di ${alias} (dipakai oleh ${slugs.get(m[1])})`
      );
      process.exit(1);
    }
    slugs.set(m[1], alias);
  }
}

const ident = (a) => a.replace(/[^a-zA-Z0-9]/g, "_");
const aliases = manifests.map((m) => m.alias);

const lines = [
  "// AUTO-GENERATED oleh scripts/generate-module-registry.mjs",
  "// Jangan edit manual. Sumber kebenaran: src/core/manifests/*.manifest.ts",
  "// (core) dan src/modules/*/module.manifest.ts (modul eksternal).",
  'import type { ModuleManifest } from "@/core/modules/types";',
  ...manifests.map(({ alias }) => `import ${ident(alias)} from "${alias}";`),
  "",
  aliases.length === 0
    ? "export const moduleRegistry: ModuleManifest[] = [];"
    : [
        "export const moduleRegistry: ModuleManifest[] = [",
        ...manifests.map(({ alias }) => `  ${ident(alias)},`),
        "];",
      ].join("\n"),
  "",
];

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, lines.join("\n"));
console.log(
  `[module-registry] ${aliases.length} manifest ditulis ke ${outPath} ` +
    `(${slugs.size} slug)`
);
