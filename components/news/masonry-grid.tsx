import Link from "next/link";
import { cn } from "@/lib/utils";
import { categoryLabel, formatTanggal, type NewsArticle } from "@/lib/news";
import { Reveal } from "@/components/motion";
import { Cover } from "./cover";

/** Rasio berulang agar tinggi tile bervariasi (efek masonry ala Studio Feixen). */
const RATIOS = ["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[2/3]", "aspect-[4/3]", "aspect-[3/5]", "aspect-[5/6]"];

export function MasonryGrid({ articles }: { articles: NewsArticle[] }) {
  return (
    <ul className="mt-10 columns-2 gap-1 sm:columns-3 lg:columns-4 [&>li]:mb-1 [&>li]:break-inside-avoid">
      {articles.map((a, i) => (
        <li key={a.slug}>
          <Reveal index={i % 4}>
            <article data-cursor="Baca" className="group relative bg-navy-5 p-3 transition-colors duration-base hover:bg-navy-10">
              <Cover kategori={a.kategori} src={a.heroImage} className={cn("w-full", RATIOS[i % RATIOS.length])} sizes="(min-width: 1024px) 25vw, 50vw" />
              <div className="mt-3">
                <h3 className="text-[13.5px] font-extrabold leading-snug text-navy">
                  <Link
                    href={`/news/${a.slug}`}
                    className="outline-none after:absolute after:inset-0 focus-visible:after:ring-4 focus-visible:after:ring-pink-pale"
                  >
                    {a.judul}
                  </Link>
                </h3>
                <p className="mt-1 text-[12px] text-muted">
                  {categoryLabel(a.kategori)} · <time dateTime={a.tanggal}>{formatTanggal(a.tanggal)}</time>
                </p>
              </div>
            </article>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
