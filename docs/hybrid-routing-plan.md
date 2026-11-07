# Hybrid Routing Strategy — Architecture & Migration Plan

> Status: Implemented on main; post-merge verification and follow-up corrections remain open.

## Post-merge audit — 2026-11-01

This audit supersedes the historical branch-status statements and earlier source snapshots below.

- PR #1 (`fix/hybrid-routing-foundation`) was merged into `main`; its merge commit is `3b38a960ed0b067229284125621eac1cb7fe71cf`.
- The canonical authenticated route prefix is `/admin`. Public pages remain locale-prefixed. The root layout is a Server Component, the admin layout no longer owns nested document elements, and both route trees compose the shared application providers.
- The proxy normalizes legacy `/admin-panel/*`, `/{language}/admin-panel/*`, and `/{language}/admin/*` paths to locale-free `/admin/*`, preserving query strings.
- Host route entries exist under `src/app/admin`; localized `src/app/[language]/admin` content files remain as reusable page-content/auth-guard implementations and legacy redirect targets.
- CI on the merged commit did **not** pass: E2E lint failed with 67 Prettier errors (plus warnings); generator CRUD/static runs failed on `eqeqeq` in `src/modules/region/pages/region-page.tsx`. These are post-merge failures and must be resolved before declaring the migration verified.
- The companion `bc-region` repository now uses `/admin/region` consistently in its module manifest, integration guide, and README on `main`.
- Admin language is bootstrapped server-side from the validated preference cookie / `Accept-Language`. The backend is PostgreSQL-only and persists `user.language` through `PATCH /v1/auth/me`; the frontend persists admin language changes through that endpoint and synchronizes the preference cookie.

## Follow-up correction — 2026-11-02

The post-merge navigation audit found that the account dropdown still linked to
locale-prefixed public routes for Profile and Settings. The canonical route
contract now also applies to these authenticated account pages:

- Profile: `/admin/profile`
- Profile editing: `/admin/profile/edit`
- Settings: `/admin/settings`

The dropdown and Profile tab cancel links target these canonical paths. The
corresponding route entries reuse the existing authenticated page-content
components under the shared admin providers. Existing localized URLs
(`/{language}/profile`, `/{language}/profile/edit`, and
`/{language}/settings`) permanently redirect to their canonical admin
equivalents. Regression coverage asserts the menu hrefs and legacy redirects.

The API repository has no frontend navigation paths to migrate. The
`bc-region` manifest and integration guide already use `/admin/region`.

The original sections below preserve the design rationale and historical review notes. Re-check each item against current source and CI before marking an acceptance gate complete.

> Scope: routing, root layouts, authentication bootstrap, language resolution, navigation, module registry, SEO, and regression coverage.
> Related issue: #185 (hydration mismatch on authenticated pages).
> Baseline reviewed: Next.js 16.2.0 / React 19.2.4 on the repository default branch at the time of revision.

## 1. Executive summary

Introduce two explicit URL policies:

1. **Public pages** retain the locale segment: /[language]/... (for example, /id/sign-in and /en/privacy-policy). The URL is authoritative for these pages.
2. **Authenticated application pages** use locale-free URLs: /admin/... (for example, /admin/dashboard). The authenticated user's validated language preference is authoritative.

This is an architectural migration, not a directory rename. Work has already started: routing utilities were added, a new src/app/layout.tsx and src/app/admin/layout.tsx were introduced, several admin-panel folders were renamed to admin, and a locale-free dashboard route was added. However, source review at commit c1e4878 shows that the hybrid migration is not yet complete: most module pages remain under src/app/[language]/admin, the custom Link still prefixes every internal absolute path, the new admin layout renders nested html/body, and language resolution still depends on client auth state. These are material correctness gaps, not documentation-only details.

**No route should be moved until the root-layout design, server/client language bootstrap, URL contract, and authentication behavior have been proven with a small vertical-slice prototype.**

## 2. Current-state findings (verified against main at commit c1e4878123ec0d324e2c05a4ed7aa678ba0d4e20)

The following snapshot is based on the repository's main branch at the latest commit inspected for this revision. Revalidate it before the next implementation batch.

### 2.1 What has been implemented

- Phase 0 and Phase 1 are marked complete in this document by subsequent repository commits.
- Routing utilities now exist under src/services/routing/: route-classifier.ts, locale-precedence.ts, and url-builder.ts, with verification scripts and tests.
- src/app/layout.tsx now exists and renders the document shell, fonts, global CSS, DirectionProvider, QueryClientProvider, ThemeProvider, and Toaster.
- src/app/[language]/layout.tsx has been converted from a document root into a nested locale layout and continues to own AuthProvider, StoreLanguageProvider, social-auth providers, ConfirmDialogProvider, LeavePageProvider, sidebar, app bar, system banner, and AppShell.
- src/app/admin/layout.tsx and src/app/admin/dashboard/page.tsx have been added.
- The former src/app/[language]/admin-panel/... route directories have been renamed to src/app/[language]/admin/... in the inspected changes. The generated module manifest and many Hygen templates now emit /admin/... URLs.
- The latest commit message reports a successful build and service restart. Treat that as reported evidence, not a substitute for reviewing the actual test output and runtime behavior.

