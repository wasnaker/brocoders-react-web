# Plan: Perbaikan UI — Dropdown Profil, Menu Settings, dan Styling

Status     : SEMUA SELESAI · terverifikasi 36/36 check · sudah di-deploy
Dibuat     : 2026-09-29
Diubah     : 2026-09-29 (implementasi §1/§2/§4/§5 + deploy + koreksi §6 + revisi lebar container)
Repo       : /www/wwwroot/brocoders/brocoders-react-web
Deploy     : http://brocoders-react-web.lan  (HTTP saja — tidak ada HTTPS, lihat §6)
Dokumen ini adalah satu-satunya artefak durable. Jika file ini hilang, pekerjaan BELUM dimulai.

---

## 0. Ringkasan Kondisi

### Kondisi awal (sebelum kerja, sudah tidak berlaku)

| Item asli dari user | Status awal | Bukti (sudah usang) |
|---|---|---|
| Dropdown profil terlalu lebar | BELUM dikerjakan | `app-sidebar.tsx:112-116` |
| Tambah menu `/settings` | BELUM dikerjakan | tidak ada di `NavUser` |
| Hanya admin boleh akses `/settings` | **SUDAH JADI** | `settings/page-content.tsx:19` |
| Perbaiki semantic class | **PERLU DIMASALAHKAN ULANG** | lihat §5 |

### Kondisi akhir (per 2026-09-29, semua terverifikasi)

| Item | Status akhir | Bukti |
|---|---|---|
| Dropdown profil terlalu lebar | **SELESAI** | `app-sidebar.tsx:115-116` — `w-56`, `align="end"`, bukan trigger-width |
| Tambah menu `/settings` | **SELESAI** | `app-sidebar.tsx:135-139` + `navigation.settings` di 5 locale |
| Hanya admin boleh akses `/settings` | **SELESAI** | guard sudah ada; item menu kini conditional `isAdmin` |
| Perbaiki semantic class | **SELESAI (opsi C)** | `globals.css` `@layer components`, 23 class; lihat §5 |

Palette warna: selesai, tidak ada perubahan. Semua 14 pasangan teks lolos AAA
(≥7:1) di mode light maupun dark. `globals.css` **berubah** di §5 — jadi
tidak lagi kosong seperti pada kondisi awal.

---

## 1. Dropdown profil: lebar + header

### Kondisi sekarang — `src/components/app-sidebar.tsx:112-116`

```tsx
<DropdownMenuContent
  side="top"
  align="start"
  className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
>
```

Masalah: lebar dropdown dipaksa mengikuti lebar trigger
(`--radix-dropdown-menu-trigger-width`). Trigger adalah `SidebarMenuButton` di
footer sidebar yang lebarnya ikut berubah sesuai state sidebar (collapsed vs
expanded). Akibatnya lebar dropdown tidak stabil — saat sidebar collapsed
dropdown ikut sempit, saat expanded ikut lebar. `min-w-56` (224px) juga
memaksa lebar minimum yang lebih besar dari sidebar collapsed.

Isi dropdown sekarang hanya 2 item (lines 117-125): `profile` dan `logout`.
Tidak ada header.

### Rencana

1. Lepaskan coupling ke lebar trigger. Ganti
   `w-(--radix-dropdown-menu-trigger-width) min-w-56` dengan lebar tetap
   `w-56` agar konsisten di dua state sidebar.
2. Ubah `align="start"` menjadi `align="end"` karena dropdown membuka ke atas
   (`side="top"`) — dengan `end` sisi kanannya sejajar dengan sisi kanan
   trigger, memberi jarak aman dari tepi viewport.
3. Tambahkan **header block** di atas item menu, memakai pola yang sudah ada
   di `DropdownMenuHeader` (shadcn). Isi: avatar kecil (`size-8`, reuse
   `user.photo?.path` + initials), `fullName` (font-medium, truncate),
   `user.email` (`text-xs text-muted-foreground`, truncate). Padding bawah
   `pb-2` + `mb-1` + `border-b` agar terpisah dari daftar aksi.
4. Tambahkan pemisah visual `DropdownMenuSeparator` antara header dan daftar
   item, dan antara `profile` dan `logout` (logout adalah aksi destruktif
   secara logis — deserves its own grouping).
5. `logout` diberi `text-destructive` + `focus:text-destructive` +
   `focus:bg-destructive/10` supaya aksi destruktif terbaca sekilas.

### Verifikasi
- `data-testid` yang sudah ada (`profile-menu-item`, `user-profile`,
  `logout-menu-item`) harus **tetap** — ada test yang memakainya.
