import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Divisi } from "@/lib/kabinet";
import { Card } from "@/components/ui";
import { Reveal } from "./Reveal";

function DivisiCard({ d }: { d: Divisi }) {
  return (
    <Link href={`/kabinet/${d.slug}`} className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light">
      <Card variant="glass" className="h-full p-3">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-navy-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={d.cover.url} alt={d.cover.alt} loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.07]" />

          {/* logo departemen */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={d.logo.url} alt={d.logo.alt} loading="lazy" className="absolute left-3 top-3 size-14 rounded-full border-2 border-white bg-white object-cover shadow-md" />

          {/* overlay: tipis di awal, pekat saat hover */}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/5 to-transparent transition-opacity duration-base group-hover:from-navy/95 group-hover:via-navy/55" />

          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <div className="text-[22px] font-extrabold leading-none tracking-[-0.02em] transition-transform duration-base ease-out-expo group-hover:-translate-y-1 group-hover:text-[26px]">{d.singkatan}</div>
            <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-base ease-out-expo group-hover:grid-rows-[1fr] group-hover:opacity-100">
              <div className="overflow-hidden">
                <p className="mt-2 text-[13px] leading-snug text-white/80">{d.tagline}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-pink-light">
                  Lihat divisi <ArrowUpRight className="size-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 px-1.5 pb-1 pt-3.5">
          <span className="text-[15px] font-bold leading-tight text-navy">{d.nama}</span>
          <ArrowUpRight aria-hidden className="size-[18px] shrink-0 text-navy-50 transition-all duration-base group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" />
        </div>
      </Card>
    </Link>
  );
}

export function DivisiGrid({ divisi }: { divisi: Divisi[] }) {
  return (
    <section className="mx-auto max-w-wrap px-6 pb-24 md:pb-32" aria-labelledby="divisi-title">
      <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <h2 id="divisi-title" className="text-[clamp(36px,5vw,72px)] font-extrabold leading-[0.95] tracking-[-0.035em]">
          Departemen
          <br />& Biro
        </h2>
        <p className="max-w-[320px] text-[15px] leading-relaxed text-secondary">
          {divisi.length} divisi yang bekerja bersama. Arahkan kursor untuk melihat ringkasan, klik untuk masuk ke halaman divisi.
        </p>
      </Reveal>

      {/* Glass hanya hidup di atas latar berwarna — panel navy dengan blob warna palet */}
      <div className="relative overflow-hidden rounded-2xl bg-navy px-5 py-10 md:px-10 md:py-14">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(45% 40% at 10% 8%, rgba(71,92,163,.85), transparent 70%), radial-gradient(40% 35% at 92% 20%, rgba(214,76,111,.65), transparent 70%), radial-gradient(45% 40% at 50% 60%, rgba(156,179,211,.35), transparent 70%), radial-gradient(40% 35% at 15% 95%, rgba(214,76,111,.5), transparent 70%), radial-gradient(40% 35% at 88% 92%, rgba(71,92,163,.8), transparent 70%)",
          }}
        />
        <ul className="relative flex flex-wrap justify-center gap-5">
          {divisi.map((d, i) => (
            <li key={d.slug} className="w-full min-[520px]:w-[calc(50%-10px)] lg:w-[calc(25%-15px)]">
              <Reveal delay={(i % 4) * 70} className="h-full">
                <DivisiCard d={d} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
