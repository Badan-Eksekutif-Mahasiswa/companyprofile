"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Users } from "lucide-react";
import { Badge } from "@/components/ui";
import { StatusBadge } from "@/components/proker/StatusBadge";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DivisiSummary, HeroProker } from "@/types";

interface Props {
  divisi: DivisiSummary;
  /** Semua proker milik divisi ini. */
  proker: HeroProker[];
  currentProker: string;
  /** Pilih proker lain milik divisi ini (viewer pindah ke proker tsb & kartu dibalik lagi). */
  onSelectProker: (slug: string) => void;
}

/** Sisi belakang kartu proker: ringkasan biro/departemen penyelenggara. */
export function DivisiBack({ divisi, proker, currentProker, onSelectProker }: Props) {
  const [kepala, ...lainnya] = divisi.pengurus;

  return (
    <div className="space-y-6 p-6 sm:p-8">
      <header>
        <Badge variant="navy">{divisi.type}</Badge>
        <h3 className="mt-3 text-3xl font-extrabold leading-none tracking-tight sm:text-4xl">{divisi.singkatan}</h3>
        <p className="mt-1 text-sm font-semibold text-muted">{divisi.nama}</p>
      </header>

      <p className="text-[15px] leading-relaxed text-secondary">{divisi.description}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Info title="Visi">
          <p>{divisi.visi}</p>
        </Info>
        <Info title="Misi">
          <ul className="list-disc space-y-1 pl-4">
            {divisi.misi.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Info>
      </div>

      {kepala && (
        <div className="flex items-center gap-3 rounded-xl bg-navy-5 p-3">
          <Foto nama={kepala.nama} src={kepala.foto} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{kepala.nama}</p>
            <p className="truncate text-xs text-muted">{kepala.jabatan}</p>
          </div>
          <span className="-space-x-2 flex">
            {lainnya.map((p) => (
              <Foto key={p.nama + p.jabatan} nama={p.nama} src={p.foto} small />
            ))}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-muted">
            <Users aria-hidden className="size-3.5" />+{divisi.stafCount} staf
          </span>
        </div>
      )}

      <div>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-muted">Program Kerja</h4>
        <ul className="divide-y divide-divider rounded-xl border border-border">
          {proker.map((p) => {
            const active = p.slug === currentProker;
            return (
              <li key={p.slug}>
                <button
                  type="button"
                  disabled={active}
                  onClick={() => onSelectProker(p.slug)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors",
                    active ? "bg-pink-pale font-bold text-navy" : "hover:bg-navy-5",
                  )}
                >
                  <span className="min-w-0 truncate">
                    {p.nama}
                    {active && <span className="ml-2 text-xs font-semibold text-accent">· sedang dilihat</span>}
                  </span>
                  <StatusBadge status={p.status} className="shrink-0" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <Link
        href={`/kabinet/${divisi.slug}`}
        className="inline-flex items-center gap-1 text-sm font-bold text-accent hover:text-accent-hover"
      >
        Profil lengkap {divisi.singkatan} <ArrowUpRight aria-hidden className="size-4" />
      </Link>
    </div>
  );
}

function Info({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-4 text-[13.5px] leading-relaxed text-secondary">
      <h4 className="mb-1.5 text-xs font-bold uppercase tracking-[0.14em] text-blue">{title}</h4>
      {children}
    </div>
  );
}

/** Foto pengurus dengan fallback inisial bila gagal dimuat (UserFlow F-01 percabangan step 08). */
function Foto({ nama, src, small }: { nama: string; src: string; small?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-gradient-to-br from-pink-light to-blue-soft font-extrabold text-white",
        small ? "size-8 text-[11px]" : "size-11 text-sm",
      )}
    >
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={nama} loading="lazy" className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span aria-label={nama}>{initials(nama)}</span>
      )}
    </span>
  );
}
