# Plan: System Banner — crm-web parity, versi brocoders

Status     : IMPLEMENTASI SELESAI (2026-09-30) — 33/33 skenario Playwright pass
Dibuat     : 2026-09-29
Repo       : /www/wwwroot/brocoders/brocoders-react-web (Next.js 16 / React 19)
Backend    : /www/wwwroot/brocoders/brocoders-api (NestJS, port 4300)
Deploy     : http://brocoders-react-web.lan (HTTP saja, port 4400, systemd)
Referensi  : /www/wwwroot/crm-web/resources/js/{components/SystemBanner.tsx,hooks/useSystemBanners.ts}

---

## 0. Ringkasan

Membangun sistem banner global di brocoders-react-web dengan cakupan setara
`crm-web` (build_update, admin_broadcast, event entity), tapi diporting ke
idiom repo ini: shadcn + Tailwind token, lucide-react, i18next 5 locale,
React Context, TanStack Query, dan semantic CSS class.

Empat keputusan yang sudah dikunci bersama user:

| Keputusan | Nilai |
|---|---|
| Scope | Penuh (parity dengan crm-web), diadaptasi ke brocoders |
| Kanal broadcast | Polling via TanStack Query (§3 — rekomendasi, bukan WS/SSE) |
| Hubungan dengan sonner | Sonner tetap untuk aksi CRUD; banner untuk pesan global |
| Lokasi render | Semua route, di `src/app/[language]/layout.tsx` |

### 0.1 Konflik scope yang belum diputuskan

Dua jawaban user saling bertentangan dan **tidak diputuskan sendiri di sini**:

- "Scope penuh" memuat `entity-created / updated / deleted`.
- "Banner untuk global saja" berarti CRUD tetap di sonner.

**Resolusi sementara yang dipakai dokumen ini:** bangun *mekanisme* lengkap
(semua tipe, provider, emitter, dismissal) tapi **hanya wire event global**
(build_update, broadcast, connection). Event entity tersedia sebagai API
publik `pushEntityEvent()` tetapi **tidak** disambungkan ke template hygen
dan tidak dipakai halaman mana pun.

Kalau maksud sebenarnya "banner juga untuk CRUD, sonner dibuang", ubah §7.4
dan tambahkan pemanggilan banner di
`.hygen/generate/resource/{page-content,edit/page-content}.ejs.t`.

---

## 1. Apa yang di-*port*, apa yang di-*buang*

`crm-web` system-banner punya 165 baris komponen + 191 baris hook. Yang
diambil adalah **konsep**, bukan kode.

| Aspek | crm-web (Inertia + Vite) | brocoders (Next + shadcn) | Keputusan |
|---|---|---|---|
| Transport event | `window.dispatchEvent(new CustomEvent(...))` | Modul emitter + `BroadcastChannel` (tiru `auth-events.ts`) | **Ganti** |
| State | `useState` + `useRef` di hook | `useReducer` di Provider | **Ganti** |
| Akses | `useSystemBanners()` dipanggil di dalam `SystemBanner` | `useSystemBanner()` context, provider di layout | **Ganti** |
| Ikon | String SVG path hardcoded (`ICON_PATHS`) | Komponen lucide-react | **Ganti** |
| Warna | Hardcoded `emerald-50` / `amber-50` / `blue-50` | Token `--color-success` / `--warning` / `--info` / `--destructive` | **Ganti** |
| Teks | Hardcoded Indonesia (`"Nanti"`, `"Muat Ulang"`, `aria-label="Tutup"`) | i18next, 5 locale | **Ganti** |
| Styling | `@apply` di `resources/css/app.css` | `@layer components` di `src/app/globals.css` | **Ganti** |
| ID banner | `banner-${Date.now()}-${random}` | Deterministik per event | **Ganti** (§5.2) |
| dismissal | `localStorage["crm-system-banners-dismissed"]`, tanpa TTL | Store dengan TTL 30 hari + prune | **Perbaiki** |
| Aksesibilitas | Tidak ada live region | `role="status"` / `role="alert"` + `aria-live` | **Perbaiki** |
| Cross-tab | Tidak ada | `BroadcastChannel` | **Tambah** |

### 1.1 Empat bug crm-web yang tidak boleh diulang

1. **Dismissal tidak pernah bekerja.** `add()` membuat id acak
   (`useSystemBanners.ts:72`). Dismiss → id masuk `localStorage` → reload →
   `add()` dipanggil lagi dengan id **baru** → banner muncul lagi. Persistensi
   di `useSystemBanners.ts:29-44` praktis mubazir. Fix: id deterministik (§5.2).
2. **Tiga event `entity-*` tidak punya pengirim.** `EntityDetailPanel.tsx:243`
   hanya *mendengarkan*, tidak pernah dispatch. Banner itu tidak akan pernah
   muncul. Fix: sediakan API, tapi jangan klaim sudah jalan (§7.4).
