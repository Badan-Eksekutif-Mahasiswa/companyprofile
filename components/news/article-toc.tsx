"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Heading } from "@/lib/news";

/** Daftar isi: lengket di desktop, lipat di mobile. Subjudul aktif ditandai saat scroll. */
export function ArticleToc({ headings }: { headings: Heading[] }) {
  const [active, setActive] = React.useState(headings[0]?.id);

  React.useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter(Boolean) as HTMLElement[];
    const onScroll = () => {
      let cur = els[0]?.id;
      for (const el of els) if (el.getBoundingClientRect().top <= 140) cur = el.id;
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headings]);

  const list = (
    <ol className="space-y-1.5 text-[14px]">
      {headings.map((h) => (
        <li key={h.id} className={h.level === 3 ? "pl-4" : undefined}>
          <a
            href={`#${h.id}`}
            aria-current={active === h.id ? "location" : undefined}
            className={cn(
              "block rounded-lg px-3 py-1.5 font-semibold leading-snug outline-none transition-colors duration-fast focus-visible:ring-4 focus-visible:ring-pink-pale",
              active === h.id ? "bg-pink-pale text-accent" : "text-secondary hover:text-navy"
            )}
          >
            {h.text}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <nav aria-label="Daftar isi">
      <details className="rounded-2xl border border-border bg-white p-4 lg:hidden">
        <summary className="cursor-pointer text-sm font-extrabold text-navy">Daftar isi</summary>
        <div className="mt-3">{list}</div>
      </details>
      <div className="hidden lg:block">
        <h2 className="mb-3 text-sm font-extrabold uppercase tracking-[0.14em] text-navy">Daftar isi</h2>
        {list}
      </div>
    </nav>
  );
}
