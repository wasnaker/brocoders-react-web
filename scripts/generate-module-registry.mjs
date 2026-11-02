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
const localeOutPath = join(root, "src/generated/module-locales.ts");
const CORE_MANIFEST_DIR = join(root, "src/core/manifests");
const LEGACY_MODULE_DIR = join(root, "src/modules");
const PACKAGE_JSON = join(root, "package.json");
const LANGUAGES = ["en", "id", "ja", "ko", "zh"];

function discoverManifests() {
  if (existsSync(LEGACY_MODULE_DIR) && readdirSync(LEGACY_MODULE_DIR).length > 0) {
    console.error("[module-registry] source module tidak boleh disalin ke src/modules; pasang sebagai package dependency.");
    process.exit(1);
  }

  const found = [];
  if (existsSync(CORE_MANIFEST_DIR)) {
    for (const name of readdirSync(CORE_MANIFEST_DIR).sort()) {
      if (name.endsWith(".manifest.ts")) {
        found.push({
          alias: `@/core/manifests/${basename(name, ".ts")}`,
          file: join(CORE_MANIFEST_DIR, name),
          packageName: null,
        });
      }
    }
  }

  const packageJson = JSON.parse(readFileSync(PACKAGE_JSON, "utf8"));
  const dependencies = Object.keys(packageJson.dependencies ?? {})
    .filter((name) => name.startsWith("@wasnaker/module-"))
    .sort();

  for (const packageName of dependencies) {
    const moduleAlias = packageName.slice("@wasnaker/module-".length);
    const packageRoot = join(root, "node_modules", "@wasnaker", `module-${moduleAlias}`);
    const packageManifest = join(
      packageRoot,
      "web/src/modules",
      moduleAlias,
      "module.manifest.ts"
    );
    if (!existsSync(packageManifest)) {
      console.error(`[module-registry] ${packageName} tidak memiliki module manifest pada ${packageManifest}`);
      process.exit(1);
    }
    found.push({
      alias: `${packageName}/manifest`,
      file: packageManifest,
      packageName,
      moduleAlias,
    });
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
  "// Jangan edit manual. Sumber module: package dependencies @wasnaker/module-*.",
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

const localeImports = [];
const localeEntries = [];
for (const manifest of manifests.filter((item) => item.packageName)) {
  const moduleAlias = manifest.moduleAlias;
  const packageJsonPath = join(
    root,
    "node_modules",
    "@wasnaker",
    `module-${moduleAlias}`,
    "package.json"
  );
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  for (const language of LANGUAGES) {
    const exportPath = `./locales/${language}`;
    if (!packageJson.exports?.[exportPath]) continue;
    const localIdent = ident(`${moduleAlias}_${language}`);
    const importPath = `${manifest.packageName}/locales/${language}`;
    localeImports.push(`import ${localIdent} from "${importPath}";`);
    localeEntries.push(
      `  { namespace: "module-${moduleAlias}", language: "${language}", resource: ${localIdent} },`
    );
  }
}

const localeLines = [
  "// AUTO-GENERATED oleh scripts/generate-module-registry.mjs",
  ...localeImports,
  "",
  "export const moduleLocaleResources = [",
  ...localeEntries,
  "] as const;",
  "",
];

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, lines.join("\n"));
writeFileSync(localeOutPath, localeLines.join("\n"));
console.log(
  `[module-registry] ${aliases.length} manifest dan ${localeEntries.length} locale resources dihasilkan`
);