3. **Tipe dobel-duty.** Field `type` sekaligus menyatakan *severity* dan
   *sumber*. Akibatnya `admin_broadcast` harus punya warna sendiri (ungu)
   padahal itu bukan severity. Fix: pisahkan `kind` dan `severity` (§2.2).
4. **`admin_broadcast` tidak ada pengirim.** Backend punya kanal, frontend
   belum pasang echo sama sekali. Fix: polling (§3).

---

## 2. Arsitektur

> **CATATAN:** diagram di bawah sudah diperbaiki. Versi awal menggambar
> `<SystemBanner />` sebagai saudara *setelah* `children`, yang kalau diikuti
> akan merender banner di paling bawah layar (setelah app shell selesai),
> bukan tepat di bawah app bar. Posisi normatif ada di §7.1.

```
┌─ layout.tsx (server component) ──────────────────────────────┐
│  <SidebarProvider className="flex-col">   ← sudah ada         │
│    ├── <ResponsiveAppBar />               ← sudah ada         │
│    ├── <div className="system-banner">    ← BARU              │
│    │     └── <SystemBannerProvider>       ← "use client"     │
│    │           <SystemBanner />           ← banner, §7.1     │
│    │     </div>                                              │
│    └── <div className="flex flex-1">      ← sudah ada         │
│          <AppSidebar />                                    │
│          <SidebarInset>{children}</SidebarInset>            │
│        </div>                                               │
│  </SidebarProvider>                                          │
└──────────────────────────────────────────────────────────────┘

Provider DI DALAM <div className="system-banner">, bukan pembungkus layout.
Alasan: banner harus berada di dalam SidebarProvider (flex-col) supaya
turun satu baris tepat di bawah app bar dan melebar penuh selebar
viewport. Kalau provider membungkus SidebarProvider, banner akan muncul
SETELAH seluruh app shell — di paling bawah, di luar layar.

Sumber event:
  /api/build-id        ──fetch saat mount──┐
  GET /v1/broadcast    ──poll, 60s────────┤
  window online/offline ───────────────────┼──► banner-events.ts
  pushEntityEvent()    (manual) ───────────┘   (emitter + BroadcastChannel)
                                                      │
                                                      ▼
                                         SystemBannerProvider
                                         (useReducer + timer per banner)
                                                      │
                                                      ▼
                                               SystemBanner
```

Opsi A dipakai: banner melebar **penuh selebar viewport**, sejajar app bar
dan juga membentang di atas sidebar. Konsekuensi: `system-banner` adalah
sibling `<ResponsiveAppBar />` di dalam `SidebarProvider`, bukan anak
`SidebarInset` seperti di crm-web (yang topbar-nya berada di dalam kolom
konten, sehingga banner-nya ikut terpotong sidebar). Konsisten dengan
perilaku app bar brocoders sendiri.

### 2.1 Kenapa emitter, bukan `window.dispatchEvent`

`src/services/auth/auth-events.ts` sudah establishes pola ini di repo:
`Set<listener>` + `BroadcastChannel` supaya event login/logout menyeberang ke
tab lain. Banner butuh cross-tab yang sama — dismiss di tab A harus
menghilangkan banner di tab B, kalau tidak dua tab menampilkan pesan yang sama
dengan state berbeda.

`window.dispatchEvent` di crm-web tidak menyeberang tab dan tidak punya
`Set<listener>` yang typed. Mengganti dengan pola `auth-events.ts` =
konsisten dengan repo, gratis cross-tab, dan typed.

### 2.2 Bentuk data

```ts
// src/services/system-banner/banner-types.ts
export type BannerSeverity = "info" | "success" | "warning" | "error";
export type BannerKind = "build" | "broadcast" | "connection" | "action";

export interface SystemBanner {
  id: string;              // deterministik — §5.2
  kind: BannerKind;
  severity: BannerSeverity;
  title?: string;          // sudah diterjemahkan
  message: string;         // sudah diterjemahkan
  detail?: string;         // mis. build id, monospace
  action?: { label: string; onClick: () => void };
  autoDismissAfter?: number;  // detik; undefined = sticky
  closable: boolean;
  createdAt: number;
}
```

Pemisahan `kind` / `severity` adalah perbaikan dari crm-web: warna dan ikon
ditentukan `severity`; perilaku (auto-dismiss, closable, tombol aksi)
ditentukan `kind`. Tidak ada lagi warna khusus per sumber.

Aturan per `kind`:

| kind | severity | closable | autoDismiss | action |
|---|---|---|---|---|
| `build` | `info` | ya | tidak | "Muat ulang" (`location.reload()`) |
| `broadcast` | dari server | ya | tidak | opsional dari server |
| `connection` | `error` | tidak | tidak | "Coba lagi" (`router.refresh()`) |
| `action` | pemanggil | ya | opsional | opsional |

