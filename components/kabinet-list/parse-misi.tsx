import * as React from "react";

export type Seg = { text: string; key: boolean };

/** "Membangun **jujur dan terbuka** dengan…" → segmen biasa/kunci. */
export function parseMisi(teks: string): Seg[] {
  return teks
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((t) => (t.startsWith("**") ? { text: t.slice(2, -2), key: true } : { text: t, key: false }));
}

export const pad = (i: number) => String(i + 1).padStart(2, "0");

export const plainText = (s: string) => s.replace(/\*\*/g, "");
