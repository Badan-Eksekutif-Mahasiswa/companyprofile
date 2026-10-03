import fs from "node:fs";
import path from "node:path";

export type Media = { url: string; alt: string };

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
  year: string;
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
  periode: string;
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

export function getKabinet(): Kabinet {
  return readJson<Kabinet>("kabinet.json");
}

export function getAllDivisi(): Divisi[] {
  return fs
    .readdirSync(path.join(DATA, "divisi"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson<Divisi>(`divisi/${f}`))
    .sort((a, b) => a.order - b.order);
}

export function getDivisi(slug: string): Divisi | null {
  const file = path.join(DATA, "divisi", `${slug}.json`);
  if (!/^[a-z0-9-]+$/.test(slug) || !fs.existsSync(file)) return null;
  return readJson<Divisi>(`divisi/${slug}.json`);
}

/** Divisi berikutnya (melingkar) untuk bagian "Divisi Selanjutnya". */
export function getNextDivisi(slug: string): Divisi | null {
  const all = getAllDivisi();
  const i = all.findIndex((d) => d.slug === slug);
  return i === -1 || all.length < 2 ? null : all[(i + 1) % all.length];
}

/** Buang penanda **frasa kunci** → teks biasa. */
export const plain = (s: string) => s.replace(/\*\*/g, "");
