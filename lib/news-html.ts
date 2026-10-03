import type { Inline, NewsBlock } from "@/lib/news";

const ENTITY: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const SAFE_HREF = /^(https?:|mailto:)/i;

function decode(s: string) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
    }
    return ENTITY[e.toLowerCase()] ?? m;
  });
}

function tidy(runs: Inline[]): Inline[] {
  const out = runs.map((r) => ({ ...r, t: r.t.replace(/\s+/g, " ") })).filter((r) => r.t !== "");
  if (out.length) {
    out[0].t = out[0].t.replace(/^ /, "");
    out[out.length - 1].t = out[out.length - 1].t.replace(/ $/, "");
  }
  return out.filter((r) => r.t !== "");
}

const plain = (runs: Inline[]) => runs.map((r) => r.t).join("");
const styled = (runs: Inline[]) => runs.some((r) => r.b || r.i || r.u || r.href);

/** HTML dari CMS (sudah dibersihkan, daftar putih tag) -> blok. Tidak ada HTML mentah yang dirender. */
export function parseHtml(html: string): NewsBlock[] {
  const blocks: NewsBlock[] = [];
  let runs: Inline[] = [];
  let block: string | null = null;
  let list: { type: "ul" | "ol"; items: string[]; itemRuns: Inline[][] } | null = null;
  let b = 0, i = 0, u = 0;
  const hrefs: string[] = [];

  const take = () => {
    const r = tidy(runs);
    runs = [];
    return r;
  };
  const emit = () => {
    const r = take();
    const text = plain(r);
    if (!text) return;
    const rich = styled(r) ? r : undefined;
    if (block === "li" && list) {
      list.items.push(text);
      list.itemRuns.push(r);
    } else if (block === "blockquote") blocks.push({ type: "quote", text, ...(rich && { runs: rich }) });
    else if (block === "h2" || block === "h3") blocks.push({ type: block, text });
    else blocks.push({ type: "p", text, ...(rich && { runs: rich }) });
  };
  const closeList = () => {
    if (list?.items.length) {
      const rich = list.itemRuns.some(styled);
      blocks.push({ type: list.type, items: list.items, ...(rich && { itemRuns: list.itemRuns }) });
    }
    list = null;
  };

  const re = /<(\/?)([a-z0-9]+)([^>]*)>|([^<]+)|</gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (m[4] !== undefined || !m[2]) {
      runs.push({ t: decode(m[4] ?? "<"), ...(b && { b: true }), ...(i && { i: true }), ...(u && { u: true }), ...(hrefs.length && { href: hrefs[hrefs.length - 1] }) });
      continue;
    }
    const close = m[1] === "/";
    const tag = m[2].toLowerCase();
    if (tag === "strong" || tag === "b") b = Math.max(0, b + (close ? -1 : 1));
    else if (tag === "em" || tag === "i") i = Math.max(0, i + (close ? -1 : 1));
    else if (tag === "u") u = Math.max(0, u + (close ? -1 : 1));
    else if (tag === "a") {
      if (close) hrefs.pop();
      else {
        const href = /href\s*=\s*"([^"]*)"|href\s*=\s*'([^']*)'/i.exec(m[3]);
        const v = href ? decode(href[1] ?? href[2]).trim() : "";
        hrefs.push(SAFE_HREF.test(v) ? v : "");
      }
    } else if (tag === "br") runs.push({ t: " " });
    else if (tag === "ul" || tag === "ol") {
      if (!close) {
        emit();
        closeList();
        list = { type: tag, items: [], itemRuns: [] };
      } else closeList();
    } else if (/^(p|h[1-6]|blockquote|li)$/.test(tag)) {
      const kind = /^h[1-2]$/.test(tag) ? "h2" : /^h[3-6]$/.test(tag) ? "h3" : tag;
      if (kind === "p" && (block === "blockquote" || block === "li")) {
        runs.push({ t: " " });
        continue;
      }
      if (!close) {
        emit();
        block = kind;
      } else {
        emit();
        block = null;
      }
    }
  }
  emit();
  closeList();
  return blocks;
}
