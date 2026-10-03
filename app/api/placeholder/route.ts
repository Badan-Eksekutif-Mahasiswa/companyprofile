import { NextRequest } from "next/server";

const TONES: Record<string, [string, string, string]> = {
  pink: ["#FFCED8", "#D64C6F", "#5E121C"],
  blue: ["#9CB3D3", "#475CA3", "#0B102D"],
  navy: ["#475CA3", "#0B102D", "#FFCED8"],
  maroon: ["#D64C6F", "#5E121C", "#FFF2F5"],
  grey: ["#F0F0F4", "#C9CAD6", "#0B102D"],
};

const esc = (s: string) => s.replace(/[<>&"']/g, "");

/** Placeholder gambar (SVG) — dipakai sampai foto asli tersedia. /api/placeholder?label=...&w=1400&h=1900&tone=pink */
export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const w = Math.min(Math.max(Number(q.get("w")) || 1200, 100), 3000);
  const h = Math.min(Math.max(Number(q.get("h")) || 800, 100), 3000);
  const label = esc(q.get("label") || "FOTO");
  const sub = esc(q.get("sub") || "PLACEHOLDER");
  const [a, b, ink] = TONES[q.get("tone") || "grey"] ?? TONES.grey;
  const fs = Math.round(Math.min(w, h) * 0.07);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>
<g fill="none" stroke="${ink}" stroke-opacity=".18" stroke-width="2"><path d="M0 0L${w} ${h}M${w} 0L0 ${h}"/></g>
<g font-family="system-ui,-apple-system,sans-serif" font-weight="800" fill="${ink}" text-anchor="middle">
<text x="${w / 2}" y="${h / 2}" font-size="${fs}" letter-spacing="2">${label}</text>
<text x="${w / 2}" y="${h / 2 + fs * 1.1}" font-size="${Math.round(fs * 0.4)}" font-weight="600" fill-opacity=".6" letter-spacing="4">${sub} · ${w}×${h}</text>
</g></svg>`;

  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
