import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { readDemoJson } from "@/lib/demo-data";
import portraits from "@/config/leader-portraits.json";
import { fetchSitCabinet, fetchSitUnits, toDivisi, toHeroProker, toKabinet, type ApiCabinet } from "@/lib/kabinet-api";
import type { HeroProker } from "@/types";

export type Media = { url: string; alt: string; /** Opsional: judul & deskripsi (mis. program kerja) yang tampil sebagai caption. */ title?: string; desc?: string; prokerSlug?: string };

export type Section =
  | { type: "media-single"; position?: "left" | "center" | "right"; media: Media }
  | { type: "media-duo"; media_left: Media; media_right: Media }
  | { type: "media-trio"; media_1: Media; media_2: Media; media_3: Media }
  | { type: "text-block"; subtitle?: string; content: string[] };

export type Person = { nama: string; jabatan: string; foto: Media; fotos?: Media[]; jurusanAngkatan?: string };

export type Divisi = {
  order: number;
  slug: string;
  title: string;
  nama: string;
  singkatan: string;
  tagline: string;
  year?: string;
  categories: { name: string; slug: string }[];
  roles: string[];
  description: string;
  visi: string;
  misi: string[];
  /** Pengurus inti departemen (per individu). */
  bph: Person[];
  /** Staf departemen (per individu). */
  staff: Person[];
  cover: Media;
  logo: Media;
  /** Foto BPH (pengurus inti) departemen — dipakai di kartu grid /kabinet. */
  foto_bph: Media;
  sections: Section[];
  collaborators?: { name: string; role: string }[];
  highlights?: { title: string; date: string; image: string }[];
};

export type Tokoh = {
  nama: string;
  jabatan: string;
  fakultas: string;
  kutipan: string;
  foto: Media;
  fotos?: (Media & { scale?: number })[];
};

export type Kabinet = {
  nama: string;
  periode?: string;
  deskripsi: string;
  visi: string;
  /** `teks` boleh memuat **frasa kunci**; `kunci` = satu kata untuk tampilan tipografi besar. */
  misi: { teks: string; kunci: string }[];
  ketua: Tokoh;
  wakil: Tokoh;
  pengurusInti?: Person[];
  stats: { divisi: number; anggota: number; proker: number; fakultas: number };
  proker: { divisi: string; title: string; date: string; image: string }[];
};

const DATA = path.join(process.cwd(), "data");

/**
 * Published CMS data is authoritative. Demo fixtures are available only during local development.
 */
const getSitCabinet = cache(async (): Promise<ApiCabinet | null> => {
  try {
    return await fetchSitCabinet();
  } catch (e) {
    console.error("Data kabinet SIT gagal dimuat:", e);
    return null;
  }
});

function localDivisi(): Divisi[] {
  if (process.env.NODE_ENV !== "development" || process.env.ENABLE_DEMO_DATA === "false" || !fs.existsSync(path.join(DATA, "divisi"))) return [];
  return fs
    .readdirSync(path.join(DATA, "divisi"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => readDemoJson<Divisi>(`divisi/${f}`)!)
    .sort((a, b) => a.order - b.order);
}

export async function getKabinet(): Promise<Kabinet | null> {
  const sit = await getSitCabinet();
  if (sit) return toKabinet(sit, portraits.ketua, portraits.wakil);
  return process.env.SIT_API_URL ? null : readDemoJson<Kabinet>("kabinet.json") ?? null;
}

export async function getAllDivisi(): Promise<Divisi[]> {
  const sit = await getSitCabinet();
  if (sit) return sit.units.map((u, i) => toDivisi(u, i + 1, sit.name));
  try {
    const units = await fetchSitUnits();
    if (units !== null) return units.map((unit, index) => toDivisi(unit, index + 1, ""));
  } catch {
    console.error("Daftar birdep SIT gagal dimuat.");
    return [];
  }
  return localDivisi();
}

export async function getDivisi(slug: string): Promise<Divisi | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  return (await getAllDivisi()).find((d) => d.slug === slug) ?? null;
}

/** Divisi berikutnya (melingkar) untuk bagian "Divisi Selanjutnya". */
export async function getNextDivisi(slug: string): Promise<Divisi | null> {
  const all = await getAllDivisi();
  const i = all.findIndex((d) => d.slug === slug);
  return i === -1 || all.length < 2 ? null : all[(i + 1) % all.length];
}

/** true bila data kabinet berasal dari SIT, bukan dari data/*.json. */
export async function isSitCabinetLive(): Promise<boolean> {
  return (await getSitCabinet()) !== null;
}

export async function getSitStatistics(): Promise<ApiCabinet["statistics"] | null> {
  return (await getSitCabinet())?.statistics ?? null;
}

/** Proker beranda dari SIT; null berarti pakai data/proker.json. */
export async function getSitHeroProker(unitType: Parameters<typeof toHeroProker>[1]): Promise<HeroProker[] | null> {
  const sit = await getSitCabinet();
  if (sit) return toHeroProker(sit, unitType);
  try {
    const units = await fetchSitUnits();
    return units === null ? null : toHeroProker({ units }, unitType);
  } catch {
    console.error("Daftar program kerja SIT gagal dimuat.");
    return [];
  }
}

/** Buang penanda **frasa kunci** → teks biasa. */
export const plain = (s: string) => s.replace(/\*\*/g, "");
