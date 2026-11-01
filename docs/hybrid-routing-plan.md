# Hybrid Routing Strategy — Architecture & Migration Plan

> Status: Proposed — architecture decisions and implementation gates required.
> Scope: routing, root layouts, authentication bootstrap, language resolution, navigation, module registry, SEO, and regression coverage.
> Related issue: #185 (hydration mismatch on authenticated pages).
> Baseline reviewed: Next.js 16.2.0 / React 19.2.4 on the repository default branch at the time of revision.

## 1. Executive summary

Introduce two explicit URL policies:

1. **Public pages** retain the locale segment: /[language]/... (for example, /id/sign-in and /en/privacy-policy). The URL is authoritative for these pages.
2. **Authenticated application pages** use locale-free URLs: /admin/... (for example, /admin/dashboard). The authenticated user's validated language preference is authoritative.

This is an architectural migration, not a directory rename. The current locale layout owns the only root layout and wraps the application in major providers. The custom Link component prepends the locale to every internal absolute path. Authentication initializes in a client provider by reading browser token storage and then calling GET /auth/me; therefore the server cannot currently know user.language during the first HTML render. A naïve move risks broken navigation, fallback-language flash, hydration mismatches, missing providers, and changed URLs.

**No route should be moved until the root-layout design, server/client language bootstrap, URL contract, and authentication behavior have been proven with a small vertical-slice prototype.**

## 2. Current-state findings (verified against repository source)

- src/app/[language]/layout.tsx is currently the root layout: it renders html and body, declares generateMetadata and generateStaticParams, and owns global providers and shell components.
- There is currently no src/app/layout.tsx. Moving pages outside [language] requires creating a root layout at src/app/layout.tsx. Next.js requires every route tree to be covered by a root layout that supplies document elements. Route groups can organize files but do not remove this requirement.
- The locale layout includes DirectionProvider, QueryClientProvider, ReactQueryDevtools, ThemeProvider, StoreLanguageProvider, ConfirmDialogProvider, AuthProvider, AuthStateClass, social-auth providers, LeavePageProvider, SidebarProvider, ResponsiveAppBar, SystemBannerProvider, AppShell, and Toaster. Their intended scope and ordering must be preserved deliberately.
- src/services/i18n/use-language.ts distinguishes public pages by route params. Public routes prioritize URL locale; authenticated pages prioritize user.language, then URL locale, then fallback. This hook depends on client auth state.
- src/services/auth/auth-provider.tsx initializes auth in the browser, reads tokens using getTokensInfo(), and loads the user through GET /auth/me. The first server render cannot rely on that browser-only state.
- src/services/i18n/store-language-provider.tsx initializes state from the i18next cookie using js-cookie. This is a client-side cookie read and must not be treated as a server bootstrap contract without making initial server and client values deterministic.
- src/components/link.tsx currently prefixes every internal absolute string href and object href with a locale segment. It will incorrectly turn an admin href into a locale-prefixed URL unless its policy changes. It also needs protection against double-prefixing and careful handling of object hrefs.
- src/services/i18n/config.ts supports en, id, ko, ja, and zh, with en as fallback.
- The package uses Next.js 16.2.0 and React 19.2.4. Middleware/Proxy APIs and route behavior must be checked against this installed Next.js version before choosing an implementation.
- The existing route tree uses admin-panel in its directory naming, while the initial proposal uses /admin as its public URL. The canonical URL decision must be explicit; do not assume filesystem names and public URL names are interchangeable.
- The current language preference cookie is named i18next. Its relationship to user.language, login, logout, profile updates, and server rendering is not specified by the initial plan.

Revalidate these observations at implementation start because the default branch may change.

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

| Route class | Canonical URL | Locale source | Indexing |
|---|---|---|---|
| Public authentication | /[language]/sign-in, /[language]/sign-up, etc. | URL segment | Normally noindex where appropriate |
| Public content/legal | /[language]/privacy-policy, etc. | URL segment | Indexable according to metadata |
| Authenticated app | /admin/... | Authenticated user preference | Normally noindex |
| Unknown/invalid locale | Explicit redirect or not-found policy | Validated supported locale only | Never emit invalid locale |

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
- Admin routes must not contain a locale prefix. A legacy URL such as /id/admin-panel/dashboard should redirect to the chosen canonical admin URL only after its mapping is known.
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

- [ ] Add route classification and locale validation utilities with unit tests.
- [ ] Add URL builder/normalizer with exhaustive string and object href tests.
- [ ] Define locale precedence as a pure function with tests.
- [ ] Add tests for supported/unsupported locale, admin path boundaries, already-prefixed URLs, query/hash, encoded paths, and external URLs.
- [ ] Keep production route behavior unchanged in this phase.

**Exit gate:** utilities pass tests and do not alter existing navigation.

### Phase 2 — Root layout and provider architecture

