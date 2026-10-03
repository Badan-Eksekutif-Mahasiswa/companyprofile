// Hanya untuk server. Jangan diimpor dari komponen client.
import { getSupabase, getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/media";
import { isNewsCategory, tagKey, type NewsArticle, type NewsBlock } from "@/lib/news";
import { estimateReadMinutes, normalizeLampiran, normalizeSumber, parseBody, slugify } from "@/lib/news-parse";

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
  { type: "p", text: "Paragraf penutup placeholder. ".repeat(12) },
  { type: "h2", text: "Rekomendasi" },
  { type: "p", text: "Paragraf rekomendasi placeholder. ".repeat(20) },
  { type: "h2", text: "Penutup" },
  { type: "p", text: "Paragraf penutup placeholder. ".repeat(20) },
];

type DummyInput = Omit<NewsArticle, "body" | "caption" | "sumber" | "lampiran">;
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

const DUMMY_ARTICLES: NewsArticle[] = DUMMY_INPUT.map((a, i) => ({
  ...a,
  diperbarui: i % 4 === 0 ? "2026-04-02" : undefined,
  caption: "Keterangan foto placeholder. Sumber: dokumentasi BEM UI 2026.",
  body: dummyBody(a.excerpt),
  sumber: [{ nama: "Dokumentasi BEM UI 2026" }, { nama: "Tautan rujukan placeholder", url: "https://example.com" }],
  lampiran:
    i % 3 === 0
      ? [{ nama: "Lampiran contoh.pdf", url: "/dummy/lampiran-contoh.pdf", tipe: "pdf", ukuran: "2 KB" }]
      : [],
}));

interface ArticleRow {
  slug: string | null;
  judul: string;
  ringkasan: string;
  isi: unknown;
  gambar_utama: string | null;
  gambar_caption: string | null;
  penulis: string;
  tag: string[] | null;
  tanggal: string;
  sumber: unknown;
  lampiran: unknown;
  kategori: string | null;
  diperbarui: string | null;
  seo: { title?: string; description?: string; ogImage?: string } | null;
}

// Baris tabel -> NewsArticle. Sesuaikan nama kolom di sini.
function fromRow(r: ArticleRow): NewsArticle {
  const body = parseBody(r.isi);
  return {
    slug: r.slug || slugify(r.judul),
    judul: r.judul,
    kategori: isNewsCategory(r.kategori) ? r.kategori : "kabar-ui",
    diperbarui: r.diperbarui ? String(r.diperbarui).slice(0, 10) : undefined,
    tag: r.tag ?? [],
    tanggal: String(r.tanggal).slice(0, 10),
    penulis: r.penulis,
    estimasiBaca: estimateReadMinutes(body),
    excerpt: r.ringkasan,
    heroImage: mediaUrl(r.gambar_utama),
    caption: r.gambar_caption ?? undefined,
    body,
    seo: r.seo ? { ...r.seo, ogImage: mediaUrl(r.seo.ogImage) } : undefined,
    sumber: normalizeSumber(r.sumber),
    lampiran: normalizeLampiran(r.lampiran, mediaUrl),
  };
}

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

export async function getNewsPreviewBySlug(slug: string): Promise<NewsArticle | undefined> {
  if (!isSupabaseConfigured()) return DUMMY_ARTICLES.find((a) => a.slug === slug);
  const { data, error } = await getSupabaseAdmin().from("articles").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Gagal memuat pratinjau: ${error.message}`);
  return data ? fromRow(data as ArticleRow) : undefined;
}

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
