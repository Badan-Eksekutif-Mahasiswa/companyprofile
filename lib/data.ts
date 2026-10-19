/**
 * Data access layer untuk beranda (proker, statistik, berita).
 * Proker, jumlah proker, dan jumlah fungsionaris dibaca dari kabinet terbit di SIT
 * (lib/kabinet.ts); berita memakai sumber yang sama dengan halaman /news. data/*.json
 * hanya untuk pengembangan lokal, tidak dibaca pada deployment produksi.
 */
import "server-only";
import { readDemoJson } from "@/lib/demo-data";
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
  return (readDemoJson<Proker[]>("proker.json") ?? []).flatMap((p) => {
    const foto_url = p.foto_url || p.dokumentasi[0]?.url;
    const u = unit.get(p.divisi);
    if (!foto_url || !u) return [];
    return [{ ...p, foto_url, unit: { slug: u.slug, nama: u.nama, singkatan: u.singkatan, type: unitType(u) } }];
  });
}

/** Random sample without replacement; each eligible program has an equal chance. */
export function pickFeaturedProker(all: HeroProker[], limit: number): HeroProker[] {
  const pool = [...new Map(all.filter((program) => program.foto_url).map((program) => [program.slug, program])).values()];
  const count = Number.isFinite(limit) ? Math.min(pool.length, Math.max(0, Math.floor(limit))) : 0;
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export async function getStats(): Promise<Stats> {
  const local = readDemoJson<Stats>("stats.json") ?? { mahasiswa_terwakili: 0, proker_aktif: 0, fungsionaris: 0 };
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
