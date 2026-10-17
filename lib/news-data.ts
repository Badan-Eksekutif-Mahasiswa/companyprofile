// Hanya untuk server. Jangan diimpor dari komponen client.
import { getSupabase, getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { fetchSitArticles, isSitConfigured } from "@/lib/news-api";
import { mediaUrl } from "@/lib/media";
import { isNewsCategory, tagKey, type NewsArticle } from "@/lib/news";
import { readDemoJson } from "@/lib/demo-data";
import { estimateReadMinutes, normalizeLampiran, normalizeSumber, parseBody, slugify } from "@/lib/news-parse";


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
  if (isSitConfigured()) {
    try { return await fetchSitArticles(); }
    catch (error) { console.error("Artikel CMS SIT tidak dapat dimuat:", error); return []; }
  }
  if (!isSupabaseConfigured()) {
    return (readDemoJson<NewsArticle[]>("news-demo.json") ?? []).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
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
  if (!isSupabaseConfigured()) return readDemoJson<NewsArticle[]>("news-demo.json")?.find((a) => a.slug === slug);
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
