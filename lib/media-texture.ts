import { getImageProps } from "next/image";

export function mediaTextureSource(src: string, origin: string): string | null {
  try {
    const url = new URL(src, origin);
    if (url.origin === origin) return src;
    if (!["https:", "http:"].includes(url.protocol)) return null;
    // The image optimizer enforces the configured media-source allowlist.
    return getImageProps({ src: url.href, alt: "", width: 1024, height: 1024, quality: 88 }).props.src;
  } catch {
    return null;
  }
}
