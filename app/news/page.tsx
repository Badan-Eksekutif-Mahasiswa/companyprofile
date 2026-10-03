import type { Metadata } from "next";
import { Suspense } from "react";
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
    <main id="main" className="mx-auto w-full max-w-wrap px-4 pb-24 pt-16 sm:px-6 lg:pt-24">
      <header className="mb-10 max-w-2xl">
        <h1 tabIndex={-1} className="text-4xl font-extrabold tracking-tight text-navy lg:text-5xl">
          Berita &amp; Artikel
        </h1>
        <p className="mt-3 text-base text-secondary">
          Kajian, pernyataan sikap, dan kabar terbaru dari BEM UI 2026.
        </p>
      </header>
      <Suspense fallback={<NewsSkeleton />}>
        <NewsBrowser articles={articles} />
      </Suspense>
    </main>
  );
}
