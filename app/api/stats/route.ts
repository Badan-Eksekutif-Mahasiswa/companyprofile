import { NextResponse } from "next/server";
import { getStats } from "@/lib/data";

// v1: dummy dari data/stats.json. v2: proxy ke endpoint SIT.
export async function GET() {
  return NextResponse.json(await getStats());
}
