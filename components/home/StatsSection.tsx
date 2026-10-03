"use client";

import { useEffect, useRef, useState } from "react";
import { StatCard } from "@/components/ui";
import type { Stats } from "@/types";

const ITEMS: Array<{ key: keyof Stats; label: string; suffix?: string }> = [
  { key: "mahasiswa_terwakili", label: "Mahasiswa terwakili" },
  { key: "proker_aktif", label: "Program kerja aktif", suffix: "+" },
  { key: "fungsionaris", label: "Fungsionaris" },
];

/** Statistik organisasi (PRD 3.1). v1 dummy, v2 dari GET /api/stats (SIT). */
export function StatsSection({ stats }: { stats: Stats }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShown(true), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} aria-label="Statistik BEM UI 2026" className="bg-white py-16 sm:py-20">
      <div className="mx-auto grid max-w-wrap gap-4 px-5 sm:grid-cols-3">
        {ITEMS.map((it) => (
          <StatCard
            key={it.key}
            value={
              <>
                <CountUp value={stats[it.key]} run={shown} />
                {it.suffix}
              </>
            }
            label={it.label}
            className="p-8 [&>div:nth-child(2)]:text-5xl"
          />
        ))}
      </div>
    </section>
  );
}

function CountUp({ value, run }: { value: number; run: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setN(value);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1400);
      setN(Math.round(value * (1 - Math.pow(1 - t, 4))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, value]);
  return <>{n.toLocaleString("id-ID")}</>;
}
