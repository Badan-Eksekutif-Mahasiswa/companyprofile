import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui";
import { categoryLabel, formatTanggal, type NewsArticle } from "@/lib/news";
import { CATEGORY_STYLE } from "./category-style";
import { Cover } from "./cover";

export function FeaturedArticle({ article }: { article: NewsArticle }) {
  return (
    <article data-cursor="Baca" className="group relative grid gap-6 lg:grid-cols-3 lg:gap-10">
      <Cover
        kategori={article.kategori}
        src={article.heroImage}
        className="aspect-[16/10] rounded-2xl lg:col-span-2 lg:aspect-[16/9]"
        sizes="(min-width: 1024px) 66vw, 100vw"
      />
      <div className="flex flex-col justify-center gap-3">
        <div className="flex items-center gap-2 text-[12.5px] text-muted">
          <Badge variant={CATEGORY_STYLE[article.kategori].badge}>{categoryLabel(article.kategori)}</Badge>
          <time dateTime={article.tanggal}>{formatTanggal(article.tanggal)}</time>
        </div>
        <h2 className="text-2xl font-extrabold leading-tight text-navy transition-colors duration-fast group-hover:text-accent lg:text-[28px]">
          <Link
            href={`/news/${article.slug}`}
            className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-4 focus-visible:after:ring-pink-pale"
          >
            {article.judul}
          </Link>
        </h2>
        <p className="text-[15px] leading-relaxed text-secondary">{article.excerpt}</p>
        <p className="text-[13px] text-muted">
          {article.penulis} · {article.estimasiBaca} menit baca
        </p>
        <span aria-hidden className="inline-flex items-center gap-1.5 text-sm font-bold text-accent">
          Baca selengkapnya
          <ArrowRight className="size-4 transition-transform duration-base ease-out-expo group-hover:translate-x-1" />
        </span>
      </div>
    </article>
  );
}
