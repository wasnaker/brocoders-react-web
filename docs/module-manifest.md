# Module Manifest

The contract a module author writes to plug a library into the app: profile tabs, settings tabs, dashboard widgets, and sidebar menu items. One file per module, plus one line in a registry index.

## Table of Contents <!-- omit in toc -->

- [Module Manifest](#module-manifest)
  - [The four slots](#the-four-slots)
  - [Slot status](#slot-status)
  - [Adding a library](#adding-a-library)
  - [Why the registry is generated](#why-the-registry-is-generated)
  - [Types](#types)
    - [I18nLabel](#i18nlabel)
    - [ModuleManifest](#modulemanifest)
    - [TabDef](#tabdef)
    - [TabContent](#tabcontent)
    - [FieldDef](#fielddef)
    - [FieldOption](#fieldoption)
    - [FieldType](#fieldtype)
    - [DashboardWidgetDef](#dashboardwidgetdef)
    - [MenuItem](#menuitem)
  - [Full example](#full-example)
  - [Common mistakes](#common-mistakes)
    - [Tab content: kind wrapper required](#tab-content-kind-wrapper-required)
    - [Icons: component, not string](#icons-component-not-string)
    - [alias: identity, not path](#alias-identity-not-path)
    - [Menu: no component, no content, icon is a component, href without locale prefix](#menu-no-component-no-content-icon-is-a-component-href-without-locale-prefix)
  - [Icon imports](#icon-imports)
  - [Permissions](#permissions)
  - [i18n](#i18n)
    - [Cross-namespace i18n is broken (verified bug)](#cross-namespace-i18n-is-broken-verified-bug)
  - [Trade-offs](#trade-offs)
  - [Deferred](#deferred)
  - [Open questions](#open-questions)

## The four slots

`ModuleManifest` (`src/core/modules/types.ts:58`) has four array slots plus `alias`.

| Slot                    | Manifest key      | Consumer                        | Resolver                      |
| ----------------------- | ----------------- | ------------------------------- | ----------------------------- |
| Profile page tabs       | `profileTabs`     | `src/core/shells/ProfileShell.tsx:20`  | `resolveTabs(..., "profileTabs", user)` |
| Settings page tabs      | `settingsTabs`    | `src/core/shells/SettingsShell.tsx:32` | `resolveTabs(..., "settingsTabs", user)` |
| Dashboard widgets       | `dashboardWidgets`| `src/core/dashboard/DashboardGrid.tsx:122` | `resolveDashboardWidgets(...)` |
| Sidebar menu            | `menu`            | `src/components/app-sidebar.tsx:193` | `resolveMenu(manifests, user)` |

### The name that matters: `dashboardWidgets`

The widget slot is named **`dashboardWidgets`**. Not `widgets`, not `dashboard`, not `cards`.

The brief this doc answers assumed `widgets` fails silently. **That is not what the code does.** Verified:

```ts
// probe: wrong slot name, object literal
defineModuleManifest({ alias: "x", widgets: [] });
// TS2353: Object literal may only specify known properties,
//         and 'widgets' does not exist in type 'ModuleManifest'.
```

TypeScript's excess-property check catches `widgets` on a direct object literal. Two escape hatches exist, and both were verified:

| How the manifest is written                     | `widgets` caught? | Why                                            |
| ---------------------------------------------- | ----------------- | ---------------------------------------------- |
| `defineModuleManifest({ alias, widgets: [] })` | **yes**, TS2353   | object literal is checked against the target type |
| `const m = { alias, widgets: [] }; defineModuleManifest(m)` | **no**  | excess-property check only applies to fresh literals |
| `defineModuleManifest({ alias, ...extra })` where `extra = { widgets: [] }` | **no** | the spread defeats freshness |

The generator does not catch it either. A manifest using the spread form with `widgets` produced exit code 0 and a normal registry write.

So the risk is real but narrower than "no TypeScript error": it is **no TypeScript error only when the wrong key is hidden behind a variable or a spread**. The registry script (`scripts/generate-module-registry.mjs`) validates `alias`, `defineModuleManifest()` wrapping, numeric `position`, non-empty `fields` with a `key` per field, and duplicate slugs. It has no slot-name check — by design, since it parses text, not types. `next build` runs its own type check, so the literal form fails there too.

## Slot status

| Slot             | Status                                                                       | Verified in                                                                 |
| ---------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `profileTabs`    | Working. Tabs render, permission filter applies, `slug` selects the settings group on the settings side. | `src/core/shells/ProfileShell.tsx:20`, `src/core/manifests/profile.manifest.ts` |
| `settingsTabs`   | Working. Both `kind: "fields"` and `kind: "component"` render.               | `src/core/shells/SettingsShell.tsx:32`, `src/core/shells/SettingsFieldsTab.tsx` |
| `dashboardWidgets` | Working. Widgets render with permission filter, drag-and-drop, and visibility toggle. | `src/core/dashboard/DashboardGrid.tsx:122`, `src/core/dashboard/resolve-layout.ts` |
| `menu`           | **Working.** `ModuleManifest.menu?: MenuItem[]` exists, `resolveMenu` filters by permission and sorts by `position → moduleAlias → slug`, `app-sidebar.tsx` renders resolved items after core admin items. `src/modules/post/module.manifest.ts` declares one menu item (position 50, permission `read:user`, icon `FileText`). | `src/core/modules/types.ts:42`, `src/core/modules/resolve-menu.ts`, `src/components/app-sidebar.tsx:193`, `src/modules/post/module.manifest.ts` |

`icon` on `TabDef` is optional; both shells render `{Icon ? <Icon /> : null}` (`ProfileShell.tsx`, `SettingsShell.tsx`), so a text-only tab is legal.

**Core menu items added in T-066:** `Roles` (`/admin/roles`) and `Modules` (`/admin/modules`) were added to the sidebar as hardcoded core items (not from the registry) — both are admin-only pages that previously had no sidebar entry. They sit alongside `Users`, `Permissions`, and `Dashboard` under the `isAdmin` guard.

## Adding a library

Modul tinggal di repo sendiri lalu disalin ke core. **Tidak ada file core yang
perlu diedit.**

1. Tulis modul di repo modulnya:
   `<repo-modul>/<alias>/web/src/modules/<alias>/module.manifest.ts` (plus tab/widget),
   dan `<repo-modul>/<alias>/web/src/services/i18n/locales/<lang>/module-<alias>.json`
   untuk kelima locale (lihat [i18n](#i18n)).
2. Pasang:
   ```bash
   npm run module:add -- <alias>
   ```
   `scripts/module-add.mjs` menyalin folder modul + i18n ke `src/modules/<alias>/`
   lalu menjalankan generator. Alias harus huruf kecil + angka + tanda hubung
   (`regions`), dan `core` ditolak karena dipakai core.
3. Restart `npm run dev`. `predev`/`prebuild` menjalankan generator otomatis,
   jadi `npm run build` dan `npm run deploy` tidak perlu langkah tambahan.

`npm run module:list` melihat modul yang terpasang, `npm run module:rm -- <alias>`
melepas folder modul dan i18n-nya lalu membangun registry ulang.

`src/modules/` ada di `.gitignore` — isinya milik repo modul, bukan repo core.
Kalau Anda sedang mengerjakan modul di dalam repo core tanpa repo terpisah,
folder itu tetap berfungsi; hanya akan hilang di `git status` dan tidak ikut ke
commit. Itu konsekuensi yang disengaja, bukan bug.

### Kenapa folder di-ignore, dan kenapa copy

`src/modules/` di-ignore supaya satu repo core bisa dipakai aplikasi dengan
modul berbeda tanpa core ikut menyimpan isi modul. Konsekuensinya, **tidak boleh
ada file core yang mendaftarkan modul eksternal** — file itu ter-track, sementara
folder yang dirujuknya hilang di fresh clone.

Karena itu `src/modules/core/manifests/index.ts` (yang duluregistration bridge)
**dihapus**, dan generator memindai disk:

| Sumber | Pola | Status git |
|---|---|---|
| Core | `src/core/manifests/*.manifest.ts` | tracked |
| Eksternal | `src/modules/<alias>/module.manifest.ts` | ignored |

Isi modul disalin, bukan di-symlink. Symlink keluar project root ditolak
Turbopack (`points out of the filesystem root`), dan import di dalam modul ikut
me-resolve dari **realpath** sehingga `node_modules` search berjalan ke atas dari
lokasi modul — tidak pernah sampai ke `node_modules` core. Copy membuat file
benar-benar berada di dalam project, jadi tidak perlu `turbopack.root` di
`next.config`.

## Why the registry is generated

Next.js bundles statically. It cannot discover a directory at runtime and `import()` a variable path — the bundler needs a literal specifier to follow, and any dynamic path would be a runtime network fetch against a build that ships no such asset. A module system that scanned `src/modules/*/` at boot would work in `next dev` and break in `next build`, which is the worst possible split.

So `scripts/generate-module-registry.mjs` scans the two manifest locations, emits `src/generated/module-registry.ts` with literal imports, and TypeScript plus the bundler both see a static array. Three consequences:

| Consequence                                              | Why it follows                                                     |
| -------------------------------------------------------- | ------------------------------------------------------------------ |
| The registry is a build artifact, not source             | regenerating it on every `dev`/`build` would churn the diff       |
| `src/generated/` is in `.gitignore`                      | a committed copy would drift from the index and cause phantom conflicts |
| A new library needs a rebuild                           | there is no runtime loader to pick it up                          |

The generator exits non-zero on a missing manifest file, a missing `alias`, a missing `defineModuleManifest()` wrap, a non-numeric `position`, an empty `fields` array, a field without `key`, or a duplicate `slug` across modules. Each message names the offending file. It has no `try`/`catch` by design: a validation failure must stop the build rather than pass silently.

## Types

All from `src/core/modules/types.ts` and `src/core/dashboard/areas.ts`.

### I18nLabel

```ts
type I18nLabel = string | { namespace: string; key: string };
```

A bare string renders as-is. The object form is resolved to `t("<namespace>:<key>")` (`WidgetCard.tsx:30`, and the `resolveLabel` helper duplicated in both shells). Prefer the object form: a bare string is a translation that does not exist yet.

### ModuleManifest

```ts
interface ModuleManifest {
  alias: string;
  profileTabs?: TabDef[];
  settingsTabs?: TabDef[];
  dashboardWidgets?: DashboardWidgetDef[];
  menu?: MenuItem[];
}
```

| Field              | Type                   | Notes                                                                    |
| ------------------ | ---------------------- | ------------------------------------------------------------------------ |
| `alias`            | `string`               | Required, unique in practice. Module identity — see [alias](#alias-identity-not-path). |
| `profileTabs`      | `TabDef[]`             | Optional. Omit rather than pass `[]`.                                   |
| `settingsTabs`     | `TabDef[]`             | Optional. `slug` doubles as the settings persistence group name.        |
| `dashboardWidgets` | `DashboardWidgetDef[]` | Optional. **Not** `widgets`.                                            |
| `menu`             | `MenuItem[]`           | Optional. Sidebar navigation entries — see [MenuItem](#menuitem).      |

`defineModuleManifest()` is an identity function with no runtime cost. It exists so editors infer the type from the literal and so the generator can grep for it.

### TabDef

```ts
interface TabDef {
  slug: string;
  label: I18nLabel;
  position: number;
  icon?: ComponentType<{ className?: string }>;
  permission?: string;
  content: TabContent;
}
```

| Field       | Notes                                                                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `slug`      | Unique across **all** manifests, both slots — the generator enforces this and fails the build on a duplicate. Doubles as the React key and, for settings, the persistence group. |
| `label`     | Tab trigger text.                                                                                                                        |
| `position`  | Sort key, ascending. Must be a numeric literal — the generator's regex rejects expressions, so `position: BASE` fails the build. Ties break on `alias`, so the order is deterministic across modules. |
| `icon`      | Optional Lucide component. Omit for a text-only tab.                                                                                     |
| `permission`| Optional string. Absent means every user; present means the user's permission list must contain it. See [Permissions](#permissions). |
| `content`   | Discriminated union. `fields` renders the built-in settings form; `component` renders your own.                                        |

### TabContent

```ts
type TabContent =
  | { kind: "fields"; fields: FieldDef[] }
  | { kind: "component"; component: ComponentType };
```

`kind: "fields"` renders `SettingsFieldsTab` (`SettingsShell.tsx`), which persists to the settings API. `kind: "component"` renders your component with no props and no persistence — you own the data fetching.

`fields` may not be empty: the generator fails the build on `fields: []`.

### FieldDef

| Field          | Type                                          | Notes                                                                                |
| -------------- | --------------------------------------------- | ------------------------------------------------------------------------------------ |
| `key`          | `string`                                      | Required. **Dots are allowed and are not a react-hook-form name** — see below.        |
| `label`        | `I18nLabel`                                   | Field label.                                                                           |
| `type`         | `FieldType`                                   | Drives which control renders.                                                           |
| `defaultValue` | `string \| number \| boolean \| string[]`     | Optional. Shown before the user saves anything.                                        |
| `options`      | `FieldOption[]`                               | Required by the UI for `select` and `multiselect`; ignored otherwise.                  |
| `help`         | `I18nLabel`                                   | Optional hint under the control.                                                        |

A dotted `key` like `general.appName` is a legitimate DB column value, but it must never become a react-hook-form `name`. react-hook-form reads a dot as a path separator, the value lands under `{ general: { appName } }`, `formValues["general.appName"]` stays `undefined`, the change comparison reports "unchanged", and the PATCH is never sent. The symptom is a value that saves and then reverts after reload. `SettingsShell` avoids this with `formFieldName(index, key)` (`SettingsFieldsTab.tsx:48`), which is dot-free and unique per tab. If you build your own form, do the same.

### FieldOption

```ts
interface FieldOption { value: string; label?: I18nLabel }
```

`label` is optional — options are commonly just `{ value: "en" }` and render the raw value.

### FieldType

`"text" | "textarea" | "boolean" | "number" | "select" | "multiselect"`. A closed union: an unrecognized string is a type error, not a fallback.

### DashboardWidgetDef

From `src/core/dashboard/areas.ts:46`.

| Field        | Type              | Notes                                                                                                                              |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `id`         | `string`          | Stable identity. Persisted in the per-user saved layout, so **renaming an existing id orphans the user's saved placement**. |
| `label`      | `I18nLabel`       | Card title.                                                                                                                          |
| `area`       | `string`          | An id from `DASHBOARD_AREAS` (`summary`, `main`, `side`), or your own — unknown areas are appended after the built-ins with full width and `label = id`. |
| `position`   | `number`          | Sort key within the area. Numeric literal only.                                                                                      |
| `component`  | `ComponentType`   | Optional. Omitted means a placeholder card, not a crash.                                                                              |
| `permission` | `string`          | Optional, same semantics as `TabDef.permission`.                                                                                     |

`area` is a plain `string`, not a `DashboardAreaDef`. Unknown ids are tolerated by `resolveAreas()` and rendered with a fallback definition (`span: 12`, `layout: "stack"`, label = the raw id string) — a real string, not an i18n key, so an unregistered area shows an untranslated id in the UI. Use a built-in area unless you have a reason not to. If you do add an area, the `layout` choice is not yours to make: it is read from `DASHBOARD_AREAS`, and it also picks the `@dnd-kit` sorting strategy in `DashboardAreaColumn`. An area that needs `"row"` must be added to `DASHBOARD_AREAS` in `areas.ts`.

### MenuItem

From `src/core/modules/types.ts:42`.

```ts
interface MenuItem {
  slug: string;
  label: I18nLabel;
  href: string;
  icon?: ComponentType<{ className?: string }>;
  position: number;
  permission?: string;
  group?: string;
}
```

| Field        | Type              | Notes                                                                                                                              |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `slug`       | `string`          | Unique within the manifest. Doubles as the React key in the sidebar. The `key` for the sort tiebreaker, after `position` and `moduleAlias`. |
| `label`      | `I18nLabel`       | Menu text. Same object form as tabs — but read the [cross-namespace caveat](#cross-namespace-i18n-is-broken-verified-bug) before using it. |
| `href`       | `string`          | Route **without** a locale prefix. The `Link` component adds it. `"/admin/newsletter"`, never `"/en/admin/newsletter"`. |
| `icon`       | `ComponentType`   | Optional Lucide component, deep-imported. Not a string, not an emoji. Omitted renders text-only.                                  |
| `position`   | `number`          | Sort key, ascending. Core items occupy 10–90, so a module should pick a range that leaves room.                                     |
| `permission` | `string`          | Optional, identical semantics to `TabDef.permission` — same `can()`, same fail-closed behaviour. The resolver already filters; do not filter again. |
| `group`      | `string`          | Optional visual grouping label. Currently carried through the resolver untouched and not rendered as a heading.                       |

`resolveMenu()` (`src/core/modules/resolve-menu.ts`) flattens `menu` across all registered manifests, filters with `can(item.permission, user)`, and sorts by `position → moduleAlias → slug`. The sidebar renders whatever survives, after its own hardcoded core items. Core does not know your module's pages — it only renders what is registered.

## Full example

All four live slots filled, both `TabContent` kinds, both `label` forms, permissions present and absent. Shapes checked against `types.ts` and `areas.ts`.

```ts
import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3";
import Megaphone from "lucide-react/dist/esm/icons/megaphone";
import { defineModuleManifest } from "@/core/modules/types";
import { NewsletterEditorTab } from "./tabs/NewsletterEditorTab";
import { NewsletterStatsWidget } from "./widgets/NewsletterStatsWidget";

export default defineModuleManifest({
  alias: "newsletter",

  profileTabs: [
    {
      slug: "newsletter-activity",
      label: { namespace: "module-newsletter", key: "tab_activity" },
      position: 40,
      permission: "read:user",
      content: { kind: "component", component: NewsletterEditorTab },
    },
  ],

  settingsTabs: [
    {
      slug: "newsletter-delivery",
      label: { namespace: "module-newsletter", key: "tab_delivery" },
      position: 50,
      icon: Megaphone,
      content: {
        kind: "fields",
        fields: [
          {
            key: "newsletter.fromName",
            label: { namespace: "module-newsletter", key: "fields.fromName" },
            type: "text",
            defaultValue: "Boilerplate",
          },
          {
            key: "newsletter.replyTo",
            label: { namespace: "module-newsletter", key: "fields.replyTo" },
            type: "text",
            help: { namespace: "module-newsletter", key: "fields.replyToHelp" },
          },
          {
            key: "newsletter.frequency",
            label: { namespace: "module-newsletter", key: "fields.frequency" },
            type: "select",
            defaultValue: "weekly",
            options: [
              { value: "daily" },
              { value: "weekly" },
              {
                value: "monthly",
                label: { namespace: "module-newsletter", key: "fields.monthly" },
              },
            ],
          },
          {
            key: "newsletter.topics",
            label: { namespace: "module-newsletter", key: "fields.topics" },
            type: "multiselect",
            defaultValue: ["product"],
            options: [
              { value: "product" },
              { value: "engineering" },
              { value: "hiring" },
            ],
          },
          {
            key: "newsletter.doubleOptIn",
            label: { namespace: "module-newsletter", key: "fields.doubleOptIn" },
            type: "boolean",
            defaultValue: true,
          },
        ],
      },
    },
  ],

  dashboardWidgets: [
    {
      id: "newsletter-stats",
      label: { namespace: "module-newsletter", key: "widget_stats" },
      area: "summary",
      position: 40,
      component: NewsletterStatsWidget,
      permission: "read:user",
    },
    {
      id: "newsletter-growth",
      label: { namespace: "module-newsletter", key: "widget_growth" },
      area: "main",
      position: 20,
      component: NewsletterStatsWidget,
    },
  ],

  // NOTE: the `label` below is a bare string, not the object form.
  // See "Cross-namespace i18n is broken" under i18n — the sidebar
  // subscribes to "common" only, so a `module-newsletter:*` key would
  // render as the literal key. This is a workaround, not the preferred form.
  menu: [
    {
      slug: "newsletter",
      label: "Newsletter",
      href: "/admin/newsletter",
      position: 60,
      permission: "read:user",
      icon: Megaphone,
    },
  ],
});
```

Register it:

```bash
npm run module:add -- newsletter
```

Note that `href: "/admin/newsletter"` has no locale prefix. The `Link` component adds it — see [Trade-offs](#trade-offs) for what happens when you add it yourself.

## Common mistakes

| Wrong                                                              | Right                                                                      | Symptom                                                     |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `content: FooTab`                                                  | `content: { kind: "component", component: FooTab }`                       | Type error — `FooTab` is not a `TabContent`.                |
| `icon: "📈"`                                                       | `icon: BarChart3` with a deep import                                       | Type error — a string is not a `ComponentType`.             |
| `alias: "src/modules/newsletter"`                                  | `alias: "newsletter"`                                                      | **No error.** Silently wrong, and expensive to discover — see below. |
| `dashboardWidgets` written as `widgets`                             | `dashboardWidgets`                                                         | Type error on a direct literal; **silent** behind a variable or spread. |
| `position: 1000 + offset`                                          | `position: 1000`                                                           | Generator fails the build — `position` must be a numeric literal. |
| `slug: "general"` in a second module                               | a module-scoped slug                                                       | Generator fails the build on duplicate `slug`.              |
| menu item with `component: FooPage` or `content: ...`              | menu items are navigation only — `href` and nothing else                  | Type error — `MenuItem` has neither field.                  |
| `href: "/en/admin/newsletter"`                               | `href: "/admin/newsletter"`                                          | 404 in all five locales — `Link` prepends the locale again.  |
| re-filtering `menu` in your own component                          | trust `resolveMenu` — it already applied `can()`                          | Duplicated, divergent permission logic.                      |

### Tab content: the `kind` wrapper is required

`content` is a union, not the component itself. `content: FooTab` fails type checking because `FooTab` is neither `{ kind: "fields"; fields }` nor `{ kind: "component"; component }`. Write `content: { kind: "component", component: FooTab }` — a real error, at build time, pointing at the line.

### Icons: a component, not a string

`TabDef.icon` is `ComponentType<{ className?: string }>`. `icon: "📈"` is a string and does not satisfy it. `icon: BarChart3` requires importing `BarChart3` as a component:

```ts
import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3";
```

The deep import is mandatory, not stylistic — see [Icon imports](#icon-imports).

### `alias`: identity, not path

`alias: "newsletter"`. **Not** `"src/modules/newsletter"`, **not** `"@/modules/newsletter"`. This is the one mistake on the list that produces no diagnostic at all — verified, including the generator, which passes.

`alias` is a module identity string. It is used for five things (`types.ts:58`, `resolve-tabs.ts:20`, `resolve-widgets.ts:23`, `resolve-menu.ts:22`, `WidgetCard.tsx:57`):

| Use                     | What breaks if it holds a path                                                |
| ----------------------- | ----------------------------------------------------------------------------- |
| Sort tiebreaker         | Cosmetic. Tabs, widgets, and menu items sort by `position` first; a path-shaped alias changes the order only when two modules share a `position`. |
| `moduleAlias` on resolved entries | Cosmetic, same reasoning.                                                    |
| Placeholder widget text | Cosmetic — it is interpolated into a "not implemented" string.                  |
| **Future: package identity** | **The cost lands here.**                                                     |

Today a path-shaped alias is merely untidy. The damage is deferred to the day the core is extracted into a package: `alias` is the only stable public name a manifest has. Once modules ship as packages, the alias is what a consumer's code references and what identifies the module across boundaries. At that point a path alias encodes this repo's directory layout, so every manifest must be rewritten — and rewritten at the exact moment the system is being split, where mass edits are least reviewable. The i18n namespace and the permission string also have to match, and nothing in the toolchain can check that.

Put differently: a path in `alias` looks harmless now and forces a coordinated rewrite later, under worse conditions. Use the identity.

### Menu: no `component`, no `content`, no string `icon`, no locale in `href`

`MenuItem` is deliberately a **smaller** type than `TabDef`, and the differences are the point.

| | `TabDef` | `MenuItem` |
| - | -------- | ---------- |
| Renders | content in a panel | a link that navigates away |
| `content` | required, discriminated union | **absent** — no such field |
| `component` | inside `content: { kind: "component" }` | **absent** — no such field |
| `icon` | optional component | optional component, same rule |

Because a menu item is navigation and not content, there is nothing to discriminate over: there is exactly one shape. **No discriminated union, no `kind` field, no `content`.** Writing `content: { kind: "component", component: FooPage }` on a menu item is a type error — the menu cannot render your component, it can only point at a route that renders it.

`MenuItem.icon` follows the same rule as `TabDef.icon`: a **component** from a deep `lucide-react` import, never an emoji string and never an icon name.

```ts
import Megaphone from "lucide-react/dist/esm/icons/megaphone";

{ slug: "newsletter", icon: Megaphone, /* ... */ }   // right
{ slug: "newsletter", icon: "📣", /* ... */ }        // type error
```

`href` **must not** carry a locale prefix. `Link` (`src/components/link.tsx`) prepends the active language itself, so a manifest href of `/en/admin/newsletter` resolves to `/en/en/admin/newsletter` and 404s in every locale. Write the unprefixed path: `href: "/admin/newsletter"`. This is the same rule the dashboard widgets already follow.

`permission` on a menu item uses **exactly** the same mechanism as a tab: the same `can()` in `src/core/modules/can.ts`, the same fail-closed ordering, the same `"resource:action"` naming. `resolveMenu()` has already applied it — items the user may not see are gone from the array you receive. **Do not filter again in the component.** A second `isAdmin` check or a second `can()` call produces logic that drifts from the resolver and is wrong in one of the two places.

## Icon imports

This project does not use barrel imports from `lucide-react`. Always deep-import:

```ts
import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3";
import UsersRound from "lucide-react/dist/esm/icons/users-round";
import SlidersHorizontal from "lucide-react/dist/esm/icons/sliders-horizontal";
```

The path segment is the icon's **kebab-case name**, not its PascalCase export name. `UsersRound` → `icons/users-round`. `BarChart3` → `icons/bar-chart-3`.

Why: the barrel re-exports the entire icon set, so importing one icon pulls the module graph for all of them into the chunk. `eslint.config.mjs:114` makes the bare specifier an error with an explicit message, and there are ~70 deep imports in `src/` following the rule. `src/types/lucide-react.d.ts` declares the wildcard module so the deep path type-checks; that declaration is type-only and costs nothing at runtime.

## Permissions

`permission` is optional on `TabDef`, `DashboardWidgetDef`, and `MenuItem`, and the semantics are identical in all three cases — decided by `can()` (`src/core/modules/can.ts`), in this order:

| # | Condition                            | Result    | Why                                                                           |
| - | ------------------------------------ | --------- | ----------------------------------------------------------------------------- |
| 1 | `permission` is falsy                | **allow** | No permission declared means no permission required. Absent is the public default. |
| 2 | `user` is null or undefined          | **deny**  | Fail-closed. A permission-gated tab must not render for an unknown user — otherwise it flashes into view for one frame before auth resolves. |
| 3 | `Number(user.role?.id) === 1`       | **allow** | Admin bypass. `RoleEnum.ADMIN` is `1`, and admins are not expected to carry every permission string. |
| 4 | permissions contain `"*"`           | **allow** | Wildcard role.                                                                   |
| 5 | permissions contain the exact string | **allow** | Exact match on `p.name`. No prefix or pattern matching.                       |
| - | otherwise                           | **deny**  |                                                                                 |

Consequences worth internalising:

- **Omitting `permission` does not mean "deny" — it means "everyone".** On a dashboard widget this is a data-exposure decision, not a default. `QuickLinksWidget` ships with no permission; every other widget in `dashboard.manifest.ts` declares one.
- **The gate is render-time, not fetch-time.** A denied tab is filtered out before render, but a component tab's own queries are its own responsibility. The manifest keeps the UI hidden; it does not secure the endpoint behind it.
- **Fail-closed is a deliberate default.** If you are tempted to "fix" a tab that disappears during auth loading by loosening `can()`, you are removing the property that stops privileged UI flashing for anonymous visitors.

Name module permissions `resource:action` — `quotation:view`, `newsletter:send`, `read:user`. The colon separates the resource from the action so a permissions admin can read the list, and the exact-match semantics mean the string is an API contract: renaming one in a manifest silently hides the tab, since the lookup is an equality test with no error path.

## i18n

Five locales ship in `src/services/i18n/locales/`: **`en`, `id`, `ja`, `ko`, `zh`**. That matches `languages` in `src/services/i18n/config.ts`, and `en` is the fallback.

Every label your manifest introduces needs a key in all five:

| Locale | File to create                                     |
| ------ | -------------------------------------------------- |
| `en`   | `src/services/i18n/locales/en/module-<alias>.json` |
| `id`   | `src/services/i18n/locales/id/module-<alias>.json` |
| `ja`   | `src/services/i18n/locales/ja/module-<alias>.json` |
| `ko`   | `src/services/i18n/locales/ko/module-<alias>.json` |
| `zh`   | `src/services/i18n/locales/zh/module-<alias>.json` |

The namespace is `module-<alias>` — the existing `post` module uses `module-post` (`src/services/i18n/locales/*/module-post.json`), referenced as `{ namespace: "module-post", key: "tab_activity" }`. A missing file is not a build error: i18next falls back to `en`, so a module with only an English namespace ships working in one language and raw keys in the other four.

`context`, the object form of `I18nLabel`, is resolved by string concatenation — `namespace`, `:`, `key` — so the JSON nests however you like and the `key` is the path beneath it:

```json
{
  "tab_activity": "Newsletter Activity",
  "fields": {
    "fromName": "From name",
    "monthly": "Monthly",
    "replyToHelp": "Where replies are delivered."
  }
}
```

Namespaces load lazily through `i18next-resources-to-backend`, one dynamic import per namespace per language. Core namespaces (`settings`, `profile`, `dashboard`, `common`) already exist per locale. One hard rule from the dashboard widgets: **do not hardcode locale-prefixed paths.** The `Link` component adds the locale prefix itself, so a widget href of `/admin/users` is correct and `/en/admin/users` is broken in the other four locales.

### Cross-namespace i18n is broken (verified bug)

**The symptom.** A label written as an object whose namespace differs from the one the rendering component subscribes to renders as the **raw key**, not the translation. In the sidebar:

```ts
// src/modules/post/module.manifest.ts
label: { namespace: "module-post", key: "menu" }
```

renders the literal text `menu` instead of `Post`. Not an empty string, not the namespace-qualified key — just `menu`.

**The root cause**, verified in `src/services/i18n/client.ts`:

- The sidebar calls `useTranslation("common")`. That subscribes the component to the `common` namespace only.
- `t("module-post:menu")` asks i18next for a namespace that was never subscribed, and **nothing loads it**. `i18next.init` sets `preload: runsOnServerSide ? languages : []` (line 32) — `languages` is a list of *language* codes, not namespaces — and `loadNamespaces` does not appear anywhere in `src/`.
- With no resources loaded for `module-post`, i18next falls back to returning the key string. Hence the literal.

The translation is **not missing**. `src/services/i18n/locales/en/module-post.json` contains `"menu": "Post"`, and the file exists for all five locales. The value is correct, reachable on disk, and never fetched — so this is purely a missing loader, not a missing translation. That is also why there is no fallback to `en`: the `en` file is in the same unloaded namespace.

**This is not a new regression introduced with the `menu` slot.** The profile tab that predates it is already broken the same way: `src/modules/post/module.manifest.ts` declares `profileTabs` with `label: { namespace: "module-post", key: "tab_activity" }`, and that renders as the literal `tab_activity`. The `menu` slot simply made the same pre-existing bug easier to notice.

Dashboard widgets are the exception, and only by coincidence: `WidgetCard.tsx` subscribes to `"dashboard"` and its widget keys are `dashboard:*` — **the same namespace**. Same-namespace labels work. Cross-namespace ones do not.

**The general rule this implies:** any `I18nLabel` whose `namespace` differs from the namespace the consuming component subscribed to will render as its raw key.

| Consumer | Subscribed namespace | Manifest labels that work |
| -------- | -------------------- | ------------------------- |
| `app-sidebar.tsx` | `common` | `common:*` only |
| `WidgetCard.tsx` | `dashboard` | `dashboard:*` only |
| `ProfileShell.tsx` | `profile` | `profile:*` only |
| `SettingsShell.tsx` | `settings` | `settings:*` only |

**What a module author does about it now.** This is a **workaround**, not the correct shape — the correct shape is the object form, and the fix belongs in the i18n client, not in your manifest.

- Use a **bare string** `label` when the label must be cross-namespace, or
- Put the key in the namespace the component subscribes to (`common:*` for a sidebar entry), or
- Accept that the key renders literally until the loader is fixed.

Choosing a bare string means the label is not translatable. That is a real loss, and it is the price of the bug — not a design you should come to rely on. See [Open questions](#open-questions).

## Trade-offs

The current design is build-time static composition. What that buys, and what it costs:

| Decision                       | Buys                                                              | Costs                                                                   |
| ------------------------------ | ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Generated static registry      | Tree-shaking, type checking, no runtime fetch, one deploy artifact | Every new or removed library needs a rebuild                           |
| No runtime loader              | No dynamic-`import()` from a string, no eval, no fetch-and-run    | Libraries cannot be installed into a running instance                   |
| No enable/disable flag         | Every registered module is live for everyone it registers for      | Per-environment or per-tenant module selection is impossible without a rebuild |
| No marketplace                 | Contracts stay in-repo and reviewable                             | Nothing can be added without a source change and a deploy              |
| Single repo, single deploy     | Cross-module changes are one atomic deploy; no version skew       | One library's deploy takes down or restarts all of them                 |

The practical read: adding a library is a code change, a review, and a deploy. That is the intended model. If a future requirement needs modules installed at runtime, the registry generator is the seam to revisit — not a workaround bolted onto a manifest.

Two costs of the `menu` slot are worth stating separately, because neither is visible at the type level.

**A menu `href` must point at a route that actually exists.** Nothing validates it. A dead `href` produces two symptoms rather than an error: clicking the item renders a 404, and `Link` *prefetch*ing a route that does not exist produces a console error on every sidebar render. This happened in practice — `src/modules/post/module.manifest.ts` declares `href: "/admin/post"`, and no `post` resource was ever generated, so that route does not exist. The manifest type-checks, the registry accepts it, and the failure only appears at click time. Check the route before you ship the item.

**Menu `isActive` is `pathname.includes(href)`** (`app-sidebar.tsx:283`) — the same style the hardcoded core items use. The consequence is a loose match: with `href: "/admin/users"`, visiting `/admin/users/123` highlights **Users**. That is inherited legacy behaviour, deliberately not changed, because changing only module items while core items keep the old rule would make the sidebar behave two different ways. Module authors inherit the imprecision along with the rule.

## Deferred

Deferred, not discarded. Both items below were considered and parked.

**Extracting the module core into a package**, and cross-package TypeORM. The constraint that governs the second is concrete and verified in the API, not hypothetical. `brocoders-api/src/database/typeorm-config.service.ts:26` sets:

```ts
entities: [__dirname + '/../**/*.entity{.ts,.js}'],
```

That glob resolves to `brocoders-api/**/*.entity` and **does not reach `node_modules`**. If the core later ships as a package with its entities inside, TypeORM will not find them. The failure mode is what makes it worth writing down: it passes the build, passes boot, and surfaces as `NoMetadataError` on the first query that touches the missing entity — in production, under load, after the deploy. Any extraction plan must change entity discovery first; it cannot be deferred to the extraction itself.

Two costs show up the moment a manifest becomes a package boundary, both traced above: `alias` must hold an identity rather than a path ([see above](#alias-identity-not-path)), and the i18n namespace plus permission strings become public API that cannot be renamed casually.

## Open questions

Flagged rather than guessed, because each needs a decision from the repo owner.

1. **Cross-namespace i18n does not load.** The bug is [documented above](#cross-namespace-i18n-is-broken-verified-bug) and it predates the `menu` slot — profile tabs from `module-post` are already broken. The sidebar subscribes to `common`, `useTranslation` only suspends on the subscribed namespace, `preload` carries language codes rather than namespaces, and `loadNamespaces` is never called. **Unfixed.** Decisions needed: whether to call `loadNamespaces` eagerly for `module-*` namespaces at the app boundary, or to have each `resolveLabel` call site preload the namespace it is about to read, or to widen `preload` to accept namespaces. Any of those fixes the symptom properly; none of them is a manifest author's decision, which is why a workaround is documented above instead.
2. **Menu `href` is not validated.** `src/modules/post/module.manifest.ts` points at `/admin/post`, which does not exist — a 404 on click plus a prefetch console error. The generator has no route check, and adding one is not obviously possible from a manifest script. Decision needed: whether the generator should verify that a `menu[].href` resolves to a route, or whether dead hrefs stay the author's responsibility.
3. **Menu `group` is inert.** The field exists on `MenuItem` and survives the resolver, but the sidebar renders no group headings. Either core starts rendering them or the field should be dropped. Left in place because removing it is a breaking change to a published type.
4. **Tab `position` spacing.** Existing manifests use steps of 10 (`10`, `20`, `30`, `90`) with no stated convention. Worth documenting whether gaps are reserved for core tabs.
5. **`version` from `/api/v1/modules` is a placeholder.** The backend returns a hardcoded `'1.0.0'` for every module, not real data. `brocoders-api/src/config/modules.config.ts` is a static config list (there is no filesystem scan and no database), and its own comment says the field does not come from the frontend manifest — `ModuleManifest` has no `version` field to source it from. Anything that displays a module version to a user is showing a constant. Decision needed: add `version` to the manifest type so the backend can read a real value, or drop the field from the API response so the absence is visible rather than papered over. Note the config file must also be kept in sync by hand — it is not generated from the registry.

---

Previous: [Auth](auth.md)

Next: [Testing](testing.md)
