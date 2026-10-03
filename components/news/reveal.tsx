"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Jeda animasi (ms), untuk stagger. */
  delay?: number;
}

/**
 * Muncul halus saat masuk viewport. Elemen yang sudah terlihat saat mount
 * (dan semua elemen tanpa JS / IntersectionObserver) langsung tampil penuh.
 * Reduced-motion ditangani global (durasi transisi ~0 di globals.css).
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.95) return;

    setHidden(true);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHidden(false);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: hidden ? undefined : `${delay}ms` }}
      className={cn(
        "transition-[opacity,transform] duration-slow ease-out-expo",
        hidden ? "translate-y-5 opacity-0" : "translate-y-0 opacity-100",
        className
      )}
    >
      {children}
    </div>
  );
}