---

## 3. Kanal broadcast — rekomendasi: **polling, bukan WebSocket/SSE**

Jawaban atas pertanyaan "apa pola terbaiknya?". Rekomendasi: **polling via
TanStack Query**.

| Kriteria | Polling | SSE | WebSocket |
|---|---|---|---|
| Dependency baru | **0** | 0 | `@nestjs/websockets` + `socket.io` + `socket.io-client` |
| Infra tambahan | **0** | 0 | adapter/redis untuk scale-out |
| Kesesuaian `brocoders-api` sekarang | **sesuai** (single systemd process, port 4300) | perlu handle keep-alive + buffering nginx | perlu handler, guard, room, auth handshake |
| Autentikasi | **gratis** — `useFetch` sudah attach `Authorization` + auto-refresh 401 | `EventSource` **tidak bisa** set header → token pindah ke query string | harus handshake JWT manual |
| `refetchOnWindowFocus` / dedupe / `staleTime` | **gratis** dari TanStack Query | tulis sendiri | tulis sendiri |
| Latensi | ≤ 60 dtk | < 1 dtk | < 1 dtk |
| Skala | 1 instance | 1 instance | perlu shared adapter |

Kanal yang ada di `crm-web` (Reverb + `laravel-echo`) **tidak ada padanannya**
di sini: `brocoders-api` tidak punya `@nestjs/websockets`, tidak punya
`socket.io`, tidak punya Redis. Meniru parity Reverb berarti menambah 3
dependency dan 1 adapter sebelum satu baris banner berjalan.

Broadcast admin (deploy notice, maintenance window) memang **event
jarang-hingga-sedang** — latensi 60 detik tidak terasa. Yang terasa justru
biaya operasional.

SSE ditolak khusus karena `EventSource` tidak bisa mengirim header
`Authorization`, dan token harus dipindah ke query string — downgrade
keamanan nyata pada endpoint yang menyimpan pengumuman sistem.

**Upgrade path nanti** (kalau latensi jadi masalah): ganti `queryFn` dengan
`EventSource`, pertahankan `BannerKind`/`BannerSeverity`/UI apa adanya.
Pemisahan data-vs-transport di §2.2 membuat migrasi itu lokal ke satu file.

---

## 4. Backend — brocoders-api

### 4.1 Module baru `src/broadcast/`

```
src/broadcast/broadcast.module.ts
src/broadcast/broadcast.controller.ts
src/broadcast/broadcast.service.ts
src/broadcast/dto/publish-broadcast.dto.ts
```

**Kenapa module baru, bukan reuse `SettingsController`:** `GET /v1/settings`
di-guard `@Roles(RoleEnum.admin)` (`settings.controller.ts:34-37`). Broadcast
harus terbaca **semua** user terautentikasi. Module baru meng-`import`
`SettingsService` (sudah di-`exports` di `settings.module.ts:9`) lalu
mengespos dua route berbeda.

### 4.2 Penyimpanan — reuse tabel `setting`, tanpa entitas baru

`CLAUDE.md` brocoders-api: "Do not hand-write entity files" — pakai
generator. **Plan ini menghindari generator sama sekali** dengan menyimpan
broadcast sebagai baris `setting`:

| kolom | nilai |
|---|---|
| `key` | `system.broadcast` (unik — sudah ada `@Column({ unique: true })`) |
| `group` | `system` |
| `type` | `json` |
| `value` | JSON `{ severity, title, message, actionLabel, closable }` |
| `moduleAlias` | `null` |

Nol migrasi, nol entitas, nol generator. `updatedAt` baris ini **berperan
sebagai version** — dipakai §4.4.

### 4.3 Endpoint

| Method | Path | Guard | Body | Response |
|---|---|---|---|---|
| `GET` | `/api/v1/broadcast` | `AuthGuard('jwt')` saja | — | `BroadcastPayload \| { version: null }` |
| `POST` | `/api/v1/broadcast` | `AuthGuard('jwt') + RolesGuard(RoleEnum.admin)` | `PublishBroadcastDto` | `BroadcastPayload` |
| `DELETE` | `/api/v1/broadcast` | idem | — | `{ version: null }` |

`BroadcastPayload`:

```ts
{
  version: string;            // setting.updatedAt ISO — dipakai buat dedupe
  severity: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  actionLabel?: string;
  closable: boolean;
  createdAt: string;
}
```

`version` **wajib** ada di payload. Tanpa itu, admin mengedit broadcast
dengan teks sama tidak akan memicu banner baru, dan pengguna yang sudah
dismiss tidak pernah melihat revisi berikutnya.

