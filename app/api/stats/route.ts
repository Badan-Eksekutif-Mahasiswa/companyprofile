import { NextResponse } from "next/server";
import { getStats } from "@/lib/data";

export const dynamic = "force-dynamic";

// Statistik terbit dari CMS SIT, dengan JSON lokal bila SIT belum tersedia.
export async function GET() {
  return NextResponse.json(await getStats());
}
