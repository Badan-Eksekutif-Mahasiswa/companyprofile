import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTanggal, type NewsArticle } from "@/lib/news";
import { Cover } from "./cover";
import { Highlight } from "./highlight";
import { KindChip } from "./kind-chip";

export interface ArticleCardProps {
  article: NewsArticle;
  /** "large" = kartu besar (cover tinggi, excerpt); "small" = kartu ringkas. */
  size?: "large" | "small" | "compact";
  /** Kata kunci pencarian untuk disorot. */
  q?: string;
  className?: string;
}

const TILE =
  "border border-border shadow-sm transition-[transform,box-shadow] duration-base ease-out-expo group-hover:-translate-y-1 group-hover:shadow-lg";
const ARROW =
  "size-5 shrink-0 text-navy-50 transition-all duration-base group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent";
const META = "text-[12.5px] font-bold uppercase tracking-[0.12em] text-accent-hover";
const STRETCH =
  "outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-4 focus-visible:after:ring-pink-light";

/** Kartu berita bergaya tile Kabinet: gambar rounded-2xl, chip kaca di atas gambar, meta kapital beraksen. */
export function ArticleCard({ article, size = "small", className, q }: ArticleCardProps) {
  const large = size === "large";
  const compact = size === "compact";
  return (
    <article
      data-cursor="Baca"
      className={cn("group relative", compact ? "grid grid-cols-[40%_1fr] gap-4" : "flex flex-col", className)}
    >
      <div className="relative">
        <Cover
          kategori={article.kategori}
          src={article.heroImage}
          className={cn("rounded-2xl bg-navy-5", TILE, compact ? "aspect-[4/3]" : large ? "aspect-[16/10]" : "aspect-[4/3]")}
          sizes={large ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"}
        />
        <KindChip kategori={article.kategori} className={cn("absolute left-3 top-3 transition-transform duration-base ease-out-expo group-hover:-translate-y-1", compact && "hidden")} />
      </div>
      <div className={cn("flex flex-1 flex-col", compact ? "gap-1.5" : "mt-4 gap-2")}>
        <p className={META}>
          <time dateTime={article.tanggal}>{formatTanggal(article.tanggal)}</time>
        </p>
        <div className="flex items-start justify-between gap-3">
          <h3 className={cn("font-bold leading-snug tracking-[-0.01em] text-navy", large ? "text-[clamp(20px,1.8vw,26px)]" : compact ? "text-base" : "text-[17px]")}>
            <Link href={`/news/${article.slug}`} className={STRETCH}>
              <Highlight text={article.judul} q={q} />
            </Link>
          </h3>
          <ArrowUpRight aria-hidden className={cn(ARROW, "mt-0.5")} />
        </div>
        {large && (
          <p className="line-clamp-3 text-[14.5px] leading-relaxed text-secondary">
            <Highlight text={article.excerpt} q={q} />
          </p>
        )}
        <p className="mt-auto pt-1 text-[12.5px] text-muted">{article.estimasiBaca} menit baca</p>
      </div>
    </article>
  );
}
