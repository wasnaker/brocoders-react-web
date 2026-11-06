# Module Manifest & Profile Tabs

Dokumen ini adalah kontrak implementasi module untuk host Brocoders React Web. Sumber kebenaran implementasi adalah manifest di setiap package module dan resolver di host. Module tetap berada di repository/package masing-masing; host tidak menyalin source module ke folder internalnya.

## Prinsip arsitektur

1. **Core owns the host experience.** Core menyediakan halaman Profile, tab navigation, layout, authentication boundary, permission filtering, dan registry.
2. **Module owns its tab.** Module menentukan identitas tab, label, icon, urutan, permission, dan komponen kontennya.
3. **Manifest is the integration contract.** Module mendaftarkan kontribusinya melalui `module.manifest.ts`; Core tidak boleh menambahkan conditional khusus seperti `if (module === "customer")`.
4. **No copy-and-modify.** Source module tetap berada di repository module dan dipasang sebagai package dependency `@wasnaker/module-*`.
5. **API owns data access and authorization.** Komponen frontend tidak mengakses PostgreSQL/TypeORM secara langsung. Semua data dibaca melalui API module; endpoint tetap wajib memvalidasi hak akses dan scope user di backend.

## Slot manifest

`ModuleManifest` berada di `src/core/modules/types.ts`.

| Slot | Tujuan | Pemilik renderer |
| --- | --- | --- |
| `pages` | Halaman module pada URL canonical, mis. `/admin/customer/branch` | Host route resolver |
| `profileTabs` | Tab tambahan pada halaman Profile milik user yang sedang login | `ProfileShell` |
| `settingsTabs` | Tab pengaturan aplikasi | `SettingsShell` |
| `dashboardWidgets` | Widget dashboard | `DashboardGrid` |
| `menu` | Navigasi sidebar module | App sidebar |

Jangan mendaftarkan tab Profile sebagai `pages` atau `menu`. Profile tab adalah kontribusi ke halaman Profile Core, bukan halaman admin mandiri.

## Profile tabs

### Tanggung jawab Core

Core menyediakan satu halaman Profile untuk semua user. Core memiliki tab bawaan seperti Account dan Security melalui manifest Core di `src/core/manifests/profile.manifest.ts`.

Core bertanggung jawab untuk:
- mengambil seluruh manifest dari generated module registry;
- menggabungkan `profileTabs` dari Core dan semua module;
- memfilter tab berdasarkan permission user;
- mengurutkan tab secara deterministik;
- menampilkan navigasi dan area konten dengan layout yang konsisten.

Core tidak mengetahui arti bisnis dari tab module. Core hanya membaca kontrak manifest dan merender komponen yang diberikan.

### Tanggung jawab module

Setiap module boleh menambahkan nol atau lebih profile tabs. Deklarasikan tab di `web/src/modules/<alias>/module.manifest.ts`:

```tsx
import Building2 from "lucide-react/dist/esm/icons/building-2";
import { defineModuleManifest } from "@/core/modules/types";
import { MyCompanyTab } from "./pages/my-customer-page";

export default defineModuleManifest({
  alias: "customer",
  profileTabs: [
    {
      slug: "my-company",
      label: {
        namespace: "module-customer",
        key: "myCompany.tabTitle",
      },
      position: 30,
      icon: Building2,
      permission: "read:branch",
      content: {
        kind: "component",
        component: MyCompanyTab,
      },
    },
  ],
});
```

Field contract:

| Field | Ketentuan |
| --- | --- |
| `slug` | Identifier stabil dan unik lintas manifest. Gunakan nama spesifik, mis. `my-company`, bukan `overview` yang mudah bentrok. Jangan mengubah slug setelah digunakan tanpa alasan migrasi. |
| `label` | Gunakan object `{ namespace, key }` agar label mengikuti bahasa aktif. |
| `position` | Angka; urutan ascending. Core Profile saat ini memakai 10 dan 20, sehingga module mulai dari 30. Sisakan jarak 10 untuk penambahan tab berikutnya. |
| `icon` | Komponen Lucide opsional. Gunakan deep import seperti contoh. |
| `permission` | Opsional. Jika diisi, tab hanya ditampilkan ketika user memiliki permission tersebut. Jika tidak diisi, tab dianggap boleh dilihat semua user. |
| `content` | Profile tab menggunakan `kind: "component"`. Komponen menjadi tanggung jawab module. |

