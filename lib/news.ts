export type NewsCategory = "kajian-strategis" | "siaran-pers" | "opini-artikel" | "kabar-ui";

export const NEWS_CATEGORIES: { value: NewsCategory; label: string }[] = [
  { value: "kajian-strategis", label: "Kajian Strategis" },
  { value: "siaran-pers", label: "Pernyataan Resmi" },
  { value: "opini-artikel", label: "Opini" },
  { value: "kabar-ui", label: "Kabar UI" },
];

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
  caption?: string;
  body: NewsBlock[];
  seo?: { title?: string; description?: string; ogImage?: string };
  diperbarui?: string;
  sumber: NewsSource[];
  lampiran: NewsAttachment[];
}

export interface NewsSource {
  nama: string;
  url?: string;
}

export interface NewsAttachment {
  nama: string;
  url: string;
  tipe?: string;
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

export const JENIS_KONTEN: Record<NewsCategory, { label: string; note?: string }> = {
  "siaran-pers": { label: "Pernyataan Resmi", note: "Sikap resmi BEM UI 2026." },
  "opini-artikel": { label: "Opini", note: "Pendapat penulis; tidak mewakili sikap resmi BEM UI 2026." },
  "kajian-strategis": { label: "Kajian Strategis", note: "Hasil kajian tim BEM UI 2026." },
  "kabar-ui": { label: "Kabar UI" },
};

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

function slugHeading(t: string) {
  return t.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "bagian";
}

export function extractHeadings(blocks: NewsBlock[]): Heading[] {
  const used = new Map<string, number>();
  const out: Heading[] = [];
  for (const b of blocks) {
    if (b.type !== "h2" && b.type !== "h3") continue;
    const base = slugHeading(b.text);
    const n = used.get(base) ?? 0;
    used.set(base, n + 1);
    out.push({ id: n ? `${base}-${n + 1}` : base, text: b.text, level: b.type === "h2" ? 2 : 3 });
  }
  return out;
}

export function splitHighlight(text: string, q?: string): { t: string; hit: boolean }[] {
  const needle = q?.trim();
  if (!needle) return [{ t: text, hit: false }];
  const re = new RegExp(`(${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return text.split(re).filter(Boolean).map((t) => ({ t, hit: t.toLowerCase() === needle.toLowerCase() }));
}

export const BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

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
  tag?: string | null;
  q?: string;
  tahun?: string | null;
  bulan?: string | null;
}

export function filterArticles(articles: NewsArticle[], { kategori, tag, q, tahun, bulan }: NewsFilters): NewsArticle[] {
  const needle = q?.trim().toLowerCase();
  return articles.filter((a) => {
    if (kategori && a.kategori !== kategori) return false;
    if (tag && !a.tag.some((t) => tagKey(t) === tag)) return false;
    if (tahun && a.tanggal.slice(0, 4) !== tahun) return false;
    if (bulan && Number(a.tanggal.slice(5, 7)) !== Number(bulan)) return false;
    if (
      needle &&
      !(a.judul.toLowerCase().includes(needle) || a.excerpt.toLowerCase().includes(needle) || a.tag.some((t) => t.toLowerCase().includes(needle)))
    ) {
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
