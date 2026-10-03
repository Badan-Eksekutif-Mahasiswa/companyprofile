/**
 * Data access layer untuk beranda (proker, statistik, berita).
 * Data kabinet & divisi ada di lib/kabinet.ts (dikelola tim kabinet).
 *
 * v1: baca flat JSON di /data. v2: ganti isi fungsi di sini dengan fetch ke SIT API;
 * komponen UI tidak perlu diubah (PRD 6.6).
 */
import "server-only";
import prokerJson from "@/data/proker.json";
import statsJson from "@/data/stats.json";
import newsJson from "@/data/news.json";
import { getAllDivisi } from "@/lib/kabinet";
import { unitType } from "@/lib/unit";
import type { Artikel, HeroProker, Proker, Stats } from "@/types";

/** Semua proker yang punya sampul, lengkap dengan unit pemiliknya, untuk hero orbit. */
export async function getHeroProker(): Promise<HeroProker[]> {
  const unit = new Map(getAllDivisi().map((d) => [d.slug, d]));
  return (prokerJson as Proker[]).flatMap((p) => {
    const foto_url = p.foto_url || p.dokumentasi[0]?.url;
    const u = unit.get(p.divisi);
    if (!foto_url || !u) return [];
    return [{ ...p, foto_url, unit: { slug: u.slug, nama: u.nama, singkatan: u.singkatan, type: unitType(u) } }];
  });
}

/**
 * Proker unggulan yang tampil di orbit (maks. `limit`). Sementara dipilih bergiliran per divisi
 * agar beragam; rotasi harian nanti cukup mengganti isi fungsi ini (mis. dari SIT).
 */
export function pickFeaturedProker(all: HeroProker[], limit: number): HeroProker[] {
  const byUnit = new Map<string, HeroProker[]>();
  for (const p of all) byUnit.set(p.unit.slug, [...(byUnit.get(p.unit.slug) ?? []), p]);
  const queues = [...byUnit.values()];
  const out: HeroProker[] = [];
  for (let round = 0; out.length < limit && queues.some((q) => q.length > round); round++) {
    for (const q of queues) if (q[round] && out.length < limit) out.push(q[round]);
  }
  return out;
}

export async function getStats(): Promise<Stats> {
  return statsJson as Stats;
}

/** v1: JSON lokal. v2: query tabel artikel di Supabase (PRD 7). */
export async function getLatestNews(limit = 3): Promise<Artikel[]> {
  return (newsJson as Artikel[])
    .slice()
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    .slice(0, limit);
}
