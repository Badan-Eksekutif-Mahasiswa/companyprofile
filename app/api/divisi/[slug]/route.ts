import { NextResponse } from "next/server";
import { getAllDivisi, getDivisi } from "@/lib/kabinet";

/**
 * GET /api/divisi/[slug] → data divisi (sumber: lib/kabinet.ts).
 * Dipakai hero beranda untuk memuat detail biro/departemen saat kartu proker ditukar.
 * Di-prerender saat build, jadi hanya berupa file JSON statis.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllDivisi().map((d) => ({ slug: d.slug }));
}

export function GET(_req: Request, { params }: { params: { slug: string } }) {
  const d = getDivisi(params.slug);
  if (!d) return NextResponse.json({ error: "Divisi tidak ditemukan" }, { status: 404 });
  return NextResponse.json(d);
}
