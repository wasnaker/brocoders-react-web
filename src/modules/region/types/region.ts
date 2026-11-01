// Province — wilayah level 1 di Indonesia
export interface Province {
  id: number | string;
  name: string;
  isoCode: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
}

// Regency — wilayah level 2 (kabupaten / kota), child dari Province
export interface Regency {
  id: number | string;
  provinceId: number | string;
  name: string;
  type: "kabupaten" | "kota";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const REGENCY_TYPES = [
  { value: "kabupaten" as const, label: "Kabupaten" },
  { value: "kota" as const, label: "Kota" },
];
