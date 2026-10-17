import { NextResponse } from "next/server";
import { getDivisi } from "@/lib/kabinet";

/**
 * GET /api/divisi/[slug] → data divisi (sumber: lib/kabinet.ts).
 * Dipakai hero beranda untuk memuat detail biro/departemen saat kartu proker ditukar.
 * Dimuat saat runtime agar slug baru dari CMS tidak memerlukan build ulang.
 */
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const d = await getDivisi(params.slug);
  if (!d) return NextResponse.json({ error: "Divisi tidak ditemukan" }, { status: 404 });
  return NextResponse.json(d);
}
