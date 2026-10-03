/** Normalisasi data mentah dari database/JSON ke bentuk yang dipakai UI. Murni, tanpa akses jaringan. */
import type { NewsAttachment, NewsBlock, NewsSource } from "@/lib/news";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Isi berita -> blok. Menerima:
 *  - array blok ({type:"p"|"h2"|"h3"|"quote"|"ul"|"ol"}) atau string JSON dari array itu;
 *  - teks biasa: paragraf dipisah baris kosong; "## " subjudul, "### " sub-subjudul,
 *    "> " kutipan, "- " / "* " daftar, "1. " daftar bernomor.
 * HTML TIDAK diinterpretasi (tag tampil sebagai teks), jadi aman dari XSS.
 */
export function parseBody(input: unknown): NewsBlock[] {
  if (Array.isArray(input)) return input as NewsBlock[];
  if (typeof input !== "string") return [];
  const raw = input.trim();
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as NewsBlock[];
    } catch {
      /* bukan JSON, perlakukan sebagai teks */
    }
  }
  const blocks: NewsBlock[] = [];
  for (const chunk of raw.replace(/\r\n/g, "\n").split(/\n{2,}/)) {
    const lines = chunk.split("\n").map((l) => l.trimEnd()).filter(Boolean);
    if (lines.length === 0) continue;
    const first = lines[0];
    if (first.startsWith("### ")) blocks.push({ type: "h3", text: first.slice(4).trim() });
    else if (first.startsWith("## ")) blocks.push({ type: "h2", text: first.slice(3).trim() });
    else if (first.startsWith("# ")) blocks.push({ type: "h2", text: first.slice(2).trim() });
    else if (lines.every((l) => l.startsWith(">"))) blocks.push({ type: "quote", text: lines.map((l) => l.replace(/^>\s?/, "")).join(" ") });
    else if (lines.every((l) => /^[-*]\s+/.test(l))) blocks.push({ type: "ul", items: lines.map((l) => l.replace(/^[-*]\s+/, "")) });
    else if (lines.every((l) => /^\d+[.)]\s+/.test(l))) blocks.push({ type: "ol", items: lines.map((l) => l.replace(/^\d+[.)]\s+/, "")) });
    else blocks.push({ type: "p", text: lines.join(" ") });
  }
  return blocks;
}

/** Estimasi menit baca (~200 kata/menit), minimal 1. */
export function estimateReadMinutes(blocks: NewsBlock[]): number {
  const words = blocks
    .map((b) => ("items" in b ? b.items.join(" ") : b.text))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function parseMaybeJson(v: unknown): unknown {
  if (typeof v !== "string") return v;
  const t = v.trim();
  if (t.startsWith("[") || t.startsWith("{")) {
    try {
      return JSON.parse(t);
    } catch {
      return v;
    }
  }
  return v;
}

/** Sumber: string, array string, atau array {nama,url}. */
export function normalizeSumber(input: unknown): NewsSource[] {
  const v = parseMaybeJson(input);
  const list = Array.isArray(v) ? v : v ? [v] : [];
  return list
    .map((s): NewsSource | null => {
      if (typeof s === "string") return s.trim() ? { nama: s.trim() } : null;
      if (s && typeof s === "object") {
        const o = s as Record<string, unknown>;
        const nama = String(o.nama ?? o.name ?? o.judul ?? o.url ?? "").trim();
        const url = typeof o.url === "string" && /^https?:\/\//i.test(o.url) ? o.url : undefined;
        return nama ? { nama, url } : null;
      }
      return null;
    })
    .filter((x): x is NewsSource => x !== null);
}

/** Lampiran: array {nama,url,tipe?,ukuran?} atau array URL string. Hanya http(s) atau path relatif. */
export function normalizeLampiran(input: unknown, resolveUrl: (p?: string | null) => string | undefined): NewsAttachment[] {
  const v = parseMaybeJson(input);
  const list = Array.isArray(v) ? v : v ? [v] : [];
  return list
    .map((a): NewsAttachment | null => {
      const o: Record<string, unknown> = typeof a === "string" ? { url: a } : (a as Record<string, unknown>);
      if (!o || typeof o !== "object") return null;
      const url = resolveUrl(String(o.url ?? o.path ?? ""));
      if (!url) return null;
      const fileName = decodeURIComponent(url.split("?")[0].split("/").pop() ?? "lampiran");
      const nama = String(o.nama ?? o.name ?? fileName).trim() || fileName;
      const tipe = String(o.tipe ?? o.type ?? (/\.pdf($|\?)/i.test(url) ? "pdf" : "")).toLowerCase() || undefined;
      const ukuran = o.ukuran ? String(o.ukuran) : undefined;
      return { nama, url, tipe, ukuran };
    })
    .filter((x): x is NewsAttachment => x !== null);
}
