import type { Metadata } from "next";
import { Suspense } from "react";
import { Badge } from "@/components/ui";
import { MeshGradient } from "@/components/webgl";
import { GlassHighlight } from "@/components/news/glass-highlight";
import { CursorRing } from "@/components/news/cursor-ring";
import { NewsBrowser } from "@/components/news/news-browser";
import { NewsSkeleton } from "@/components/news/news-skeleton";
import { getNewsArticles } from "@/lib/news-data";

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
export const fetchCache = "force-no-store";

export default async function NewsPage() {
  const articles = await getNewsArticles();

  return (
    <main id="main">
      <CursorRing />
      <header className="relative overflow-hidden pb-14 pt-32 md:pt-40">
        <MeshGradient className="h-full" />
        <div className="relative mx-auto max-w-wrap px-6">
          <Badge className="mb-6 px-3.5 py-1.5 text-[13px]">Publikasi resmi BEM UI 2026</Badge>
          <h1 tabIndex={-1} className="text-[clamp(48px,9vw,136px)] font-extrabold leading-[0.9] tracking-[-0.04em]">
            <span className="block overflow-hidden pb-3">
              <span className="news-rise block [animation:news-rise_0.9s_var(--ease-out)_both]">Berita</span>
            </span>
            <span className="-mt-3 -mb-8 block overflow-hidden pb-12">
              <span className="news-rise block [animation:news-rise_0.9s_0.12s_var(--ease-out)_both]">
                <GlassHighlight>&amp; Artikel</GlassHighlight>
              </span>
            </span>
          </h1>
          <p className="news-fade mt-6 max-w-xl text-[17px] font-medium leading-relaxed text-secondary [animation:news-fade_0.8s_0.4s_var(--ease-out)_both]">
            Kajian, pernyataan sikap, dan kabar terbaru dari BEM UI 2026.
          </p>
        </div>
      </header>
      <div className="mx-auto max-w-wrap px-6 pb-24 md:pb-32">
        <Suspense fallback={<NewsSkeleton />}>
          <NewsBrowser articles={articles} />
        </Suspense>
      </div>
    </main>
  );
}
