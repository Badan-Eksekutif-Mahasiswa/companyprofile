import Link from "next/link";
import { Breadcrumb } from "@/components/ui";
import { MeshGradient } from "@/components/webgl";
import { ArticleBody } from "./article-body";
import { ArticleCard } from "./article-card";
import { Cover } from "./cover";
import { ShareButtons } from "./share-buttons";
import { Attachments } from "./attachments";
import { Reveal } from "@/components/motion";
import { ContentLabel } from "./content-label";
import { ArticleToc } from "./article-toc";
import { ReadingProgress } from "./reading-progress";
import { ReaderTools } from "./reader-tools";
import { BackToList } from "./back-to-list";
import { categoryLabel, extractHeadings, formatTanggal, tagKey, type NewsArticle } from "@/lib/news";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Tampilan artikel penuh, dipakai halaman publik dan halaman pratinjau. */
export function ArticleView({ a, related, banner }: { a: NewsArticle; related: NewsArticle[]; banner?: React.ReactNode }) {
  const headings = extractHeadings(a.body);
  const showToc = headings.filter((h) => h.level === 2).length >= 3;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.judul,
    description: a.excerpt,
    datePublished: a.tanggal,
    ...(a.diperbarui ? { dateModified: a.diperbarui } : {}),
    author: { "@type": "Person", name: a.penulis },
    publisher: { "@type": "Organization", name: "BEM UI 2026" },
    image: a.seo?.ogImage ?? a.heroImage,
    mainEntityOfPage: `${SITE}/news/${a.slug}`,
  };

  return (
    <main id="main">
      <ReadingProgress />
      {banner}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="relative overflow-hidden pb-16 pt-32 md:pt-40 print:pt-0">
      <MeshGradient className="h-full print:hidden" />
      <div className="relative mx-auto max-w-wrap px-6">
      <div className="mb-4 print:hidden"><BackToList /></div>
      <Breadcrumb items={[{ label: "News", href: "/news" }, ...(a.kategori ? [{ label: categoryLabel(a.kategori), href: `/news?kategori=${a.kategori}` }] : []), { label: a.judul }]} />

      <div className="mt-8 max-w-[860px]">
        <ContentLabel kategori={a.kategori} />
        <h1 tabIndex={-1} className="mt-4 text-[clamp(30px,4.6vw,60px)] font-extrabold leading-[1.05] tracking-[-0.035em] text-navy">
          {a.judul}
        </h1>
        <p className="mt-4 text-sm text-muted">
          {a.penulis} · Terbit <time dateTime={a.tanggal}>{formatTanggal(a.tanggal)}</time>
          {a.diperbarui && <> · Diperbarui <time dateTime={a.diperbarui}>{formatTanggal(a.diperbarui)}</time></>} · {a.estimasiBaca} menit baca
        </p>
        <p className="mt-2 hidden text-sm text-muted print:block">BEM UI 2026 · {SITE}/news/{a.slug}</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {a.tag.map((t) => (
            <li key={t}>
              <Link href={`/news/tag/${encodeURIComponent(tagKey(t))}`} className="rounded-full border border-glass-border bg-glass px-3 py-1 text-[13px] font-bold text-navy shadow-glass-soft backdrop-blur-glass transition-colors duration-fast hover:text-accent">
                #{t}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 print:hidden">
          <ShareButtons title={a.judul} />
          <ReaderTools />
        </div>
      </div>
      </div>
      </header>

      <div className="mx-auto w-full max-w-wrap px-4 pb-24 pt-10 sm:px-6">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_220px] print:block">
      <div className="min-w-0">
      <div className="max-w-[860px]">
    {a.koreksi && (
      <aside role="note" className="mt-6 rounded-2xl border-l-4 border-accent bg-pink-pale p-4 text-[14.5px] leading-relaxed text-navy">
        <strong>Catatan koreksi{a.diperbarui ? ` (${formatTanggal(a.diperbarui)})` : ""}:</strong> {a.koreksi}
      </aside>
    )}
    {a.poinUtama && a.poinUtama.length > 0 && (
      <section aria-labelledby="poin-utama" className="mt-6 rounded-2xl border border-border bg-navy-5 p-5">
        <h2 id="poin-utama" className="text-[13px] font-bold uppercase tracking-[0.12em] text-accent-hover">Poin penting</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[15.5px] leading-relaxed text-primary marker:text-accent">
          {a.poinUtama.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </section>
    )}
      </div>

      <figure className="mt-8 max-w-[720px]">
        <Cover kategori={a.kategori} src={a.heroImage} className="aspect-[21/9] w-full rounded-2xl border border-border shadow-md" sizes="(min-width: 768px) 720px, 100vw" />
        {a.caption && <figcaption className="mt-3 text-[13px] text-muted">{a.caption}</figcaption>}
      </figure>

        <article id="isi-artikel" className="mt-12">
          {showToc && <div className="mb-8 lg:hidden"><ArticleToc headings={headings} /></div>}
          <ArticleBody blocks={a.body} />
          <div className="print:hidden"><Attachments items={a.lampiran} /></div>
          {a.sumber.length > 0 && (
            <section aria-labelledby="sumber" className="mt-12 max-w-[720px]">
              <h2 id="sumber" className="text-xl font-extrabold text-navy">Sumber</h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-6 text-[15px] text-secondary marker:text-accent">
                {a.sumber.map((s, i) => (
                  <li key={i}>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold text-navy underline underline-offset-2 hover:text-accent">
                        {s.nama}<span className="sr-only"> (buka di tab baru)</span>
                      </a>
                    ) : (
                      s.nama
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="mt-12 max-w-[720px] border-t border-divider pt-6 print:hidden">
            <ShareButtons title={a.judul} label="Bagikan artikel ini" />
          </div>
        </article>
        </div>
        {showToc ? (
          <aside className="hidden lg:block print:hidden">
            <div className="sticky top-28">
              <ArticleToc headings={headings} />
            </div>
          </aside>
        ) : (
        <aside aria-labelledby="terkait" className="lg:sticky lg:top-28 lg:self-start print:hidden">
          <h2 id="terkait" className="text-lg font-extrabold text-navy">Artikel Terkait</h2>
          <ul className="mt-4 space-y-4">
            {related.map((r) => (
              <li key={r.slug}>
                <ArticleCard article={r} size="small" />
              </li>
            ))}
          </ul>
        </aside>
        )}
      </div>

      <section aria-labelledby="baca-juga" className="mt-20 print:hidden border-t border-divider pt-10">
        <h2 id="baca-juga" className="text-[clamp(28px,3.5vw,48px)] font-extrabold leading-[0.95] tracking-[-0.035em] text-navy">Baca Juga</h2>
        <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((r, i) => (
            <Reveal key={r.slug} index={i}>
              <ArticleCard article={r} size="large" />
            </Reveal>
          ))}
        </div>
      </section>
      </div>
    </main>
  );
}