DTO dengan `class-validator` (pola `settings.controller.ts:29-33` +
`utils/validation-options.ts`) — file DTO **boleh ditulis tangan**;
CLAUDE.md melarang menulis *entity*, bukan DTO.

### 4.4 Versioning & deduplikasi

Client menyimpan `version` terakhir yang **sudah dilihat** di `localStorage`
(§5.2). Kalau `version` di response berbeda → banner baru dibuat dengan
`id = broadcast:<version>`. Kalau sama → tidak ada banner.

> **REVISI SETELAH IMPLEMENTASI — `updatedAt` TIDAK bisa dipakai sebagai
> version.** Rencana awal memakai `setting.updatedAt`. Itu salah: MySQL hanya
> menyalakan `ON UPDATE CURRENT_TIMESTAMP` bila ada kolom lain yang benar-benar
> berubah. Broadcast yang dipublish ulang dengan **teks identik** tidak
> mengubah kolom mana pun, jadi `updatedAt` tidak bergerak, `version` tetap,
> dan pengguna yang sudah dismiss tidak pernah melihat revisi berikutnya —
> persis skenario verifikasi #6 yang gagal saat diuji.
>
> Perbaikan: `version` (ISO timestamp) ditulis eksplisit di dalam JSON `value`
> setiap kali publish. Dokumentasi ini sebelumnya mengira `updatedAt` "berperan
> sebagai version" sudah cukup; tidak.

Akibatnya: admin meng-edit broadcast (walau teksnya identik) → versi baru →
banner muncul lagi untuk yang belum dismiss.

### 4.5 i18n backend

Judul/message broadcast disimpan apa adanya (hasil ketik admin), **tidak**
melewati `nestjs-i18n`. Repo ini punya 7 locale di `src/i18n/` tapi
`SettingsService` juga menyimpan nilai mentah, jadi ini konsisten. Widget
`label_i18n` yang berlaku untuk *kode*, bukan *konten*.

---

## 5. Frontend — brocoders-react-web

### 5.1 File baru

```
src/services/system-banner/banner-types.ts
src/services/system-banner/banner-events.ts
src/services/system-banner/banner-dismissal.ts
src/services/system-banner/use-build-version.ts
src/services/system-banner/use-broadcast.ts
src/components/system-banner/system-banner-provider.tsx
src/components/system-banner/system-banner.tsx
src/components/system-banner/banner-icon.tsx
src/components/system-banner/use-system-banner.ts
src/components/system-banner/index.ts            (barrel)
src/app/api/build-id/route.ts
src/services/api/services/broadcast.ts           (BARU)
src/services/api/types/broadcast.ts               (BARU)
```

Dimodifikasi:

```
src/app/[language]/layout.tsx
src/app/globals.css
```

### 5.2 ID deterministik (perbaikan bug crm-web #1)

| Event | ID |
|---|---|
| build | `build:<buildId>` |
| broadcast | `broadcast:<version>` |
| connection up | `connection:up` |
| connection down | `connection:down` |
| entity (API publik) | `entity:<action>:<entity>:<id>` |

Store dismissal:

```ts
// src/services/system-banner/banner-dismissal.ts
const STORE_KEY = "brocoders.system-banner.dismissed.v1";
const TTL_DAYS = 30;

interface Store { [id: string]: number }   // id → epoch ms saat dismiss
```

- `read()`: parse, **buang entri lebih tua dari TTL** sekalian (prune saat
  baca, bukan hanya saat tulis).
- `write(id)`: tambah entri, prune, tulis.
- `isDismissed(id)`: `Date.now() - store[id] < TTL`.

Harus dibungkus `try/catch` — `localStorage` melempar di mode privat Safari
dan saat kuota penuh. crm-web sudah benar di sini (`useSystemBanners.ts:36`),
pertahankan.

### 5.3 Emitter — tiru `auth-events.ts`

`src/services/system-banner/banner-events.ts` mengikuti
`src/services/auth/auth-events.ts` persis: `Set<listener>` + `BroadcastChannel`
+ notifikasi listener lokal eksplisit (BroadcastChannel tidak mengirim ke
context pengirim). Bedanya hanya: `auth-events.ts` guarding
`typeof window !== "undefined"`; banner **wajib** begitu juga karena
`layout.tsx` mengimpor provider di server render.

### 5.4 Provider

`useReducer` dengan action `push` / `dismiss` / `clear`. Satu `Map` ref untuk
`setTimeout` per banner — sama seperti crm-web, dengan dua tambahan:

- Timer di-register di `push`, dibersihkan di `dismiss` **dan** saat unmount.
- `action.onClick` disimpan di `Map` terpisah (ref) keyed by `id`, bukan di
  state, supaya tidak memicu re-render dan tidak ikut ter-serialize.

