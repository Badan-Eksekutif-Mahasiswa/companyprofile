import type { Divisi } from "@/types";

/**
 * Loader divisi di sisi klien. Tiap file JSON menjadi chunk terpisah,
 * jadi data divisi baru diunduh saat pertama kali dibuka lalu di-cache.
 * v2: ganti dengan fetch ke SIT API.
 */
const cache = new Map<string, Promise<Divisi>>();

export function loadDivisi(slug: string): Promise<Divisi> {
  let p = cache.get(slug);
  if (!p) {
    p = import(`@/data/divisi/${slug}.json`).then((m) => m.default as Divisi);
    p.catch(() => cache.delete(slug));
    cache.set(slug, p);
  }
  return p;
}
