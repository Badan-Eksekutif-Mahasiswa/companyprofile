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
  /** Opsional: tidak semua sumber data punya kategori. */
  kategori?: NewsCategory;
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
  /** Sumber/rujukan artikel (boleh kosong). */
  sumber: NewsSource[];
  /** Lampiran (PDF dll). PDF bisa dipratinjau di halaman artikel. */
  lampiran: NewsAttachment[];
}

export interface NewsSource {
  nama: string;
  url?: string;
}

export interface NewsAttachment {
  nama: string;
  url: string;
  /** "pdf" -> ada tombol pratinjau. */
  tipe?: string;
  /** Teks bebas, mis. "1,2 MB". */
  ukuran?: string;
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
