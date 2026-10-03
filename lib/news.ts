/**
 * Lapisan data News & Artikel.
 *
 * v1: data dummy lokal. Semua akses data lewat fungsi di file ini (getNewsArticles),
 * jadi saat sumber data pindah ke database cukup ganti isi fungsi, bukan komponen UI.
 */

export type NewsCategory = "kajian-strategis" | "siaran-pers" | "opini-artikel" | "kabar-ui";

export const NEWS_CATEGORIES: { value: NewsCategory; label: string }[] = [
  { value: "kajian-strategis", label: "Kajian Strategis" },
  { value: "siaran-pers", label: "Siaran Pers" },
  { value: "opini-artikel", label: "Opini & Artikel" },
  { value: "kabar-ui", label: "Kabar UI" },
];

export interface NewsArticle {
  slug: string;
  judul: string;
  kategori: NewsCategory;
  /** Nama tag tanpa "#", mis. "UKT". Pencocokan tidak peka huruf besar/kecil. */
  tag: string[];
  /** ISO date (YYYY-MM-DD). */
  tanggal: string;
  penulis: string;
  /** Estimasi waktu baca, menit. */
  estimasiBaca: number;
  excerpt: string;
  /** Path gambar (mis. "/images/news/xxx.jpg"). Kosong = tampilkan placeholder. */
  heroImage?: string;
}

export function isNewsCategory(value: string | null | undefined): value is NewsCategory {
  return NEWS_CATEGORIES.some((c) => c.value === value);
}

export function categoryLabel(value: NewsCategory): string {
  return NEWS_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export const tagKey = (tag: string) => tag.trim().toLowerCase();

/** Format tanggal Indonesia, mis. "15 Maret 2026". UTC supaya server dan client sama. */
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

/** Pencarian saat ini mencakup judul dan excerpt. Ubah di sini kalau scope-nya berubah. */
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

/* ------------------------------------------------------------------ */
/* DATA DUMMY — ganti dengan sumber data asli (database).             */
/* Judul/ringkasan hanyalah placeholder untuk menguji tampilan.        */
/* ------------------------------------------------------------------ */
const DUMMY_ARTICLES: NewsArticle[] = [
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

/** Artikel terbaru lebih dulu. Async supaya mudah diganti ke fetch database. */
export async function getNewsArticles(): Promise<NewsArticle[]> {
  return [...DUMMY_ARTICLES].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}
