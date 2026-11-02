#!/usr/bin/env node
/**
 * Install external modules as version-pinned package dependencies.
 * The module repository is the only source of truth; this script never copies
 * module files into src/modules or locale directories.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJsonPath = join(root, "package.json");
const RESERVED = new Set(["core"]);

function fail(message) {
  console.error(`[module:add] ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const positional = [];
  const options = { ref: null, repo: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--ref" || argv[i] === "--repo") {
      const key = argv[i] === "--ref" ? "ref" : "repo";
      const value = argv[++i];
      if (!value) fail(`${argv[i - 1]} membutuhkan nilai`);
      options[key] = value;
    } else {
      positional.push(argv[i]);
    }
  }
  return { positional, options };
}

function runNpm(args) {
  execFileSync("npm", args, { cwd: root, stdio: "inherit" });
}

function regenerateRegistry() {
  execFileSync(
    process.execPath,
    [join(root, "scripts/generate-module-registry.mjs")],
    { cwd: root, stdio: "inherit" }
  );
}

function packageName(alias) {
  return `@wasnaker/module-${alias}`;
}

function cmdAdd(alias, { ref, repo }) {
  if (RESERVED.has(alias)) fail(`"${alias}" dimiliki core`);
  if (!/^[a-z][a-z0-9-]*$/.test(alias)) {
    fail(`alias tidak valid: ${alias}`);
  }
  if (!ref) {
    fail(
      "ref wajib ditentukan agar dependency dapat dikunci: --ref <tag-atau-commit-sha>"
    );
  }
  const repository = repo ?? `wasnaker/bc-${alias}`;
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    fail(`nama repository tidak valid: ${repository}`);
  }

  const spec = `git+https://github.com/${repository}.git#${ref}`;
  console.log(`[module:add] memasang ${packageName(alias)} dari ${spec}`);
  runNpm(["install", "--save-exact", spec]);
  regenerateRegistry();
  console.log(`[module:add] ${alias} terpasang sebagai package dependency.`);
}

function cmdRm(alias) {
  if (RESERVED.has(alias)) fail(`"${alias}" dimiliki core`);
  runNpm(["uninstall", packageName(alias)]);
  regenerateRegistry();
  console.log(`[module:rm] ${alias} dihapus dari dependency host.`);
}

function cmdList() {
  const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const installed = Object.keys(pkg.dependencies ?? {})
    .filter((name) => name.startsWith("@wasnaker/module-"))
    .sort()
    .map((name) => name.slice("@wasnaker/module-".length));
  console.log(
    installed.length
      ? `module packages: ${installed.join(", ")}`
      : "belum ada module package terpasang"
  );
}

const { positional, options } = parseArgs(process.argv.slice(2));
const [command, alias] = positional;
if (command === "add") {
  if (!alias)
    fail(
      "pemakaian: npm run module:add -- <alias> --ref <tag-atau-commit> [--repo owner/repo]"
    );
  cmdAdd(alias, options);
} else if (command === "rm") {
  if (!alias) fail("pemakaian: npm run module:rm -- <alias>");
  cmdRm(alias);
} else if (command === "list") {
  cmdList();
} else {
  fail("perintah tidak dikenal: gunakan add, rm, atau list");
}
