import type { Metadata } from "next";
import { getAllDivisi, getKabinet } from "@/lib/kabinet";
import { SiteFooter, SiteNav } from "@/components/ui";
import { KabinetHero } from "@/components/kabinet-list/KabinetHero";
import { Leaders } from "@/components/kabinet-list/Leaders";
import { DivisiGrid } from "@/components/kabinet-list/DivisiGrid";
import { ProkerSpotlight } from "@/components/kabinet-list/ProkerSpotlight";

export const metadata: Metadata = {
  title: "Kabinet — BEM UI 2026 Terus Terang",
  description: "Visi, misi, ketua, wakil ketua, dan seluruh departemen Kabinet Terus Terang BEM UI 2026.",
};

export default function KabinetPage() {
  const kabinet = getKabinet();
  const divisi = getAllDivisi();
  return (
    <>
      <SiteNav />
      <main>
        <KabinetHero kabinet={kabinet} />
        <Leaders kabinet={kabinet} />
        <DivisiGrid divisi={divisi} />
        <ProkerSpotlight kabinet={kabinet} />
      </main>
      <SiteFooter />
    </>
  );
}
