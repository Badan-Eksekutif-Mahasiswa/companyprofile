import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { fetchSitCabinet, toDivisi, toHeroProker, toKabinet, type ApiCabinet } from "@/lib/kabinet-api";
import type { HeroProker } from "@/types";

export type Media = { url: string; alt: string; /** Opsional: judul & deskripsi (mis. program kerja) yang tampil sebagai caption. */ title?: string; desc?: string };

export type Section =
  | { type: "media-single"; position?: "left" | "center" | "right"; media: Media }
  | { type: "media-duo"; media_left: Media; media_right: Media }
  | { type: "media-trio"; media_1: Media; media_2: Media; media_3: Media }
  | { type: "text-block"; subtitle?: string; content: string[] };

export type Person = { nama: string; jabatan: string; foto: Media };

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
  stats: { divisi: number; anggota: number; proker: number; fakultas: number };
  proker: { divisi: string; title: string; date: string; image: string }[];
};

const DATA = path.join(process.cwd(), "data");

const readJson = <T,>(file: string): T => JSON.parse(fs.readFileSync(path.join(DATA, file), "utf8")) as T;

/**
 * Sumber data: kabinet terbit di CMS SIT (SIT_API_URL). data/*.json hanya cadangan placeholder
 * selama SIT belum dikonfigurasi, belum ada kabinet yang terbit, atau API sedang gagal, agar
 * halaman tetap tampil. Struktur birdep SIT berbeda dari placeholder, jadi keduanya tidak dicampur.
 */
const getSitCabinet = cache(async (): Promise<ApiCabinet | null> => {
  try {
    return await fetchSitCabinet();
  } catch (e) {
    console.error("Data kabinet SIT gagal dimuat, memakai data/*.json:", e);
    return null;
  }
});

function localDivisi(): Divisi[] {
  return fs
    .readdirSync(path.join(DATA, "divisi"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson<Divisi>(`divisi/${f}`))
    .sort((a, b) => a.order - b.order);
}

export async function getKabinet(): Promise<Kabinet> {
  const local = readJson<Kabinet>("kabinet.json");
  const sit = await getSitCabinet();
  return sit ? toKabinet(sit) : local;
}

export async function getAllDivisi(): Promise<Divisi[]> {
  const sit = await getSitCabinet();
  return sit ? sit.units.map((u, i) => toDivisi(u, i + 1, sit.name)) : localDivisi();
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
  return sit ? toHeroProker(sit, unitType) : null;
}

/** Buang penanda **frasa kunci** → teks biasa. */
export const plain = (s: string) => s.replace(/\*\*/g, "");
