"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { SearchX, Search } from "lucide-react";
import { Button, EmptyState, InputWithIcon } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  BULAN,
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
import { LIST_KEY, BACK_FLAG } from "./list-memory";

const PAGE_SIZE = 6;

export function NewsBrowser({ articles }: { articles: NewsArticle[] }) {
  const pathname = usePathname();
  const params = useSearchParams();

  const rawKategori = params.get("kategori");
  const kategori = isNewsCategory(rawKategori) ? rawKategori : null;
  const tag = params.get("tag") ? tagKey(params.get("tag") as string) : null;
  const q = params.get("q") ?? "";
  const tahun = params.get("tahun");
  const bulan = tahun ? params.get("bulan") : null;

  const [query, setQuery] = React.useState(q);
  const [visible, setVisible] = React.useState(PAGE_SIZE);
  const headingRef = React.useRef<HTMLHeadingElement>(null);


  const setParam = React.useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(window.location.search);
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      const qs = next.toString();
      window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname]
  );

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

  React.useEffect(() => {
    if (q !== lastPushed.current) {
      lastPushed.current = q;
      setQuery(q);
    }
  }, [q]);

  const sig = React.useRef<string | null>(null);
  React.useEffect(() => {
    const now = JSON.stringify([kategori, tag, query, tahun, bulan]);
    if (sig.current === null) { sig.current = now; return; }
    if (sig.current !== now) { sig.current = now; setVisible(PAGE_SIZE); }
  }, [kategori, tag, query, tahun, bulan]);

  const visibleRef = React.useRef(visible);
  visibleRef.current = visible;
  React.useEffect(() => {
    const save = () => {
      try {
        sessionStorage.setItem(LIST_KEY, JSON.stringify({ url: location.pathname + location.search, y: window.scrollY, visible: visibleRef.current }));
      } catch {}
    };
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a[href^="/news/"]')) save();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("pagehide", save);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("pagehide", save);
    };
  }, []);

  React.useEffect(() => {
    try {
      // Pulihkan posisi hanya saat kembali dari artikel.
      if (sessionStorage.getItem(BACK_FLAG) !== "1") return;
      setTimeout(() => { try { sessionStorage.removeItem(BACK_FLAG); } catch {} }, 2500);
      const s = JSON.parse(sessionStorage.getItem(LIST_KEY) ?? "null");
      if (!s || s.url !== location.pathname + location.search) return;
      setVisible(Math.max(PAGE_SIZE, s.visible));
      let n = 0;
      const go = () => {
        window.scrollTo(0, s.y);
        if (++n < 6 && Math.abs(window.scrollY - s.y) > 4) setTimeout(go, 100);
      };
      requestAnimationFrame(go);
    } catch {}
  }, []);

  const results = React.useMemo(() => filterArticles(articles, { kategori, tag, q: query, tahun, bulan }), [articles, kategori, tag, query, tahun, bulan]);
  const tags = React.useMemo(() => collectTags(articles), [articles]);
  const tagLabel = tags.find((t) => t.key === tag)?.label;

  const years = React.useMemo(() => [...new Set(articles.map((x) => x.tanggal.slice(0, 4)))].sort().reverse(), [articles]);
  const months = React.useMemo(
    () => [...new Set(articles.filter((x) => x.tanggal.startsWith(tahun ?? "")).map((x) => Number(x.tanggal.slice(5, 7))))].sort((a, b) => a - b),
    [articles, tahun]
  );
  const searching = query.trim().length > 0;
  const filtered = Boolean(kategori || tag || searching || tahun);
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
        <div role="search" className="max-w-xl ">
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

        {(
          <div role="group" aria-label="Filter kategori" className="-mx-4 flex gap-2 overflow-x-auto px-4 py-2 sm:mx-0 sm:flex-wrap sm:px-0">
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
                      ? "border-navy bg-navy text-white shadow-md"
                      : "border-border bg-white text-navy hover:border-accent hover:text-accent"
                  )}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-3 text-sm">
          <label className="sr-only" htmlFor="f-tahun">Tahun</label>
          <select
            id="f-tahun"
            value={tahun ?? ""}
            onChange={(e) => setParam({ tahun: e.target.value || null, bulan: null })}
            className="rounded-full border-[1.5px] border-border bg-white px-4 py-2 font-bold text-navy outline-none focus-visible:ring-4 focus-visible:ring-pink-pale"
          >
            <option value="">Semua tahun</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <label className="sr-only" htmlFor="f-bulan">Bulan</label>
          <select
            id="f-bulan"
            value={bulan ?? ""}
            disabled={!tahun}
            onChange={(e) => setParam({ bulan: e.target.value || null })}
            className="rounded-full border-[1.5px] border-border bg-white px-4 py-2 font-bold text-navy outline-none focus-visible:ring-4 focus-visible:ring-pink-pale disabled:opacity-50"
          >
            <option value="">Semua bulan</option>
            {months.map((m) => <option key={m} value={m}>{BULAN[m - 1]}</option>)}
          </select>
        </div>

        {tag && (
          <p className="text-sm text-secondary">
            Topik: <strong className="text-navy">#{tagLabel ?? tag}</strong>{" "}
            <Link href={`/news/tag/${encodeURIComponent(tag)}`} className="ml-1 font-bold text-accent underline underline-offset-2">Halaman topik</Link>{" "}
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
                <FeaturedArticle article={featured} q={query} />
              </Reveal>
            </div>
          )}

          {shown.length > 0 && (
            <div className="mt-20">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="text-[clamp(32px,4.5vw,64px)] font-bold leading-[0.95] tracking-normal text-navy">
                  {searching ? "Hasil pencarian" : "Artikel terbaru"}
                </h2>
                <p className="max-w-[320px] text-[15px] leading-relaxed text-secondary">{results.length} artikel. Klik kartu untuk membaca selengkapnya.</p>
              </div>
              <div className="mt-8 grid gap-x-8 gap-y-12 lg:grid-cols-12">
                {Array.from({ length: Math.ceil(shown.length / 6) }, (_, c) => shown.slice(c * 6, c * 6 + 6)).map((blok, c) => (
                  <React.Fragment key={c}>
                    <Reveal className="lg:col-span-7">
                      <ArticleCard article={blok[0]} size="large" className="h-full" q={query} />
                    </Reveal>
                    {blok.length > 1 && (
                      <div className="flex flex-col gap-8 lg:col-span-5">
                        {blok.slice(1, 3).map((a, i) => (
                          <Reveal key={a.slug} index={i + 1}>
                            <ArticleCard article={a} size="compact" q={query} />
                          </Reveal>
                        ))}
                      </div>
                    )}
                    {blok.slice(3).map((a, i) => (
                      <Reveal key={a.slug} index={i} className="lg:col-span-4">
                        <ArticleCard article={a} size="small" className="h-full" q={query} />
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
