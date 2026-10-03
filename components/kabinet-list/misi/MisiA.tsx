"use client";

import * as React from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Kabinet } from "@/lib/kabinet";
import { pad, parseMisi } from "./parse";

/** Opsi A — kalimat besar; kata-katanya menyala bertahap mengikuti scroll, frasa kunci berwarna aksen. */
export function MisiA({ misi }: { misi: Kabinet["misi"] }) {
  const root = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>("[data-misi]").forEach((item) => {
        const words = item.querySelectorAll("[data-w]");
        gsap.fromTo(words, { opacity: 0.16 }, { opacity: 1, ease: "none", stagger: 0.12, scrollTrigger: { trigger: item, start: "top 78%", end: "bottom 48%", scrub: true } });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="mx-auto max-w-wrap px-6 py-24 md:py-36" aria-label="Misi">
      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-2">
          <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-accent-hover md:sticky md:top-32">(Misi)</div>
        </div>
        <div className="space-y-[16vh] md:col-span-10 md:pb-[12vh]">
          {misi.map((m, i) => (
            <p key={i} data-misi className="text-[clamp(32px,5.4vw,80px)] font-bold leading-[1.06] tracking-[-0.035em]">
              <sup className="mr-3 align-top text-[14px] font-semibold tracking-normal text-muted">({pad(i)})</sup>
              {parseMisi(m.teks).flatMap((seg, si) =>
                seg.text.split(/(\s+)/).map((w, wi) =>
                  /^\s+$/.test(w) || !w ? (
                    w
                  ) : (
                    <span key={`${si}-${wi}`} data-w className={seg.key ? "text-accent" : undefined}>
                      {w}
                    </span>
                  )
                )
              )}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
