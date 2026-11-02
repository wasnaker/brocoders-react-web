# Module package architecture

## Ownership rule

A module repository is the sole owner of its implementation. The frontend host
must not contain editable copies of module pages, components, hooks, services,
manifests, or locale JSON files.

The host owns shared infrastructure only: routing adapters, authentication,
API/runtime providers, design-system primitives, and module discovery.

## Package contract

Each frontend module is installed as a version-pinned Git package:

- package name: `@wasnaker/module-<alias>`
- public entry: package root
- manifest entry: `@wasnaker/module-<alias>/manifest`
- locale entries: `@wasnaker/module-<alias>/locales/<language>`
- module manifest must use the host `defineModuleManifest` contract
- module source may import host infrastructure through the configured `@/*`
  alias; such imports are resolved by the host and are not bundled as module
  copies.

The host transpiles all installed `@wasnaker/module-*` packages and generates
its manifest and locale registries from `package.json` dependencies.

## Commands

Install a module at an immutable ref:

```bash
npm run module:add -- region --ref <commit-sha-or-release-tag>
```

Remove a module:

```bash
npm run module:rm -- region
```

List installed modules:

```bash
npm run module:list
```

The install command updates both `package.json` and `package-lock.json`.
Use `npm ci` in CI/production to reproduce the exact dependency graph.

## Change workflow

1. Implement and test module changes in the module repository.
2. Commit the change and create a release tag (or use its immutable commit SHA).
3. Update the host dependency with `module:add`.
4. Review the host adapter/route changes only when the host contract changes.
5. Never hotfix module code inside the host repository.

## Local development

For simultaneous development, use a local package link/workspace only in a
developer checkout. Do not commit copied source or edit files under
`node_modules`. The committed dependency must remain pinned to a module Git
commit or release tag.
