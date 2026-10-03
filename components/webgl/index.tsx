"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

/**
 * Lazy-load (tanpa SSR) supaya ogl tidak ikut initial bundle.
 * Selama loading → langsung tampil CSS fallback yang sama.
 */
export const MeshGradient = dynamic(() => import("./MeshGradient"), {
  ssr: false,
  loading: () => (
    <div aria-hidden className={cn("mesh-fallback mesh-mask pointer-events-none absolute inset-x-0 top-0 h-[760px]")} />
  ),
});
