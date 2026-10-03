import type { Metadata } from "next";
import { getAllDivisi, getKabinet } from "@/lib/kabinet";
import { SiteFooter, SiteNav } from "@/components/ui";
import { MisiA } from "@/components/kabinet-list/misi/MisiA";
import { MisiB } from "@/components/kabinet-list/misi/MisiB";
import { MisiC } from "@/components/kabinet-list/misi/MisiC";
import { DivisiA } from "@/components/kabinet-list/divisi/DivisiA";
import { DivisiC } from "@/components/kabinet-list/divisi/DivisiC";

export const metadata: Metadata = { title: "Preview opsi desain /kabinet", robots: { index: false } };

const Tag = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto max-w-wrap px-6 pt-20">
    <span className="inline-flex rounded-full bg-navy px-4 py-1.5 text-[12.5px] font-bold text-white">{children}</span>
  </div>
);

/** HALAMAN SEMENTARA untuk membandingkan opsi desain. Hapus setelah opsi dipilih. */
export default function PreviewPage() {
  const k = getKabinet();
  const divisi = getAllDivisi();
  return (
    <>
      <SiteNav />
      <main className="pt-28">
        <Tag>MISI — Opsi A · kalimat menyala saat scroll</Tag>
        <MisiA misi={k.misi} />
        <hr className="border-border" />
        <Tag>MISI — Opsi B · paragraf bertingkat + angka raksasa tipis</Tag>
        <MisiB misi={k.misi} />
        <hr className="border-border" />
        <Tag>MISI — Opsi C · kata kunci raksasa</Tag>
        <MisiC misi={k.misi} />
        <hr className="border-border" />
        <Tag>DEPARTEMEN — Opsi A · tile logo 4-4-4-3-2</Tag>
        <div className="pt-10">
          <DivisiA divisi={divisi} />
        </div>
        <hr className="border-border" />
        <Tag>DEPARTEMEN — Opsi C · bento</Tag>
        <div className="pt-10">
          <DivisiC divisi={divisi} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
