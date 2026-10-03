import type { Kabinet } from "@/lib/kabinet";
import { Reveal } from "../Reveal";
import { cn } from "@/lib/utils";
import { pad, parseMisi } from "./parse";

const POS = ["md:col-start-1 md:col-span-7", "md:col-start-5 md:col-span-7", "md:col-start-2 md:col-span-8", "md:col-start-6 md:col-span-7"];
const NUM_POS = ["md:right-0", "md:left-0", "md:right-6", "md:left-10"];

/** Opsi B — paragraf bertingkat asimetris, angka raksasa tipis sebagai latar (gaya majalah). */
export function MisiB({ misi }: { misi: Kabinet["misi"] }) {
  return (
    <section className="mx-auto max-w-wrap px-6 py-24 md:py-36" aria-label="Misi">
      <div className="mb-16 text-[13px] font-bold uppercase tracking-[0.12em] text-accent-hover">(Misi)</div>
      <div className="space-y-10 md:space-y-4">
        {misi.map((m, i) => (
          <div key={i} className="relative grid md:grid-cols-12 md:py-14">
            <span
              aria-hidden
              className={cn("pointer-events-none absolute top-1/2 hidden -translate-y-1/2 select-none text-[clamp(200px,28vw,420px)] font-extrabold leading-[0.8] tracking-[-0.06em] text-navy/[0.06] md:block", NUM_POS[i % 4])}
            >
              {pad(i)}
            </span>
            <Reveal className={cn("relative", POS[i % 4])}>
              <p className="text-[clamp(26px,3.3vw,48px)] font-semibold leading-[1.15] tracking-[-0.025em]">
                {parseMisi(m.teks).map((s, si) => (
                  <span key={si} className={s.key ? "text-accent" : undefined}>
                    {s.text}
                  </span>
                ))}
              </p>
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  );
}