### 2.2 Gaps and risks found in the current source

- **Root layout client boundary:** src/app/layout.tsx currently begins with "use client". Keep the root layout as a Server Component and move interactive providers into a dedicated client wrapper component. Verify this against the installed Next.js version and build/runtime behavior.
- **Nested document elements:** src/app/admin/layout.tsx currently returns html and body even though it is nested under src/app/layout.tsx. Only a root layout should own the document elements. The admin layout should return route content/providers, not another html/body pair.
- **Admin providers are not clearly mounted:** AuthProvider and the authenticated application shell are currently mounted in src/app/[language]/layout.tsx, not in src/app/admin/layout.tsx. The new locale-free /admin tree therefore needs an explicit provider/guard composition. Do not assume it inherits providers from the [language] segment.
- **Document language is hard-coded:** src/app/layout.tsx currently renders html lang="en" and dir="ltr". A nested DirectionProvider does not itself update the document's lang/dir attributes. Define a supported architecture that makes document attributes correct for both localized public routes and locale-free admin routes.
- **Most admin module routes are still localized:** the inspected tree contains src/app/[language]/admin/... pages for users, roles, permissions, modules, region, and related screens. The new src/app/admin tree contains a dashboard page, but this is not yet a complete migration of all authenticated routes. Avoid claiming all admin URLs are locale-free.
- **Custom Link remains incompatible:** src/components/link.tsx still prepends the active language to every internal absolute string href and object href. It does not use the new routing/url-builder utility and will continue to produce locale-prefixed URLs for admin destinations.
- **Language bootstrap remains client-dependent:** src/services/auth/auth-provider.tsx reads token data from browser storage and fetches GET /auth/me after hydration. src/services/i18n/use-language.ts still resolves the admin language from client auth state and falls back to URL params/fallback language. There is no demonstrated server-verifiable user-language bootstrap yet.
- **Cookie initialization remains client-only:** StoreLanguageProvider initializes from js-cookie. The server cannot read that browser-only value through this provider initializer, so it is not a deterministic SSR bootstrap contract.
- **Routing utility semantics need tightening:** locale-precedence.ts currently treats any path whose first segment is a supported locale as a locale-prefixed public route, even if the remainder is not one of the explicitly public pages. The public-route resolver also falls back to userLanguage when URL locale is absent/invalid, which conflicts with the stated rule that a localized public URL is authoritative and must have a deterministic invalid/missing-locale policy.
- **Route classifier coverage needs review:** route-classifier.ts uses exact public-segment matching in its current version; nested public paths and path-boundary behavior need explicit tests. Ensure locale-prefixed admin legacy paths are not accidentally classified as public.
- **URL builder is not yet the complete navigation layer:** url-builder.ts currently builds a locale prefix for a caller-supplied isPublic flag, but it does not itself establish route classification, validate the locale, prevent an existing locale prefix, or preserve a typed UrlObject contract. It also is not yet integrated into the custom Link component.
- **Phase 2 verification is not the same as acceptance:** scripts/verify-phase2-layouts.ts checks utility behavior, but does not by itself prove correct Next.js root-layout ownership, provider availability, document attributes, auth guards, server/client hydration agreement, or that every module route has moved.
- **Legacy routes and redirects:** the reviewed changes rename routes inside [language] but do not demonstrate a complete explicit old-to-new redirect map for every former admin URL. Define and test compatibility behavior before removing old entry points.

### 2.3 Current progress assessment

| Workstream                                 | Repository status at inspected commit                                  | Assessment                                                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Phase 0 — discovery                        | Checklist marked complete                                              | Reconcile the ADR-2 server language-bootstrap decision with the actual implementation; it is not yet evidenced in code |
| Phase 1 — pure utilities                   | Utilities and tests added; checklist marked complete                   | Implemented baseline; tighten edge cases and integrate with navigation                                                 |
| Phase 2 — root layout/providers            | New root and admin layout files exist                                  | In progress; root/client boundary, nested html/body, provider coverage, and document lang/dir need correction          |
| Phase 3 — deterministic language bootstrap | No server-verifiable user-language bootstrap found                     | Not complete                                                                                                           |
| Phase 4 — navigation compatibility         | Custom Link still adds locale to every internal path                   | Not complete                                                                                                           |
| Phase 5 — admin route migration            | Some folders renamed under [language]; one locale-free dashboard added | Partial; module routes are not all locale-free                                                                         |
| Phase 6 — SEO/integration regression       | No complete evidence reviewed                                          | Not complete                                                                                                           |
| Phase 7 — rollout/cleanup                  | No complete evidence reviewed                                          | Not complete                                                                                                           |

