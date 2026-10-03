import type { Metadata } from "next";
import { getAllDivisi, getKabinet } from "@/lib/kabinet";
import { Button, Navbar } from "@/components/ui";
import { KabinetHero } from "@/components/kabinet-list/KabinetHero";
import { Leaders } from "@/components/kabinet-list/Leaders";
import { DivisiGrid } from "@/components/kabinet-list/DivisiGrid";
import { ProkerSpotlight } from "@/components/kabinet-list/ProkerSpotlight";
import { SiteFooter } from "@/components/kabinet-list/SiteFooter";

export const metadata: Metadata = {
  title: "Kabinet — BEM UI 2026 Terus Terang",
  description: "Visi, misi, ketua, wakil ketua, dan seluruh departemen Kabinet Terus Terang BEM UI 2026.",
};

export default function KabinetPage() {
  const kabinet = getKabinet();
  const divisi = getAllDivisi();
  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 pt-4">
        <Navbar
          links={[
            { label: "Beranda", href: "/" },
            { label: "Kabinet", href: "/kabinet" },
            { label: "News", href: "/news" },
          ]}
          actions={<Button size="sm">Gabung Divisi</Button>}
        />
      </div>
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
