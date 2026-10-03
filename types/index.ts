export type ProkerStatus = "upcoming" | "ongoing" | "done";

/** Jenis unit; diturunkan dari data divisi (lihat lib/unit.ts). */
export type UnitType = "BPH" | "Departemen" | "Biro";

/** Foto dokumentasi proker. Selalu rasio 4:3 (landscape), mis. 1200×900. */
export interface Dokumentasi {
  url: string;
  caption: string;
}

/**
 * Program kerja. Data ini nantinya dikelola lewat CRUD di sistem terpisah (SIT),
 * website ini hanya membaca. `divisi` mengacu ke `slug` di data/divisi/*.json.
 */
export interface Proker {
  slug: string;
  divisi: string;
  nama: string;
  status: ProkerStatus;
  /** Ringkasan satu kalimat (dipakai di list). */
  deskripsi: string;
  /** Penjelasan lengkap, satu string per paragraf. */
  penjelasan: string[];
  tanggal?: string;
  /** Foto sampul 4:3. Bila kosong, pakai dokumentasi[0]. */
  foto_url?: string;
  dokumentasi: Dokumentasi[];
}

/** Ringkasan divisi untuk sisi belakang kartu proker di hero (dikirim dari server). */
export interface DivisiSummary {
  slug: string;
  nama: string;
  singkatan: string;
  type: UnitType;
  description: string;
  visi: string;
  misi: string[];
  pengurus: { nama: string; jabatan: string; foto: string }[];
  stafCount: number;
}

/** Proker yang tampil di hero orbit, lengkap dengan unit pemiliknya. */
export interface HeroProker extends Proker {
  foto_url: string;
  unit: Pick<DivisiSummary, "slug" | "nama" | "singkatan" | "type">;
}

export type KategoriArtikel = "Kajian Strategis" | "Siaran Pers" | "Opini & Artikel" | "Kabar UI";

export interface Artikel {
  slug: string;
  judul: string;
  kategori: KategoriArtikel;
  /** ISO date, contoh "2026-03-15" */
  tanggal: string;
  excerpt: string;
  tags: string[];
  thumbnail_url: string;
}

export interface Stats {
  mahasiswa_terwakili: number;
  proker_aktif: number;
  fungsionaris: number;
}
