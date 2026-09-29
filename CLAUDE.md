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

Aturan:

1. Layout wrapper wajib memakai class semantic.
2. Utility Tailwind tetap boleh untuk children kecil (`span`, `button`, `th`, `td`) dan untuk komponen primitive shadcn di `src/components/ui/`.
3. Kalau class semantic yang dibutuhkan belum ada, TAMBAHKAN di `@layer components` — jangan hardcode utility di komponen.
4. Primitif shadcn di `src/components/ui/` **tidak** dimigrasikan. Itu design system, bukan layout aplikasi.
