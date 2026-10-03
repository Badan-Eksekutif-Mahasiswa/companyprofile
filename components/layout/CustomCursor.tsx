"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Titik kursor ala k95 (warna aksen). Elemen dengan `data-cursor="Label"`
 * membesarkan kursor dan menampilkan label tersebut. Hanya untuk pointer presisi.
 */
export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);
    let x = -100, y = -100, cx = x, cy = y, raf = 0;
    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-cursor]");
      setLabel(target ? target.dataset.cursor || "" : null);
    };
    const tick = () => {
      cx += (x - cx) * 0.25;
      cy += (y - cy) * 0.25;
      if (dot.current) dot.current.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!enabled) return null;
  const active = label !== null;
  return (
    <div ref={dot} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[100] mix-blend-normal">
      <div
        className="flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white shadow-md transition-[width,height] duration-base"
        style={{ width: active ? 64 : 12, height: active ? 64 : 12 }}
      >
        {active && label}
      </div>
    </div>
  );
}
