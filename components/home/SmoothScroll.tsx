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
    // Panel detail/filosofi mengunci scroll halaman (overflow: hidden) → Lenis halaman ikut berhenti.
    const html = document.documentElement;
    const sync = () => (html.style.overflow === "hidden" ? lenis.stop() : lenis.start());
    const mo = new MutationObserver(sync);
    mo.observe(html, { attributes: true, attributeFilter: ["style"] });
    let raf = requestAnimationFrame(function loop(t) {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    });
    return () => {
      mo.disconnect();
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);
  return null;
}
