import Link from "next/link";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { categoryLabel, formatTanggal, type NewsArticle } from "@/lib/news";
import { CATEGORY_STYLE } from "./category-style";
import { Cover } from "./cover";

export interface ArticleCardProps {
  article: NewsArticle;
  /** "large" = kartu besar (cover tinggi, excerpt); "small" = kartu ringkas. */
  size?: "large" | "small" | "compact";
  className?: string;
}

export function ArticleCard({ article, size = "small", className }: ArticleCardProps) {
  const large = size === "large";
  if (size === "compact") {
    return (
      <article data-cursor="Baca" className={cn("group relative grid grid-cols-[40%_1fr] gap-4 rounded-2xl border border-glass-border bg-glass p-3 shadow-glass-soft backdrop-blur-glass transition-[transform,box-shadow] duration-base ease-out-expo hover:-translate-y-1 hover:shadow-glass", className)}>
        <Cover kategori={article.kategori} src={article.heroImage} className="aspect-[4/3] rounded-xl" sizes="(min-width: 1024px) 20vw, 40vw" />
        <div className="flex flex-col gap-1.5">
          <Badge variant={CATEGORY_STYLE[article.kategori].badge} className="self-start">{categoryLabel(article.kategori)}</Badge>
          <h3 className="text-base font-extrabold leading-snug text-navy transition-colors duration-fast group-hover:text-accent">
            <Link href={`/news/${article.slug}`} className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-4 focus-visible:after:ring-pink-pale">
              {article.judul}
            </Link>
          </h3>
          <p className="mt-auto text-[12.5px] text-muted">
            <time dateTime={article.tanggal}>{formatTanggal(article.tanggal)}</time> · {article.estimasiBaca} mnt
          </p>
        </div>
      </article>
    );
  }
  return (
    <article data-cursor="Baca" className={cn("group relative flex flex-col", className)}>
      <Cover
        kategori={article.kategori}
        src={article.heroImage}
        className={cn("rounded-xl", large ? "aspect-[16/10]" : "aspect-[4/3]")}
        sizes={large ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"}
      />
      <div className="mt-4 flex flex-1 flex-col gap-2">
        <div className="flex items-center gap-2 text-[12.5px] text-muted">
          <Badge variant={CATEGORY_STYLE[article.kategori].badge}>{categoryLabel(article.kategori)}</Badge>
          <time dateTime={article.tanggal}>{formatTanggal(article.tanggal)}</time>
        </div>
        <h3
          className={cn(
            "font-extrabold leading-snug text-navy transition-colors duration-fast group-hover:text-accent",
            large ? "text-xl" : "text-base"
          )}
        >
          {/* Link meregang ke seluruh kartu; fokus keyboard tampil di kartu. */}
          <Link
            href={`/news/${article.slug}`}
            className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-4 focus-visible:after:ring-pink-pale"
          >
            {article.judul}
          </Link>
        </h3>
        {large && <p className="line-clamp-3 text-[14.5px] leading-relaxed text-secondary">{article.excerpt}</p>}
        <p className="mt-auto pt-1 text-[12.5px] text-muted">{article.estimasiBaca} menit baca</p>
      </div>
    </article>
  );
}