**Important:** do not mark Phase 2 complete solely because the build succeeds or the two layout files exist. Its exit gate requires valid document ownership, correct providers for both route classes, correct document language/direction, direct-load and refresh coverage, and no public-route regression.

### 2.4 Implementation branch status — `fix/hybrid-routing-foundation`

The following changes have been implemented on the draft branch and are not yet merged into `main`:

- The root `src/app/layout.tsx` is now a Server Component and owns the only `html`/`body`. Interactive root-only providers are isolated in `RootProviders`.
- Shared authenticated application providers are composed in `AppProviders` and mounted by both `/[language]` and `/admin` layouts. The nested admin layout no longer renders document elements.
- The proxy resolves the request language, passes it through `x-app-language`, keeps `/admin/*` locale-free, and redirects legacy `/admin-panel/*`, `/{language}/admin-panel/*`, and `/{language}/admin/*` URLs to canonical `/admin/*` paths while preserving query strings.
- All 12 existing admin page routes (home, dashboard, modules, users, user create/edit, permissions, permission create/edit, roles, role edit, and region) now have route entries under `src/app/admin`. Existing page-content and query implementations are reused to avoid duplicating business logic.
- `useLanguage`, `StoreLanguageProvider`, `DocumentLanguageSync`, the custom `Link`, and `url-builder` now share the hybrid locale contract. Public links keep or add a locale; admin links remain locale-free.
- The language switcher now offers only the languages supported by the frontend configuration and does not rewrite admin URLs.
- Hygen resource templates, generator fixtures, cleanup scripts, and CRUD route assertions now target `src/app/admin` and `/admin/*`.
- Routing verification cases cover locale precedence, path boundaries, and legacy URL normalization.

**Important backend dependency:** the frontend `User` type has an optional `language` property, but the inspected `brocoders/nestjs-boilerplate` default-branch user entity and profile-update DTO do not currently persist that property. Therefore, this frontend branch can use the validated `i18next` preference cookie and update the in-memory authenticated user, but it cannot guarantee cross-device persistence of an admin language preference as a backend profile setting. If durable `user.language` storage is a product requirement, that needs a separately reviewed backend schema/API change; this frontend PR does not silently change the backend contract.

- The Region module was missing from the host repository even though its admin route and generated manifest expected it. The branch now includes the module manifest, API services, hooks, UI components, types, and all five configured locale dictionaries from the companion `wasnaker/bc-region` module. Its canonical menu URL is `/admin/region`.
- The first lint run caught strict-equality violations, an unused hook import, and use of native `window.confirm` in the integrated Region module. These have been corrected; deletion now uses the application's accessible `ConfirmDialogProvider`. The E2E workflow lint step has been restored to a non-mutating `npm run lint` (it no longer runs ESLint with `--fix`).
- The current branch head is `60204efb61dc0aa30c14394a63cf1dcbcfaf1f04`. New E2E and generator workflow runs have started for this head; their results are still pending. Earlier runs were cancelled as newer commits arrived, and an earlier run failed on the Region lint errors that are now addressed.

**CI status:** an initial generator run exposed two lint errors in the branch (an unused import and an obsolete dashboard placeholder), which have been fixed. The initial Playwright run also exposed that the current `ubuntu-latest` runner image was newer than Playwright 1.60 supports; both workflows are now pinned to Ubuntu 24.04. Re-run CI on the latest branch head and require lint, build, generator, and E2E checks to pass before merge. A pending workflow is not a passing check.

The branch remains a draft. No changes have been merged into `main`.

## 3. Goals and non-goals

### Goals

- Preserve locale-prefixed public URLs and SEO metadata.
- Remove locale prefixes from authenticated/admin URLs.
- Make first server-rendered HTML and first client render agree on language, document lang, text direction, translations, and language-dependent UI.
- Use the authenticated user's valid language preference consistently throughout the authenticated application.
- Make profile language changes propagate predictably without an arbitrary full reload.
- Preserve authentication, authorization, shell, provider, module registry, and leave-page behavior.
- Avoid redirect loops, double locale prefixes, stale user data, and accidental exposure of authenticated content.
- Provide a reversible, observable migration with automated coverage.

### Non-goals

- Do not change backend authorization rules or treat a locale-free URL as access control.
- Do not redesign translation content, supported languages, or public SEO strategy unless implementation discovers a blocker.
- Do not change API response contracts merely to simplify frontend routing without a separately reviewed backend decision.
- Do not perform unrelated UI, sidebar, or module architecture refactors.
- Do not assume middleware alone can solve authenticated language selection.

## 4. URL contract and route classification

### 4.1 Proposed canonical URL policy

