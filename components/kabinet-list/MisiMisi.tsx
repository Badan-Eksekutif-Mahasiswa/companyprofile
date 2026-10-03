import type { Kabinet } from "@/lib/kabinet";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";
import { pad, plainText } from "./parse-misi";

/** Misi: satu kata kunci besar per misi, kalimat misi kecil di sisi berlawanan. Ganjil navy, genap pink. */
export function MisiMisi({ misi }: { misi: Kabinet["misi"] }) {
  return (
    <section className="mx-auto max-w-wrap px-6 py-16 md:py-24" aria-label="Misi">
      <div className="mb-10 text-[13px] font-bold uppercase tracking-[0.12em] text-accent-hover">(Misi)</div>
      <div className="space-y-10 md:space-y-8">
        {misi.map((m, i) => {
          const right = i % 2 === 1;
          return (
            <Reveal key={i} className={cn("flex flex-col", right ? "md:items-end" : "md:items-start")}>
              <div
                className={cn("text-[clamp(26px,6.25vw,90px)] font-extrabold uppercase leading-[0.9] tracking-[-0.06em]", right ? "text-accent" : "text-navy")}
              >
                {m.kunci}
              </div>
              <div className={cn("mt-3 flex max-w-[460px] gap-4 md:mt-1", right && "md:flex-row-reverse md:text-right")}>
                <span className="pt-1 text-[13px] font-bold tracking-[0.12em] text-accent">{pad(i)}</span>
                <p className="text-[17px] font-medium leading-snug text-secondary">{plainText(m.teks)}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
