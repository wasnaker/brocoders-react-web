---
name: module-manifest
description: Add a library to brocoders without editing core files — contributes profile tabs, settings tabs, dashboard widgets, or sidebar menu items. Use when creating a new module folder, adding a settings tab, adding a profile tab, adding a dashboard widget, or adding a sidebar menu entry in this Next.js boilerplate.
---

# Module Manifest

The contract a module author writes to plug a library into the app: profile tabs, settings tabs, dashboard widgets, and sidebar menu items. One file per module, plus one line in a registry index.

## When to use — and when NOT to use

**Use this skill when:**
- Adding a profile tab from a library
- Adding a settings tab from a library
- Adding a dashboard widget from a library
- Adding a sidebar menu entry from a library — **read the i18n note in [Sidebar menu items](#sidebar-menu-items) first**

**Do NOT use this skill for:**
- Adding business features (projects, tasks, invoices, payments, quotations). Those are NOT core concerns — they are separate libraries in separate repos. Core never contains business features.

## Registration steps

Modul **tidak** ditulis langsung ke `src/modules/`. Folder itu ada di
`.gitignore` — isinya disalin dari repo modul sendiri supaya repo core bisa
dipakai aplikasi dengan modul berbeda.

1. Tulis modul di repo-nya: `<repo-modul>/<alias>/web/src/modules/<alias>/`
   (`module.manifest.ts` + tab/widget yang diperlukan), dan
   `<repo-modul>/<alias>/web/src/services/i18n/locales/<lang>/module-<alias>.json`
   untuk 5 locale.
2. Pasang ke core:
   ```bash
   npm run module:add -- <alias>
   ```
   Script itu menyalin folder modul + i18n ke `src/modules/<alias>/`, lalu
   menjalankan generator. Tidak ada file core yang perlu diedit.
3. Lihat status: `npm run module:list` · copot: `npm run module:rm -- <alias>`
4. Restart dev server (`npm run dev`) agar modul termuat.

**Kenapa tidak ada file index?** Dulu ada `src/modules/core/manifests/index.ts`
yang di-grep generator. File itu dihapus. Alasannya: `src/modules/` di-ignore,
jadi file core yang mendaftarkan modul eksternal akan menunjuk folder yang
**tidak ada di fresh clone** — build rusak sebelum modul sempat dipasang.
Generator sekarang memindai disk:

| Sumber | Pola |
|---|---|
| Core (tracked, selalu ikut) | `src/core/manifests/*.manifest.ts` |
| Eksternal (hasil `module:add`) | `src/modules/<alias>/module.manifest.ts` |

Folder di `src/modules/` tanpa `module.manifest.ts` adalah **error**, bukan
"modul yang belum jadi" — generator berhenti dengan pesan yang menyebut
`npm run module:add`. `src/generated/module-registry.ts` tetap di-`.gitignore`
(build artifact); `predev` dan `prebuild` menjalankannya otomatis.

## Manifest template

Copy-paste ready, all four slots filled. **Must be correct and compile-able** — matches `types.ts` and `areas.ts`.

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

  // Bare string label, NOT the object form — see "Sidebar menu items" below.
  // The sidebar subscribes to the "common" namespace only, so a
  // module-newsletter:* key would render as the literal key string.
  menu: [
    {
      slug: "newsletter",
      label: "Newsletter",
      href: "/admin/newsletter", // no locale prefix
      position: 60, // core occupies 10-90
      permission: "read:user",
      icon: Megaphone, // component, deep import
    },
  ],
});
```

**Slot names that matter:** `profileTabs`, `settingsTabs`, `dashboardWidgets`, `menu`. **Not `widgets`** — that key does not exist on `ModuleManifest`.

**Verified by `npx tsc --noEmit` against `types.ts` and `areas.ts`.**

## Sidebar menu items

The `menu` slot is live. `ModuleManifest.menu?: MenuItem[]` is in the type, `resolveMenu()` (`src/core/modules/resolve-menu.ts`) resolves and permission-filters it, and `app-sidebar.tsx` renders the result after its core admin items.

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

Four rules that are not obvious from the type.

**1. No `component`, no `content`.** A menu item is *navigation*, not content. It points at a route that renders your page; it does not render the page itself. So there is no `content: { kind: ... }` wrapper and no `kind` field at all — unlike `TabDef`. Writing `content:` or `component:` on a menu item is a type error.

**2. `icon` is a component.** Same rule as tabs: deep-import from `lucide-react`, never an emoji string.

**3. `href` must NOT start with a locale.** `Link` prepends the active language itself.

```ts
href: "/admin/newsletter"          // correct
href: "/en/admin/newsletter"       // 404 — Link adds /en again
```

**Also: make sure the route exists.** Nothing validates it. A dead `href` renders a 404 on click and produces a `Link` prefetch console error. This already happened — `src/modules/post/module.manifest.ts` points at `/admin/post`, and that resource was never generated. Check the route before shipping.

**4. `permission` works exactly like a tab.** Same `can()` from `src/core/modules/can.ts`, same fail-closed ordering, same `resource:action` naming. `resolveMenu()` **already filtered** — do not re-filter in your component. A second `can()` call or a second `isAdmin` check is duplicated logic that will drift from the resolver.

### Cross-namespace i18n is broken: use a bare string for menu labels

**Known bug, not a new regression, and not fixed.** A label whose namespace differs from the one the component subscribed to renders as the **raw key**.

The sidebar calls `useTranslation("common")`, so it subscribes to `common` only. Nothing loads `module-*` namespaces: `i18next.init` sets `preload: runsOnServerSide ? languages : []` (`src/services/i18n/client.ts:32`) — `languages` holds language *codes*, not namespaces — and `loadNamespaces` is never called. i18next therefore returns the key string.

So `label: { namespace: "module-post", key: "menu" }` renders the literal text `menu`.

**This predates the `menu` slot.** The `profileTabs` entry in `src/modules/post/module.manifest.ts` uses `label: { namespace: "module-post", key: "tab_activity" }` and renders as the literal `tab_activity`. Dashboard widgets are unaffected only because `WidgetCard.tsx` subscribes to `"dashboard"` and the keys are `dashboard:*` — same namespace.

The translation is **not missing** — `src/services/i18n/locales/en/module-post.json` contains `"menu": "Post"`, and the file exists in all five locales. It is simply never fetched.

**Workaround for menu items: use a bare string**, as in the template above, or add the key to `common:*` (note: `common.json` has no `menu` key today, so you would be adding one). This is a workaround, not the right shape — the right shape is the object form, and the fix belongs in the i18n client, not in your manifest. The cost is that a bare string is not translatable.

## Three most common mistakes

| Mistake | Symptom |
|---------|---------|
| `content: FooTab` directly | Must be `content: { kind: "component", component: FooTab }` → Type error |
| `icon: "📈"` string | Must be component + deep import → Type error |
| `alias: "src/modules/x"` (path) | **NO error**, silently breaks — see below |
| `content` / `component` on a menu item | Type error — `MenuItem` has neither. Menu is navigation only |
| `href: "/en/..."` | 404 in all locales — `Link` adds the prefix |
| Re-filtering `menu` by permission | Duplicated logic that drifts from `resolveMenu` |

**Why the third is most dangerous:** If `alias` holds a folder path, when the module is later extracted as a package, every manifest must be rewritten — and the breakage is not discovered until that moment. `alias` is the only stable public identity a manifest has. Today a path-shaped alias is merely untidy; the cost lands at package extraction time under worse review conditions. Use the identity: `alias: "newsletter"`.

**Critical note from verification:** TypeScript's excess-property check **only applies to direct object literals**. Through a variable or spread, a wrong field name passes without error:

```ts
// Caught: direct literal
defineModuleManifest({ alias: "x", widgets: [] });
// TS2353: 'widgets' does not exist in type 'ModuleManifest'

