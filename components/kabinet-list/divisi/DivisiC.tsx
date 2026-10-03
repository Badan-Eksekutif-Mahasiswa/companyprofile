import Link from "next/link";
import type { CSSProperties } from "react";
import type { Divisi } from "@/lib/kabinet";
import { Reveal } from "../Reveal";
import { Plate } from "./Plate";
import { cn } from "@/lib/utils";

/**
 * Opsi C — bento tak seragam di atas putih. Unit 5 tile (1 besar 6×2 + 4 kecil 3×1),
 * besar bergantian kiri/kanan. Sisa tile terakhir melebar 6 kolom.
 */
function place(i: number, total: number): { big: boolean; css: CSSProperties } {
  const unit = Math.floor(i / 5);
  const pos = i % 5;
  const base = unit * 2 + 1;
  const rightBig = unit % 2 === 1;
  const full = total - unit * 5 >= 5; // unit lengkap?
  if (!full) {
    const k = i - unit * 5; // 0..n-1 sisa
    return { big: false, css: { "--c": `${k === 0 ? 1 : 7} / span 6`, "--r": `${base} / span 1` } as CSSProperties };
  }
  if (pos === 0) return { big: true, css: { "--c": `${rightBig ? 7 : 1} / span 6`, "--r": `${base} / span 2` } as CSSProperties };
  const col = (rightBig ? 1 : 7) + ((pos - 1) % 2) * 3;
  const row = base + Math.floor((pos - 1) / 2);
  return { big: false, css: { "--c": `${col} / span 3`, "--r": `${row} / span 1` } as CSSProperties };
}

export function DivisiC({ divisi }: { divisi: Divisi[] }) {
  return (
    <section className="mx-auto max-w-wrap px-6 pb-24 md:pb-32" aria-labelledby="divisi-c">
      <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <h2 id="divisi-c" className="text-[clamp(36px,5vw,72px)] font-extrabold leading-[0.95] tracking-[-0.035em]">
          Departemen
          <br />& Biro
        </h2>
        <p className="max-w-[320px] text-[15px] leading-relaxed text-secondary">{divisi.length} divisi yang bekerja bersama. Arahkan kursor untuk ringkasan, klik untuk masuk.</p>
      </Reveal>
      <ul className="grid auto-rows-[190px] grid-cols-2 gap-4 sm:auto-rows-[230px] lg:grid-cols-12 lg:gap-5">
        {divisi.map((d, i) => {
          const { big, css } = place(i, divisi.length);
          return (
            <li key={d.slug} style={css} className={cn("lg:[grid-column:var(--c)] lg:[grid-row:var(--r)]", big && "col-span-2 row-span-2")}>
              <Reveal className="h-full">
                <Link
                  href={`/kabinet/${d.slug}`}
                  className="group relative block h-full overflow-hidden rounded-2xl border border-border bg-navy-5 shadow-sm transition-all duration-base ease-out-expo hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.logo.url} alt={d.logo.alt} loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.06]" />
                  <Plate d={d} always={false} className={big ? "" : "max-sm:p-2.5"} />
                </Link>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
