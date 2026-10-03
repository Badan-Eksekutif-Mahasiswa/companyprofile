import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Breadcrumb, buttonVariants } from "@/components/ui";
import { DivisiDetail } from "@/components/divisi/DivisiDetail";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getDivisi, getStruktur } from "@/lib/data";
import { cn } from "@/lib/utils";

export async function generateStaticParams() {
  const struktur = await getStruktur();
  return struktur.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const divisi = await getDivisi(params.slug);
  if (!divisi) return { title: "Divisi tidak ditemukan" };
  return {
    title: divisi.nama,
    description: divisi.deskripsi.slice(0, 155),
    openGraph: { title: divisi.nama, images: [divisi.cover_url] },
  };
}

export default async function DivisiPage({ params }: { params: { slug: string } }) {
  const [divisi, struktur] = await Promise.all([getDivisi(params.slug), getStruktur()]);
  if (!divisi) notFound();

  // Urutan prev/next mengikuti struktur.json (UserFlow 6.2).
  const pos = struktur.findIndex((s) => s.slug === divisi.slug);
  const prev = pos > 0 ? struktur[pos - 1] : null;
  const next = pos < struktur.length - 1 ? struktur[pos + 1] : null;

  return (
    <>
      <main id="konten" className="mx-auto max-w-wrap px-5 pb-10 pt-28">
        <Breadcrumb
          className="mb-6"
          items={[{ label: "Beranda", href: "/" }, { label: "Kabinet", href: "/kabinet" }, { label: divisi.singkatan }]}
        />

        <DivisiDetail divisi={divisi} />

        <nav aria-label="Navigasi divisi" className="grid grid-cols-2 items-stretch gap-3 border-t border-divider pt-10 sm:grid-cols-[1fr_auto_1fr]">
          {prev ? (
            <Link
              href={`/kabinet/${prev.slug}`}
              className="rounded-2xl border border-border p-5 transition-all duration-base ease-out-expo hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex items-center gap-1 text-xs font-bold text-muted">
                <ArrowLeft aria-hidden className="size-3.5" /> Sebelumnya
              </span>
              <span className="mt-1 block text-xl font-extrabold">{prev.singkatan}</span>
            </Link>
          ) : (
            <span />
          )}
          <Link
            href="/kabinet"
            className={cn(buttonVariants({ variant: "navy" }), "order-last col-span-2 self-center sm:order-none sm:col-span-1")}
          >
            Kembali ke Kabinet
          </Link>
          {next ? (
            <Link
              href={`/kabinet/${next.slug}`}
              className="rounded-2xl border border-border p-5 text-right transition-all duration-base ease-out-expo hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex items-center justify-end gap-1 text-xs font-bold text-muted">
                Berikutnya <ArrowRight aria-hidden className="size-3.5" />
              </span>
              <span className="mt-1 block text-xl font-extrabold">{next.singkatan}</span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </main>
      <SiteFooter />
    </>
  );
}
