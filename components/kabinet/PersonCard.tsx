"use client";

import type { Person } from "@/lib/kabinet";
import { LeaderPortrait } from "@/components/kabinet-list/LeaderPortrait";

export function PersonCard({ p, academic = false }: { p: Person; academic?: boolean }) {
  const subtitle = academic ? p.jurusanAngkatan : p.jabatan;
  return (
    <figure className="person-card group relative m-0 aspect-[3/4] overflow-hidden rounded-lg border border-border bg-navy-5 shadow-sm transition-shadow duration-base ease-out-expo hover:shadow-lg">
      {p.fotos?.length ? <LeaderPortrait photos={p.fotos} name={p.nama} /> : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.foto.url} alt={p.foto.alt || p.nama} loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.06]" />
      )}
      <figcaption className="absolute inset-x-3 bottom-3 rounded-lg border border-glass-border bg-glass-strong p-3 shadow-glass-soft backdrop-blur-glass">
        <div className="text-[14px] font-bold leading-tight text-navy">{p.nama}</div>
        {subtitle && <div className={`mt-0.5 text-[11px] font-semibold text-secondary${academic ? "" : " uppercase"}`}>{subtitle}</div>}
        {!academic && p.jurusanAngkatan && <div className="mt-1 text-[11px] text-secondary">{p.jurusanAngkatan}</div>}
      </figcaption>
    </figure>
  );
}
