import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Kabinet } from "@/lib/kabinet";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

const Num = ({ children }: { children: React.ReactNode }) => <span className="font-extrabold text-accent">{children}</span>;

function Proker({ p, i, className, aspect }: { p: Kabinet["proker"][number]; i: number; className?: string; aspect: string }) {
  return (
    <Link href={`/kabinet/${p.divisi}`} className={cn("group block", className)}>
      <div className={cn("relative overflow-hidden rounded-2xl bg-navy-10 shadow-md", aspect)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.image} alt={p.title} loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-[1100ms] ease-out-expo group-hover:scale-[1.05]" />
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-[13px] font-bold tracking-[0.12em] text-accent-hover">{String(i + 1).padStart(2, "0")} — {p.date.toUpperCase()}</div>
          <div className="mt-1 text-[clamp(18px,1.6vw,24px)] font-bold leading-snug tracking-[-0.01em]">{p.title}</div>
        </div>
        <ArrowUpRight aria-hidden className="mt-1 size-6 shrink-0 text-navy-50 transition-all duration-base group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
      </div>
    </Link>
  );
}

/** Alternatif B: kalimat berangka inline + kolase proker asimetris (bukan stat card). */
export function ProkerSpotlight({ kabinet }: { kabinet: Kabinet }) {
  const { stats, proker } = kabinet;
  const [p1, p2, p3] = proker;
  return (
    <section className="mx-auto max-w-wrap px-6 pb-32" aria-labelledby="spot-title">
      <Reveal>
        <h2 id="spot-title" className="max-w-[1000px] text-[clamp(28px,4.4vw,64px)] font-bold leading-[1.1] tracking-[-0.03em]">
          <Num>{stats.divisi}</Num> divisi, <Num>{stats.anggota}+</Num> anggota, dan <Num>{stats.proker}</Num> program kerja dari <Num>{stats.fakultas}</Num> fakultas — bergerak dalam satu kabinet.
        </h2>
      </Reveal>

      {/* Kolase butuh data proker; kabinet yang baru terbit di SIT bisa belum punya proker. */}
      {p1 && (
        <>
          <div className="mt-6 text-[13px] font-bold uppercase tracking-[0.12em] text-muted">Program kerja terbaru</div>

          <div className="mt-8 grid gap-x-8 gap-y-14 md:grid-cols-12">
            <Reveal className="md:col-span-7">
              <Proker p={p1} i={0} aspect="aspect-[4/5]" />
            </Reveal>
            {p2 && (
              <div className="space-y-14 md:col-span-5 md:pt-24">
                <Reveal delay={120}>
                  <Proker p={p2} i={1} aspect="aspect-[7/5]" />
                </Reveal>
                {p3 && (
                  <Reveal delay={200} className="md:ml-16">
                    <Proker p={p3} i={2} aspect="aspect-square" />
                  </Reveal>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
