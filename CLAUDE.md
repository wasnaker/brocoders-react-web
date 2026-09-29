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

## Dashboard Widgets

Pola dashboard (grid area + drag-and-drop reorder):

- `src/core/dashboard/resolve-layout.ts` — **fungsi murni** (tanpa React, tanpa fetch, tanpa import project) yang merge layout tersimpan dengan katalog widget → urutan render per area. Enam kasus wajib tertangani: layout null, reorder, pindah area, fallback widget tak ditempatkan, skip ghost id, dan layout rusak → default. Self-check 38 assertion di dalam file yang sama, dijalankan `npm run test:merge` (tsc → node, tanpa unit test runner).
- `src/core/dashboard/areas.ts` — `DASHBOARD_AREAS` (id + i18n label + `span` + position + `layout`) dan peta `AREA_SPAN_CLASS`. Span adalah union type + peta class eksplisit — JANGAN `col-span-${span}` karena Tailwind JIT tidak membaca string dinamis.
- **Area `layout: "stack" | "row"`** menentukan sumbu tata letak widget di dalam area. `"row"` mengganti `flex-col` dengan sub-grid responsif (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`) dan dipakai untuk baris KPI di area `summary`. WAJIB: nilai ini juga memilih strategi sorting `@dnd-kit` (`verticalListSortingStrategy` vs `horizontalListSortingStrategy`) di `DashboardAreaColumn`. Kalau strategi tidak ikut berubah, drag tile ke samping mendarat di posisi salah dan gejalanya hanya muncul saat user benar-benar drag — bukan di test render biasa.
- `src/core/dashboard/use-stats-summary.ts` — query KPI bersama. Ketiga tile membaca tiga field dari objek yang sama dan **WAJIB** memakai satu `queryKey` supaya React Query hanya melakukan satu request, bukan tiga.
- `StatTile` menampilkan angka besar + hint. Angka `0` adalah nilai valid dan tidak boleh disamarkan jadi "—"; `null` (belum diketahui) yang memakai "—".
- `src/core/dashboard/use-dashboard-state.ts` — state dashboard per user. **Fase 0: localStorage** (tabel `setting` di API tidak punya `userId` dan endpoint-nya admin-only). Query key WAJIB memuat userId — `AuthProvider` memang `queryClient.clear()` saat logout, tapi key per-user adalah pengaman kedua terhadap layout user lain mewarisi di akun yang sama.
- Widget didaftarkan di `src/modules/*/module.manifest.ts` via `dashboardWidgets[]`. Manifest baru harus ditambah satu baris di `src/modules/core/manifests/index.ts` supaya ikut ter-registry.
- **Drag-and-drop** (`@dnd-kit/core` v6): `DashboardGrid` bungkus `DndContext`, tiap area punya `DashboardAreaColumn` yang `useDroppable` (id berawalan `column::`), tiap widget punya `WidgetCard` yang `useSortable`. `useSortable` **tidak** menerima `group`/`index` di v6 — itu datang dari `<SortableContext id={area} items={ids}>` induk.
- **Collision detection custom** (`dashboardCollision` di DashboardGrid). `closestCorners` bawaan **tidak bisa dipakai** untuk grid: ia membandingkan sudut kartu dengan sudut droppable, sehingga area kosong yang lebar selalu kalah dari widget yang lebih dekat sudutnya — drop ke kolom kosong jadi tidak pernah terjadi. Pakai `pointerWithin` → prioritaskan target widget, fallback ke kolom.
- Drag hanya boleh mulai dari grip (`setActivatorNodeRef`), bukan dari kartu penuh, supaya tombol/link di dalam widget tetap bisa diklik.
- **Aksesibilitas**: setiap widget punya menu "Pindah ke atas/bawah" (`canMoveUp`/`canMoveDown` meng-disable item di batas) untuk pengguna keyboard, dan setiap perpindahan diumumkan lewat `aria-live="polite"` di `dashboard-announcer`. `PointerSensor` tidak memberi umpan balik ke keyboard — tanpa pengumuman eksplisit, pengguna screen reader kehilangan widget tanpa diberi tahu.
- Label widget = `I18nLabel` → butuh key di `dashboard.json` **lima locale** (en/id/ko/ja/zh). Jangan hardcode string Indonesia di dalam `.tsx`.
- Komponen `Link` sudah menambah prefiks locale sendiri — path widget **tidak boleh** diawali `/en`.

## Elevation Tokens

Added in `src/app/globals.css` (identik di `:root` dan `.dark`):

| Token | Nilai | Peran |
|-------|-------|-------|
| `--elevation-1` | `0 1px 2px 0 rgb(0 0 0 / 0.04)` | Permukaan statis (card, table border) |
| `--elevation-2` | `0 1px 2px 0 rgb(0 0 0 / 0.05), 0 4px 8px -2px rgb(0 0 0 / 0.06)` | Mengambang (dropdown, popover, select, tooltip) |
| `--elevation-3` | `0 2px 4px -1px rgb(0 0 0 / 0.05), 0 12px 20px -4px rgb(0 0 0 / 0.1)` | Overlay (dialog, alert-dialog, sheet) |

Shadow **tidak** dinaikkan di dark mode — nilai identik. Bayangan netral, tanpa hue, agar tidak menimbulkan warna pada permukaan.

## System Banner

Banner pesan global (build baru, broadcast admin, status koneksi). Docs lengkap:
`docs/plans/system-banner-plan.md`.

- **Lokasi render: sibling `<ResponsiveAppBar />`, DI DALAM `SidebarProvider`**
  (`src/app/[language]/layout.tsx`). Provider TIDAK boleh membungkus
  `SidebarProvider` — kalau begitu banner dirender setelah seluruh app shell
  dan jatuh di paling bawah layar. Lebar **penuh selebar viewport** (opsi A),
  termasuk di atas sidebar.
- **Jangan taruh di dalam `page-content--narrow`.** Class itu hanya dipakai 3
  halaman (`dashboard`, `ProfileShell`, `SettingsShell`) — banner tidak akan
  muncul di `sign-in`, `privacy-policy`, atau `admin-panel/users`. Selain itu,
  container itu `max-w-3xl` sehingga banner jadi strip sempit ter-center.
- `src/services/system-banner/banner-types.ts` memisahkan `kind` (sumber) dari
  `severity` (tingkat). Warna & ikon dari `severity`; perilaku dari `kind`.
  crm-web memakai satu `type` untuk dua hal sehingga `admin_broadcast` perlu
  warna sendiri.
- **ID banner WAJIB deterministik** (`banner-ids.ts`): `build:<buildId>`,
  `broadcast:<version>`, `connection:up|down`, `action:<a>:<entity>:<id>`.
  ID acak membuat dismissal tidak pernah bekerja — dismiss -> id disimpan ->
  reload -> `add()` lagi dengan id BARU -> banner muncul lagi.
- `banner-events.ts` meniru `auth-events.ts` (`Set<listener>` +
  `BroadcastChannel`). **Dismissal juga harus disiarkan** lewat
  `emitBannerDismissed()`, kalau tidak tab B tetap menampilkan banner yang
  sudah ditutup di tab A meski localStorage-nya shared.
- Dismissal (`banner-dismissal.ts`) = `Record<id, epochMs>` dengan TTL 30 hari
  + prune saat baca DAN tulis, dibungkus `try/catch` (mode privat Safari,
  kuota penuh).
- **Konten broadcast = `raw: true`.** Judul/pesan broadcast adalah teks admin
  apa adanya, bukan key i18n. Tanpa penanda itu, teks admin yang kebetulan
  sama dengan nama key (mis. `actions.dismiss`) akan diganti terjemahan.
- `action.onClick` disimpan di `Map` ref provider, bukan di state — supaya
  tidak memicu re-render dan tidak ikut ter-serialize.
- Dismissal **dibaca setelah mount**, bukan saat render, supaya server tidak
  merender banner yang sudah di-dismiss lalu hydration melompat.
- `NEXT_PUBLIC_BUILD_VERSION` harus di-set sebelum `npm run build`. Kalau
  kosong, `useBuildVersion` sengaja diam — lebih baik tidak menampilkan
  apa-apa daripada banner yang salah/tidak bisa hilang.
- `pushEntityEvent()` / `buildBannerIdForEntity()` ada sebagai API publik
  tetapi **TIDAK di-wire** ke halaman atau template hygen mana pun. Sonner
  masih memegang pesan CRUD.