Resolver berada di `src/core/modules/resolve-tabs.ts`. Tab diurutkan berdasarkan `position`, lalu `moduleAlias` sebagai tie-breaker. Karena itu hasil gabungan tetap deterministik meskipun beberapa module memilih posisi yang sama.

**Penting:** permission pada manifest adalah kontrol visibilitas UI, bukan pengganti authorization backend. Endpoint data tetap harus memeriksa session, permission, dan kepemilikan/scope data. Untuk data "milik user yang sedang login", gunakan endpoint self-service yang mengambil identitas dari session server; jangan mengirim user ID target dari browser sebagai sumber otoritatif.

### Kontrak komponen tab

Komponen tab:
- merupakan React component yang tidak menerima props dari ProfileShell;
- mengambil user/session melalui auth hook yang tersedia di host;
- mengambil data melalui service/API module;
- mengelola loading, error, empty state, dan success state sendiri;
- memakai query key yang menyertakan identitas user bila cache datanya user-specific;
- tidak mengakses database secara langsung;
- tidak mengubah layout atau navigation Profile milik Core.

ProfileShell saat ini merender konten komponen. Bentuk `kind: "fields"` digunakan oleh SettingsShell untuk form pengaturan dan tidak boleh digunakan untuk Profile tab.

### Contoh pilot: My Company

Pilot pertama adalah `My Company` dari `bc-customer`.

- Manifest module mendaftarkan slug `my-company`, label dari namespace `module-customer`, icon Building2, dan posisi setelah tab Core.
- Komponen `MyCompanyTab` membaca cabang yang terkait dengan akun yang sedang login melalui service API `GET /v1/customer/me/branch`.
- Module menampilkan state loading, error, tidak ada cabang, atau detail cabang.
- Komponen memanfaatkan komponen presentasi milik module Customer untuk detail cabang.
- Tab ini tidak membuat menu sidebar atau route admin baru.

Pola ini dapat dipakai module lain, misalnya module Equipment kelak dapat mendaftarkan `My Equipment` tanpa mengubah ProfileShell atau file Core. Module tersebut tetap harus menyediakan endpoint self-service dan authorization backend-nya sendiri.

## Settings tabs berbeda dari Profile tabs

`settingsTabs` dapat memakai:
- `content: { kind: "component", component: ... }` untuk UI custom milik module; atau
- `content: { kind: "fields", fields: [...] }` untuk form settings standar yang disimpan melalui Settings API Core.

Jangan memakai `kind: "fields"` untuk Profile. Profile menampilkan informasi dan tindakan yang terkait dengan user saat ini; Settings menyimpan konfigurasi aplikasi.

## Package integration dan registry

Module frontend dipasang sebagai package dependency, bukan disalin ke `src/modules`.

Generator `scripts/generate-module-registry.mjs`:
1. membaca manifest Core dari `src/core/manifests/*.manifest.ts`;
2. menemukan dependency `@wasnaker/module-*` dari `package.json`;
3. memeriksa manifest package pada `node_modules/@wasnaker/module-<alias>/web/src/modules/<alias>/module.manifest.ts`;
4. menghasilkan static import registry di `src/generated/module-registry.ts`;
5. menghasilkan registry locale di `src/generated/module-locales.ts` dari package exports.

Generated files adalah build artifacts; jangan diedit manual. `predev` dan `prebuild` menjalankan generator. Folder `src/modules` tidak boleh digunakan untuk menaruh source module hasil copy; generator akan menghentikan proses jika folder legacy itu berisi file.

