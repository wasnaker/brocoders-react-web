import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = join(root, "src/modules/core/manifests/index.ts");
const outPath = join(root, "src/generated/module-registry.ts");

// Daftar modul hidup di satu file. File ini yang pertama kali dibuat task ini,
// dan diisi manifest core di task berikutnya. Modul dihapus: hapus satu baris di sini.
if (!existsSync(indexPath)) {
  mkdirSync(dirname(indexPath), { recursive: true });
  writeFileSync(
    indexPath,
    "// Alias modul aktif. Tambah satu baris per modul.\n"
  );
  console.log(`[module-registry] dibuat starter ${indexPath}`);
}

const indexSrc = readFileSync(indexPath, "utf8");
const aliases = [
  ...indexSrc.matchAll(/from\s+["'](@\/modules\/[^"']+)["']/g),
].map((m) => m[1]);

if (aliases.length === 0) {
  console.warn("[module-registry] tidak ada modul terdaftar");
}

const slugs = new Map();
for (const alias of aliases) {
  const modPath = join(root, "src", alias.replace("@/", ""));
  if (!existsSync(modPath + ".ts")) {
    console.error(`[module-registry] manifest tidak ditemukan: ${alias}.ts`);
    process.exit(1);
  }
  const src = readFileSync(modPath + ".ts", "utf8");
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

const lines = [
  "// AUTO-GENERATED oleh scripts/generate-module-registry.mjs",
  "// Jangan edit manual. Sumber kebenaran: src/modules/*/module.manifest.ts",
  'import type { ModuleManifest } from "@/core/modules/types";',
  ...aliases.map((a) => `import ${ident(a)} from "${a}";`),
  "",
  aliases.length === 0
    ? "export const moduleRegistry: ModuleManifest[] = [];"
    : [
        "export const moduleRegistry: ModuleManifest[] = [",
        ...aliases.map((a) => `  ${ident(a)},`),
        "];",
      ].join("\n"),
  "",
];

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, lines.join("\n"));
console.log(`[module-registry] ${aliases.length} modul ditulis ke ${outPath}`);
