import Link from "next/link";
import { Breadcrumb, Badge } from "@/components/ui";
import { ArticleBody } from "./article-body";
import { ArticleCard } from "./article-card";
import { CATEGORY_STYLE } from "./category-style";
import { Cover } from "./cover";
import { ShareButtons } from "./share-buttons";
import { Reveal } from "@/components/motion";
import { categoryLabel, formatTanggal, tagKey, type NewsArticle } from "@/lib/news";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Tampilan artikel penuh, dipakai halaman publik dan halaman pratinjau. */
export function ArticleView({ a, related, banner }: { a: NewsArticle; related: NewsArticle[]; banner?: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.judul,
    description: a.excerpt,
    datePublished: a.tanggal,
    author: { "@type": "Person", name: a.penulis },
    publisher: { "@type": "Organization", name: "BEM UI 2026" },
    image: a.seo?.ogImage ?? a.heroImage,
    mainEntityOfPage: `${SITE}/news/${a.slug}`,
  };

  return (
    <main id="main" className="mx-auto w-full max-w-wrap px-4 pb-24 pt-28 sm:px-6 lg:pt-32">
      {banner}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Breadcrumb items={[{ label: "News", href: "/news" }, { label: categoryLabel(a.kategori), href: `/news?kategori=${a.kategori}` }, { label: a.judul }]} />

      <header className="mt-8 max-w-[860px]">
        <Badge variant={CATEGORY_STYLE[a.kategori].badge}>{categoryLabel(a.kategori)}</Badge>
        <h1 tabIndex={-1} className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-navy sm:text-4xl lg:text-5xl">
          {a.judul}
        </h1>
        <p className="mt-4 text-sm text-muted">
          {a.penulis} · <time dateTime={a.tanggal}>{formatTanggal(a.tanggal)}</time> · {a.estimasiBaca} menit baca
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {a.tag.map((t) => (
            <li key={t}>
              <Link href={`/news?tag=${tagKey(t)}`} className="rounded-full bg-navy-5 px-3 py-1 text-[13px] font-bold text-navy transition-colors duration-fast hover:bg-pink-pale hover:text-accent">
                #{t}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <ShareButtons title={a.judul} />
        </div>
      </header>

      <figure className="mt-10">
        <Cover kategori={a.kategori} src={a.heroImage} className="aspect-[16/9] w-full rounded-2xl" sizes="(min-width: 1180px) 1180px, 100vw" />
        {a.caption && <figcaption className="mt-3 text-[13px] text-muted">{a.caption}</figcaption>}
      </figure>

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article>
          <ArticleBody blocks={a.body} />
          <div className="mt-12 max-w-[720px] border-t border-divider pt-6">
            <ShareButtons title={a.judul} label="Bagikan artikel ini" />
          </div>
        </article>
        <aside aria-labelledby="terkait" className="lg:sticky lg:top-8 lg:self-start">
          <h2 id="terkait" className="text-lg font-extrabold text-navy">Artikel Terkait</h2>
          <ul className="mt-4 space-y-4">
            {related.map((r) => (
              <li key={r.slug}>
                <ArticleCard article={r} size="small" />
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <section aria-labelledby="baca-juga" className="mt-20 border-t border-divider pt-10">
        <h2 id="baca-juga" className="text-2xl font-extrabold text-navy">Baca Juga</h2>
        <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((r, i) => (
            <Reveal key={r.slug} index={i}>
              <ArticleCard article={r} size="large" />
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
