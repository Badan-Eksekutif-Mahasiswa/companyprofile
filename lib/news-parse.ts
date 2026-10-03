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
 *  - teks bertanda: paragraf dipisah baris kosong; "# "/"## " subjudul (h2), "###" ke atas sub-subjudul (h3);
 *    kutipan: "> ...", """ ... """ atau “...”; daftar: "- ", "* ", "• "; bernomor: "1. " atau "1) ".
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
  return parseText(raw);
}

const BULLET = /^\s*[-*•–]\s+/;
const NUMBER = /^\s*\d+[.)]\s+/;
const HEADING = /^(#{1,6})\s+(.*)$/;

/** Teks bertanda ke blok. Toleran: blok boleh menempel tanpa baris kosong, bullet -, *, •, nomor 1. atau 1). */
function parseText(raw: string): NewsBlock[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const out: NewsBlock[] = [];
  let para: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;
  let quote: string[] | null = null;
  const flush = () => {
    if (para.length) out.push({ type: "p", text: para.join(" ") });
    if (list) out.push(list);
    if (quote?.length) out.push({ type: "quote", text: quote.join(" ") });
    para = [];
    list = null;
    quote = null;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) { flush(); continue; }
    // Kutipan ber-"""…""" atau “…” (boleh beberapa baris)
    if (line.startsWith('"""')) {
      flush();
      const buf: string[] = [];
      const rest = line.slice(3);
      if (rest.endsWith('"""') && rest.length >= 3) buf.push(rest.slice(0, -3));
      else {
        if (rest) buf.push(rest);
        for (i++; i < lines.length; i++) {
          const l = lines[i].trim();
          if (l.endsWith('"""')) { if (l.slice(0, -3)) buf.push(l.slice(0, -3)); break; }
          if (l) buf.push(l);
        }
      }
      const text = buf.join(" ").trim();
      if (text) out.push({ type: "quote", text });
      continue;
    }
    if (line.startsWith("\u201C") && line.endsWith("\u201D") && line.length > 2 && !para.length) {
      flush();
      out.push({ type: "quote", text: line.slice(1, -1).trim() });
      continue;
    }
    const h = line.match(HEADING);
    if (h) {
      flush();
      // Maksimal tiga tingkat: # dan ## jadi h2, ### dan seterusnya jadi h3.
      out.push({ type: h[1].length >= 3 ? "h3" : "h2", text: h[2].trim() });
      continue;
    }
    if (line.startsWith(">")) {
      if (!quote) { flush(); quote = []; }
      quote.push(line.replace(/^>\s?/, ""));
      continue;
    }
    const isUl = BULLET.test(line);
    const isOl = NUMBER.test(line);
    if (isUl || isOl) {
      const type = isUl ? "ul" : "ol";
      if (!list || list.type !== type) { flush(); list = { type, items: [] }; }
      list.items.push(line.replace(isUl ? BULLET : NUMBER, ""));
      continue;
    }
    if (list || quote) flush();
    para.push(line);
  }
  flush();
  return out;
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
