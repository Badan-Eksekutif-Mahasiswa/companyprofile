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
  /** Kosong bila sumbernya SIT, yang belum menyimpan status proker. */
  status?: ProkerStatus;
  /** Ringkasan satu kalimat (dipakai di list). */
  deskripsi: string;
  /** Penjelasan lengkap, satu string per paragraf. */
  penjelasan: string[];
  tanggal?: string;
  /** Sampul kartu, rasio 1.4:1.9 (sama dengan kartu detail kabinet). Bila kosong, pakai dokumentasi[0]. */
  foto_url?: string;
  dokumentasi: Dokumentasi[];
}

/** Proker yang tampil di hero orbit, lengkap dengan unit pemiliknya. */
export interface HeroProker extends Proker {
  foto_url: string;
  unit: { slug: string; nama: string; singkatan: string; type: UnitType };
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
