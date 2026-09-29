---
name: rbac
description: Handle RBAC/permissions in this Next.js React admin panel. Use when checking user permissions, rendering conditional UI based on role/permission, or displaying permission-related UI components.
---

# RBAC (Frontend)

The frontend receives permissions via the auth response. The `useAuth` hook exposes `user.role.permissions`.

## Key Files

| File | Purpose |
|------|---------|
| `src/modules/auth/` | Auth store, hooks |
| `src/shared/hooks/useAuth.ts` | Auth hook with user, role, permissions |

## Usage

### Check permission in component

```tsx
import { useAuth } from '@/shared/hooks/useAuth';

function MyComponent() {
  const { user } = useAuth();
  const hasPermission = user?.role?.permissions?.some(
    p => p.name === 'create:user'
  );

  if (!hasPermission) return <div>Access denied</div>;
  return <button>Create User</button>;
}
```

### Check role

```tsx
const isAdmin = user?.role?.id === 1; // admin = 1, user = 2
```

### Conditional rendering

```tsx
{user?.role?.permissions?.some(p => p.name === 'delete:user') && (
  <button onClick={handleDelete}>Delete</button>
)}
```

## Constants

```ts
const ROLE = {
  ADMIN: 1,
  USER: 2,
} as const;
```

## Notes

- Permissions are loaded from `user.role.permissions` array
- API returns permissions in the login/register response
- No frontend-only permission storage — always read from auth state
