import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllDivisi, getDivisi, getNextDivisi } from "@/lib/kabinet";
import { ProjectShell } from "@/components/kabinet/ProjectShell";
import { ProjectPage } from "@/components/kabinet/ProjectPage";
import { SiteFooter } from "@/components/ui/site-footer";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return getAllDivisi().map((d) => ({ slug: d.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const d = getDivisi(params.slug);
  return d ? { title: `${d.nama} — Kabinet Terus Terang`, description: d.description.slice(0, 160) } : {};
}

export default function DivisiPage({ params }: Props) {
  const divisi = getDivisi(params.slug);
  if (!divisi) notFound();
  return (
    <ProjectShell key={divisi.slug}>
      <ProjectPage divisi={divisi} next={getNextDivisi(divisi.slug)} />
      <div className="relative z-[1]">
        <SiteFooter />
      </div>
    </ProjectShell>
  );
}