- [ ] Create the new root layout with one document shell.
- [ ] Move document-level concerns (fonts, global CSS, html/body) deliberately.
- [ ] Split locale-specific and authenticated-shell responsibilities into nested layouts or approved route groups.
- [ ] Preserve provider ordering and route coverage using the provider ownership matrix.
- [ ] Ensure public pages do not unintentionally render authenticated-only shell elements.
- [ ] Verify error, loading, not-found, and metadata behavior for both route trees.
- [ ] Prototype a localized public route and a locale-free protected route before migrating all routes.

**Exit gate:** both route classes render with correct providers and document attributes; no nested html/body; no public route regression.

### Phase 3 — Deterministic language bootstrap

- [ ] Implement the selected server-readable bootstrap mechanism.
- [ ] Align server and client initial locale values.
- [ ] Refactor server language resolution and client useLanguage() to share the same policy without importing client-only modules into server code.
- [ ] Synchronize backend profile update, cookie/session, StoreLanguageProvider, and translation state.
- [ ] Define login/logout, expired-session, multi-tab, and transient API failure behavior.
- [ ] Add SSR/hydration tests for each language and auth state.

**Exit gate:** initial HTML and first client render agree; no language flash or hydration mismatch in repeated cold loads, refreshes, and navigation.

### Phase 4 — Navigation compatibility layer

- [ ] Update custom Link to use the centralized URL policy.
- [ ] Update router actions, redirects, active route checks, and auth return URLs.
- [ ] Preserve leave-page confirmation semantics.
- [ ] Add old-to-new redirect mapping and query/hash preservation tests.
- [ ] Audit direct NextLink usage and generated hrefs.

**Exit gate:** every navigation source produces expected canonical URL; no double-prefixing or broken back/forward navigation.

### Phase 5 — Admin route migration (incremental vertical slices)

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

| Scenario | Expected result |
|---|---|
| Anonymous direct visit to /id/sign-in | Indonesian public page; URL remains localized |
| Anonymous direct visit to /en/sign-in | English public page; URL remains localized |
| Public URL locale differs from saved user preference | Public page follows URL locale |
| Authenticated user with user.language=id opens /admin/dashboard | Indonesian admin UI on locale-free URL |
| Authenticated user with user.language=ko opens /admin/dashboard | Korean admin UI on locale-free URL |
| User preference missing/invalid | Agreed validated fallback; no crash |
| Cold load with existing authenticated session | Server and first client render use same bootstrap locale |
| Refresh on nested admin route | Route remains accessible and language is stable |
| Client navigation between admin modules | URL remains locale-free; language remains stable |
| Profile language change | Backend and UI preference synchronize; current route remains valid |
| Logout then visit admin URL | Protected content is not rendered; expected login redirect |
| Expired/revoked session | No stale private data; expected unauthenticated state |
| Auth API transient 5xx/network failure | No false logout or stale-user data leak; agreed loading/error behavior |
| Two users in separate sessions with different languages | No cross-user cache or locale leakage |
| Two tabs, language changed in one tab | Other tab follows documented synchronization behavior |
| Old localized admin URL | Correct mapped redirect, preserving safe query/hash |
| Invalid locale URL | Deterministic redirect or not-found; no invalid translation import |
| Link string href and object href | Correct locale policy and preserved query/hash |
| External/protocol-relative/mailto/tel href | Unchanged |
| Leave-page modal during navigation | Same confirmation behavior and correct eventual destination |
| Sidebar, breadcrumbs, active module item | Correct active state for canonical route |
| OAuth and email callback/deep links | Callback succeeds and returns to correct route |
| Public metadata and sitemap | Locale-specific SEO remains correct |
| Admin route metadata/cache | No indexing or private data leakage |
| Browser back/forward and prefetch | Correct route and language; no redirect loop |

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

| Risk | Impact | Mitigation |
|---|---|---|
| Root layout moved incorrectly | Entire app fails to render or provider state resets | Prototype root layout and route-group design first |
| Server cannot resolve user language | Hydration mismatch or language flash | Implement and test server-readable bootstrap |
| Client-only cookie initialization differs from SSR | Initial markup mismatch | Pass explicit server-derived initial state |
| Custom Link prefixes admin URLs | Broken navigation/404 | Central URL utility and exhaustive tests |
| Incomplete route/manifest inventory | Hidden broken module links | Automated source search and generated registry validation |
| Auth redirect assumes /[language] | Redirect loops or wrong destinations | Centralize redirect builder and test auth states |
| Cache shares personalized locale/data | Data leakage | Private/dynamic cache policy and multi-user tests |
| OAuth/email callbacks retain old paths | Login/verification failures | Audit provider settings and external links |
| Broad middleware rewrite catches assets/API | App resources break | Explicit matcher exclusions and integration tests |
| Legacy redirects are ambiguous | SEO or navigation regressions | Exact mapping; no broad wildcard guesses |

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