Instalasi module dilakukan dengan script host:

```bash
npm run module:add -- customer --ref <commit-sha>
```

Secara default script menggunakan repository `wasnaker/bc-<alias>`. Untuk repository lain, gunakan `--repo owner/repo`. Ref harus berupa tag atau commit SHA yang eksplisit agar dependency dapat direproduksi. Script menjalankan npm install dan generator; commit **package.json dan package-lock.json** bersama-sama. Jangan mengubah salah satunya saja.

Perintah terkait:
- `npm run module:list` — daftar package module di dependencies.
- `npm run module:rm -- <alias>` — melepas dependency module.

Package module harus mengekspor:
- `./manifest` yang menunjuk ke module manifest;
- `./locales/en`, `./locales/id`, `./locales/ja`, `./locales/ko`, dan `./locales/zh` untuk locale yang disediakan;
- file frontend module dan locale harus tercakup dalam field `files` pada package.json.

Namespace locale module mengikuti pola `module-<alias>`. Contoh: module alias `customer` menggunakan namespace `module-customer`. Komponen module menggunakan namespace tersebut melalui `useTranslation("module-customer")`; label manifest menggunakan namespace/key yang sama. Client i18n host mendukung pemuatan cross-namespace untuk label manifest.

## Permissions

Resolver memakai `can(permission, user)` dari Core. Pemeriksaan ini menggabungkan permission dari seluruh role user (multi-role), mendukung wildcard, dan admin bypass.

Pedoman:
- Gunakan permission module yang stabil dan bermakna, mis. `read:branch`.
- Tab yang hanya relevan bagi kelompok user tertentu sebaiknya menyatakan permission secara eksplisit.
- Jangan menganggap tab tersembunyi sebagai proteksi data.
- Backend module harus memvalidasi authorization secara independen, termasuk endpoint self-service.

## Validasi dan checklist sebelum merge

Untuk setiap module yang menambahkan Profile tab, periksa:

1. [ ] Tab didaftarkan hanya melalui `profileTabs` di manifest module.
2. [ ] Tidak ada perubahan khusus module di ProfileShell, registry Core, atau sidebar Core.
3. [ ] Slug unik dan stabil; posisi numerik; label menggunakan namespace module.
4. [ ] Permission UI ditentukan secara eksplisit bila tab tidak untuk semua user.
5. [ ] Komponen tab tidak membutuhkan props dari host dan mengelola loading/error/empty state.
6. [ ] Data diambil melalui API module; tidak ada akses database langsung dari frontend.
7. [ ] Endpoint self-service mengambil identitas dari session server dan membatasi data ke user terkait.
8. [ ] API menguji unauthorized/forbidden dan skenario user tanpa relasi data.
9. [ ] Locale yang didukung tersedia dan diekspor dari package.
10. [ ] Package dependency dikunci pada commit SHA dan package.json/package-lock.json konsisten.
11. [ ] Generator dan build host berhasil; module build/typecheck juga berhasil.
12. [ ] Profile diuji dengan beberapa role, multi-role, tanpa permission, dan saat user/session berubah.

## File referensi implementasi

- Core manifest: `src/core/manifests/profile.manifest.ts`
- Manifest types: `src/core/modules/types.ts`
- Tab resolver: `src/core/modules/resolve-tabs.ts`
- Permission evaluator: `src/core/modules/can.ts`
- Profile renderer: `src/core/shells/ProfileShell.tsx`
- Registry generator: `scripts/generate-module-registry.mjs`
- Package installer: `scripts/module-add.mjs`
- Pilot manifest: `bc-customer/web/src/modules/customer/module.manifest.ts`
- Pilot component: `bc-customer/web/src/modules/customer/pages/my-customer-page.tsx`

Dokumen ini menggantikan instruksi lama yang menyebut penyalinan module ke `src/modules`. Jika implementasi generator atau kontrak manifest berubah, dokumen ini harus diperbarui dalam commit yang sama.