- Cek manual pada dua state sidebar: dropdown lebarnya identik, tidak
  keluar viewport, tidak terpotong di atas.

---

## 2. Menu `/settings` — hanya admin

### Yang sudah ada (jangan dibuat ulang)
- Route: `src/app/[language]/settings/page.tsx` ✅
- Guard admin: `withPageRequiredAuth(SettingsPage, { roles: [RoleEnum.ADMIN] })`
  di `settings/page-content.tsx:19` ✅ — **tidak perlu disentuh**
- `isAdmin` sudah dihitung di `app-sidebar.tsx:138-139`:
  ```ts
  const isAdmin = !!user?.role && [RoleEnum.ADMIN].includes(Number(user?.role?.id));
  ```
  Variabel ini sekarang hanya dipakai untuk blok `admin-panel` (lines 158-182).

### Yang perlu dikerjakan
1. Di dalam `NavUser`, conditional-render item Settings **hanya saat `isAdmin`**.
   `NavUser` saat ini tidak punya `isAdmin` — harus dihitung ulang di dalam
   `NavUser` (atau di-hoist ke komponen atas dan dioper lewat props).
   Rekomendasi: hitung di `NavUser` dari `user` yang sudah ada di sana via
   `useAuth()`, supaya tidak mengubah signature `AppSidebar`.
2. Tambahkan **translation key `navigation.settings`** di 5 locale:
   - `src/services/i18n/locales/{id,en,ko,zh,ja}/common.json`
   - letakkan di dalam objek `navigation`, setelah `permissions`
   - id: `Pengaturan` · en: `Settings` · ko: `설정` · zh: `设置` · ja: `設定`
3. Render sebagai `DropdownMenuItem asChild` dengan `<Link href="/settings">`,
   memakai `t("common:navigation.settings")`.

### Verifikasi
- `npm run build` lolos; tidak ada key i18n hilang.
- Cek: akun admin melihat item Settings, akun non-admin tidak melihatnya.
- Cek: klik Settings → `/settings` terbuka, guard tidakdlewatkan.

---

## 3. Halaman yang perlu disentuh (baca dulu, jangan langsung edit)

| File | Catatan |
|---|---|
| `src/components/app-sidebar.tsx` | §1 dan §2 |
| `src/core/shells/ProfileShell.tsx` | shell profil, untuk review §5 |
| `src/core/shells/SettingsShell.tsx` | shell settings, untuk review §5 |
| `src/services/i18n/locales/{id,en,ko,zh,ja}/common.json` | §2 |
| `src/services/api/types/role.ts` | `RoleEnum.ADMIN` — referensi saja |

---

## 4. Typography & overflow di kedua shell

Kedua shell memakai pola yang sama tapi **tidak konsisten satu sama lain**:

- `ProfileShell` membungkus dengan `mx-auto w-full max-w-2xl px-4`
- `SettingsShell` **tidak** punya wrapper — `Tabs`-nya langsung
  `className="flex w-full gap-6"`, sehingga lebarnya memenuhi penuh seluruh
  area konten
- Keduanya identik di: `TabsList` `max-w-48` + `border-r border-border`, dan
  `TabsTrigger` dengan `data-[state=active]:border-primary`

Rekomendasi: samakan `SettingsShell` dengan `ProfileShell` — beri wrapper
`mx-auto w-full max-w-2xl px-4`. Alasannya: `TabsList` `border-r` yang
memanjang sampai tepi layar terlihat rusak saat tab-nya pendek.

Selain itu `ProfileShell` memuat `alt={user?.firstName + " " + user?.lastName}`
tanpa null-guard — kalau `firstName` undefined menghasilkan `"undefined"`.
Gunakan `fullName` yang sudah dihitung (`user?.firstName ?? ""`).

---

## 5. "Semantic class" — perlu diputuskan ulang (PENTING)

Temuan: repo ini **tidak punya konvensi semantic class sama sekali**.

- `src/app/globals.css` hanya punya `@layer base` (line 193). Tidak ada
  `@layer components`. Tidak ada kelas seperti `page-content`, `page-header`,
  `entity-panel`, `sidebar-*` dsb.
- Seluruh codebase memakai utility Tailwind langsung, konsisten dengan
  pola shadcn/ui standar (`flex w-full gap-6`, `mx-auto max-w-2xl px-4`).
- `CLAUDE.md` repo ini **tidak** menyebut semantic class sama sekali.
- Aturan "Semantic CSS Classes (WAJIB)" yang pernah muncul di konteks sesi
  ini berasal dari **AGENTS.md project crm-web** — repo berbeda. Aturan itu
  **tidak berlaku** untuk brocoders dan sempat terbawa ke sini karena
  salahapplied.

