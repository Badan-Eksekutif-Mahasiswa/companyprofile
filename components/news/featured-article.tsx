import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatTanggal, type NewsArticle } from "@/lib/news";
import { Cover } from "./cover";
import { Highlight } from "./highlight";
import { KindChip } from "./kind-chip";

export function FeaturedArticle({ article, q }: { article: NewsArticle; q?: string }) {
  return (
    <article data-cursor="Baca" className="group relative grid gap-6 lg:grid-cols-3 lg:gap-10">
      <div className="relative lg:col-span-2">
        <Cover
          kategori={article.kategori}
          src={article.heroImage}
          className="aspect-[16/10] rounded-2xl border border-border bg-navy-5 shadow-md transition-[transform,box-shadow] duration-base ease-out-expo group-hover:-translate-y-1 group-hover:shadow-lg lg:aspect-[16/9]"
          sizes="(min-width: 1024px) 66vw, 100vw"
        />
        <KindChip kategori={article.kategori} className="absolute left-4 top-4" />
      </div>
      <div className="flex flex-col justify-center gap-3">
        <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-accent-hover">
          Terbaru — <time dateTime={article.tanggal}>{formatTanggal(article.tanggal)}</time>
        </p>
        <h2 className="text-[clamp(24px,2.4vw,34px)] font-bold leading-[1.15] tracking-[-0.02em] text-navy">
          <Link href={`/news/${article.slug}`} className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-4 focus-visible:after:ring-pink-light">
            <Highlight text={article.judul} q={q} />
          </Link>
        </h2>
        <p className="text-[15px] leading-relaxed text-secondary">
          <Highlight text={article.excerpt} q={q} />
        </p>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] text-muted">
            {article.penulis} · {article.estimasiBaca} menit baca
          </p>
          <ArrowUpRight aria-hidden className="size-6 shrink-0 text-navy-50 transition-all duration-base group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
        </div>
      </div>
    </article>
  );
}
