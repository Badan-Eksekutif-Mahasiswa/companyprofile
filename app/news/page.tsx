import type { Metadata } from "next";
import { Suspense } from "react";
import { GlassHighlight } from "@/components/news/glass-highlight";
import { CursorRing } from "@/components/news/cursor-ring";
import { NewsBrowser } from "@/components/news/news-browser";
import { NewsSkeleton } from "@/components/news/news-skeleton";
import { getNewsArticles } from "@/lib/news";

export const metadata: Metadata = {
  title: "Berita & Artikel — BEM UI 2026",
  description:
    "Kajian strategis, siaran pers, opini, dan kabar terbaru dari BEM UI 2026 Kabinet Terus Terang.",
  openGraph: {
    title: "Berita & Artikel — BEM UI 2026",
    description: "Kajian strategis, siaran pers, opini, dan kabar terbaru dari BEM UI 2026.",
    type: "website",
  },
};

// Dirender per-request supaya daftar artikel (sesuai ?kategori/?tag/?q) ada di HTML awal untuk SEO.
export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const articles = await getNewsArticles();

  return (
    <main id="main" className="relative mx-auto w-full max-w-wrap px-4 pb-24 pt-16 sm:px-6 lg:pt-24">
      <CursorRing />
      <header className="mb-12 border-b-2 border-navy pb-6">
        <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-accent">Publikasi resmi BEM UI 2026</p>
        <h1 tabIndex={-1} className="mt-2 text-5xl font-extrabold leading-[0.95] tracking-tight text-navy sm:text-6xl lg:text-8xl">
          <span className="block overflow-hidden py-2">
            <span className="news-rise block [animation:news-rise_0.9s_var(--ease-out)_both]">Berita <GlassHighlight>&amp; Artikel</GlassHighlight></span>
          </span>
        </h1>
        <p className="news-fade mt-3 text-base text-secondary [animation:news-fade_0.8s_0.35s_var(--ease-out)_both]">
          Kajian, pernyataan sikap, dan kabar terbaru dari BEM UI 2026.
        </p>
      </header>
      <Suspense fallback={<NewsSkeleton />}>
        <NewsBrowser articles={articles} />
      </Suspense>
    </main>
  );
}