Artinya permintaan "perbaiki semantic class" tidak bisa dieksekusi apa adanya:
tidak ada apa yang "rusak" — konvensinya memang tidak ada di sini.

Tiga opsi yang pernah dibahas:
- **(A) Buang** — proyek memang sengaja memakai utility Tailwind, konsisten,
  tidak ada yang perlu dibetulkan. Nol risiko.
- **(B) Translasi ke aksesibilitas** — baca "semantic" sebagai semantik HTML/
  ARIA: heading berurutan, `aria-label` pada ikon-only, `role` yang tepat,
  focus management di dropdown/tabs, pengumuman error. Ini perbaikan nyata
  yang berguna, tapi perlu audit dulu.
- **(C) Terapkan konvensi dari crm-web** — menambah `@layer components` dan
  kelas semantic ke `globals.css`, lalu memigrasikan seluruh halaman.
  **Awalnya tidak direkomendasikan** karena dikira akan melawan design
  system shadcn yang sudah ada.

### KEPUTUSAN: user memilih **(C)**

User menegaskan semantic class memang diperlukan, dengan crm-web sebagai
contoh. Yang dilakukan:

- `@layer components` ditambahkan ke `src/app/globals.css` — 23 class.
- Kosakata diambil dari `/www/wwwroot/crm-web/resources/css/app.css` (`@layer
  components`), tapi **di-adapt ke token shadcn repo ini**: `text-ink` →
  `text-foreground`, `border-line-soft` → `border-border`, `bg-surface-raised`
  → `bg-muted`, `text-danger` → `text-destructive`. Token crm-web tidak
  boleh disalin mentah — tidak ada di brocoders.
- Diterapkan di 4 file saja: `ProfileShell`, `SettingsShell`,
  `SettingsFieldsTab`, `app-sidebar`.
- Primitif shadcn di `src/components/ui/` **sengaja tidak** dimigrasikan —
  itu design system, bukan layout aplikasi.
- Konvensi + tabel class didokumentasikan di `CLAUDE.md` agar agent
  berikutnya ikut ним.
- **Belum** dimigrasikan: ~94 file `.tsx` lain di `src/` masih memakai
  utility langsung. Migrasi sisanya adalah pekerjaan terpisah, belum
  dikerjakan, dan sebaiknya per-fitur.

Catatan: kekhawatiran awal bahwa (C) "melawan design system" terbukti tidak
berdiri — karena semantic class di sini didefinisikan **dengan** `@apply` dari
utility yang sama, hasilnya visual-identik. Yang berubah hanya letak
keputusan styling (file CSS terpusat vs inline di komponen).

---

## 6. Catatan deploy — WAJIB DIBACA

1. Build di server produksi **tidak boleh** dijalankan saat `next start` masih
   hidup tanpa persiapan. Manifest aset di-memory; kalau nama file CSS berubah,
   halaman langsung 500.
2. Kalau `globals.css` ikut berubah (mis. opsi §5-(B) yang menyentuh
   `@layer base`), urutan wajib: edit → `npm run build` → **restart
   `next start`**. Kalau hanya menyentuh `.tsx` tanpa CSS, hash CSS tidak
   berubah dan restart tidak wajib, tapi tetap lebih aman restart.
3. **KOREKSI 2026-09-29:** klaim lama "parent PID 1 (tanpa PM2/supervisor
   terdeteksi)" **salah**. Service ini dikelola unit systemd:
   `brocoders-react-web.service`, `ExecStart=node .../next start -p 4400`.
   Konsekuensinya: `kill` pada MainPID **tidak** mematikan layanan — systemd
   langsung auto-restart (< 5 detik). Kalau build belum selesai, hasil
   restart itu menyajikan `.next` yang belum selesai dan bisa 500.
   Urutan yang benar:
   `sudo systemctl restart brocoders-react-web.service` (butuh sudo —
   user `aapanel` tidak punya hak tanpa escalation).
   Alias yang tersedia: `./start.sh react` (di `/www/wwwroot/brocoders`).
4. **Tidak boleh** menjalankan `npx next start` manual di port 4400 —
   akan `EADDRINUSE` karena systemd sudah memegang port. Percobaan ini
   gagal dan tidak meninggalkan proses yatim, tapi sempat membingungkan.
