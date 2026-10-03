import type { Divisi } from "@/lib/kabinet";

/**
 * Loader detail divisi di klien (hero beranda). Diunduh saat pertama dibutuhkan lalu di-cache.
 * v2: ganti URL ke endpoint SIT.
 */
const cache = new Map<string, Promise<Divisi>>();

export function loadDivisi(slug: string): Promise<Divisi> {
  let p = cache.get(slug);
  if (!p) {
    p = fetch(`/api/divisi/${slug}`).then((r) => {
      if (!r.ok) throw new Error(`Gagal memuat divisi ${slug}`);
      return r.json() as Promise<Divisi>;
    });
    p.catch(() => cache.delete(slug));
    cache.set(slug, p);
  }
  return p;
}
