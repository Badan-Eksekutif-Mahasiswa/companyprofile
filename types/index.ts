export type UnitType = "BPH" | "Kemenkoan" | "Departemen" | "Biro";

export type ProkerStatus = "upcoming" | "ongoing" | "done";

export interface StrukturItem {
  nama: string;
  slug: string;
  singkatan: string;
  type: UnitType;
  deskripsi_singkat: string;
}

export interface Anggota {
  nama: string;
  jabatan: string;
  foto_url: string;
  linkedin: string;
}

/** Foto dokumentasi proker. Selalu rasio 4:3 (landscape), mis. 1200×900. */
export interface Dokumentasi {
  url: string;
  caption: string;
}

/**
 * Program kerja. Data ini nantinya dikelola lewat CRUD di sistem terpisah (SIT),
 * website ini hanya membaca.
 */
export interface Proker {
  slug: string;
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

export interface Divisi {
  nama: string;
  slug: string;
  singkatan: string;
  type: UnitType;
  cover_url: string;
  deskripsi: string;
  visi: string;
  misi: string[];
  tupoksi: string[];
  anggota: Anggota[];
  proker: Proker[];
}

/** Proker yang tampil di hero orbit, lengkap dengan unit pemiliknya. */
export interface HeroProker extends Proker {
  foto_url: string;
  divisi: Pick<StrukturItem, "nama" | "slug" | "singkatan" | "type">;
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

export interface Kabinet {
  nama_kabinet: string;
  tagline: string;
  deskripsi: string;
  visi: string;
  misi: string[];
  nilai_utama: string[];
  filosofi_logo: string;
  foto_logo_url: string;
  kata_kabem: { kutipan: string; nama: string; jabatan: string; foto_url: string };
}

export interface Stats {
  mahasiswa_terwakili: number;
  proker_aktif: number;
  fungsionaris: number;
}
