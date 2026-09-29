/**
 * Merge layout dashboard — fungsi MURNI: tanpa React, tanpa fetch, tanpa import
 * dari project mana pun. Sifat itu yang membuat file bisa diuji sendiri lewat
 * `npm run test:merge` (tsc + node, tanpa test runner) — repo ini memang tidak
 * punya unit test runner.
 *
 * Tipe lokal di bawah sengaja struktural (bukan tipe UI asli) supaya file ini
 * tidak menarik React atau modul lain saat dikompilasi standalone.
 *
 * KONSEP: layout yang tersimpan adalah DATA USER, dan data itu akan basi.
 * Widget ditambah, widget dihapus, area di-rename — semuanya membuat layout
 * lama tidak lengkap atau menunjuk entitas yang sudah tidak ada. Karena itu
 * hasil merge harus SELALU berupa urutan render yang valid untuk setiap
 * pasangan (layout, katalog): tidak ada widget yang hilang diam-diam, dan
 * layout rusak tidak boleh membuat halaman error.
 */

export interface ResolvableWidget {
  id: string;
  area: string;
  position?: number;
}

export type DashboardLayout = Record<string, string[]>;

/**
 * Sanitasi layout dari sumber tidak dipercaya (localStorage, API, cast).
 * Nilai yang bukan array dibuang, entri non-string dibuang, `null`/`{}`/
 * nilai non-objek dianggap "belum ada layout".
 */
export function sanitizeLayout(input: unknown): DashboardLayout | null {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const out: DashboardLayout = {};
  let hasAnyArea = false;

  for (const [area, value] of Object.entries(
    input as Record<string, unknown>
  )) {
    if (!Array.isArray(value)) {
      continue;
    }
    out[area] = value.filter(
      (id): id is string => typeof id === "string" && id.length > 0
    );
    hasAnyArea = true;
  }

  return hasAnyArea ? out : null;
}

/**
 * Daftar area efektif: base (urutan definisi) + area dari katalog widget
 * (default area modul) + area yang tersimpan di layout user. Area tambahan
 * append di belakang base, urutan kemunculan pertama.
 */
export function resolveAreas(
  baseAreas: readonly string[],
  widgets: readonly { area: string }[],
  layout: DashboardLayout | null
): string[] {
  const areas: string[] = [];
  const push = (area: string) => {
    if (area && !areas.includes(area)) {
      areas.push(area);
    }
  };

  baseAreas.forEach(push);
  widgets.forEach((w) => push(w.area));
  if (layout) {
    Object.keys(layout).forEach(push);
  }

  return areas;
}

function sortWidgets<T extends ResolvableWidget>(list: T[]): T[] {
  return list.sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0) || a.id.localeCompare(b.id)
  );
}

function groupByDefaultArea<T extends ResolvableWidget>(
  widgets: readonly T[]
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  for (const w of widgets) {
    (grouped[w.area] ??= []).push(w);
  }
  for (const list of Object.values(grouped)) {
    sortWidgets(list);
  }
  return grouped;
}

/**
 * Merge layout tersimpan dengan katalog widget -> urutan render per area.
 *
 * Kasus yang wajib tertangani (semua punya assertion di self-check):
 *  1. layout null  -> semua widget di area default-nya, urut katalog.
 *  2. reorder dalam satu area -> mengikuti urutan tersimpan.
 *  3. pindah antar area -> mengikuti area tujuan.
 *  4. FALLBACK: widget terdaftar tapi tidak ditempatkan di area layout
 *     manapun -> dirender di area default-nya. Ini yang mencegah widget
 *     hilang total hanya karena satu WYSIWYG gagal nyimpan.
 *  5. GHOST: id di layout yang widget-nya sudah dihapus -> di-skip, dan
 *     tetap dihitung "placed" supaya tidak mengganggu fallback.
 *  6. layout rusak (bukan object / area bukan array) -> jatuh ke default.
 *  7. id yang sama muncul dua kali di satu area -> render sekali.
 */
export function resolveDashboardLayout<T extends ResolvableWidget>(
  rawLayout: unknown,
  widgets: readonly T[],
  areas: readonly string[]
): Record<string, T[]> {
  const layout = sanitizeLayout(rawLayout);
  const byId = new Map(widgets.map((w) => [w.id, w]));

  if (!layout) {
    const grouped = groupByDefaultArea(widgets);
    return Object.fromEntries(areas.map((area) => [area, grouped[area] ?? []]));
  }

  // Semua id yang disebut di layout manapun sudah "ditempatkan" user —
  // termasuk id yang sudah tidak ada di katalog (ghost). Menandainya placed
  // mencegah entri lain ikut ter-fallback ke area default.
  const placed = new Set<string>();
  for (const ids of Object.values(layout)) {
    for (const id of ids) {
      placed.add(id);
    }
  }

  const unplaced: Record<string, T[]> = {};
  for (const w of widgets) {
    if (!placed.has(w.id)) {
      (unplaced[w.area] ??= []).push(w);
    }
  }
  for (const list of Object.values(unplaced)) {
    sortWidgets(list);
  }

  const resolved: Record<string, T[]> = {};

  for (const area of areas) {
    const saved: T[] = [];
    const seen = new Set<string>();

    for (const id of layout[area] ?? []) {
      if (seen.has(id)) {
        continue;
      }
      seen.add(id);
      const widget = byId.get(id);
      if (widget) {
        saved.push(widget);
      }
    }

    resolved[area] = [...saved, ...(unplaced[area] ?? [])];
  }

  return resolved;
}