| Route class            | Canonical URL                                  | Locale source                   | Indexing                           |
| ---------------------- | ---------------------------------------------- | ------------------------------- | ---------------------------------- |
| Public authentication  | /[language]/sign-in, /[language]/sign-up, etc. | URL segment                     | Normally noindex where appropriate |
| Public content/legal   | /[language]/privacy-policy, etc.               | URL segment                     | Indexable according to metadata    |
| Authenticated app      | /admin/...                                     | Authenticated user preference   | Normally noindex                   |
| Unknown/invalid locale | Explicit redirect or not-found policy          | Validated supported locale only | Never emit invalid locale          |

The exact admin prefix must be approved before code changes. This plan uses /admin as proposed canonical prefix because that is the initial proposal. If product intent is to retain /admin-panel, update this contract consistently before Phase 1.

### 4.2 Route inventory is mandatory

Before moving anything, create an inventory from the actual src/app tree and module manifests. For every route record:

- current filesystem path and public URL;
- target filesystem path and target public URL;
- route class (public, authenticated, shared, callback, API, static asset);
- owning layout and providers required;
- auth/role/permission guard;
- metadata and SEO requirements;
- static/dynamic params and loading/error/not-found boundaries;
- known inbound links, redirects, and external callback references;
- compatibility redirect, if the old URL must continue to work.

Do not classify a route as public or authenticated solely from its folder name. Review route guards and product behavior.

### 4.3 URL normalization rules

- A locale prefix is valid only when the first path segment exactly matches a supported language.
- Public routes require a supported locale segment. Define one deterministic policy for missing/unsupported locale: redirect to a supported locale or return not-found. Do not infer from a stale client-only value.
- Admin routes must not contain a locale prefix. A legacy URL such as /id/admin/dashboard should redirect to the chosen canonical admin URL only after its mapping is known.
- Query strings and fragments must survive redirects where semantically appropriate.
- Define trailing slash, percent-encoded path, basePath (if configured), and locale-like route-name behavior.
- Do not rewrite API routes, Next.js internals, static assets, image optimizer paths, or unrelated public routes as part of locale handling.
- Avoid ambiguous routes where a public slug could collide with the admin prefix.

## 5. Architecture decisions required before implementation

These decisions are gates, not optional cleanup.

### ADR-1: Root layout ownership

**Required outcome:** introduce src/app/layout.tsx as the single root layout containing html and body. The locale-specific layout becomes nested and no longer renders document elements.

Evaluate and document the final layout tree. A likely organization is:

- src/app/layout.tsx: document shell, fonts, global CSS, and only providers that are locale-independent and safe to initialize at this level.
- src/app/[language]/layout.tsx: validate locale, initialize locale-aware translations, direction, and locale-specific providers.
- src/app/admin/layout.tsx: authenticated application shell and admin-specific guards/providers as appropriate.
- Optional route groups such as (public) and (authenticated) may organize files without changing URLs.

Verify Next.js root-layout rules and the ability to set html lang and dir for this chosen structure. Do not render nested html or body. If route-specific document attributes cannot be safely expressed in the proposed single-root arrangement, evaluate supported alternatives, including multiple root layouts with route-group boundaries, and account for full-page navigation between roots. Choose one architecture and test it before moving the complete route tree.

Create a provider ownership table that states for every provider:

- required routes;
- whether it needs locale or authenticated user at initialization;
- whether it must run on server, client, or both;
- whether it must be shared across public and admin routes;
- ordering dependencies;
- whether remounting on route-class transitions is acceptable.

Preserve shell behavior intentionally. Do not blindly move the entire current provider stack into the root layout if public pages should not render an authenticated sidebar or admin shell.

### ADR-2: Server/client language bootstrap (highest risk)

**Required outcome:** first server render and first client render must receive the same initial locale for every route.

The current auth token is read in the browser and /auth/me is fetched after hydration. Consequently, user.language is not available to a server component by simply calling the current useAuth() hook. A client-only effect that changes language after load is not an acceptable fix for an initial hydration mismatch.

Evaluate these options with security and deployment constraints:

1. **Server-readable session cookie (preferred if architecture permits):** use an HttpOnly, Secure, appropriately scoped cookie or server session that the server can validate and resolve to a user/language. Do not trust an unsigned client-supplied language as proof of identity.
2. **Server-side session/bootstrap endpoint:** a server-side request validates the session and returns a minimal safe bootstrap payload. Define cache behavior, token forwarding, timeout, and unauthenticated behavior.
3. **Signed locale preference cookie:** if user identity cannot be resolved on the server, use a signed/validated preference cookie as deterministic initial locale, then reconcile with authoritative user preference after authentication. It is a display preference, not an authorization signal.
4. **Deterministic fallback then post-hydration switch:** use only if a brief language transition is explicitly accepted. It does not fully meet the no-flash objective and must not be presented as eliminating initial mismatch risk.

For the selected option, specify:

- source of truth and precedence;
- validation against the supported languages list;
- cookie name, path, domain, SameSite, Secure, HttpOnly, expiry, and update rules where applicable;
- login, logout, expired token, revoked session, and multi-tab behavior;
- SSR, RSC, CSR navigation, prefetch, refresh, and back/forward behavior;
- cache isolation so one user's language or private data is never served to another user;
- failure behavior when auth or profile APIs are unavailable;
- how initial locale is passed into client providers without reading browser-only state during initial render.

Never expose access tokens to client-visible HTML or logs. Never use a plain, user-editable cookie as an authentication credential.

### ADR-3: Locale preference precedence

Adopt one documented rule, consistently applied by server utilities, client hooks, navigation, and language settings:

- Public localized page: URL locale is authoritative for that request/page.
- Authenticated admin page: validated authenticated user preference is authoritative.
- Before authentication is resolved: use the agreed deterministic bootstrap locale; do not oscillate between URL, cookie, and fallback.
- Invalid or missing user preference: use a validated preference cookie if explicitly selected as fallback; otherwise use fallbackLanguage.
- Profile language update: persist to backend first (or define optimistic update with rollback), update server-readable preference/session state, update client context, then refresh/revalidate or navigate while preserving the current admin route.
- Logout: clear user-specific state and decide whether the last chosen language remains as a non-sensitive display preference. Document the choice.

Avoid competing sources of truth that silently overwrite each other. The i18next cookie, StoreLanguageProvider, backend user.language, and any new session/bootstrap cookie need a clear synchronization contract.

### ADR-4: Middleware / Proxy / server redirect responsibility

Inspect the repository for existing middleware, rewrites, redirects, deployment-level routing, and Next.js 16 conventions. The initial plan's reference to src/middleware.ts was conditional; do not create middleware by assumption.

Define which layer owns:

- locale validation and public-route redirects;
- legacy admin URL redirects;
- auth redirects;
- locale-free admin route access;
- canonical URL and query preservation.

Use the lightest correct layer. Middleware/Proxy should not duplicate business authorization and should not call expensive auth APIs for every static asset. Route-level/server-side guards remain responsible for protecting sensitive content and data.

## 6. Navigation and URL construction

### 6.1 Custom Link contract

Refactor src/components/link.tsx around a single tested URL policy utility rather than scattered string concatenation.

The utility must:

- prefix locale only for public localized internal routes;
- leave canonical admin routes locale-free;
- avoid prefixing a URL that already has a supported locale;
- avoid double-prefixing;
- preserve query strings and hashes;
- handle string hrefs and UrlObject hrefs consistently;
- handle root path, nested paths, dynamic segments, encoded segments, and optional trailing slash;
- leave external URLs, protocol-relative URLs, mailto/tel links, and non-root-relative hrefs untouched;
- handle basePath if the application uses one;
- avoid treating a path merely beginning with the letters admin as an admin route (segment boundary required).

Define behavior for object hrefs where pathname is absent, and ensure search/query/hash are not lost. Preserve replace, prefetch, scroll, refs, and existing leave-page confirmation behavior.

### 6.2 Audit every navigation source

Search and update as appropriate:

- custom Link and direct next/link imports;
- router.push, router.replace, redirect(), permanentRedirect();
- usePathname comparisons and active-menu matching;
- app-sidebar.tsx, app bar, breadcrumbs, tabs, command menus, buttons, cards, and empty states;
- auth guards and post-login/post-logout return URLs;
- module manifests, module registry, generated registry output, and generators/templates;
- OAuth/social-auth callback and redirect URIs;
- email links, password reset, confirmation, invite, and deep links;
- tests, fixtures, Storybook stories, and documentation;
- environment variables, reverse proxy/CDN rules, and deployment rewrite configuration.

Do not change external identity-provider callback URLs without checking provider configuration.

### 6.3 Legacy URL compatibility

Create an explicit old-to-new route mapping. Add redirects only for routes that existed and have a known target. Preserve query parameters where safe. Decide whether redirects are temporary during rollout or permanent after validation. Avoid broad wildcard redirects that can swallow public routes.

## 7. Internationalization requirements

- Keep supported languages and fallback in one shared configuration module.
- Create pure utilities for locale validation, route classification, URL normalization, and locale selection; avoid duplicating route logic in React hooks.
- Keep server-only language resolution separate from client hooks so server modules do not import client-only auth providers or browser storage.
- Ensure translation resources loaded on server correspond to the same locale used to render the client.
- Set document lang and dir correctly for each route class and supported language, including RTL behavior if a future language requires it.
- Ensure StoreLanguageProvider receives an explicit initial value from the server/bootstrap layer; do not rely on a client-only cookie read as the initial SSR contract.
- Audit components that call useLanguage(), useTranslation(), or read the language cookie directly.
- Check date, number, currency, and locale-sensitive formatting for server/client determinism, including timezone.
- When language changes on admin page, translated UI, sidebar labels, document attributes, and subsequent navigation must update consistently.
- Public pages must continue to use URL locale even if a signed-in user's profile preference differs.

