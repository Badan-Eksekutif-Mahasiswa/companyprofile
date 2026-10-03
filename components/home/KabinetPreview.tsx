import Link from "next/link";
import { ArrowRight, ArrowUpRight, Building2, LayoutGrid, Network } from "lucide-react";
import { Badge, buttonVariants } from "@/components/ui";
import type { Divisi } from "@/lib/kabinet";
import { unitType } from "@/lib/unit";
import { cn } from "@/lib/utils";
import type { UnitType } from "@/types";
import { SectionHeading } from "./SectionHeading";

const PREVIEW_COUNT = 4;
const ICON = { BPH: Network, Departemen: LayoutGrid, Biro: Building2 } as const satisfies Record<UnitType, unknown>;

/** Preview kabinet: featured card BPH + 4 card divisi + CTA (PRD 3.1, UserFlow F-01 langkah 03). */
export function KabinetPreview({ divisi }: { divisi: Divisi[] }) {
  const bph = divisi.find((d) => d.slug === "bph");
  const units = divisi.filter((d) => d.slug !== "bph");
  const preview = units.slice(0, PREVIEW_COUNT);
  const rest = units.length - preview.length;
  const count = (t: UnitType) => units.filter((d) => unitType(d) === t).length;

  return (
    <section aria-labelledby="kabinet-title" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-wrap px-5">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            id="kabinet-title"
            eyebrow="Kabinet TerusTerang"
            title="Kabinet Kami"
            description="Mewujudkan aspirasi mahasiswa melalui departemen dan biro yang berdedikasi. Temukan divisi yang kamu minati."
          />
          <Link href="/kabinet" className={cn(buttonVariants({ variant: "navy" }), "self-start md:self-auto")}>
            Lihat Kabinet Lengkap <ArrowRight />
          </Link>
        </div>

        {bph && (
          <Link
            href={`/kabinet/${bph.slug}`}
            className="group relative mt-12 grid gap-8 overflow-hidden rounded-2xl bg-navy p-7 text-white shadow-lg transition-all duration-base ease-out-expo hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light active:scale-[.99] sm:p-10 lg:grid-cols-[1.2fr_1fr]"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(214,76,111,.35), transparent 70%)" }}
            />
            <div className="relative">
              <Badge variant="pink">BPH</Badge>
              <h3 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">{bph.nama}</h3>
              <p className="mt-2 line-clamp-3 max-w-xl text-white/70">{bph.description}</p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {bph.bph.map((p) => (
                  <li key={p.nama + p.jabatan} className="rounded-full bg-white/10 px-3.5 py-1.5 text-[13px] font-semibold">
                    {p.jabatan}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative flex flex-col justify-between gap-8">
              <dl className="grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
                {(
                  [
                    ["Departemen", count("Departemen")],
                    ["Biro", count("Biro")],
                    ["Staf BPH", bph.staff.length],
                  ] as const
                ).map(([label, n]) => (
                  <div key={label}>
                    <dt className="text-[13px] text-white/60">{label}</dt>
                    <dd className="mt-1 text-4xl font-extrabold tracking-tight">{n}</dd>
                  </div>
                ))}
              </dl>
              <span className="flex items-center justify-end gap-1.5 text-sm font-bold text-pink-light">
                Lihat BPH
                <ArrowUpRight aria-hidden className="size-4 transition-transform duration-base group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        )}

        <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {preview.map((d) => {
            const type = unitType(d);
            const Icon = ICON[type];
            return (
              <li key={d.slug}>
                {/* State card sesuai UserFlow 5.1: default, hover (ikon biru + panah geser), active, focus */}
                <Link
                  href={`/kabinet/${d.slug}`}
                  title={d.tagline}
                  className="group flex h-full min-h-52 flex-col justify-between rounded-2xl border border-border bg-white p-5 shadow-sm transition-all duration-base ease-out-expo hover:-translate-y-1 hover:bg-off-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light active:scale-[.98]"
                >
                  <span className="flex items-start justify-between">
                    <span className="flex size-11 items-center justify-center rounded-lg bg-navy-5 text-muted transition-colors duration-base group-hover:bg-blue group-hover:text-white">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <ArrowUpRight
                      aria-hidden
                      className="size-5 opacity-40 transition-all duration-base group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent group-hover:opacity-100"
                    />
                  </span>
                  <span>
                    <span className="text-xs font-bold text-muted">{type}</span>
                    <span className="mt-0.5 block text-xl font-extrabold tracking-tight">{d.singkatan}</span>
                    <span className="mt-1.5 line-clamp-2 block text-[13.5px] text-secondary">{d.nama}</span>
                  </span>
                </Link>
              </li>
            );
          })}
          {rest > 0 && (
            <li className="col-span-2 md:col-span-1">
              <Link
                href="/kabinet"
                className="group flex h-full min-h-52 flex-col justify-between rounded-2xl border-[1.5px] border-dashed border-border p-5 transition-all duration-base ease-out-expo hover:border-accent hover:bg-pink-pale focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light active:scale-[.98]"
              >
                <span className="text-5xl font-extrabold tracking-tight text-accent">+{rest}</span>
                <span className="flex items-end justify-between gap-2 text-sm font-bold">
                  divisi lainnya
                  <ArrowUpRight aria-hidden className="size-5 transition-transform duration-base group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