Provider **tidak** membaca localStorage saat render (SSR). Dismissal dibaca
di `useEffect` mount — sama seperti gate `isLoaded` yang dipakai
`AuthProvider` (`auth-provider.tsx:20`). Tanpa itu, server merender banner
yang seharusnya sudah di-dismiss, lalu hydration melompat.

### 5.5 Komponen presentasi

`SystemBanner` me-render `banners.map(...)` ke dalam `system-banner__stack`.
Perbedaan penting dari crm-web:

- **Ikon dari lucide-react**, bukan string path:

  ```tsx
  import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";

  const SEVERITY_ICON: Record<
    BannerSeverity,
    ComponentType<{ className?: string }>
  > = {
    info: Info,
    success: CircleCheck,
    warning: TriangleAlert,
    error: CircleAlert,
  };
  ```

  Tipe `ComponentType<{ className?: string }>` sudah dipakai repo di
  `core/modules/types.ts:37` (`TabDef.icon`) — konsisten. Keempat ikon
  diverifikasi ada di `lucide-react@1.18.0`.

- **Tombol close pakai `t("actions.dismiss")`**, bukan `aria-label="Tutup"`
  hardcoded seperti `SystemBanner.tsx:110` di crm-web.
- **Live region**: `role="status" aria-live="polite"` untuk
  `info`/`success`; `role="alert" aria-live="assertive"` untuk
  `warning`/`error`. Perbaikan bug #4.
- **Tidak ada animasi**, jadi tidak ada concern `prefers-reduced-motion`.

### 5.6 Semantic CSS class

`CLAUDE.md` mewajibkan layout wrapper punya class semantic; class baru
ditambahkan ke `@layer components` di `src/app/globals.css` (mulai line 223).

```css
.system-banner { @apply w-full; }
.system-banner__stack { @apply flex flex-col; }
.system-banner__item {
  @apply flex items-center justify-between gap-3 border-b px-4 py-2 text-sm;
}
.system-banner__content { @apply flex min-w-0 flex-1 items-center gap-2; }
.system-banner__text { @apply min-w-0 truncate; }
.system-banner__detail { @apply font-mono text-xs opacity-70; }
.system-banner__actions { @apply flex shrink-0 items-center gap-2; }
.system-banner__icon { @apply h-4 w-4 shrink-0; }
.system-banner__item--info    { @apply bg-info/10 text-foreground; }
.system-banner__item--success { @apply bg-success/10 text-foreground; }
.system-banner__item--warning { @apply bg-warning/10 text-foreground; }
.system-banner__item--error   { @apply bg-destructive/10 text-foreground; }
.system-banner__item--build   { @apply bg-accent text-accent-foreground; }
```

Token `--color-info`, `--color-success`, `--color-warning`,
`--color-destructive` **sudah ada** di `@theme inline` (`globals.css:30-35`)
dan sudah punya pasangan dark di `:root` (line 118) dan `.dark` (line 176).
Tidak ada warna hex baru yang diperkenalkan.

Border per-item memakai `border-b` + warna token dengan opacity rendah, bukan
satu `divide-y` abu — `divide-border` terlalu lemah untuk memisahkan banner
bertumpuk yang warnanya berbeda.

### 5.7 i18n — 5 locale, tanpa string hardcoded

Namespace baru `system-banner.json` di
`src/services/i18n/locales/{en,id,ja,ko,zh}/`. Loader i18next repo memakai
dynamic import per-namespace (`services/i18n/client.ts:22-24`), jadi
namespace baru terdaftar otomatis tanpa touching config.

Skeleton (isi ke-5 locale dicantumkan di §10):

```json
{
  "build":  { "title": "...", "reload": "...", "detailLabel": "..." },
  "broadcast": { "label": "..." },
  "connection": { "lost": { "title": "...", "message": "...", "retry": "..." } },
  "actions": { "dismiss": "..." }
}
```

`CLAUDE.md` melarang keras string Indonesia hardcoded di `.tsx` (baris 63-64).
Tidak ada pengecualian untuk banner.

### 5.8 API service

`src/services/api/services/broadcast.ts` mengikuti bentuk
`services/settings.ts` persis: `useGetBroadcastService()` /
`useDeleteBroadcastService()` memakai `useFetch()` +
`wrapperFetchJsonResponse<T>`. POST **tidak** diimplementasikan karena tidak
ada UI admin di scope ini — endpointnya tetap dibuat supaya bisa dipakai nanti.

---

## 6. Deteksi build (`build_update`)

`crm-web` membaca `<meta name="build-version">` dari Blade. brocoders tidak
punya Blade. Yang penting: **tab lama harus bisa tahu server sudah punya build
baru** — artinya nilai baru harus datang lewat HTTP saat runtime, bukan dari
props yang sudah ter-bake ke bundle.

