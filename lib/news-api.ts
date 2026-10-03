// Hanya untuk server. Membaca API publik CMS SIT (/api/website/v1/).
import { estimateReadMinutes } from "@/lib/news-parse";
import { parseHtml } from "@/lib/news-html";
import type { NewsArticle, NewsAttachment, NewsCategory } from "@/lib/news";

const BASE = process.env.SIT_API_URL?.replace(/\/+$/, "");

export const isSitConfigured = () => Boolean(BASE);

const CATEGORY: Record<string, NewsCategory> = {
  news: "kabar-ui",
  kajian: "kajian-strategis",
  "siaran-pers": "siaran-pers",
  opini: "opini-artikel",
};

interface ApiMedia {
  url: string;
  alt?: string;
  download_url?: string;
  pages?: { url: string; width: number; height: number }[];
}

interface ApiArticle {
  slug: string;
  category: string;
  title: string;
  summary?: string;
  body?: string;
  cover?: (ApiMedia & { alt?: string }) | null;
  author?: { display?: string; unit_name?: string; personal_name?: string };
  event_date?: string | null;
  published_at?: string | null;
  references?: string[];
  tags?: string[];
  attachments?: (ApiMedia & { title: string })[];
}

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function fromApi(a: ApiArticle): NewsArticle {
  const body = parseHtml(a.body ?? "");
  const lampiran: NewsAttachment[] = (a.attachments ?? []).map((x) => ({
    nama: x.title,
    url: x.download_url ?? x.url,
    tipe: "pdf",
    halaman: x.pages?.map((p) => ({ url: p.url, width: p.width, height: p.height })),
  }));
  return {
    slug: a.slug,
    judul: a.title,
    kategori: CATEGORY[a.category] ?? "kabar-ui",
    tag: a.tags ?? [],
    tanggal: (a.published_at ?? a.event_date ?? "").slice(0, 10),
    penulis: a.author?.display ?? a.author?.unit_name ?? "BEM UI 2026",
    estimasiBaca: estimateReadMinutes(body),
    excerpt: a.summary ?? "",
    heroImage: a.cover?.url,
    caption: a.cover?.alt || undefined,
    body,
    sumber: (a.references ?? []).map((url) => ({ nama: host(url), url })),
    lampiran,
  };
}

export async function fetchSitArticles(): Promise<NewsArticle[]> {
  const out: NewsArticle[] = [];
  let page = 1;
  let pages = 1;
  do {
    const res = await fetch(`${BASE}/articles/?page_size=50&page=${page}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`API SIT menjawab ${res.status}`);
    const json = (await res.json()) as { pages: number; results: ApiArticle[] };
    out.push(...json.results.map(fromApi));
    pages = json.pages;
    page += 1;
  } while (page <= pages);
  return out.sort((x, y) => y.tanggal.localeCompare(x.tanggal));
}
