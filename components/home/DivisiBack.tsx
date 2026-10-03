"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Users } from "lucide-react";
import { Avatar, Badge, Skeleton } from "@/components/ui";
import { StatusBadge } from "@/components/proker/StatusBadge";
import { loadDivisi } from "@/lib/divisi-client";
import { cn } from "@/lib/utils";
import type { Divisi } from "@/types";

interface Props {
  slug: string;
  currentProker: string;
  /** Pilih proker lain milik divisi ini (viewer pindah ke proker tsb & kartu dibalik lagi). */
  onSelectProker: (slug: string) => void;
}

/** Sisi belakang kartu proker: ringkasan biro/departemen penyelenggara. */
export function DivisiBack({ slug, currentProker, onSelectProker }: Props) {
  const [data, setData] = useState<Divisi | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setError(false);
    loadDivisi(slug)
      .then((d) => alive && setData(d))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [slug, attempt]);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-secondary">Data divisi gagal dimuat.</p>
        <button type="button" onClick={() => setAttempt((a) => a + 1)} className="text-sm font-bold text-accent hover:text-accent-hover">
          Coba Lagi
        </button>
      </div>
    );
  }

  if (!data || data.slug !== slug) {
    return (
      <div aria-busy="true" aria-label="Memuat data divisi" className="space-y-4 p-6 sm:p-8">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const [kepala, wakil, ...staf] = data.anggota;

  return (
    <div className="space-y-6 p-6 sm:p-8">
      <header>
        <Badge variant="navy">{data.type}</Badge>
        <h3 className="mt-3 text-3xl font-extrabold leading-none tracking-tight sm:text-4xl">{data.singkatan}</h3>
        <p className="mt-1 text-sm font-semibold text-muted">{data.nama}</p>
      </header>

      <p className="text-[15px] leading-relaxed text-secondary">{data.deskripsi}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Info title="Visi">
          <p>{data.visi}</p>
        </Info>
        <Info title="Tupoksi">
          <ul className="list-disc space-y-1 pl-4">
            {data.tupoksi.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Info>
      </div>

      {kepala && (
        <div className="flex items-center gap-3 rounded-xl bg-navy-5 p-3">
          <Avatar name={kepala.nama} src={kepala.foto_url || null} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{kepala.nama}</p>
            <p className="truncate text-xs text-muted">{kepala.jabatan}</p>
          </div>
          {wakil && <Avatar name={wakil.nama} src={wakil.foto_url || null} size="sm" />}
          <span className="flex items-center gap-1 text-xs font-semibold text-muted">
            <Users aria-hidden className="size-3.5" />+{staf.length} staf
          </span>
        </div>
      )}

      <div>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-muted">Program Kerja</h4>
        <ul className="divide-y divide-divider rounded-xl border border-border">
          {data.proker.map((p) => {
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
        href={`/kabinet/${data.slug}`}
        className="inline-flex items-center gap-1 text-sm font-bold text-accent hover:text-accent-hover"
      >
        Profil lengkap {data.singkatan} <ArrowUpRight aria-hidden className="size-4" />
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
