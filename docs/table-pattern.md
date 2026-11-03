# Server-side Table Pattern

Semua modul WAJIB pakai pola server-side untuk pagination, search, dan sort.
Client-side filtering dihapus untuk konsistensi dan skalabilitas.

## Arsitektur

```
src/core/table/
  use-table.ts      ← Hook universal untuk semua modul
  types.ts          ← Type definitions (SortConfig, TableResponse, etc.)
src/components/
  small-table.tsx   ← UI component (menerima props controlled)
```

## Kapan Pakai

| Volume Data | Metode |
| --- | --- |
| Semua modul | Server-side (useTable hook) |

Tidak ada lagi client-side pagination/filter — semua delegasi ke API.

## API Contract

### Backend

```ts
GET /api/v1/<resource>?page=1&limit=20&search=aceh&sort=name:ASC
// Response:
{
  data: T[],
  total: number  // WAJIB — untuk hitung totalPages di frontend
}
```

### Frontend Hook

```tsx
import { useTable } from "@/core/table/use-table";
import type { Province } from "@wasnaker/module-region";

function RegionPage() {
  const {
    data,           // T[] — items untuk halaman ini
    total,          // number — total record di server
    isLoading,
    page,
    setPage,
    search,
    setSearch,
    sort,
    setSort,
  } = useTable({
    queryKey: ["region", "provinces"],
    defaultLimit: 20,
    searchDebounce: 300,
    fetchFn: async ({ page, limit, search, sort }) => {
      const res = await api.getProvinces({
        page,
        limit,
        search: search || undefined,
        sort: sort ? `${sort.field}:${sort.order}` : undefined,
      });
      return { data: res.data, total: res.total };
    },
  });

  return (
    <SmallTable
      mode="server"
      items={data}
      total={total}
      page={page}
      onPageChange={setPage}
      searchValue={search}
      onSearchChange={setSearch}
      sort={sort}
      onSortChange={setSort}
      /* props lain */
    />
  );
}
```

## SmallTable Props (Server Mode)

| Prop | Tipe | Wajib | Keterangan |
| --- | --- | --- | --- |
| `items` | `T[]` | ✅ | Data dari server (sudah dipaginasi) |
| `total` | `number` | ✅ | Total record — untuk hitung totalPages |
| `page` | `number` | ✅ | Halaman aktif (1-based) |
| `onPageChange` | `(p) => void` | ✅ | Handler ganti halaman |
| `searchValue` | `string` | ✅ | Search query controlled |
| `onSearchChange` | `(q) => void` | ✅ | Handler search |
| `sort` | `SortConfig` | — | Sort config optional |
| `onSortChange` | `(s) => void` | — | Handler sort optional |
| `perPage` | `number` | — | Default: dari Settings › Misc (defaultPageSize) |

> Catatan: opsi `mode="server"` dan prop `mode` sudah dihapus dari SmallTable —
> komponen selalu berjalan server-side.

## Settings Global (Settings › Misc)

Beberapa nilai default tabel dikelola **frontend core**, bukan modul, jadi berlaku
untuk semua modul sekaligus lewat `useCoreSettings()`:

| Setting | Key backend | Diterapkan ke |
| --- | --- | --- |
| `defaultPageSize` | `misc.defaultPageSize` | `useTable` (defaultLimit saat modul tidak override) |
| `maxApiLimit` | `misc.maxApiLimit` | Panduan cap limit API modul |
| `dashboardWidgetsEnabled` | `misc.dashboardWidgetsEnabled` | `DashboardGrid` (sembunyikan semua widget saat off) |
| `staleTimeSeconds` | `misc.staleTimeSeconds` | `useTable` (staleTime query React Query) |

Modul **tidak boleh** memanggil settings API langsung — gunakan `useCoreSettings()`.

## Checklist Modul Baru

1. [ ] API endpoint return `{ data, total }`
2. [ ] Pakai `useTable()` hook di page
3. [ ] SmallTable props: `items`, `total`, `page`, `onPageChange`, `searchValue`, `onSearchChange`
4. [ ] Jangan ada filter/pagination client-side di modul
5. [ ] Test: search "aceh" → hasil muncul di halaman 1 (server filter)

## Contoh Lengkap

Lihat `bc-region/web/src/modules/region/pages/region-page.tsx` sebagai referensi.

## Migration dari Client-side

Jika modul masih pakai client-side filter:

```tsx
// ❌ HAPUS ini
const filteredItems = useMemo(() => items.filter(...), [items, q]);
const pagedItems = filteredItems.slice(page * pageSize, ...);

// ✅ GANTI dengan
const { data, total, page, setPage, search, setSearch } = useTable({...});
// data sudah difilter & dipaginasi dari server
```