/**
 * Pindahkan satu widget antar/dalam area -> layout baru (immutable).
 * Indeks di-clamp ke batas daftar, dan area di luar daftar `areas` diabaikan,
 * sehingga input yang salah tidak menghasilkan layout korup.
 */
export function moveWidget(
  layout: DashboardLayout,
  widgetId: string,
  fromArea: string,
  fromIndex: number,
  toArea: string,
  toIndex: number,
  areas: readonly string[]
): DashboardLayout {
  const next: DashboardLayout = {};
  for (const area of areas) {
    next[area] = [...(layout[area] ?? [])];
  }

  const from = next[fromArea];
  if (!from) {
    return layout;
  }

  const removeAt = Math.min(
    Math.max(fromIndex, 0),
    Math.max(from.length - 1, 0)
  );
  const [removed] = from.splice(removeAt, 1);

  // Index yang dikasih pemanggil bisa sudah basi (layout berubah di tengah
  // drag, atau daftar lebih pendek dari dugaan). Kalau isi slot itu bukan
  // widget yang diminta, jangan pindahkan apa pun — lebih baik no-op daripada
  // diam-diam memindahkan widget yang salah.
  if (removed !== widgetId) {
    return layout;
  }

  const to = next[toArea] ?? (next[toArea] = []);
  to.splice(Math.min(Math.max(toIndex, 0), to.length), 0, removed);

  return next;
}

/** Widget tersembunyi: map absen / true = tampil; hanya `false` yang menyembunyikan. */
export function isWidgetVisible(
  widgetId: string,
  visibility: Record<string, boolean> | null | undefined
): boolean {
  return !(visibility && visibility[widgetId] === false);
}

// ---------------------------------------------------------------------------
// Self-check: `tsc resolve-layout.ts --outDir /tmp/...` lalu `node ...js`.
// Dijalankan lewat `npm run test:merge`. Tidak dieksekusi saat di-import app.
// ---------------------------------------------------------------------------
function check(name: string, cond: boolean) {
  if (!cond) {
    console.error(`FAIL: ${name}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${name}`);
  }
}

const W = (id: string, area: string, position?: number): ResolvableWidget => ({
  id,
  area,
  position,
});