## 8. Authentication, authorization, and data safety

- Locale-free URLs are not a security boundary. Every protected page and API request must retain existing authentication and permission checks.
- Verify unauthenticated access to every admin route redirects to the correct localized sign-in URL (or agreed login entry point) and preserves a safe return path.
- Verify authenticated users without required roles/permissions receive existing forbidden behavior, not a redirect loop.
- Ensure server-side bootstrap does not leak user profile data into static/shared caches.
- Mark personalized admin responses and route segments with appropriate dynamic/private cache semantics. Explicitly test cache isolation between two users with different languages.
- Keep logout cleanup behavior, including query-cache clearing and cross-tab auth events.
- Define behavior when GET /auth/me fails with 401 versus transient 5xx/network errors. A transient outage must not accidentally be treated as a valid authenticated user or expose stale private data.
- Validate all language values from API and cookie boundaries; never interpolate arbitrary values into document attributes or dynamic imports.

## 9. Module registry and code-generation impact

The repository has a generated module registry and a generate:module-registry script. Treat generated output as derived state.

- Inspect manifest schema and every module's route declaration before changing values.
- Update source manifests and generator templates, not only generated output.
- Ensure generated route paths are canonical locale-free admin paths.
- Regenerate using the repository's documented command (verify actual script and package lifecycle; the package currently invokes the generator in predev and prebuild).
- Review generated diffs for unintended changes.
- Add validation that rejects invalid route prefixes or duplicate route registrations.
- Confirm module add/remove/generate workflows continue to produce correct paths.
- Audit permission/menu resolution and active-route matching against the new path format.

## 10. Phased implementation plan and exit gates

### Phase 0 — Discovery and baseline (no behavior changes)

- [x] Record current branch SHA and dependency versions.
- [x] Inventory every route, layout, route handler, route guard, metadata function, and redirect.
- [x] Inventory providers and their dependencies/order.
- [x] Search for all locale, auth, navigation, and manifest references.
- [x] Inspect issue #185 reproduction steps and add a deterministic regression test before changing architecture.
- [x] Record current public URLs, admin URLs, SEO metadata, and expected redirect behavior.
- [x] Confirm canonical admin prefix (/admin versus /admin-panel).
- [x] Decide whether old admin URLs need compatibility redirects and for how long.
- [x] Write and approve ADR decisions 1–4, including server auth/bootstrap constraints.

**Exit gate:** route inventory is reviewed; root-layout/provider diagram and language-bootstrap design are approved; baseline reproduction exists.

### Phase 1 — Pure utilities and contract tests

- [x] Add route classification and locale validation utilities with unit tests.
- [x] Add URL builder/normalizer with exhaustive string and object href tests.
- [x] Define locale precedence as a pure function with tests.
- [x] Add tests for supported/unsupported locale, admin path boundaries, already-prefixed URLs, query/hash, encoded paths, and external URLs.
- [x] Keep production route behavior unchanged in this phase.

**Exit gate:** utilities pass tests and do not alter existing navigation.

### Phase 2 — Root layout and provider architecture

**Status at c1e4878: in progress.** Root and admin layout files have been introduced, but the exit gate is not met. The following implementation tasks remain:

- [x] Add src/app/layout.tsx as the document-shell location.
- [ ] Keep the root layout a Server Component; move interactive providers into a dedicated client-side provider wrapper.
- [ ] Ensure exactly one html/body pair is rendered for each route tree; remove html/body from nested src/app/admin/layout.tsx.
- [ ] Make document lang and dir correct for both localized public routes and locale-free admin routes rather than hard-coding en/ltr at the root.
- [ ] Mount the required auth, locale, shell, and navigation providers for locale-free admin routes without depending on the [language] layout.
- [ ] Split locale-specific and authenticated-shell responsibilities into nested layouts or approved route groups.
- [ ] Preserve provider ordering and route coverage using the provider ownership matrix.
- [ ] Ensure public pages do not unintentionally render authenticated-only shell elements.
- [ ] Verify error, loading, not-found, and metadata behavior for both route trees.
- [ ] Add integration/e2e coverage for a localized public route and a locale-free protected route, including direct load and refresh.

**Exit gate:** both route classes render with correct providers and document attributes; no nested html/body; no public route regression.

### Phase 3 — Deterministic language bootstrap

**Status at c1e4878: not complete.** The current AuthProvider and StoreLanguageProvider still initialize from browser-side state; no server-verifiable user-language bootstrap was found.

- [ ] Implement the selected server-readable bootstrap mechanism.
- [ ] Align server and client initial locale values.
- [ ] Refactor server language resolution and client useLanguage() to share the same policy without importing client-only modules into server code.
- [ ] Synchronize backend profile update, cookie/session, StoreLanguageProvider, and translation state.
- [ ] Define login/logout, expired-session, multi-tab, and transient API failure behavior.
- [ ] Add SSR/hydration tests for each language and auth state.

