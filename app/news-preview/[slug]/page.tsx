import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import { ArticleView } from "@/components/news/article-view";
import { getNewsPreviewBySlug, getRelatedArticles } from "@/lib/news-data";

// Pratinjau selalu dirender per-request, tidak di-cache, dan tidak diindeks mesin pencari.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const metadata: Metadata = { title: "Pratinjau artikel", robots: { index: false, follow: false } };

function tokenValid(given?: string): boolean {
  const expected = process.env.NEWS_PREVIEW_TOKEN;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Pratinjau artikel (termasuk draft): /news-preview/<slug>?token=<NEWS_PREVIEW_TOKEN>
 * Token salah / belum diatur -> 404 (keberadaan halaman tidak dibocorkan).
 */
export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { token?: string };
}) {
  if (!tokenValid(searchParams.token)) notFound();
  const a = await getNewsPreviewBySlug(params.slug);
  if (!a) notFound();
  const related = await getRelatedArticles(a.slug, 3);
  return (
    <ArticleView
      a={a}
      related={related}
      banner={
        <div role="status" className="fixed inset-x-0 bottom-0 z-[60] bg-navy px-4 py-3 text-center text-sm font-bold text-white">
          Mode pratinjau — halaman ini tidak publik dan tidak diindeks.
        </div>
      }
    />
  );
}
