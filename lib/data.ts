/**
 * Data access layer untuk beranda (proker, statistik, berita).
 * Proker, jumlah proker, dan jumlah fungsionaris dibaca dari kabinet terbit di SIT
 * (lib/kabinet.ts); berita memakai sumber yang sama dengan halaman /news. data/*.json
 * hanya cadangan selama SIT belum dikonfigurasi atau belum ada yang terbit.
 */
import "server-only";
import prokerJson from "@/data/proker.json";
import statsJson from "@/data/stats.json";
import { getAllDivisi, getSitHeroProker, getSitStatistics } from "@/lib/kabinet";
import { getNewsArticles } from "@/lib/news-data";
import type { NewsCategory } from "@/lib/news";
import { unitType } from "@/lib/unit";
import type { Artikel, HeroProker, KategoriArtikel, Proker, Stats } from "@/types";

/** Semua proker yang punya sampul, lengkap dengan unit pemiliknya, untuk hero orbit. */
export async function getHeroProker(): Promise<HeroProker[]> {
  const sit = await getSitHeroProker(unitType);
  if (sit) return sit;
  const unit = new Map((await getAllDivisi()).map((d) => [d.slug, d]));
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
  const local = statsJson as Stats;
  const stats = await getSitStatistics();
  if (!stats) return local;
  return { mahasiswa_terwakili: stats.represented_students ?? 0,
    proker_aktif: stats.active_programs ?? 0, fungsionaris: stats.people };
}

const KATEGORI: Record<NewsCategory, KategoriArtikel> = {
  "kajian-strategis": "Kajian Strategis",
  "siaran-pers": "Siaran Pers",
  "opini-artikel": "Opini & Artikel",
  "kabar-ui": "Kabar UI",
};

/** Berita terbaru dari sumber yang sama dengan halaman /news (SIT, Supabase, atau contoh). */
export async function getLatestNews(limit = 3): Promise<Artikel[]> {
  return (await getNewsArticles()).slice(0, limit).map((a) => ({
    slug: a.slug,
    judul: a.judul,
    kategori: KATEGORI[a.kategori],
    tanggal: a.tanggal,
    excerpt: a.excerpt,
    tags: a.tag,
    thumbnail_url: a.heroImage ?? `/api/placeholder?label=${encodeURIComponent(a.judul.slice(0, 24).toUpperCase())}&w=1200&h=900&tone=navy&sub=BERITA`,
  }));
}
