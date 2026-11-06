import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE = process.env.SIT_API_URL?.replace(/\/+$/, "");
const TOKEN = process.env.SIT_VISITS_TOKEN;
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|monitor/i;

async function callSit(method: "GET" | "POST") {
  if (!BASE) return NextResponse.json({ total: null }, { status: 503 });
  try {
    const res = await fetch(`${BASE}/companyprofile/visits/`, {
      method,
      headers: method === "POST" && TOKEN ? { "X-Visits-Token": TOKEN } : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    const data = await res.json();
    if (!res.ok || typeof data?.total !== "number") return NextResponse.json({ total: null }, { status: 503 });
    return NextResponse.json({ total: data.total });
  } catch {
    return NextResponse.json({ total: null }, { status: 503 });
  }
}

export const GET = () => callSit("GET");

export async function POST(req: Request) {
  return callSit(BOT.test(req.headers.get("user-agent") ?? "") ? "GET" : "POST");
}
