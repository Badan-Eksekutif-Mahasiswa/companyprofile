import type { Kabinet } from "@/lib/kabinet";
import { MeshGradient } from "@/components/webgl";
import { Reveal } from "./Reveal";

export function KabinetHero({ kabinet }: { kabinet: Kabinet }) {
  const hashtag = `#${kabinet.nama.replace(/^kabinet\s+/i, "").replace(/^#/, "").replace(/\s+/g, "")}`;
  return (
    <header className="relative overflow-hidden pb-16 pt-32 md:pt-40">
      <MeshGradient className="h-full" />
      <div className="relative mx-auto max-w-wrap px-6">
        <h1 className="break-words text-[32px] font-bold leading-tight tracking-normal text-maroon sm:text-[56px] lg:text-[104px] xl:text-[128px]">
          <Reveal as="span" className="block">
            {hashtag}
          </Reveal>
        </h1>

        <div className="mt-14 grid gap-12 md:mt-20 md:grid-cols-12">
          <Reveal className="md:col-span-4" delay={200}>
            <p className="text-[17px] font-medium leading-relaxed text-secondary">{kabinet.deskripsi}</p>
          </Reveal>
          <Reveal className="md:col-span-7 md:col-start-6" delay={280}>
            <div className="mb-3 text-[13px] font-bold uppercase tracking-[0.12em] text-accent-hover">Visi</div>
            <p className="text-[24px] font-semibold leading-[1.35] tracking-normal md:text-[32px]">{kabinet.visi}</p>
          </Reveal>
        </div>
      </div>
    </header>
  );
}
