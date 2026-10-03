"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Mobile (< md): carousel geser dengan kartu samping miring 3D (coverflow) + titik indikator.
 * Desktop: grid 3 kolom biasa, tanpa transform.
 */
export function NewsCarousel({ children, labels }: { children: React.ReactNode[]; labels: string[] }) {
  const listRef = React.useRef<HTMLUListElement>(null);
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    const ul = listRef.current;
    if (!ul) return;
    const mobile = window.matchMedia("(max-width: 767px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    const update = () => {
      raf = 0;
      const items = Array.from(ul.children) as HTMLElement[];
      if (!mobile.matches) {
        items.forEach((el) => {
          el.style.transform = "";
          el.style.opacity = "";
        });
        return;
      }
      const center = ul.scrollLeft + ul.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      items.forEach((el, i) => {
        // -1 = satu kartu di kiri, 0 = tengah, 1 = satu kartu di kanan
        const t = Math.max(-1, Math.min(1, (el.offsetLeft + el.offsetWidth / 2 - center) / el.offsetWidth));
        if (Math.abs(t) < bestDist) {
          bestDist = Math.abs(t);
          best = i;
        }
        if (!reduce) el.style.transform = `perspective(900px) rotateY(${t * 30}deg) scale(${1 - Math.abs(t) * 0.12})`;
        el.style.opacity = String(1 - Math.abs(t) * 0.35);
      });
      setActive(best);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    const late = setTimeout(schedule, 300); // ukur ulang setelah font/gambar selesai memengaruhi layout
    ul.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    mobile.addEventListener("change", schedule);
    return () => {
      clearTimeout(late);
      cancelAnimationFrame(raf);
      ul.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      mobile.removeEventListener("change", schedule);
    };
  }, []);

  const goTo = (i: number) => {
    const ul = listRef.current;
    const el = ul?.children[i] as HTMLElement | undefined;
    if (!ul || !el) return;
    ul.scrollTo({ left: el.offsetLeft - (ul.clientWidth - el.offsetWidth) / 2, behavior: "smooth" });
  };

  return (
    <>
      <ul
        ref={listRef}
        className="-mx-5 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-[16vw] py-4 [scrollbar-width:none] md:mx-0 md:mt-10 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:p-0 [&::-webkit-scrollbar]:hidden"
      >
        {children.map((child, i) => (
          <li key={i} className="w-[68vw] shrink-0 snap-center will-change-transform md:w-auto md:will-change-auto">
            {child}
          </li>
        ))}
      </ul>
      {children.length > 1 && (
        <div className="mt-4 flex justify-center gap-2 md:hidden">
          {labels.map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Berita ${i + 1}: ${label}`}
              aria-current={i === active ? "true" : undefined}
              className={cn(
                "h-2 rounded-full transition-all duration-500 ease-out-expo",
                i === active ? "w-8 bg-gradient-to-r from-accent to-pink-light" : "w-2 bg-navy/20",
              )}
            />
          ))}
        </div>
      )}
    </>
  );
}
