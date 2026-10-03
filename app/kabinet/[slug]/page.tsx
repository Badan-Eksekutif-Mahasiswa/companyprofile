import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllDivisi, getDivisi, getKabinet, getNextDivisi } from "@/lib/kabinet";
import { ProjectShell } from "@/components/kabinet/ProjectShell";
import { ProjectPage } from "@/components/kabinet/ProjectPage";
import { SiteFooter } from "@/components/ui/site-footer";

type Props = { params: { slug: string } };

export async function generateStaticParams() {
  return (await getAllDivisi()).map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [d, kabinet] = await Promise.all([getDivisi(params.slug), getKabinet()]);
  return d ? { title: `${d.nama} — ${kabinet.nama}`, description: d.description.slice(0, 160) } : {};
}

export default async function DivisiPage({ params }: Props) {
  const divisi = await getDivisi(params.slug);
  if (!divisi) notFound();
  const next = await getNextDivisi(divisi.slug);
  return (
    <ProjectShell key={divisi.slug}>
      <ProjectPage divisi={divisi} next={next} />
      <div className="relative z-[1]">
        <SiteFooter />
      </div>
    </ProjectShell>
  );
}
