"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SearchX, Search } from "lucide-react";
import { Button, EmptyState, InputWithIcon } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  NEWS_CATEGORIES,
  categoryLabel,
  collectTags,
  filterArticles,
  isNewsCategory,
  tagKey,
  type NewsArticle,
} from "@/lib/news";
import { ArticleCard } from "./article-card";
import { FeaturedArticle } from "./featured-article";
import { Reveal } from "@/components/motion";
import { TagCloud } from "./tag-cloud";

const PAGE_SIZE = 6;

/**
 * Seluruh state filter hidup di URL (?kategori=, ?tag=, ?q=) supaya bisa
 * dibagikan, di-bookmark, dan tombol Back berfungsi.
 */
export function NewsBrowser({ articles }: { articles: NewsArticle[] }) {
  const pathname = usePathname();
  const params = useSearchParams();

  const rawKategori = params.get("kategori");
  const kategori = isNewsCategory(rawKategori) ? rawKategori : null;
  const tag = params.get("tag") ? tagKey(params.get("tag") as string) : null;
  const q = params.get("q") ?? "";

  const [query, setQuery] = React.useState(q);
  const [visible, setVisible] = React.useState(PAGE_SIZE);
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  // Sinkronkan kotak pencarian bila URL berubah dari luar (Back/Forward).
  
  const setParam = React.useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(window.location.search);
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      const qs = next.toString();
      // History API native (Next 14.1+): URL & useSearchParams ikut update tanpa request ke server.
      window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname]
  );

  // Hasil pencarian dihitung dari `query` (state lokal) supaya instan; URL menyusul setelah jeda.
  const lastPushed = React.useRef(q);
  React.useEffect(() => {
    const t = setTimeout(() => {
      const v = query.trim();
      if (v !== lastPushed.current.trim()) {
        lastPushed.current = v;
        setParam({ q: v || null });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, setParam]);

  // Sinkron dari URL hanya bila berubah dari luar (mis. tombol Back).
  React.useEffect(() => {
    if (q !== lastPushed.current) {
      lastPushed.current = q;
      setQuery(q);
    }
  }, [q]);

  React.useEffect(() => setVisible(PAGE_SIZE), [kategori, tag, query]);

  const results = React.useMemo(() => filterArticles(articles, { kategori, tag, q: query }), [articles, kategori, tag, query]);
  const tags = React.useMemo(() => collectTags(articles), [articles]);
  const tagLabel = tags.find((t) => t.key === tag)?.label;

  const searching = query.trim().length > 0;
  const filtered = Boolean(kategori || tag || searching);
  const featured = searching ? undefined : results[0];
  const rest = searching ? results : results.slice(1);
  const shown = rest.slice(0, visible);

  const reset = () => {
    setQuery("");
    lastPushed.current = "";
    window.history.replaceState(null, "", pathname);
    setParam({});
  };

  return (
    <>
      <div className="flex flex-col gap-5">
        <div role="search" className="max-w-xl">
          <label htmlFor="news-search" className="sr-only">
            Cari artikel
          </label>
          <InputWithIcon
            id="news-search"
            type="search"
            icon={<Search />}
            placeholder="Cari artikel…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div role="group" aria-label="Filter kategori" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {[{ value: null, label: "Semua" }, ...NEWS_CATEGORIES].map((c) => {
            const on = (c.value ?? null) === kategori;
            return (
              <button
                key={c.label}
                type="button"
                aria-pressed={on}
                onClick={() => setParam({ kategori: c.value })}
                className={cn(
                  "shrink-0 rounded-full border-[1.5px] px-4 py-2 text-sm font-bold outline-none transition-colors duration-fast focus-visible:ring-4 focus-visible:ring-pink-pale",
                  on
                    ? "border-navy bg-navy text-white"
                    : "border-border bg-white text-navy hover:border-accent hover:text-accent"
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {tag && (
          <p className="text-sm text-secondary">
            Topik: <strong className="text-navy">#{tagLabel ?? tag}</strong>{" "}
            <button
              type="button"
              onClick={() => setParam({ tag: null })}
              className="ml-1 font-bold text-accent underline underline-offset-2 outline-none focus-visible:ring-4 focus-visible:ring-pink-pale"
            >
              Hapus
            </button>
          </p>
        )}
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {results.length} artikel ditemukan
      </p>
      <h2 ref={headingRef} tabIndex={-1} className="sr-only">
        Daftar artikel
      </h2>

      {results.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon={<SearchX />}
            title={
              query.trim()
                ? `Tidak ada artikel untuk “${query.trim()}”`
                : kategori
                  ? `Belum ada artikel di ${categoryLabel(kategori)}`
                  : "Tidak ada artikel yang cocok"
            }
            description="Coba kata kunci lain atau hapus filter."
            action={
              <Button variant="outline" size="sm" onClick={reset}>
                Reset filter
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {featured && (
            <div className="mt-10">
              <Reveal>
                <FeaturedArticle article={featured} />
              </Reveal>
            </div>
          )}

          {shown.length > 0 && (
            <div className="mt-16 border-t-2 border-navy pt-3">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.14em] text-navy">
                {searching ? `Hasil pencarian (${results.length})` : "Terbaru"}
              </h2>
              <div className="mt-8 grid gap-x-8 gap-y-12 lg:grid-cols-12">
                {Array.from({ length: Math.ceil(shown.length / 6) }, (_, c) => shown.slice(c * 6, c * 6 + 6)).map((blok, c) => (
                  <React.Fragment key={c}>
                    <Reveal className="lg:col-span-7">
                      <ArticleCard article={blok[0]} size="large" className="h-full" />
                    </Reveal>
                    {blok.length > 1 && (
                      <div className="flex flex-col gap-8 lg:col-span-5">
                        {blok.slice(1, 3).map((a, i) => (
                          <Reveal key={a.slug} index={i + 1}>
                            <ArticleCard article={a} size="compact" />
                          </Reveal>
                        ))}
                      </div>
                    )}
                    {blok.slice(3).map((a, i) => (
                      <Reveal key={a.slug} index={i} className="lg:col-span-4">
                        <ArticleCard article={a} size="small" className="h-full" />
                      </Reveal>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {rest.length > shown.length && (
            <div className="mt-12 flex justify-center">
              <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                Muat Lebih Banyak
              </Button>
            </div>
          )}
        </>
      )}

      <TagCloud tags={tags} active={tag} onSelect={(key) => setParam({ tag: key })} />
      {filtered && results.length > 0 && (
        <p className="mt-6 text-center text-sm text-muted">
          <button type="button" onClick={reset} className="font-bold text-accent underline underline-offset-2">
            Reset semua filter
          </button>
        </p>
      )}
    </>
  );
}