### 6.1 Route handler

`src/app/api/build-id/route.ts`:

```ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { buildId: process.env.NEXT_PUBLIC_BUILD_VERSION ?? null },
    { headers: { "cache-control": "no-store" } },
  );
}
```

`src/proxy.ts:17` sudah men-skip path yang mengandung `/api/`, jadi route ini
tidak kena redirect locale.

### 6.2 Syarat wajib: env var harus di-set

`NEXT_PUBLIC_BUILD_VERSION` harus diisi **sebelum `npm run build`** di setiap
deploy, kalau tidak fitur ini mati sendiri.

Client membandingkan `process.env.NEXT_PUBLIC_BUILD_VERSION` (ter-bake ke
bundle versi lama) dengan hasil fetch ke route handler. Guard wajib:

- Kalau env di server `null` atau string kosong → fetch mengembalikan
  `{ buildId: null }` → `useBuildVersion` **tidak menambah banner sama sekali**.
- Hasil fetch gagal / timeout → **tidak** menambah banner (default diam).

Tanpa guard ini, env kosong bisa menghasilkan banner permanen yang tidak bisa
hilang. Prinsipnya: lebih baik tidak menampilkan apa-apa daripada menampilkan
banner yang salah.

Alternatif yang lebih kuat (kalau mau otomatis tanpa langkah manual): tulis
`buildId` ke file saat `next build` lewat `generateBuildId` di `next.config.js`.
Itu langkah tambahan di script deploy; `NEXT_PUBLIC_BUILD_VERSION` lebih
eksplisit dan cukup untuk single-server seperti sekarang.

### 6.3 Cukup fetch **sekali saat mount**, tidak perlu polling

Build baru tidak akan pernah "muncul di tengah halaman yang sudah terbuka"
dengan cara lain: tab yang masih memegang JS lama harus melakukan fetch
eksplisit. Poll 60 detik setelah page load juga tidak menambah nilai —
halaman perlu hard-reload untuk mendapat bundle baru, dan pada saat reload
provider baru mount dan cek versi lagi.

Jadi: **fetch sekali saat mount**. Lebih murah dari poll, dan hasilnya sama.

---

## 7. Wiring

### 7.1 Layout

`src/app/[language]/layout.tsx` — bungkus segalanya dengan
`<SystemBannerProvider>`, letakkan `<SystemBanner />` **di dalam**
`SidebarProvider` sehingga ikut seluruh route (`/sign-in` ikut, sesuai
keputusan user).

Posisi: tepat setelah `<ResponsiveAppBar />`, sebelum
`<div className="flex flex-1">`. `SidebarProvider` memakai `flex-col`
(`layout.tsx:75`), jadi anak baru otomatis turun satu baris di bawah app bar
dan menyatu penuh dengan lebar viewport — banner tidak terpotong sidebar.

`SystemBannerProvider` (client) dibungkus `<div className="system-banner">`
dan diletakkan DI DALAM `SidebarProvider` — bukan sebagai pembungkus
`SidebarProvider`. Detail inilah yang membuat diagram §2 awal tampak
menyesatkan: kalau provider membungkus `SidebarProvider`, banner dirender
setelah seluruh app shell dan jatuh di paling bawah layar.

Pembungkus memakai class semantic baru `system-banner`, bukan utility inline,
sesuai `CLAUDE.md`. **Lebar: opsi A** — full viewport, sejajar app bar
(banner ikut membentang di atas sidebar). Lihat catatan opsi di §7.1.1.

### 7.1.1 Kenapa bukan di dalam `page-content--narrow`

Pertanyaan muncul: banner diletakkan di dalam `page-content--narrow` atau
sejajar di atasnya? **Di atasnya**, di shell global. Tiga alasan:

1. **Cakupan route.** `page-content--narrow` hanya dipakai 3 tempat
   (`DashboardGrid` via `dashboard/page-content.tsx`, `ProfileShell`,
   `SettingsShell`). `sign-in`, `privacy-policy`, dan `admin-panel/users`
   TIDAK memakainya — banner di dalam sana tidak akan muncul di sana, padahal
   `build` dan `connection` justru paling relevan saat user belum login.
2. **Lebar.** `page-content--narrow` itu `max-w-3xl` → `xl:max-w-5xl` →
   `2xl:max-w-screen-xl`, yaitu kolom konten yang sengaja dibatasi. Pesan
   sistem ("versi baru tersedia", "koneksi terputus") bukan konten artikel;
   di dalam container sempit jadi kotak kecil ter-center dengan ruang kosong
   di kiri-kanan.
3. **Perongan.** Banner global harus mount sekali di layout. Menaruhnya di
   dalam page container berarti setiap halaman baru harus mengingatinya.

