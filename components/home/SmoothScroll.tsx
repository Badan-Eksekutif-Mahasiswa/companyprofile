"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/** Smooth scroll (Lenis) untuk beranda. Panel dialog (detail proker, filosofi) punya scroll sendiri. */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      lerp: 0.08,
      wheelMultiplier: 0.9,
      anchors: true,
      prevent: (node) => !!node.closest?.('[role="dialog"]'),
    });
    let raf = requestAnimationFrame(function loop(t) {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);
  return null;
}
