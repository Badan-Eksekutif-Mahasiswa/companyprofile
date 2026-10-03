import { Card } from "@/components/ui";
import { MeshGradient } from "@/components/webgl";
import type { Kabinet } from "@/types";

/** Tagline kabinet sebagai elemen tipografi dominan (PRD 3.1), di atas MeshGradient design system. */
export function TaglineSection({ kabinet }: { kabinet: Kabinet }) {
  return (
    <section aria-labelledby="tagline-title" className="relative isolate overflow-hidden py-24 sm:py-32">
      <MeshGradient className="-z-10 h-full" />
      <div className="mx-auto max-w-wrap px-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Tentang BEM UI</p>
        <h2
          id="tagline-title"
          className="mt-4 text-[clamp(3.25rem,11vw,9rem)] font-extrabold leading-[0.9] tracking-[-0.04em] text-navy"
        >
          {kabinet.tagline}
        </h2>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-secondary sm:text-xl">{kabinet.deskripsi}</p>

        <ol className="mt-12 grid gap-4 sm:grid-cols-3">
          {kabinet.nilai_utama.map((n, i) => (
            <li key={n}>
              <Card variant="glass" className="h-full">
                <span className="text-sm font-bold text-accent">0{i + 1}</span>
                <p className="mt-6 text-2xl font-extrabold tracking-tight">{n}</p>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
