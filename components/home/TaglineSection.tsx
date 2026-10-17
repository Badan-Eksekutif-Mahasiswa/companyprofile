import { Card } from "@/components/ui";
import { MeshGradient } from "@/components/webgl";
import { SITE } from "@/config/site";
import { plain, type Kabinet } from "@/lib/kabinet";

/** Tagline kabinet sebagai elemen tipografi dominan (PRD 3.1), di atas MeshGradient design system. */
export function TaglineSection({ kabinet }: { kabinet: Kabinet }) {
  return (
    <section aria-labelledby="tagline-title" className="relative isolate overflow-hidden py-24 sm:py-32">
      <MeshGradient className="-z-10 h-full" />
      <div className="mx-auto max-w-wrap px-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Tentang BEM UI</p>
        <h2
          id="tagline-title"
          className="mt-4 text-[clamp(3.25rem,11vw,9rem)] font-bold leading-[0.9] tracking-normal text-navy"
        >
          {SITE.tagline}
        </h2>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-secondary sm:text-xl">{kabinet.deskripsi}</p>

        {/* Kata kunci misi kabinet (data tim kabinet) */}
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kabinet.misi.map((m, i) => (
            <li key={m.kunci}>
              <Card variant="glass" className="h-full">
                <span className="text-sm font-bold text-accent">0{i + 1}</span>
                <p className="mt-6 text-2xl font-extrabold tracking-tight">{m.kunci}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-secondary">{plain(m.teks)}</p>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