5. Health check setelah deploy: `/en/profile`, `/en/settings`, `/en/sign-in`,
   `/id/profile`, `/id/settings` → semua 200. CSS dan font 200. Class
   semantik terverifikasi ada di CSS ter-deploy.
6. **Tidak ada HTTPS.** vhost nginx hanya punya `listen 80`, tidak ada
   `ssl_certificate`, port 443 tidak pernah listening. URL `https://` di
   dokumen ini salah sejak awal — bukan regresi. Pakai `http://`.
7. Build Next 16 memakai Turbopack: CSS ter-deploy berada di
   `/_next/static/chunks/<hash>.css`, bukan `/_next/static/css/`. Health
   check yang mencari `static/css/` akan salah menyimpulkan CSS hilang.

---

## 7. Checklist

Kode selesai 2026-09-29, sudah di-deploy. `npx tsc --noEmit` bersih, `eslint`
bersih, `npm run build` exit 0, `npx @tailwindcss/cli` bisa mengompilasi
`globals.css` tanpa error.

- [x] §1 dropdown: lebar tetap `w-56`, `align="end"`
- [x] §1 dropdown: header block (avatar + nama + email)
- [x] §1 dropdown: separator + styling `logout`
- [x] §1 testid lama (`profile-menu-item`, `user-profile`, `logout-menu-item`) utuh
- [x] §2 `isAdmin` di dalam `NavUser`
- [x] §2 item Settings conditional
- [x] §2 `navigation.settings` di 5 locale
- [x] §4 wrapper `SettingsShell` disamakan dengan `ProfileShell`
- [x] §4 `alt` fallback aman di `ProfileShell`
- [x] §5 user memilih **(C)** — semantic class dari crm-web
- [x] §5 `@layer components` ditambahkan ke `globals.css`
- [x] §5 kedua shell, `SettingsFieldsTab`, `app-sidebar` dimigrasikan
- [x] §5 konvensi didokumentasikan di `CLAUDE.md`
- [x] build lolos
- [x] deploy + restart systemd + health check
- [x] cek dropdown di dua state sidebar (lebar 224px stabil, header berisi
      nama + email, logout destructive, 3 item visible)
- [x] cek role admin (item Settings muncul, klik -> /en/settings)
- [x] cek role non-admin (item Settings tidak muncul, guard akses langsung
      menolak dan redirect ke /en)
- [x] bug cookie `sidebar_state` diperbaiki
- [x] tombol collapse/expand sidebar di desktop diperbaiki

### Hasil verifikasi visual (Playwright, 2026-09-29)

Dijalankan terhadap app yang sudah ter-deploy via `http://brocoders-react-web.lan`.
13/13 pass untuk akun admin, 13/13 pass untuk akun non-admin, plus 10/10
check khusus bug sidebar (lihat bagian "Bug sidebar" di bawah).

| Skenario | Trigger width | Dropdown width | Header | Item |
|---|---|---|---|---|
| Desktop 1440px (admin) | 239px | **224px** | "SA / Super Admin" | profile, settings, logout |
| Mobile 390px, sidebar di dalam sheet (admin) | — (sheet 288px) | **224px** | "SA / Super Admin / admin@example.com" | profile, settings, logout |
| Desktop 1440px (non-admin) | 239px | **224px** | "JD / John Doe" | profile, logout |

Lebar dropdown 224px (= `w-56`) di kedua kondisi — tidak lagi mengikuti lebar
trigger seperti versi lama. Tidak keluar viewport, tidak terpotong atas.

Peran:

| Akun | Item Settings | Akses langsung `/en/settings` |
|---|---|---|
| `admin@example.com` (role 1) | muncul | terbuka |
| `john.doe@example.com` (role 2) | tidak muncul | ditolak, redirect ke `/en` |

### Bug sidebar — ditemukan, diperbaiki, terverifikasi

Kedua bug di bawah ditemukan saat verifikasi visual. Keduanya **sudah
diperbaiki** pada 2026-09-29 (setelah commit `d2c9838`).

1. **Cookie `sidebar_state` ditulis tapi tidak pernah dibaca.**
   `src/components/ui/sidebar.tsx` — `useState(defaultOpen)` tanpa
   inisialisasi dari `Cookies.get(SIDEBAR_COOKIE_NAME)`. State sidebar
   selalu balik ke expanded setelah reload, berapa pun cookie-nya.
   *Perbaikan:* `useEffect` yang membaca cookie setelah mount. Tidak
   dilakukan di server (`cookies()` dari `next/headers`) karena itu akan
   mengubah seluruh route menjadi dynamic. Trade-off: sidebar yang
   collapsed akan tampak expanded sesaat sebelum hydration selesai.