// NOT caught: behind a variable
const m = { alias: "x", widgets: [] };
defineModuleManifest(m); // passes

// NOT caught: spread
defineModuleManifest({ alias: "x", ...extra }); // where extra = { widgets: [] }
```

The generator does not validate slot names — by design, it parses text, not types. `next build` runs its own type check, so the literal form fails there too.

## Deep import icons

This project does **NOT** use barrel imports from `lucide-react`. Always deep-import:

```ts
import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3";
import UsersRound from "lucide-react/dist/esm/icons/users-round";
import SlidersHorizontal from "lucide-react/dist/esm/icons/sliders-horizontal";
```

The path segment is the icon's **kebab-case name**, not its PascalCase export name. `UsersRound` → `icons/users-round`. `BarChart3` → `icons/bar-chart-3`.

Why: the barrel re-exports the entire icon set, pulling all icons into the chunk. `eslint.config.mjs:114` makes the bare specifier an error with an explicit message. `src/types/lucide-react.d.ts` declares the wildcard module so the deep path type-checks; that declaration is type-only and costs nothing at runtime.

## Permissions

`permission` is optional on `TabDef`, `DashboardWidgetDef`, and `MenuItem`. Semantics are identical in all three — decided by `can()` (`src/core/modules/can.ts`), in order:

| # | Condition | Result | Why |
|---|-----------|--------|-----|
| 1 | `permission` is falsy | **allow** | No permission declared = no permission required. Absent is the public default. |
| 2 | `user` is null/undefined | **deny** | Fail-closed. A permission-gated tab must not render for unknown user — otherwise it flashes for one frame before auth resolves. |
| 3 | `Number(user.role?.id) === 1` | **allow** | Admin bypass. `RoleEnum.ADMIN` is `1`. |
| 4 | permissions contain `"*"` | **allow** | Wildcard role. |
| 5 | permissions contain exact string | **allow** | Exact match on `p.name`. No prefix/pattern matching. |
| - | otherwise | **deny** | |

**Consequences:**
- **Omitting `permission` does not mean "deny" — it means "everyone".** On a dashboard widget this is a data-exposure decision. `QuickLinksWidget` ships with no permission; every other widget in `dashboard.manifest.ts` declares one.
- **The gate is render-time, not fetch-time.** A denied tab is filtered before render, but a component tab's own queries are its own responsibility.
- **Fail-closed is deliberate.** If a tab disappears during auth loading, do not "fix" it by loosening `can()` — that removes the property stopping privileged UI from flashing for anonymous visitors.

Name module permissions `resource:action` — `quotation:view`, `newsletter:send`, `read:user`. The colon separates resource from action so a permissions admin can read the list. Exact-match semantics mean the string is an API contract: renaming one in a manifest silently hides the tab.

## Checklist before done

- [ ] `npx tsc --noEmit` — empty
- [ ] `npm run lint` — 0 errors
- [ ] `node scripts/generate-module-registry.mjs` — exit 0
- [ ] i18n in **five** languages — run `ls src/services/i18n/locales/` to confirm. Namespace: `module.<alias>.*`
- [ ] Permission filled if slot needs it
- [ ] If a `menu` item was added: every `href` points at a route that **exists** (click it — a dead route is a 404 plus a prefetch console error, not a type error)
- [ ] If a `menu` item was added: `href` has no locale prefix, and its `label` is a bare string or a `common:*` key (see [the i18n bug](#cross-namespace-i18n-is-broken-use-a-bare-string-for-menu-labels))
- [ ] **`git diff --name-only` shows only library files** — this proves the contract. If core files appear, something is wrong.

## Pointer

See `docs/module-manifest.md` for full detail.