Referensi `crm-web` (`AppLayout.tsx:889-891`) memakai pola yang sama: banner
adalah saudara dari `.page-content`, bukan anaknya.

### 7.2 `useBuildVersion`

Mount di dalam provider. Perbandingan dilakukan **sekali** (§6.3):

```
buildIdClient  = process.env.NEXT_PUBLIC_BUILD_VERSION (baked ke bundle)
buildIdServer  = hasil GET /api/build-id
kalau keduanya ada DAN berbeda → emit banner id=`build:${buildIdServer}`
```

Tiga kondisi yang **tidak** memicu banner: `buildIdClient` null/kosong,
`buildIdServer` null, atau keduanya sama.

### 7.3 `useBroadcast` — polling

Mengikuti `use-dashboard-state.ts` sebagai preseden query di repo:

```ts
useQuery({
  queryKey: ["broadcast", userId],      // WAJIB per-user, lihat catatan di bawah
  queryFn: fetch broadcast,
  enabled: Boolean(user),               // hanya user terautentikasi
  refetchInterval: 60_000,
  staleTime: 30_000,
  retry: false,
})
```

`onSuccess`: kalau payload punya `version` dan `version` !== versi terakhir
yang disimpan di localStorage → `emitBanner({ id: \`broadcast:${version}\`, ... })`
lalu simpan `version`.

**Query key WAJIB memuat userId.** Broadcast di design ini bersifat global,
tapi key per-user tetap dipakai sebagai pengaman kedua terhadap state user
lain di akun yang sama — preseden yang sama sudah dipakai
`use-dashboard-state.ts:99-101` dengan alasannya tertulis di sana.

`staleTime: 30_000` dengan `refetchInterval: 60_000` mencegah refetch di tengah
interval. `retry: false` mengikuti default global `query-client.ts:8`.

### 7.4 Banner untuk CRUD — TIDAK dikerjakan di scope ini

`enqueueSnackbar` di `.hygen/generate/resource/*.ejs.t` **tidak disentuh**.
Sonner tetap menangani create/edit success.

