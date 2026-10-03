import Link from "next/link";
import type { Divisi } from "@/lib/kabinet";
import { Reveal } from "./Reveal";
import { Plate } from "./Plate";

/** Tile foto BPH tiap departemen di atas putih (4-4-4-3-2), tanpa panel latar. */
export function DivisiGrid({ divisi }: { divisi: Divisi[] }) {
  return (
    <section className="mx-auto max-w-wrap px-6 pb-24 md:pb-32" aria-labelledby="divisi-title">
      <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <h2 id="divisi-title" className="text-[clamp(36px,5vw,72px)] font-extrabold leading-[0.95] tracking-[-0.035em]">
          Departemen
          <br />& Biro
        </h2>
        <p className="max-w-[320px] text-[15px] leading-relaxed text-secondary">{divisi.length} divisi yang bekerja bersama. Arahkan kursor untuk ringkasan, klik untuk masuk.</p>
      </Reveal>
      <ul className="flex flex-wrap justify-center gap-5">
        {divisi.map((d, i) => (
          <li key={d.slug} className="w-full min-[520px]:w-[calc(50%-10px)] lg:w-[calc(25%-15px)]">
            <Reveal delay={(i % 4) * 70}>
              <Link
                href={`/kabinet/${d.slug}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-navy-5 shadow-sm transition-all duration-base ease-out-expo hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.foto_bph.url} alt={d.foto_bph.alt} loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.06]" />
                <Plate d={d} />
              </Link>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
