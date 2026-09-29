# Project instructions

Next.js 16 admin-panel boilerplate (React 19, TypeScript, shadcn, TanStack Query, react-hook-form, i18next).

## When adding resources or fields

Use the `generate` skill (auto-loaded from [.claude/skills/generate/SKILL.md](.claude/skills/generate/SKILL.md)). It wraps the project's hygen generators (`npm run generate:resource`, `npm run generate:field`) which scaffold list/edit/create pages, queries, schemas, and i18n. Do not hand-write resource files.

## Semantic CSS Classes

Every layout wrapper `div`, `section`, or `article` MUST carry a semantic class. Do not put layout utilities (`flex w-full gap-6`, `mx-auto max-w-2xl px-4`, `py-8 text-center`) directly on a layout wrapper — use the class declared in `src/app/globals.css` under `@layer components`.

Semantic classes are declared in `src/app/globals.css` (`@layer components`) and use this project's shadcn tokens (`background`, `foreground`, `muted-foreground`, `border`, `destructive`). The naming convention follows the sibling `crm-web` project; do not copy its `ink` / `surface-raised` / `line-soft` tokens.

| Class | Fungsi |
|-------|--------|
| `page-content` | Container utama halaman |
| `page-content--narrow` | Container halaman dibatasi lebar, responsif: `max-w-3xl` → `xl:max-w-5xl` → `2xl:max-w-screen-xl` (profil, settings) |
| `page-header` | Wrapper header halaman |
| `page-title` | Judul halaman |
| `page-subtitle` | Subtitle di bawah judul |
| `empty-state` | Placeholder saat tidak ada data |
| `empty-state__skeleton` | Susunan skeleton untuk state loading |
| `identity-block` | Blok identitas pengguna (avatar + nama) |
| `identity-block__media` | Kolom avatar |
| `identity-block__details` | Kolom nama + email |
| `tabs-shell` | Layout tab vertikal (list kiri, content kanan) |
| `tabs-shell__list` | `TabsList` vertikal dengan border kanan |
| `tabs-shell__trigger` | `TabsTrigger` dengan active line |
| `tabs-shell__content` | Area isi tab |
| `user-menu` | Header dropdown profil user |
| `user-menu__identity` | Blok nama + email di header dropdown |
| `user-menu__name` | Nama user (truncate) |
| `user-menu__email` | Email user (truncate) |
| `user-menu__item-destructive` | Item menu aksi destruktif (logout) |
| `form` | Wrapper form |
| `form__fields` | Stack field dalam form |
| `form__actions` | Baris tombol aksi form |
| `form__error` | Pesan error form |
| `form-field` | Wrapper satu field + bantuan |
| `form-field__help` | Teks bantuan di bawah field |
| `app-bar` | Wrapper header aplikasi (flex, height var(--header-height), gap, px) |
| `app-bar__brand` | Brand/app-name: `me-auto min-w-0 truncate font-mono text-lg font-bold`, tracking step-down (`tracking-[0.15em] sm:tracking-[0.3em]`) |
| `app-bar__actions` | Wrapper action buttons (theme, language) di kanan: `flex shrink-0 items-center gap-2` |
| `language-switcher` | Trigger language select: `min-w-0 sm:min-w-[7.5rem]` (menggantikan hardcoded `min-w-[120px]`) |

Aturan:

1. Layout wrapper wajib memakai class semantic.
2. Utility Tailwind tetap boleh untuk children kecil (`span`, `button`, `th`, `td`) dan untuk komponen primitive shadcn di `src/components/ui/`.
3. Kalau class semantic yang dibutuhkan belum ada, TAMBAHKAN di `@layer components` — jangan hardcode utility di komponen.
4. Primitif shadcn di `src/components/ui/` **tidak** dimigrasikan. Itu design system, bukan layout aplikasi.

## Elevation Tokens

Added in `src/app/globals.css` (identik di `:root` dan `.dark`):

| Token | Nilai | Peran |
|-------|-------|-------|
| `--elevation-1` | `0 1px 2px 0 rgb(0 0 0 / 0.04)` | Permukaan statis (card, table border) |
| `--elevation-2` | `0 1px 2px 0 rgb(0 0 0 / 0.05), 0 4px 8px -2px rgb(0 0 0 / 0.06)` | Mengambang (dropdown, popover, select, tooltip) |
| `--elevation-3` | `0 2px 4px -1px rgb(0 0 0 / 0.05), 0 12px 20px -4px rgb(0 0 0 / 0.1)` | Overlay (dialog, alert-dialog, sheet) |

Shadow **tidak** dinaikkan di dark mode — nilai identik. Bayangan netral, tanpa hue, agar tidak menimbulkan warna pada permukaan.
