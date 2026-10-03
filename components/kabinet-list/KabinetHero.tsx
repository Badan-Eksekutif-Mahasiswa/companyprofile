import type { Kabinet } from "@/lib/kabinet";
import { Badge } from "@/components/ui";
import { MeshGradient } from "@/components/webgl";
import { Reveal } from "./Reveal";

export function KabinetHero({ kabinet }: { kabinet: Kabinet }) {
  return (
    <header className="relative overflow-hidden pb-16 pt-32 md:pt-40">
      <MeshGradient className="h-full" />
      <div className="relative mx-auto max-w-wrap px-6">
        <Reveal>
          <Badge className="mb-6 px-3.5 py-1.5 text-[13px]">{kabinet.periode}</Badge>
        </Reveal>

        <h1 className="text-[clamp(56px,11vw,168px)] font-extrabold leading-[0.9] tracking-[-0.04em]">
          <Reveal as="span" className="block">
            Kabinet
          </Reveal>
          <Reveal as="span" className="block" delay={120}>
            <span className="inline-flex items-center rounded-xl border border-glass-border bg-glass px-[0.22em] pb-[0.04em] text-maroon shadow-glass backdrop-blur-glass">
              Terus Terang
            </span>
          </Reveal>
        </h1>

        <div className="mt-14 grid gap-12 md:mt-20 md:grid-cols-12">
          <Reveal className="md:col-span-4" delay={200}>
            <p className="text-[17px] font-medium leading-relaxed text-secondary">{kabinet.deskripsi}</p>
          </Reveal>
          <Reveal className="md:col-span-7 md:col-start-6" delay={280}>
            <div className="mb-3 text-[13px] font-bold uppercase tracking-[0.12em] text-accent-hover">Visi</div>
            <p className="text-[clamp(22px,2.4vw,34px)] font-semibold leading-[1.25] tracking-[-0.01em]">{kabinet.visi}</p>
          </Reveal>
        </div>

        <div className="mt-20 md:mt-28">
          <Reveal>
            <div className="mb-2 text-[13px] font-bold uppercase tracking-[0.12em] text-accent-hover">Misi</div>
          </Reveal>
          <ol className="border-t border-navy-30/60">
            {kabinet.misi.map((m, i) => (
              <Reveal as="li" key={i} delay={i * 80} className="grid grid-cols-[auto_1fr] items-center gap-x-6 border-b border-navy-30/60 py-6 md:grid-cols-12 md:gap-x-0">
                <span className="text-[clamp(32px,4vw,56px)] font-extrabold leading-none tracking-[-0.03em] text-accent md:col-span-2">{String(i + 1).padStart(2, "0")}</span>
                <p className="text-[clamp(17px,1.5vw,21px)] font-medium leading-snug md:col-span-8 md:col-start-3">{m}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </header>
  );
}
