"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LIST_KEY, BACK_FLAG } from "./list-memory";

/** Kembali ke daftar lengkap dengan filter dan posisi scroll terakhir. */
export function BackToList() {
  const [href, setHref] = React.useState("/news");
  React.useEffect(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(LIST_KEY) ?? "null");
      if (s?.url) setHref(s.url);
    } catch {}
    // Selama artikel dibuka, "kembali" (tombol atau Back browser) memulihkan daftar.
    // Klik tautan di navbar/footer berarti pembaca pergi ke tempat lain: jangan pulihkan.
    try { sessionStorage.setItem(BACK_FLAG, "1"); } catch {}
    const leave = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      if (a && !a.closest("main")) { try { sessionStorage.removeItem(BACK_FLAG); } catch {} }
    };
    document.addEventListener("click", leave, true);
    return () => document.removeEventListener("click", leave, true);
  }, []);
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-bold text-accent outline-none hover:underline focus-visible:ring-4 focus-visible:ring-pink-pale print:hidden"
    >
      <ArrowLeft className="size-4" aria-hidden /> Kembali ke daftar
    </Link>
  );
}
