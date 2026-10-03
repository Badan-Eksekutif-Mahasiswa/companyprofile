import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge, EmptyState, buttonVariants } from "@/components/ui";
import { formatTanggal } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Artikel, KategoriArtikel } from "@/types";
import { NewsCarousel } from "./NewsCarousel";
import { SectionHeading } from "./SectionHeading";

const KATEGORI_BADGE: Record<KategoriArtikel, "navy" | "pink" | "blue" | "maroon"> = {
  "Kajian Strategis": "blue",
  "Siaran Pers": "maroon",
  "Opini & Artikel": "pink",
  "Kabar UI": "navy",
};

/** Tiga artikel terbaru (PRD 3.1 Preview Section News). Mobile: carousel miring + titik indikator. */
export function NewsPreview({ articles }: { articles: Artikel[] }) {
  return (
    <section aria-labelledby="news-title" className="bg-off-white py-20 sm:py-28">
      <div className="mx-auto max-w-wrap px-5">
        <div className="flex items-end justify-between gap-6">
          <SectionHeading id="news-title" eyebrow="Publikasi resmi" title="Berita Terbaru" />
          <Link href="/news" className={cn(buttonVariants({ variant: "outline" }), "hidden md:inline-flex")}>
            Lihat Semua Berita <ArrowRight />
          </Link>
        </div>

        {articles.length === 0 ? (
          <EmptyState title="Belum ada berita" description="Publikasi terbaru BEM UI akan muncul di sini." className="mt-10" />
        ) : (
          <NewsCarousel labels={articles.map((a) => a.judul)}>
            {articles.map((a) => (
              <Link
                key={a.slug}
                href={`/news/${a.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-base ease-out-expo hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light"
              >
                <div className="aspect-[16/10] overflow-hidden bg-navy-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.thumbnail_url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-slow ease-out-expo group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={KATEGORI_BADGE[a.kategori]}>{a.kategori}</Badge>
                    <time dateTime={a.tanggal} className="text-[13px] text-muted">
                      {formatTanggal(a.tanggal)}
                    </time>
                  </div>
                  <h3 className="mt-3 text-base leading-snug sm:mt-4 sm:text-lg transition-colors group-hover:text-accent">{a.judul}</h3>
                </div>
              </Link>
            ))}
          </NewsCarousel>
        )}

        <Link href="/news" className={cn(buttonVariants({ variant: "outline" }), "mt-8 flex md:hidden")}>
          Lihat Semua Berita <ArrowRight />
        </Link>
      </div>
    </section>
  );
}
