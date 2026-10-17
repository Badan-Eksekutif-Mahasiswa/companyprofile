import type { Metadata } from "next";
import { getAllDivisi, getKabinet } from "@/lib/kabinet";
import { SiteFooter, SiteNav } from "@/components/ui";
import { Cursor } from "@/components/kabinet/Cursor";
import { KabinetHero } from "@/components/kabinet-list/KabinetHero";
import { Leaders } from "@/components/kabinet-list/Leaders";
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
            <DivisiGrid divisi={divisi} />
            <ProkerSpotlight kabinet={kabinet} />
          </>
        ) : (
          <section className="mx-auto min-h-[60svh] max-w-wrap px-6 pb-24 pt-40">
            <h1 className="text-4xl font-bold">Kabinet BEM UI</h1>
            <p className="mt-4 text-secondary">Profil kabinet belum tersedia.</p>
          </section>
        )}
      </main>
      <SiteFooter />
      <Cursor />
    </>
  );
}
