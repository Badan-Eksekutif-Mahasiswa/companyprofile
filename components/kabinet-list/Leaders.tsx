import type { Kabinet, Tokoh } from "@/lib/kabinet";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";
import { LeaderPortrait } from "./LeaderPortrait";

function Leader({ t, label, flip }: { t: Tokoh; label: string; flip?: boolean }) {
  return (
    <div id={flip ? "wakil-ketua" : "ketua"} className={cn("grid scroll-mt-28 items-end gap-8 md:grid-cols-12 md:gap-12", flip && "md:mt-28")}>
      <div className={cn("md:col-span-6", flip ? "md:order-2 md:col-start-7" : "md:col-start-1")}>
        {t.fotos?.length ? (
          <figure className="relative m-0 overflow-hidden rounded-lg shadow-lg shadow-black/20">
            <LeaderPortrait photos={t.fotos} name={t.nama} />
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 p-6 text-white [text-shadow:0_2px_8px_rgb(0_0_0_/_55%)] sm:p-7 md:p-9">
              <div className="mb-2 text-[13px] font-bold uppercase text-pink-light">{t.jabatan}</div>
              <div className="max-w-full break-words text-[28px] font-bold leading-[1.12] sm:text-[36px] lg:text-[42px]">{t.nama}</div>
              <div className="mt-2 text-[15px] font-medium text-white/70">{t.fakultas}</div>
            </figcaption>
          </figure>
        ) : (
        <Reveal>
        <figure className="group relative min-h-[520px] overflow-hidden rounded-2xl bg-navy-10 shadow-lg md:min-h-[640px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={t.foto.url} alt={t.foto.alt} className="absolute inset-0 size-full object-cover transition-transform duration-[1200ms] ease-out-expo group-hover:scale-[1.04]" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/10 to-transparent" />
          <figcaption className="absolute inset-x-0 bottom-0 p-7 text-white md:p-9">
            <div className="mb-2 text-[13px] font-bold uppercase tracking-[0.12em] text-pink-light">{t.jabatan}</div>
            <div className="text-[clamp(30px,3.6vw,52px)] font-extrabold leading-[1.02] tracking-[-0.03em]">{t.nama}</div>
            <div className="mt-2 text-sm text-white/70">{t.fakultas}</div>
          </figcaption>
        </figure>
        </Reveal>
        )}
      </div>

      <Reveal delay={150} className={cn("md:col-span-5 md:pb-6", flip ? "md:order-1 md:col-start-1" : "md:col-start-8")}>
        <div className="mb-4 text-[13px] font-bold uppercase tracking-[0.12em] text-accent-hover">{label}</div>
        <blockquote className="text-[clamp(22px,2.4vw,34px)] font-semibold leading-[1.25] tracking-[-0.01em]">“{t.kutipan}”</blockquote>
      </Reveal>
    </div>
  );
}

export function Leaders({ kabinet }: { kabinet: Kabinet }) {
  return (
    <section id="pimpinan" className="mx-auto max-w-wrap scroll-mt-28 px-6 py-12 md:py-20" aria-label="Ketua dan Wakil Ketua">
      <div className="space-y-20 md:space-y-8">
        {kabinet.ketua.nama && <Leader t={kabinet.ketua} label="Ketua" />}
        {kabinet.wakil.nama && <Leader t={kabinet.wakil} label="Wakil Ketua" flip />}
      </div>
    </section>
  );
}
