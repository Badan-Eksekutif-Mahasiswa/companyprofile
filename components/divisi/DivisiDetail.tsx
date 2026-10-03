import { Badge, Card, EmptyState, MemberCard } from "@/components/ui";
import { StatusBadge } from "@/components/proker/StatusBadge";
import { cn } from "@/lib/utils";
import type { Divisi } from "@/types";

/** Isi halaman detail biro/departemen (PRD 3.3): banner, tentang, struktur internal, program kerja. */
export function DivisiDetail({ divisi }: { divisi: Divisi }) {
  const [kepala, wakil, ...staf] = divisi.anggota;

  return (
    <>
      <header className="relative isolate flex min-h-[340px] items-end overflow-hidden rounded-2xl bg-navy sm:min-h-[420px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={divisi.cover_url} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent" />
        <div className="w-full p-7 text-white sm:p-10">
          <Badge variant="pink">{divisi.type}</Badge>
          <h1 className="mt-4 text-[clamp(3rem,9vw,6.5rem)] font-extrabold leading-[0.9] tracking-[-0.04em]">{divisi.singkatan}</h1>
          <p className="mt-3 text-lg font-semibold text-white/85">{divisi.nama}</p>
        </div>
      </header>

      <Section title={`Tentang ${divisi.type}`}>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          <p className="text-lg leading-relaxed text-secondary">{divisi.deskripsi}</p>
          <div className="space-y-4">
            <Card variant="flat" className="p-6">
              <InfoTitle>Visi</InfoTitle>
              <p className="text-secondary">{divisi.visi}</p>
            </Card>
            <Card variant="flat" className="p-6">
              <InfoTitle>Misi</InfoTitle>
              <List items={divisi.misi} />
            </Card>
            <Card variant="flat" className="p-6">
              <InfoTitle>Tupoksi</InfoTitle>
              <List items={divisi.tupoksi} />
            </Card>
          </div>
        </div>
      </Section>

      <Section title="Struktur Internal">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[kepala, wakil].filter(Boolean).map((a) => (
            <MemberCard key={a.nama} name={a.nama} role={a.jabatan} photo={a.foto_url || null} />
          ))}
        </div>
        {staf.length > 0 && (
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {staf.map((a) => (
              <li key={a.nama}>
                <MemberCard name={a.nama} role={a.jabatan} photo={a.foto_url || null} className="[&>div:first-child]:text-2xl" />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Program Kerja">
        {divisi.proker.length === 0 ? (
          <EmptyState title="Program kerja segera hadir" />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {divisi.proker.map((p) => (
              <li key={p.slug}>
                <Card variant="default" className="overflow-hidden p-0">
                  <div className="aspect-[4/3] bg-navy-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.foto_url || p.dokumentasi[0]?.url} alt={`Dokumentasi ${p.nama}`} loading="lazy" className="h-full w-full object-cover" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-lg">{p.nama}</h3>
                      <StatusBadge status={p.status} className="shrink-0" />
                    </div>
                    <p className="mt-2 text-[14.5px] leading-relaxed text-secondary">{p.deskripsi}</p>
                    {p.tanggal && <p className="mt-3 text-[13px] font-semibold text-muted">{p.tanggal}</p>}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("border-t border-divider py-14 first-of-type:border-t-0 md:py-20", className)}>
      <h2 className="mb-8 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
      {children}
    </section>
  );
}

function InfoTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-blue">{children}</h3>;
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-secondary">
      {items.map((it) => (
        <li key={it} className="flex gap-3">
          <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
