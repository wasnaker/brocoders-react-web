# Master-detail pattern (core)

Halaman tipe "list + panel detail" (mis. Region) memakai satu pola yang dimiliki
**frontend core**, bukan modul. Modul hanya menyuplai kolom, tab, dan renderer.

## Aturan ownership

| Bagian | Pemilik |
| --- | --- |
| State seleksi, visibilitas panel, sinkron hash URL | core (`useMasterDetail`) |
| Layout list + split panel, skeleton, pagination | core (`SmallTable`) |
| Query detail (`GET /:id`) | modul (hook API) |
| Kolom, tab, isi panel, form create/edit | modul |

Modul **tidak boleh** menyimpan `selectedId`/`showDetail` sendiri, menulis
`window.history`, atau mengambil entitas detail dari baris list.

## API core

### `useMasterDetail()` — `@/core/master-detail/use-master-detail`

```ts
const { selectedId, showDetail, select, close, toggle, afterSave } =
  useMasterDetail();
```

| Fungsi | Semantik |
| --- | --- |
| `select(id)` | klik baris → pilih + buka panel + tulis hash |
| `close()` | tutup panel + hapus pilihan + hapus hash |
| `toggle()` | lipat/buka panel tanpa mengubah pilihan |
| `afterSave(id)` | **wajib dipanggil setelah create/update** → invalidasi cache, pilih id hasil simpan, buka panel |

### `SmallTable` — `@/components/small-table`

| Prop | Fungsi |
| --- | --- |
| `selectedId` | id terpilih (dari `useMasterDetail`) |
| `onSelectId` | `select` |
| `showDetail` | visibilitas panel |
| `detailItem` | **entitas hasil `GET /:id`** — sumber isi panel |
| `detailLoading` | skeleton saat detail dimuat |
| `customTabBody`, `toolbar`, `renderHeader` | renderer milik modul |

`detailItem` diprioritaskan di atas baris list. Karena itu panel tetap tampil
walau item:

- baru dibuat dan belum ada di halaman list aktif,
- berubah nama sehingga pindah urutan/halaman,
- berada di luar filter/pagination yang sedang aktif.

## Kontrak backend (sudah berlaku, tanpa endpoint khusus)

| Operasi | Kontrak |
| --- | --- |
| `GET /:id` | mengembalikan entitas detail |
| `POST` | `201` + entitas yang dibuat (termasuk `id`) |
| `PATCH /:id` | `200` + entitas terbaru |
| `DELETE /:id` | `204` |
| `GET` list | `{ data, hasNextPage }` |

Panel detail **selalu** dirender dari `GET /:id`, bukan dari objek hasil
`POST`/`PATCH` di memori, agar perilakunya sama untuk semua modul dan tetap
benar setelah refetch.

## Checklist modul baru

1. Pakai `useMasterDetail()` — jangan buat state seleksi sendiri.
2. Ambil detail dengan hook `useX(id)` saat `selectedId != null`.
3. Teruskan `detailItem` + `detailLoading` ke `SmallTable`.
4. Di `onSuccess` form: cukup `afterSave(savedId)` — invalidasi cache milik core
   (default: semua query aktif; bisa dipersempit lewat opsi `invalidateKey`).
5. Jangan menulis hash URL atau menyembunyikan panel secara manual.

Contoh:

```tsx
const { selectedId, showDetail, select, close, toggle, afterSave } =
  useMasterDetail({ invalidateKey: ["x"] });
const detailId = selectedId != null ? Number(selectedId) : null;
const { data: item, isLoading } = useX(detailId);

<SmallTable
  items={rows}
  selectedId={selectedId}
  onSelectId={select}
  showDetail={showDetail}
  detailItem={item ?? null}
  detailLoading={isLoading}
  getItemId={(row) => row.id}
  /* columns, tabs, customTabBody, toolbar */
/>;

<XFormDialog onSuccess={(savedId) => afterSave(savedId)} />;
```
