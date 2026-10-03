"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { MOTION } from "@/lib/motion";

export interface RevealProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
}

export function Reveal({ children, className, index = 0 }: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.95) return;
    setHidden(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setHidden(false);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: MOTION.reveal.threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transitionDuration: `${MOTION.duration.reveal}s`,
        transitionDelay: hidden ? undefined : `${index * MOTION.reveal.stagger}ms`,
        transform: hidden ? `translateY(${MOTION.reveal.y}px)` : undefined,
      }}
      className={cn("transition-[opacity,transform] ease-out-expo", hidden ? "opacity-0" : "opacity-100", className)}
    >
      {children}
    </div>
  );
}
