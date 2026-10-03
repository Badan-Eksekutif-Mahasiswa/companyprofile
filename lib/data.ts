/**
 * Data access layer.
 * v1: baca flat JSON di /data. v2: ganti isi fungsi di sini dengan fetch ke SIT API;
 * komponen UI tidak perlu diubah (PRD 6.6).
 */
import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import strukturJson from "@/data/struktur.json";
import statsJson from "@/data/stats.json";
import kabinetJson from "@/data/kabinet.json";
import newsJson from "@/data/news.json";
import type { Artikel, Divisi, HeroProker, Kabinet, Stats, StrukturItem } from "@/types";

const DIVISI_DIR = path.join(process.cwd(), "data", "divisi");

export async function getStruktur(): Promise<StrukturItem[]> {
  return strukturJson as StrukturItem[];
}

export async function getDivisi(slug: string): Promise<Divisi | null> {
  const struktur = await getStruktur();
  if (!struktur.some((s) => s.slug === slug)) return null;
  const raw = await fs.readFile(path.join(DIVISI_DIR, `${slug}.json`), "utf8");
  return JSON.parse(raw) as Divisi;
}

export async function getAllDivisi(): Promise<Divisi[]> {
  const struktur = await getStruktur();
  const all = await Promise.all(struktur.map((s) => getDivisi(s.slug)));
  return all.filter((d): d is Divisi => d !== null);
}

/** Semua proker yang punya foto, untuk hero orbit beranda. */
export async function getHeroProker(): Promise<HeroProker[]> {
  const divisi = await getAllDivisi();
  return divisi.flatMap((d) =>
    d.proker
      .map((p) => ({ ...p, foto_url: p.foto_url || p.dokumentasi[0]?.url || "" }))
      .filter((p) => p.foto_url)
      .map((p) => ({ ...p, divisi: { nama: d.nama, slug: d.slug, singkatan: d.singkatan, type: d.type } })),
  );
}

export async function getStats(): Promise<Stats> {
  return statsJson as Stats;
}

export async function getKabinet(): Promise<Kabinet> {
  return kabinetJson as Kabinet;
}

/** v1: JSON lokal. v2: query tabel artikel di Supabase (PRD 7). */
export async function getLatestNews(limit = 3): Promise<Artikel[]> {
  return (newsJson as Artikel[])
    .slice()
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    .slice(0, limit);
}
