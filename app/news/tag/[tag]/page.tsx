import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import { MeshGradient } from "@/components/webgl";
import { ArticleCard } from "@/components/news/article-card";
import { collectTags, tagKey } from "@/lib/news";
import { getNewsArticles } from "@/lib/news-data";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const keyOf = (raw: string) => {
  try {
    return tagKey(decodeURIComponent(raw));
  } catch {
    return tagKey(raw);
  }
};

export async function generateMetadata({ params }: { params: { tag: string } }): Promise<Metadata> {
  const key = keyOf(params.tag);
  const label = collectTags(await getNewsArticles()).find((t) => t.key === key)?.label ?? key;
  return { title: `#${label} — Berita BEM UI 2026`, description: `Semua artikel BEM UI 2026 bertopik ${label}.` };
}

export default async function TagPage({ params }: { params: { tag: string } }) {
  const key = keyOf(params.tag);
  const all = await getNewsArticles();
  const list = all.filter((a) => a.tag.some((t) => tagKey(t) === key));
  if (list.length === 0) notFound();
  const tags = collectTags(all);
  const label = tags.find((t) => t.key === key)?.label ?? key;
  const others = tags.filter((t) => t.key !== key).slice(0, 12);

  return (
    <main id="main">
      <header className="relative overflow-hidden pb-12 pt-32 md:pt-40">
        <MeshGradient className="h-full" />
        <div className="relative mx-auto max-w-wrap px-6">
          <Badge className="mb-6 px-3.5 py-1.5 text-[13px]">Topik</Badge>
          <h1 tabIndex={-1} className="text-[clamp(40px,7vw,96px)] font-bold leading-[0.95] tracking-normal text-navy">#{label}</h1>
          <p className="mt-4 text-[17px] font-medium text-secondary">{list.length} artikel</p>
          <Link href="/news" className="mt-4 inline-block text-sm font-bold text-accent hover:underline">← Semua berita</Link>
        </div>
      </header>
      <div className="mx-auto max-w-wrap px-6 pb-24">
        <h2 className="sr-only">Daftar artikel bertopik {label}</h2>
        <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <li key={a.slug}>
              <ArticleCard article={a} size="large" className="h-full" />
            </li>
          ))}
        </ul>
        {others.length > 0 && (
          <section aria-labelledby="topik-lain" className="mt-20 rounded-2xl border border-border bg-navy-5 p-8">
            <h2 id="topik-lain" className="text-xl font-bold text-navy">Topik lain</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {others.map((t) => (
                <li key={t.key}>
                  <Link href={`/news/tag/${encodeURIComponent(t.key)}`} className="rounded-full bg-white px-3 py-1 text-sm font-bold text-navy hover:bg-pink-pale hover:text-accent">
                    #{t.label} <span className="text-muted">{t.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