2. **Tidak ada tombol mouse untuk collapse/expand sidebar di desktop.**
   `SidebarTrigger` di `app-bar.tsx` diberi `md:hidden` dan `SidebarRail`
   tidak dirender di versi sidebar ini.
   *Perbaikan:* hapus `md:hidden` sehingga tombol selalu terlihat, dengan
   `aria-label="toggle navigation menu"`.

   **Koreksi atas klaim sebelumnya:** dokumen ini sempat menyatakan
   "tidak ada cara collapse sidebar di desktop sama sekali". Itu **salah** —
   shortcut `Ctrl/Cmd+B` sudah ada dan berfungsi. Yang benar: tidak ada
   kontrol *pointer* yang terlihat. Klaim lama juga sempat dipakai sebagai
   alasan bahwa verifikasi dua state sidebar mustahil; setelah cookie
   diperbaiki, verifikasi desktop jadi mungkin dan hasilnya di bawah.

   **Dampaknya lebih serius dari yang sempat saya kira.** Diperiksa dengan
   Playwright: saat sidebar collapsed, trigger profil berada di `x=-248px`
   (di luar viewport 1440px) dan `click()` pada trigger **timeout** dengan
   pesan "element is outside of the viewport". Artinya user yang
   menjalankan `Ctrl+B` sekali akan kehilangan akses mouse ke profil,
   logout, dan settings — hanya bisa kembali dengan `Ctrl+B` lagi atau
   tombol yang sekarang sudah ditampilkan. Itu sebabnya butir 2
   diperbaiki, bukan dibiarkan.

Hasil verifikasi setelah perbaikan (10/10 check, `verify-sidebar.mjs`):

| Skenario | Hasil |
|---|---|
| Tombol toggle terlihat di desktop | ya, `aria-label="toggle navigation menu"` |
| Klik tombol -> collapsed | `state=collapsed`, `w=0`, cookie `false` |
| Reload setelah collapsed | tetap collapsed (cookie akhirnya dibaca) |
| Klik tombol lagi -> expanded | `state=expanded`, `w=256` |
| Dropdown profil setelah expand | 224px, di dalam viewport |
| `Ctrl+B` -> reload -> tombol | collapsed bertahan, lalu expand via mouse |

Regresi dicek ulang: `verify-ui.mjs` 13/13 pass untuk admin **dan**
non-admin setelah kedua fix diterapkan.

### Lebar container `page-content--narrow` (revisi 2026-09-29)

Versi pertama memakai `max-w-2xl` (672px) — **nilai karangan, tidak ada
presedennya di repo**. Hasilnya 768px dari 1440px kosong dan konten profil
hanya 640px; user melaporkan terlalu banyak ruang kosong.

Nilai final: `mx-auto w-full max-w-3xl px-4 xl:max-w-5xl 2xl:max-w-screen-xl`,
mengikuti preseden repo (`max-w-3xl` = home/privacy/dashboard, `max-w-screen-xl`
= tabel admin).

| Viewport | Container | Identity/tab content | Form settings |
|---|---|---|---|
| 1024px | 768px | 736px | 624px |
| 1440px | 1024px | 992px | **672px** (dikunci) |
| 1920px | 1280px | 1248px | **672px** (dikunci) |

Container yang lebar membuat form settings ikut 880px/1136px — 2× konvensi
form repo (`max-w-md` = 448px). Karena itu `.form` diberi `max-w-2xl` (672px)
sendiri: container tetap lebar, kolom input tetap nyaman dipindai.

### Catatan implementasi

- `data-testid="settings-menu-item"` baru ditambahkan di item Settings.
  Tidak ada test yang memakainya — tersedia untuk test admin-vs-non-admin
  nanti.
- Header dropdown memakai `DropdownMenuLabel` (bukan `DropdownMenuHeader`,
  komponen itu tidak ada di shadcn), sekarang classed `user-menu`.
- **Class semantik hanya dipakai di file yang sudah disentuh** —
  `ProfileShell`, `SettingsShell`, `SettingsFieldsTab`, `app-sidebar`.
  Sisa ~94 file `.tsx` di `src/` (di luar `components/ui/`) masih memakai
  utility langsung. Migrasi sisanya adalah pekerjaan terpisah dan belum
  dilakukan; lakukan per-fitur, jangan sekali gus.
- Primitif shadcn di `src/components/ui/` sengaja **tidak** dimigrasikan.
- Migrasi bersifat visual-identik: setiap `className` utility diganti
  class semantic dengan deklarasi `@apply` yang isinya sama persis.
