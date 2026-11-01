# Hybrid Routing Strategy Plan

## Overview
Adopt a hybrid routing strategy to eliminate hydration mismatches (#185) on authenticated pages while preserving SEO for public-facing pages.

- **Public Routes (`/id/sign-in`, etc.)**: Retain the `/[language]/...` prefix. This leverages Next.js I18n routing, essential for SEO.
- **Authenticated/Admin Routes (`/admin/dashboard`, etc.)**: Transition to a flat `/[admin-prefix]/...` structure, **removing** the `/[language]/` prefix. Authentication state (specifically `user.language`) will dictate the language, removing reliance on the URL for language detection.

## Implementation Phases

### Phase 1: Structure & Routing
- [ ] Rename/Move all routes currently in `app/[language]/admin-panel/...` to a new `app/admin/...` directory structure.
- [ ] Ensure public routes (`sign-in`, `sign-up`, `privacy-policy`, etc.) remain under `app/[language]/...`.

### Phase 2: Middleware & I18n Resolution
- [ ] Update `src/middleware.ts` (if exists) or equivalent to bypass the `[language]` check for any path starting with `/admin/`.
- [ ] Refactor `useLanguage()` to:
    - Prioritize `user.language` for `/admin/*` paths.
    - Prioritize `URL param` for public paths.
- [ ] Sync language settings: ensure `PATCH /auth/me` with `language` works seamlessly and `useLanguage` reads from `user` object correctly in the admin context.

### Phase 3: Wiring & Updates
- [ ] Update `app-sidebar.tsx` and all `Link` components to point to the new `/admin/...` paths.
- [ ] Update module registry (manifests) to reflect the new route paths.
- [ ] Run `npm run generate:module-registry` to sync changes.

### Phase 4: Verification
- [ ] Verify no hydration errors (#185) occur after logging in.
- [ ] Verify that changing the language in the profile correctly triggers a language switch in the sidebar without requiring a full page refresh (if possible) or providing a seamless redirect.