**Exit gate:** initial HTML and first client render agree; no language flash or hydration mismatch in repeated cold loads, refreshes, and navigation.

### Phase 4 — Navigation compatibility layer

**Status at c1e4878: not complete.** src/components/link.tsx still prefixes every internal absolute href with the active language and does not call url-builder.ts.

- [ ] Update custom Link to use the centralized URL policy.
- [ ] Update router actions, redirects, active route checks, and auth return URLs.
- [ ] Preserve leave-page confirmation semantics.
- [ ] Add old-to-new redirect mapping and query/hash preservation tests.
- [ ] Audit direct NextLink usage and generated hrefs.

**Exit gate:** every navigation source produces expected canonical URL; no double-prefixing or broken back/forward navigation.

### Phase 5 — Admin route migration (incremental vertical slices)

**Status at c1e4878: partial.** Several old admin-panel folders were renamed to admin under [language], while a locale-free /admin/dashboard route was added. The module pages are therefore not yet all on locale-free URLs.

- [ ] Move one low-risk authenticated route to the new tree.
- [ ] Verify direct load, refresh, client navigation, auth guard, permission guard, language, shell, and data fetching.
- [ ] Migrate dashboard and shared admin shell.
- [ ] Migrate each module area in small batches, keeping manifest and generated registry synchronized.
- [ ] Migrate profile/settings and language-change flows.
- [ ] Add compatibility redirects only after target mappings are verified.
- [ ] Remove old route implementations only when replacement and redirects are proven.

**Exit gate:** all inventoried admin routes work on canonical paths and legacy behavior is intentionally handled.

### Phase 6 — Public SEO and integration regression

- [ ] Verify public locale-prefixed routes still render and canonicalize correctly.
- [ ] Verify metadata, title, description, canonical URL, hreflang/alternate links (if used), robots, sitemap, and social metadata.
- [ ] Verify public routes remain statically renderable where intended.
- [ ] Verify admin pages are not indexed and do not leak private data through metadata or caches.
- [ ] Verify OAuth/social-auth, password reset, email confirmation, and invite links.
- [ ] Verify deployment rewrites, CDN caching, and reverse-proxy behavior.

**Exit gate:** no SEO regression on public routes; authentication integrations and deployment routing pass.

### Phase 7 — Cleanup and rollout

- [ ] Remove obsolete route logic and unused locale helpers only after all callers are migrated.
- [ ] Remove obsolete redirects only after compatibility window and analytics review.
- [ ] Update architecture docs, route inventory, module-manifest guidance, and contributor instructions.
- [ ] Deploy behind a feature flag or staged rollout if infrastructure permits.
- [ ] Monitor hydration errors, 404s, redirect loops, auth failures, language mismatch, and client navigation errors.
- [ ] Keep rollback instructions and previous route mapping available.

**Exit gate:** monitoring is clean for the agreed observation window and rollback is no longer required.

## 11. Required test matrix

At minimum, automate these combinations. Run key cases in Chromium and at least one additional browser if supported.

| Scenario                                                        | Expected result                                                        |
| --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Anonymous direct visit to /id/sign-in                           | Indonesian public page; URL remains localized                          |
| Anonymous direct visit to /en/sign-in                           | English public page; URL remains localized                             |
| Public URL locale differs from saved user preference            | Public page follows URL locale                                         |
| Authenticated user with user.language=id opens /admin/dashboard | Indonesian admin UI on locale-free URL                                 |
| Authenticated user with user.language=ko opens /admin/dashboard | Korean admin UI on locale-free URL                                     |
| User preference missing/invalid                                 | Agreed validated fallback; no crash                                    |
| Cold load with existing authenticated session                   | Server and first client render use same bootstrap locale               |
| Refresh on nested admin route                                   | Route remains accessible and language is stable                        |
| Client navigation between admin modules                         | URL remains locale-free; language remains stable                       |
| Profile language change                                         | Backend and UI preference synchronize; current route remains valid     |
| Logout then visit admin URL                                     | Protected content is not rendered; expected login redirect             |
| Expired/revoked session                                         | No stale private data; expected unauthenticated state                  |
| Auth API transient 5xx/network failure                          | No false logout or stale-user data leak; agreed loading/error behavior |
| Two users in separate sessions with different languages         | No cross-user cache or locale leakage                                  |
| Two tabs, language changed in one tab                           | Other tab follows documented synchronization behavior                  |
| Old localized admin URL                                         | Correct mapped redirect, preserving safe query/hash                    |
| Invalid locale URL                                              | Deterministic redirect or not-found; no invalid translation import     |
| Link string href and object href                                | Correct locale policy and preserved query/hash                         |
| External/protocol-relative/mailto/tel href                      | Unchanged                                                              |
| Leave-page modal during navigation                              | Same confirmation behavior and correct eventual destination            |
| Sidebar, breadcrumbs, active module item                        | Correct active state for canonical route                               |
| OAuth and email callback/deep links                             | Callback succeeds and returns to correct route                         |
| Public metadata and sitemap                                     | Locale-specific SEO remains correct                                    |
| Admin route metadata/cache                                      | No indexing or private data leakage                                    |
| Browser back/forward and prefetch                               | Correct route and language; no redirect loop                           |

