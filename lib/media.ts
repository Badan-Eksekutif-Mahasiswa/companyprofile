export function mediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path) || path.startsWith("/")) return path;
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/+$/, "");
  return base ? `${base}/${path.replace(/^\/+/, "")}` : undefined;
}