function run() {
  const BASE = ["summary", "main", "side"];

  // 1. sanitizeLayout
  check("sanitize: null -> null", sanitizeLayout(null) === null);
  check("sanitize: array -> null", sanitizeLayout([]) === null);
  check("sanitize: angka -> null", sanitizeLayout(42) === null);
  check("sanitize: {} -> null", sanitizeLayout({}) === null);
  check(
    "sanitize: area bukan array dibuang",
    sanitizeLayout({ a: "x", b: ["w"] })?.a === undefined
  );
  check(
    "sanitize: id non-string dibuang",
    sanitizeLayout({ a: [1, "w", null] })?.a.join() === "w"
  );

  // 2. resolveAreas
  const areas = resolveAreas(BASE, [W("q", "quotes-4")], { "orphan-6": [] });
  check("areas: 3 base + katalog + layout = 5", areas.length === 5);
  check(
    "areas: base urut di depan",
    areas.join() === "summary,main,side,quotes-4,orphan-6"
  );
  check(
    "areas: tanpa layout = 4",
    resolveAreas(BASE, [W("q", "quotes-4")], null).length === 4
  );
  check(
    "areas: tanpa widget/layout = base",
    resolveAreas(BASE, [], null).join() === "summary,main,side"
  );

  // 3. layout null -> default area, urut position
  const widgets = [W("b", "side", 2), W("a", "side", 1), W("c", "main", 1)];
  const def = resolveDashboardLayout(null, widgets, BASE);
  check("null: main = [c]", def.main.map((w) => w.id).join() === "c");
  check(
    "null: side = [a,b] (urut position)",
    def.side.map((w) => w.id).join() === "a,b"
  );
  check("null: summary kosong", def.summary.length === 0);

  // 4. reorder + pindah area
  const moved = resolveDashboardLayout(
    { summary: ["a"], main: ["c", "b"], side: [] },
    widgets,
    BASE
  );
  check(
    "reorder: summary = [a]",
    moved.summary.map((w) => w.id).join() === "a"
  );
  check("reorder: main = [c,b]", moved.main.map((w) => w.id).join() === "c,b");
  check("reorder: side kosong = 0", moved.side.length === 0);

  // 5. fallback: widget tak ditempatkan -> area default
  const partial = resolveDashboardLayout({ main: ["c"] }, widgets, BASE);
  check(
    "fallback: side dapat a,b urut position",
    partial.side.map((w) => w.id).join() === "a,b"
  );

  // 6. ghost: id tak dikenal -> skip, dan tidak=WYSIWYG fallback
  const ghost = resolveDashboardLayout(
    { side: ["ghost", "a"], summary: [] },
    widgets,
    BASE
  );
  check("ghost: ghost di-skip", !ghost.side.some((w) => w.id === "ghost"));
  check(
    "ghost: a,b tetap lengkap",
    ghost.side.map((w) => w.id).join() === "a,b"
  );

  // 7. layout rusak -> default, bukan crash
  const broken = resolveDashboardLayout("nonsense", widgets, BASE);
  check(
    "rusak: string -> default",
    broken.side.map((w) => w.id).join() === "a,b"
  );
  const brokenArea = resolveDashboardLayout(
    { side: 5, main: ["c"] },
    widgets,
    BASE
  );
  check(
    "rusak: area non-array -> default",
    brokenArea.side.map((w) => w.id).join() === "a,b"
  );

  // 8. id duplikat dalam satu area -> render sekali
  const dup = resolveDashboardLayout({ side: ["a", "a", "b"] }, widgets, BASE);
  check("duplikat: a,b (a sekali)", dup.side.map((w) => w.id).join() === "a,b");

  // 9. area katalog baru
  const custom = resolveDashboardLayout(
    null,
    [...widgets, W("q", "quotes-4")],
    BASE
  );
  check("area katalog: ikut dirender", Object.keys(custom).length === 3);

  // 10. layout kosong semua area -> semua widget fallback ke default
  const emptied = resolveDashboardLayout(
    { summary: [], main: [], side: [] },
    widgets,
    BASE
  );
  check(
    "semua kosong: widget balik ke default",
    emptied.side.map((w) => w.id).join() === "a,b"
  );

  // 11. visibility
  check("visi: null = tampil", isWidgetVisible("a", null));
  check("visi: true = tampil", isWidgetVisible("a", { a: true }));
  check("visi: false = sembunyi", !isWidgetVisible("a", { a: false }));
  check("visi: absen = tampil", isWidgetVisible("z", { a: false }));

  // 12. moveWidget
  const L: DashboardLayout = { summary: ["a", "b"], main: ["c"], side: [] };
  const mv1 = moveWidget(L, "a", "summary", 0, "summary", 1, BASE);
  check("move: reorder a ke belakang b", mv1.summary.join() === "b,a");
  check("move: input tidak dimutasi", L.summary.join() === "a,b");
  const mv2 = moveWidget(L, "a", "summary", 0, "main", 0, BASE);
  check(
    "move: pindah area",
    mv2.summary.join() === "b" && mv2.main.join() === "a,c"
  );
  // Indeks di-clamp ke batas daftar: "b" di slot 1, dipanggil dengan index 99
  // -> clamp ke 1, isinya cocok, jadi dipindah ke summary index 0.
  const mv3 = moveWidget(L, "b", "summary", 99, "summary", 0, BASE);
  check("move: indeks di-clamp ke slot terakhir", mv3.summary.join() === "b,a");
  check("move: input tetap tidak dimutasi", L.summary.join() === "a,b");
  const mv4 = moveWidget(L, "a", "tidak-ada", 0, "main", 0, BASE);
  check("move: area asal tak dikenal -> no-op", mv4 === L);
  const mv5 = moveWidget(L, "zzz", "summary", 0, "main", 0, BASE);
  check("move: id tak dikenal -> no-op", mv5 === L);
  const mv6 = moveWidget(L, "c", "main", 0, "main", 99, BASE);
  check("move: tujuan indeks di-clamp", mv6.main.join() === "c");
  const mv7 = moveWidget(L, "b", "summary", 99, "main", 0, BASE);
  check(
    "move: index basi tapi slot = id -> tetap jalan",
    mv7.summary.join() === "a" && mv7.main.join() === "b,c"
  );
  const mv8 = moveWidget(L, "c", "summary", 0, "main", 0, BASE);
  check("move: index basi, slot berisi widget lain -> no-op", mv8 === L);

  console.log(process.exitCode ? "RESULT: ada FAIL" : "RESULT: semua pass");
}

if (
  typeof window === "undefined" &&
  typeof process !== "undefined" &&
  /resolve-layout\.(js|mjs|cjs)$/.test(process.argv[1] ?? "")
) {
  run();
}