Also run relevant lint, type-check, build, unit, and Playwright/e2e suites. Record exact commands and results in the implementation PR. A successful build alone is not sufficient evidence for hydration correctness.

## 12. Observability and acceptance criteria

The migration is complete only when all are true:

- No reproducible hydration warnings/errors on public or admin routes, especially issue #185 scenarios.
- First server HTML and first client render use the same locale and direction.
- Public pages retain locale-prefixed URLs and SEO behavior.
- Admin pages use the canonical locale-free URL scheme.
- All internal navigation paths, auth redirects, and generated module links follow the URL contract.
- No unauthorized admin content is exposed on server render, prefetch, cache, or error states.
- Language changes persist and propagate according to the documented contract.
- Legacy URL behavior is mapped, tested, and monitored.
- Required tests pass and implementation evidence is attached to the PR.
- Rollback can restore previous routing behavior without data migration or irreversible backend changes.

Add structured, privacy-safe telemetry for route class, redirect reason, locale resolution source, and hydration error category where appropriate. Never log access tokens, session secrets, or unnecessary personal data.

## 13. Rollback strategy

- Keep migration in small, reviewable commits/PRs.
- Prefer a feature flag or reversible route mapping if architecture allows.
- Retain old route mappings and source manifests until the new route tree is stable.
- If hydration, auth, or routing failures exceed the agreed threshold, disable the new route policy or redeploy the previous known-good commit.
- Do not delete old route implementations and redirects in the same release that first exposes new routes.
- Keep backend language preference behavior backward-compatible during frontend rollout.
- Document how to restore the previous root layout/provider tree and locale-prefixed admin links.

## 14. Risks and mitigations

| Risk                                               | Impact                                              | Mitigation                                                |
| -------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------- |
| Root layout moved incorrectly                      | Entire app fails to render or provider state resets | Prototype root layout and route-group design first        |
| Server cannot resolve user language                | Hydration mismatch or language flash                | Implement and test server-readable bootstrap              |
| Client-only cookie initialization differs from SSR | Initial markup mismatch                             | Pass explicit server-derived initial state                |
| Custom Link prefixes admin URLs                    | Broken navigation/404                               | Central URL utility and exhaustive tests                  |
| Incomplete route/manifest inventory                | Hidden broken module links                          | Automated source search and generated registry validation |
| Auth redirect assumes /[language]                  | Redirect loops or wrong destinations                | Centralize redirect builder and test auth states          |
| Cache shares personalized locale/data              | Data leakage                                        | Private/dynamic cache policy and multi-user tests         |
| OAuth/email callbacks retain old paths             | Login/verification failures                         | Audit provider settings and external links                |
| Broad middleware rewrite catches assets/API        | App resources break                                 | Explicit matcher exclusions and integration tests         |
| Legacy redirects are ambiguous                     | SEO or navigation regressions                       | Exact mapping; no broad wildcard guesses                  |

## 15. Open questions / decisions to record

Do not begin full route migration until these are answered in the implementation PR:

1. Is the canonical authenticated prefix /admin or /admin-panel?
2. Which routes are genuinely public, authenticated, shared, or callback-only?
3. Can backend/session layer provide a server-verifiable identity and language during SSR? If not, which deterministic fallback is acceptable?
4. Is i18next intended to remain the language preference cookie, and should it be readable by the server?
5. Should language preference persist across logout and be used on the next anonymous visit, or should public pages always use explicit URL locale?
6. What are existing Next.js middleware/proxy and deployment rewrite constraints?
7. Are there external OAuth callback registrations or emails containing current admin URLs?
8. How long must legacy admin URLs remain supported?
9. What is required when profile language update succeeds on backend but client synchronization fails?
10. Which route groups should receive the global app shell, sidebar, system banner, and social-auth providers?

## 16. Implementation boundaries

This document authorizes planning and review only. It does not itself authorize changing application source code, backend contracts, identity-provider settings, or deployment configuration. Implement each phase in a separately reviewable change, update this document when an ADR is resolved, and do not mark a checkbox complete without test evidence.

---

**Recommended implementation order:** Phase 0 discovery → ADR approval → Phase 1 pure utilities → Phase 2 root-layout prototype → Phase 3 server/client language bootstrap → Phase 4 navigation compatibility → Phase 5 incremental route migration → Phase 6 SEO/integration regression → Phase 7 rollout and cleanup.
