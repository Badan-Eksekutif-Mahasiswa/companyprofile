/**
 * Ubah path media di database (mis. "news/ukt/hero.webp") jadi URL publik R2.
 * URL absolut (https://...) dibiarkan apa adanya. Kosong -> undefined (UI menampilkan placeholder).
 */
export function mediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path) || path.startsWith("/")) return path;
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/+$/, "");
  return base ? `${base}/${path.replace(/^\/+/, "")}` : undefined;
}
