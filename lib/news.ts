export type NewsCategory = "kajian-strategis" | "siaran-pers" | "opini-artikel" | "kabar-ui";

export const NEWS_CATEGORIES: { value: NewsCategory; label: string }[] = [
  { value: "kajian-strategis", label: "Kajian Strategis" },
  { value: "siaran-pers", label: "Siaran Pers" },
  { value: "opini-artikel", label: "Opini & Artikel" },
  { value: "kabar-ui", label: "Kabar UI" },
];

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/media";

export interface NewsArticle {
  slug: string;
  judul: string;
  kategori: NewsCategory;
  
  tag: string[];
  tanggal: string;
  penulis: string;
  estimasiBaca: number;
  excerpt: string;
  heroImage?: string;
  /** Keterangan di bawah hero image. */
  caption?: string;
  /** Isi artikel sebagai blok terstruktur (aman disimpan di database/JSON, tanpa HTML mentah). */
  body: NewsBlock[];
  /** Kosong = pakai judul/excerpt artikel. */
  seo?: { title?: string; description?: string; ogImage?: string };
}

export type NewsBlock =
  | { type: "p"; text: string }
  | { type: "h2" | "h3"; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "ul" | "ol"; items: string[] };

export function isNewsCategory(value: string | null | undefined): value is NewsCategory {
  return NEWS_CATEGORIES.some((c) => c.value === value);
}

