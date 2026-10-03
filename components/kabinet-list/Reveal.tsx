"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Fade + naik 24px saat masuk viewport (sekali). Tanpa JS/reduced-motion → langsung tampil. */
export function Reveal({ children, className, delay = 0, as: Tag = "div" }: { children: React.ReactNode; className?: string; delay?: number; as?: React.ElementType }) {
  const ref = React.useRef<HTMLElement>(null);
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setOn(true);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setOn(true), io.disconnect()), { rootMargin: "0px 0px -10% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn("transition-[opacity,transform] duration-[900ms] ease-out-expo motion-reduce:transition-none", on ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 motion-reduce:opacity-100", className)}
    >
      {children}
    </Tag>
  );
}
