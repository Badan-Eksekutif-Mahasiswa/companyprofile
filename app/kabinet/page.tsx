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
  const { nama, periode } = await getKabinet();
  return {
    title: nama,
    description: `Visi, misi, ketua, wakil ketua, dan seluruh birdep ${[nama, periode].filter(Boolean).join(" ")}.`,
  };
}

export default async function KabinetPage() {
  const [kabinet, divisi] = await Promise.all([getKabinet(), getAllDivisi()]);
  return (
    <>
      <SiteNav />
      <main>
        <KabinetHero kabinet={kabinet} />
        <MisiMisi misi={kabinet.misi} />
        <Leaders kabinet={kabinet} />
        <DivisiGrid divisi={divisi} />
        <ProkerSpotlight kabinet={kabinet} />
      </main>
      <SiteFooter />
      <Cursor />
    </>
  );
}