export function categoryLabel(value: NewsCategory): string {
  return NEWS_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export const tagKey = (tag: string) => tag.trim().toLowerCase();

export function formatTanggal(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export interface NewsFilters {
  kategori?: NewsCategory | null;
  /** Kunci tag (huruf kecil). */
  tag?: string | null;
  q?: string;
}

export function filterArticles(articles: NewsArticle[], { kategori, tag, q }: NewsFilters): NewsArticle[] {
  const needle = q?.trim().toLowerCase();
  return articles.filter((a) => {
    if (kategori && a.kategori !== kategori) return false;
    if (tag && !a.tag.some((t) => tagKey(t) === tag)) return false;
    if (needle && !(a.judul.toLowerCase().includes(needle) || a.excerpt.toLowerCase().includes(needle))) {
      return false;
    }
    return true;
  });
}

export interface TagCount {
  key: string;
  label: string;
  count: number;
}

export function collectTags(articles: NewsArticle[]): TagCount[] {
  const map = new Map<string, TagCount>();
  for (const a of articles) {
    for (const t of a.tag) {
      const key = tagKey(t);
      const cur = map.get(key);
      if (cur) cur.count += 1;
      else map.set(key, { key, label: t, count: 1 });
    }
  }
  return [...map.values()].sort((x, y) => y.count - x.count || x.label.localeCompare(y.label));
}

const dummyBody = (excerpt: string): NewsBlock[] => [
  { type: "p", text: excerpt },
  { type: "p", text: "Paragraf pembuka placeholder. Ganti dengan isi artikel asli dari sistem internal. Teks ini hanya untuk menguji ukuran huruf, tinggi baris, dan lebar kolom baca." },
  { type: "h2", text: "Latar Belakang" },
  { type: "p", text: "Paragraf placeholder kedua. Isi artikel dapat memuat teks tebal atau miring, dan dipecah menjadi beberapa paragraf agar nyaman dibaca di layar kecil." },
  { type: "quote", text: "Kutipan placeholder untuk menguji tampilan blockquote.", cite: "Narasumber" },
  { type: "h2", text: "Temuan Utama" },
  { type: "ul", items: ["Poin pertama placeholder", "Poin kedua placeholder", "Poin ketiga placeholder"] },
  { type: "h3", text: "Langkah Tindak Lanjut" },
  { type: "ol", items: ["Langkah pertama placeholder", "Langkah kedua placeholder"] },
  { type: "p", text: "Paragraf penutup placeholder." },
];

type DummyInput = Omit<NewsArticle, "body" | "caption">;
const DUMMY_INPUT: DummyInput[] = [
  {
    slug: "analisis-kritis-kebijakan-ukt-baru",
    judul: "Analisis Kritis Kebijakan UKT Baru: Menuju Pendidikan yang Berkeadilan",
    kategori: "kajian-strategis",
    tag: ["UKT", "Advokasi"],
    tanggal: "2026-03-15",
    penulis: "Nama Penulis",
    estimasiBaca: 8,
    excerpt:
      "Pemaparan komprehensif mengenai dampak struktur Uang Kuliah Tunggal terbaru terhadap aksesibilitas mahasiswa baru dan keluarga mereka.",
  },
  {
    slug: "pernyataan-sikap-isu-lingkungan-kampus",
    judul: "Pernyataan Sikap BEM UI Terkait Isu Lingkungan Kampus",
    kategori: "siaran-pers",
    tag: ["FasilitasKampus", "Advokasi"],
    tanggal: "2026-03-12",
    penulis: "Nama Penulis",
    estimasiBaca: 4,
    excerpt: "Ringkasan sikap resmi BEM UI beserta tuntutan dan langkah tindak lanjut yang diajukan.",
  },
  {
    slug: "evaluasi-transportasi-internal-semester-ganjil",
    judul: "Evaluasi Kinerja Fasilitas Transportasi Internal UI Semester Ganjil",
    kategori: "kabar-ui",
    tag: ["TransportasiUI", "FasilitasKampus"],
    tanggal: "2026-03-10",
    penulis: "Nama Penulis",
    estimasiBaca: 5,
    excerpt: "Catatan evaluasi layanan transportasi internal kampus berdasarkan masukan mahasiswa.",
  },
  {
    slug: "urgensi-ruang-aman-lingkungan-akademik",
    judul: "Urgensi Ruang Aman di Lingkungan Akademik",
    kategori: "opini-artikel",
    tag: ["KekerasanSeksual", "Advokasi"],
    tanggal: "2026-03-08",
    penulis: "Nama Penulis",
    estimasiBaca: 6,
    excerpt: "Opini tentang pentingnya ruang aman dan mekanisme pelaporan yang dipercaya mahasiswa.",
  },
  {
    slug: "dampak-digitalisasi-birokrasi-kemahasiswaan",
    judul: "Dampak Digitalisasi Birokrasi Kemahasiswaan",
    kategori: "kajian-strategis",
    tag: ["Advokasi", "FasilitasKampus"],
    tanggal: "2026-03-05",
    penulis: "Nama Penulis",
    estimasiBaca: 9,
    excerpt: "Kajian awal tentang efektivitas layanan digital kemahasiswaan dan celah yang perlu dibenahi.",
  },
  {
    slug: "pembaruan-layanan-kesehatan-mahasiswa",
    judul: "Pembaruan Layanan Kesehatan Mahasiswa di Lingkungan Kampus",
    kategori: "kabar-ui",
    tag: ["FasilitasKampus"],
    tanggal: "2026-03-01",
    penulis: "Nama Penulis",
    estimasiBaca: 3,
    excerpt: "Informasi terbaru mengenai layanan kesehatan yang dapat diakses mahasiswa.",
  },
  {
    slug: "hasil-audiensi-direktorat-kemahasiswaan",
    judul: "Hasil Audiensi dengan Direktorat Kemahasiswaan",
    kategori: "siaran-pers",
    tag: ["UKT", "BeasiswaUI"],
    tanggal: "2026-02-28",
    penulis: "Nama Penulis",
    estimasiBaca: 4,
    excerpt: "Poin-poin hasil audiensi dan komitmen tindak lanjut yang disepakati.",
  },
  {
    slug: "catatan-skema-beasiswa-dan-keringanan-ukt",
    judul: "Catatan atas Skema Beasiswa dan Keringanan UKT",
    kategori: "opini-artikel",
    tag: ["UKT", "BeasiswaUI"],
    tanggal: "2026-02-24",
    penulis: "Nama Penulis",
    estimasiBaca: 7,
    excerpt: "Tinjauan singkat atas skema bantuan biaya pendidikan dan kelompok yang belum terjangkau.",
  },
  {
    slug: "kajian-awal-keselamatan-rute-transportasi",
    judul: "Kajian Awal Keselamatan Rute Transportasi Kampus",
    kategori: "kajian-strategis",
    tag: ["TransportasiUI"],
    tanggal: "2026-02-20",
    penulis: "Nama Penulis",
    estimasiBaca: 10,
    excerpt: "Pemetaan titik rawan pada rute transportasi kampus beserta usulan perbaikan.",
  },
  {
    slug: "sikap-penanganan-kekerasan-seksual",
    judul: "Sikap BEM UI atas Penanganan Kekerasan Seksual di Kampus",
    kategori: "siaran-pers",
    tag: ["KekerasanSeksual", "Advokasi"],
    tanggal: "2026-02-16",
    penulis: "Nama Penulis",
    estimasiBaca: 4,
    excerpt: "Pernyataan resmi mengenai komitmen perlindungan korban dan kepastian proses.",
  },
  {
    slug: "rangkuman-forum-mahasiswa-suara-fakultas",
    judul: "Rangkuman Forum Mahasiswa: Suara dari Fakultas",
    kategori: "kabar-ui",
    tag: ["Advokasi"],
    tanggal: "2026-02-12",
    penulis: "Nama Penulis",
    estimasiBaca: 5,
    excerpt: "Ringkasan aspirasi yang terkumpul dalam forum lintas fakultas.",
  },
  {
    slug: "membaca-ulang-transparansi-ukt-lintas-fakultas",
    judul: "Membaca Ulang Transparansi UKT Lintas Fakultas",
    kategori: "opini-artikel",
    tag: ["UKT"],
    tanggal: "2026-02-09",
    penulis: "Nama Penulis",
    estimasiBaca: 6,
    excerpt: "Refleksi tentang keterbukaan informasi penetapan UKT di tiap fakultas.",
  },
  {
    slug: "panduan-pelaporan-kekerasan-seksual",
    judul: "Panduan Pelaporan Kekerasan Seksual bagi Mahasiswa",
    kategori: "kabar-ui",
    tag: ["KekerasanSeksual"],
    tanggal: "2026-02-03",
    penulis: "Nama Penulis",
    estimasiBaca: 4,
    excerpt: "Alur dan kanal pelaporan yang dapat digunakan mahasiswa.",
  },
  {
    slug: "rekomendasi-penataan-transportasi-internal",
    judul: "Rekomendasi Penataan Transportasi Internal",
    kategori: "kajian-strategis",
    tag: ["TransportasiUI"],
    tanggal: "2026-01-27",
    penulis: "Nama Penulis",
    estimasiBaca: 8,
    excerpt: "Rekomendasi kebijakan untuk penataan jadwal, rute, dan armada transportasi internal.",
  },
];

const DUMMY_ARTICLES: NewsArticle[] = DUMMY_INPUT.map((a) => ({
  ...a,
  caption: "Keterangan foto placeholder. Sumber: dokumentasi BEM UI 2026.",
  body: dummyBody(a.excerpt),
}));

/** Baris tabel `articles` (lihat docs/news-schema.sql). Ubah di sini kalau nama kolom berbeda. */
interface ArticleRow {
  slug: string;
  judul: string;
  kategori: string;
  tag: string[] | null;
  tanggal: string;
  penulis: string;
  estimasi_baca: number | null;
  excerpt: string;
  hero_image: string | null;
  caption: string | null;
  body: NewsBlock[] | null;
  seo: { title?: string; description?: string; ogImage?: string } | null;
}

function fromRow(r: ArticleRow): NewsArticle {
  return {
    slug: r.slug,
    judul: r.judul,
    kategori: isNewsCategory(r.kategori) ? r.kategori : "kabar-ui",
    tag: r.tag ?? [],
    tanggal: String(r.tanggal).slice(0, 10),
    penulis: r.penulis,
    estimasiBaca: r.estimasi_baca ?? 3,
    excerpt: r.excerpt,
    heroImage: mediaUrl(r.hero_image),
    caption: r.caption ?? undefined,
    body: r.body ?? [],
    seo: r.seo ? { ...r.seo, ogImage: mediaUrl(r.seo.ogImage) } : undefined,
  };
}

/** Artikel terbit, terbaru lebih dulu. Supabase bila env terisi, kalau tidak data dummy. */
export async function getNewsArticles(): Promise<NewsArticle[]> {
  if (!isSupabaseConfigured()) {
    return [...DUMMY_ARTICLES].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }
  const { data, error } = await getSupabase()
    .from("articles")
    .select("*")
    .eq("published", true)
    .order("tanggal", { ascending: false });
  if (error) throw new Error(`Gagal memuat artikel dari Supabase: ${error.message}`);
  return (data as ArticleRow[]).map(fromRow);
}

export async function getNewsBySlug(slug: string): Promise<NewsArticle | undefined> {
  return (await getNewsArticles()).find((a) => a.slug === slug);
}

/** Artikel terkait: tag/kategori sama dulu, sisanya terbaru. Selalu `limit` artikel (bila cukup). */
export async function getRelatedArticles(slug: string, limit = 3): Promise<NewsArticle[]> {
  const all = await getNewsArticles();
  const cur = all.find((a) => a.slug === slug);
  if (!cur) return all.slice(0, limit);
  const score = (a: NewsArticle) =>
    a.tag.filter((t) => cur.tag.some((c) => tagKey(c) === tagKey(t))).length * 2 + (a.kategori === cur.kategori ? 1 : 0);
  return all
    .filter((a) => a.slug !== slug)
    .sort((x, y) => score(y) - score(x) || y.tanggal.localeCompare(x.tanggal))
    .slice(0, limit);
}