`pushEntityEvent()` disediakan di `banner-events.ts` sebagai API publik,
tapi tidak ada satu pun halaman yang memanggilnya. Catat di CLAUDE.md bahwa
API ini ada tapi belum di-wire, supaya agent berikutnya tidak mengira banner
entity sudah berfungsi (persis bug #2 crm-web).

Kalau nanti diputuskan untuk menyalakannya: tambahkan pemanggilan di
`.hygen/generate/resource/page-content.ejs.t` (setelah `fetchDelete`
berhasil) dan `edit/page-content.ejs.t` (setelah `enqueueSnackbar`), lalu
pertimbangkan menonaktifkan `enqueueSnackbar` supaya tidak dobel.

### 7.5 `connection`

Listener `window.addEventListener("offline" | "online")` di provider.
Emit `connection:down` saat offline, `connection:up` saat online kembali.
`closable: false` — pengguna tidak boleh menutup banner koneksi hilang karena
itu satu-satunya indikator dia sedang offline.

Tidak ada deteksi "server tidak bisa dihubungi" terpisah dari `offline`
browser event; itu butuh health-check endpoint dan di luar scope ini.

---

## 8. Verifikasi

### 8.1 Build & lint

```
cd /www/wwwroot/brocoders/brocoders-react-web
npx tsc --noEmit
npm run lint
npm run build

cd /www/wwwroot/brocoders/brocoders-api
npm run lint
npm run build
```

`npm run build` di web menjalankan `prebuild` → `generate-module-registry.mjs`
otomatis, dan file `src/generated/module-registry.ts` tidak berubah karena
tidak ada manifest baru.

### 8.2 Fungsional (manual / browser)

| # | Skenario | Ekspektasi |
|---|---|---|
| 1 | Tidak ada event apa pun | Banner tidak render, nol layout shift |
| 2 | `NEXT_PUBLIC_BUILD_VERSION` diubah lalu rebuild + restart | Muncul banner "versi baru" di semua route termasuk `/id/sign-in` |
| 3 | Klik "Muat ulang" | Halaman reload, banner hilang, tidak muncul lagi |
| 4 | `NEXT_PUBLIC_BUILD_VERSION` tidak di-set | Tidak ada banner sama sekali, tidak ada error konsol |
| 5 | Broadcast dibuat via `POST /api/v1/broadcast` | Muncul ≤ 60 detik di user login, tidak muncul di user non-login |
| 6 | Broadcast diedit (teks sama) | Versi berubah, banner muncul lagi untuk yang belum dismiss |
| 7 | Broadcast dihapus | `version` jadi null, banner lama yang masih tampil tidak dihapus otomatis (hanya dismiss manual) |
| 8 | Dismiss banner broadcast | Tidak muncul lagi sampai versi berubah atau TTL 30 hari habis |
| 9 | Dua tab terbuka, dismiss di tab A | Tab B ikut hilang (BroadcastChannel) |
| 10 | DevTools → offline | Banner connection, `closable: false` |
| 11 | Koneksi kembali | Banner `connection:up` success, auto-dismiss 4 detik |
| 12 | Severity `warning` | `role="alert"`, diumumkan screen reader |
| 13 | 5 locale | Tidak ada key mentah di UI, tidak ada missing translation |
| 14 | Non-admin `GET /api/v1/broadcast` | 200 (bukan 403) |
| 15 | Non-admin `POST /api/v1/broadcast` | 403 |
| 16 | Tanpa token `GET /api/v1/broadcast` | 401 |

### 8.3 Aksesibilitas

- `role="status"` / `role="alert"` sesuai severity (§5.5).
- Tombol close punya `aria-label` dari i18n.
- Banner tidak mengambil fokus (`tabIndex` tidak di-set) — pengumuman lewat
  live region, bukan focus trap.
- Kontras teks di semua 4 severity, mode terang dan gelap, dicek per
  `docs/plans/ui-fixes-plan.md` §"Palette" yang sudah、香港 establishes
  standar AAA ≥7:1 di repo ini.

### 8.4 Deploy

1. `npm run build` di **kedua** repo. Jangan jalankan build web saat
   `next start` masih hidup — lihat catatan §6 `ui-fixes-plan.md`.
2. `sudo systemctl restart brocoders-react-web.service`
3. `sudo systemctl restart brocoders-api.service`
4. Health check: `/en/profile`, `/id/profile`, `/en/sign-in`, `/api/build-id`
   → 200.

Catatan: `globals.css` ikut berubah → hash CSS berubah → **restart wajib**
setelah build selesai, bukan sebelum.

---

## 9. Out of scope

| Item | Alasan |
|---|---|
| WebSocket / SSE | §3 — nol benefit untuk event jarang, biaya dependency besar |
| UI admin broadcast | Tidak ada di scope; endpoint POST tersedia untuk dipakai manual via curl |
| Banner untuk CRUD | §7.4 — sonner masih memegang |
| Animasi masuk/keluar | Tidak ada di crm-web juga; menambah `prefers-reduced-motion` handling |
| Notifikasi desktop (Notification API) | Tidak ada di crm-web, tidak diminta |
| Migrasi semantic class file lain | Terpisah, per `ui-fixes-plan.md` §"Catatan implementasi" |

---

## 10. Checklist

- [x] Konfirmasi resolusi §0.1 — TIDAK: banner untuk CRUD di luar scope, sonner tetap memegang (sesuai §7.4)
- [x] §4 backend: `src/broadcast/` lengkap
- [x] §4 `app.module.ts` meng-import `BroadcastModule`
- [x] §4 broadcast tersimpan di `setting` dengan key `system.broadcast`
- [x] §4.3 `GET` tanpa guard role, `POST`/`DELETE` dengan `RolesGuard(admin)`
- [x] §5.1 semua file baru dibuat
- [x] §5.2 `banner-dismissal.ts` dengan TTL + prune + try/catch
- [x] §5.3 `banner-events.ts` tiru `auth-events.ts`
- [x] §5.4 provider: `useReducer`, timer map, `onClick` map, dismiss hanya dibaca setelah mount
- [x] §5.5 ikon lucide, `aria-label` dari i18n, live region
- [x] §5.6 semantic class di `@layer components`
- [x] §5.7 `system-banner.json` di 5 locale
- [x] §5.8 `broadcast.ts` service + types
- [x] §6.1 `src/app/api/build-id/route.ts`
- [x] §6.2 guard env kosong / fetch gagal
- [x] §7.1 layout terpasang, posisi benar
- [x] §7.3 query key memuat userId, `refetchInterval: 60_000`
- [x] §7.4 `pushEntityEvent` ada tapi tidak di-wire; dicatat di CLAUDE.md
- [x] §7.5 listener online/offline
- [x] §8.1 `tsc`, `lint`, `build` bersih di kedua repo
- [x] §8.2 16 skenario terverifikasi
- [x] §8.3 kontras + role dicek
- [x] §8.4 deploy + health check

### Urutan pengerjaan

1. §4 backend dulu — frontend tidak bisa diuji tanpa endpoint-nya.
2. §5.1–5.2 (types, dismissal) — fondasi tanpa UI.
3. §5.3–5.4 (emitter, provider) — otaknya.
4. §5.5–5.6 + §5.7 (UI, CSS, i18n) — bagian yang bisa dilihat.
5. §7.1 pasang di layout.
6. §6 + §7.2 build detection.
7. §7.3 broadcast polling.
8. §7.5 connection listener.
9. §8 verifikasi.
