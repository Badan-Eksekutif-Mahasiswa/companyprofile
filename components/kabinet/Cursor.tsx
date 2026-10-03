"use client";

import * as React from "react";

/** Kursor titik 15px (accent pink) → cincin 45px saat hover elemen interaktif / [data-hover]. */
export function Cursor() {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const move = (e: MouseEvent) => {
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
    };
    const over = (e: MouseEvent) => {
      const t = e.target as Element | null;
      el.classList.toggle("is-hovering", !!t?.closest("[data-hover], a, button"));
    };
    window.addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mouseover", over, { passive: true });
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", over);
    };
  }, []);

  return <div ref={ref} className="kd-cursor" aria-hidden="true" />;
}
