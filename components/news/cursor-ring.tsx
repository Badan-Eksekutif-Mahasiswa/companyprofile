"use client";

import * as React from "react";
import { MOTION, prefersReducedMotion } from "@/lib/motion";

/**
 * Kursor ring ala K95: mengikuti pointer dengan lerp, membesar + label "Baca"
 * di atas elemen [data-cursor]. Hanya di perangkat pointer halus; kursor asli tetap tampil.
 */
export function CursorRing() {
  const ring = React.useRef<HTMLDivElement>(null);
  const [label, setLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (prefersReducedMotion() || !window.matchMedia("(pointer: fine)").matches) return;
    const el = ring.current;
    if (!el) return;
    let tx = -100, ty = -100, x = -100, y = -100, raf = 0;
    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      el.style.opacity = "1";
      const t = (e.target as Element | null)?.closest?.("[data-cursor]");
      setLabel(t ? t.getAttribute("data-cursor") : null);
    };
    const leave = () => (el.style.opacity = "0");
    const tick = () => {
      x += (tx - x) * MOTION.lerp;
      y += (ty - y) * MOTION.lerp;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div
      ref={ring}
      aria-hidden
      style={{ opacity: 0 }}
      className="pointer-events-none fixed left-0 top-0 z-50 hidden transition-opacity duration-base pointer-fine:block"
    >
      <div
        className={
          "grid place-items-center rounded-full border border-navy text-[9px] font-bold uppercase tracking-wider text-white transition-[width,height,background-color] duration-base ease-out-expo " +
          (label ? "size-14 bg-accent border-transparent" : "size-6 bg-transparent")
        }
      >
        {label}
      </div>
    </div>
  );
}
