import type { Metadata } from "next";
import { getAllDivisi, getKabinet } from "@/lib/kabinet";
import { SiteFooter, SiteNav } from "@/components/ui";
import { Cursor } from "@/components/kabinet/Cursor";
import { KabinetHero } from "@/components/kabinet-list/KabinetHero";
import { Leaders } from "@/components/kabinet-list/Leaders";
import { CoreLeaders } from "@/components/kabinet-list/CoreLeaders";
import { DivisiGrid } from "@/components/kabinet-list/DivisiGrid";
import { MisiMisi } from "@/components/kabinet-list/MisiMisi";
import { ProkerSpotlight } from "@/components/kabinet-list/ProkerSpotlight";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const kabinet = await getKabinet();
  return {
    title: { absolute: "BEM UI 2026" },
    description: `Visi, misi, ketua, wakil ketua, dan seluruh birdep ${[kabinet?.nama, kabinet?.periode].filter(Boolean).join(" ") || "BEM UI"}.`,
  };
}

export default async function KabinetPage() {
  const [kabinet, divisi] = await Promise.all([getKabinet(), getAllDivisi()]);
  return (
    <>
      <SiteNav />
      <main>
        {kabinet ? (
          <>
            <KabinetHero kabinet={kabinet} />
            <MisiMisi misi={kabinet.misi} />
            <Leaders kabinet={kabinet} />
            <CoreLeaders people={kabinet.pengurusInti ?? []} />
            {divisi.length > 0 && <DivisiGrid divisi={divisi} />}
            <ProkerSpotlight kabinet={kabinet} />
          </>
        ) : (
          <section className={`mx-auto max-w-wrap px-6 pt-40 ${divisi.length ? "pb-16" : "min-h-[60svh] pb-24"}`}>
            <h1 className="break-words text-[32px] font-bold text-maroon sm:text-[56px]">#TerusTerang</h1>
            {!divisi.length && <p className="mt-4 text-secondary">Profil belum tersedia.</p>}
          </section>
        )}
        {!kabinet && divisi.length > 0 && <DivisiGrid divisi={divisi} />}
      </main>
      <SiteFooter />
      <Cursor />
    </>
  );
}
