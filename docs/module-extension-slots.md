# Frontend module extension slots

Modules can contribute React components to stable host extension points through `ModuleManifest.extensions`. The host decides where a slot is rendered; the module package owns the contributed component.

## Supported slot names

| Slot | Intended host location |
|---|---|
| `page.actions` | Page-level action area |
| `table.actions` | Table toolbar or row-action area |
| `table.columns` | Additional table columns |
| `table.filters` | Table filter area |
| `form.fields` | Form field area |
| `form.sections` | Form section area |
| `detail.actions` | Detail header action area |
| `detail.panels` | Detail page panels |
| `component.before` | Before a named host component |
| `component.after` | After a named host component |

The `target` is a stable host identifier, for example `customer.branch.list` or `customer.branch.edit`. It is not a URL and should not be inferred from a component filename.

## Module declaration

```tsx
import { defineModuleManifest } from "@/core/modules/types";
import type { ModuleExtensionProps } from "@/core/modules/types";

function BranchExportAction({ context }: ModuleExtensionProps) {
  const branchId = context?.branchId;
  return <button type="button" onClick={() => exportBranch(branchId)}>Export</button>;
}

export default defineModuleManifest({
  alias: "customer",
  extensions: [
    {
      id: "branch.export",
      slot: "page.actions",
      target: "customer.branch.detail",
      component: BranchExportAction,
      position: 30,
      permission: "read:customer-branch",
    },
  ],
});
```

## Host rendering

Place the shared renderer where the host owns the slot:

```tsx
<ModuleExtensionSlot
  slot="page.actions"
  target="customer.branch.detail"
  user={user}
  context={{ branchId: branch.id, branch }}
/>
```

The renderer:
- finds contributions for the exact slot and target;
- applies the existing role-aware permission check before rendering;
- sorts by `position`, then module alias and extension ID;
- passes only module alias, slot, target, and the caller-provided view context.

## Security and ownership rules

- Hiding a contribution is a UI affordance, not API authorization. Every protected API endpoint must enforce permission server-side.
- Do not pass database repositories, TypeORM managers, secrets, or privileged service objects through `context`.
- Prefer IDs and small view DTOs. Components fetch protected data through the module's API client.
- Extension IDs must be stable and unique within their owning module.
- The host must render only slots it explicitly supports; a module cannot create arbitrary DOM placement by registering a new slot name.
- The resolver uses exact target matching. There is no wildcard target that could accidentally leak an action into unrelated pages.

## Current scope

This change supplies the manifest contract, permission-aware resolver, registry lookup, and reusable renderer. Existing menus, routes, tabs, and dashboard widgets remain unchanged. The host still needs to place `ModuleExtensionSlot` at each desired UI location; modules do not patch host pages.
