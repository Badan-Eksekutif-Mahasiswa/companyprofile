import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/news/article-view";
import { getNewsArticles, getNewsBySlug, getRelatedArticles } from "@/lib/news-data";

// Halaman artikel dibuat ulang paling lambat tiap 60 detik, jadi artikel baru/edit muncul tanpa deploy.
export const revalidate = 60;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateStaticParams() {
  return (await getNewsArticles()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const a = await getNewsBySlug(params.slug);
  if (!a) return {};
  const title = a.seo?.title ?? a.judul;
  const description = a.seo?.description ?? a.excerpt;
  const image = a.seo?.ogImage ?? a.heroImage;
  return {
    metadataBase: new URL(SITE),
    title: `${title} — BEM UI 2026`,
    description,
    alternates: { canonical: `/news/${a.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: a.tanggal,
      authors: [a.penulis],
      tags: a.tag,
      images: image ? [image] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const a = await getNewsBySlug(params.slug);
  if (!a) notFound();
  const related = await getRelatedArticles(a.slug, 3);
  return <ArticleView a={a} related={related} />;
}
