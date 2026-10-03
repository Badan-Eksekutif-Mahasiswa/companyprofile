"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { HERO, SITE } from "@/config/site";
import { clamp } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DivisiSummary, HeroProker } from "@/types";
import type { OrbitController, OrbitMode, Rect } from "./orbit/scene";
import { ProkerViewer } from "./ProkerViewer";

const TOTAL_SLOTS = HERO.rings * HERO.cardsPerRing;

/**
 * Hero beranda ala k95.it: logo BEM UI 3D di tengah dibungkus kartu proker yang berputar
 * otomatis (mode Rings/Spiral, WebGL). Scroll menambah putaran sampai batas
 * HERO.maxRotations, setelah itu halaman lanjut ke section berikutnya.
 */
export function HeroOrbit({ items, divisi }: { items: HeroProker[]; divisi: Record<string, DivisiSummary> }) {
  const wrapRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const ctrlRef = useRef<OrbitController | null>(null);
  const modeRef = useRef<OrbitMode>("rings");
  const pointer = useRef({ down: false, x: 0, y: 0, moved: 0 });
  const lastFocus = useRef<HTMLElement | null>(null);

  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [mode, setMode] = useState<OrbitMode>("rings");
  const [front, setFront] = useState(0);
  const [turn, setTurn] = useState(1);
  const [done, setDone] = useState(false);
  const [viewer, setViewer] = useState<{ index: number; origin: Rect | null } | null>(null);
  const [stageHidden, setStageHidden] = useState(false);

  // Instance kartu → index proker. Langkah coprime agar kartu bertetangga tidak sama.
  const slots = useMemo(() => {
    const n = items.length;
    const step = [7, 5, 11, 13].find((s) => gcd(s, n) === 1) ?? 1;
    return Array.from({ length: TOTAL_SLOTS }, (_, i) => (i * step) % n);
  }, [items.length]);

  // Muat scene WebGL setelah halaman tampil (three.js di chunk terpisah).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || items.length === 0) return;
    let disposed = false;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    import("./orbit/scene")
      .then(({ createOrbit }) =>
        createOrbit({
          canvas,
          images: items.map((p) => p.foto_url),
          slots,
          perRing: HERO.cardsPerRing,
          logoSrc: "/images/logo-bem-ui.png",
          logoBumpSrc: "/images/logo-bem-ui-height.png",
          bgColor: HERO.bgColor,
          autoSpeed: HERO.autoSpeed,
          reduceMotion,
          onFront: setFront,
          onHover: (item) => {
            const stage = stageRef.current;
            if (!stage) return;
            if (item === null) {
              delete stage.dataset.cursor;
              stage.style.cursor = "";
            } else {
              stage.dataset.cursor = "Lihat";
              stage.style.cursor = "pointer";
            }
          },
        }),
      )
      .then((ctrl) => {
        if (disposed) return ctrl.dispose();
        ctrlRef.current = ctrl;
        ctrl.setMode(modeRef.current);
        setStatus("ready");
      })
      .catch(() => !disposed && setStatus("failed"));

    return () => {
      disposed = true;
      ctrlRef.current?.dispose();
      ctrlRef.current = null;
    };
  }, [items, slots]);

  useEffect(() => {
    modeRef.current = mode;
    ctrlRef.current?.setMode(mode);
  }, [mode]);

  // Progress scroll di dalam hero yang "ditahan" (sticky) → putaran tambahan.
  useEffect(() => {
    let lastTurn = -1;
    let lastDone: boolean | null = null;
    const onScroll = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const progress = clamp(-rect.top / Math.max(1, rect.height - window.innerHeight), 0, 1);
      ctrlRef.current?.setScrollTurns(progress * HERO.maxRotations);
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
      const t = Math.min(HERO.maxRotations, Math.floor(progress * HERO.maxRotations) + 1);
      if (t !== lastTurn) setTurn((lastTurn = t));
      const d = progress >= 0.995;
      if (d !== lastDone) setDone((lastDone = d));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [status]);

  const openItem = useCallback((index: number, origin: Rect | null) => {
    lastFocus.current = document.activeElement as HTMLElement | null;
    ctrlRef.current?.setPaused(true);
    setViewer({ index, origin });
    setStageHidden(true);
  }, []);

  // Drag horizontal memutar orbit; klik tanpa geser membuka proker.
  const onPointerDown = (e: React.PointerEvent) => {
    pointer.current = { down: true, x: e.clientX, y: e.clientY, moved: 0 };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const p = pointer.current;
    if (!p.down) return;
    const dx = e.clientX - p.x;
    p.moved += Math.abs(dx) + Math.abs(e.clientY - p.y);
    p.x = e.clientX;
    p.y = e.clientY;
    if (dx) ctrlRef.current?.drag(dx);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const p = pointer.current;
    if (!p.down) return;
    p.down = false;
    ctrlRef.current?.release();
    if (p.moved > 6) return;
    const ctrl = ctrlRef.current;
    const inst = ctrl?.pick(e.clientX, e.clientY);
    if (ctrl && inst != null) openItem(slots[inst], ctrl.rectOf(inst));
  };
  const onPointerCancel = () => {
    pointer.current.down = false;
    ctrlRef.current?.release();
  };

  const getReturnRect = useCallback(
    (slug: string): Rect | null => {
      setStageHidden(false);
      const ctrl = ctrlRef.current;
      const item = items.findIndex((p) => p.slug === slug);
      const hit = ctrl && item >= 0 ? ctrl.findVisible(item) : null;
      if (!hit) return null;
      ctrl!.setHidden(hit.instance); // disembunyikan sampai foto yang terbang mendarat
      return hit.rect;
    },
    [items],
  );

  const closeViewer = useCallback(() => {
    setViewer(null);
    setStageHidden(false);
    ctrlRef.current?.setHidden(null);
    ctrlRef.current?.setPaused(false);
    lastFocus.current?.focus?.({ preventScroll: true });
  }, []);

  const frontItem = items[front];

  return (
    <section
      ref={wrapRef}
      aria-label="Program kerja BEM UI 2026"
      className="relative bg-navy text-white"
      style={{ height: `${100 + HERO.maxRotations * HERO.viewportsPerRotation * 100}svh` }}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <h1 className="sr-only">
          BEM UI 2026, {SITE.kabinet} {SITE.tagline}
        </h1>

        {/* Panggung WebGL */}
        <div
          ref={stageRef}
          className={cn("absolute inset-0 transition-opacity duration-slow", stageHidden ? "opacity-0" : "opacity-100")}
        >
          <canvas
            ref={canvasRef}
            aria-label="Logo BEM UI 3D dibungkus foto program kerja yang berputar"
            className={cn(
              "absolute inset-0 h-full w-full touch-pan-y transition-opacity duration-700",
              status === "ready" ? "opacity-100" : "opacity-0",
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onPointerLeave={onPointerCancel}
          />
          {/* Logo statis: tampil selama scene dimuat / bila WebGL tidak didukung */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-700",
              status === "ready" ? "opacity-0" : "opacity-100",
            )}
          >
            <Image
              src="/images/logo-bem-ui.png"
              alt=""
              width={876}
              height={876}
              priority
              className={cn("h-auto w-[min(56vw,380px)]", status === "loading" && "animate-pulse")}
            />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_46%,transparent_55%,rgba(11,16,45,0.55)_100%)]"
          />
        </div>

        {/* Daftar proker untuk keyboard / pembaca layar (muncul saat difokus) */}
        <nav
          aria-label="Daftar program kerja"
          className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:left-5 focus-within:top-24 focus-within:z-30 focus-within:max-h-[60svh] focus-within:w-72 focus-within:overflow-y-auto focus-within:rounded-xl focus-within:bg-white focus-within:p-4 focus-within:text-navy focus-within:shadow-lg"
        >
          <ul className="space-y-1">
            {items.map((p, i) => (
              <li key={p.slug}>
                <button type="button" onClick={() => openItem(i, null)} className="w-full text-left text-sm hover:text-accent">
                  {p.nama} <span className="text-muted">({p.unit.singkatan})</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* HUD bawah */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-4 px-5 pb-6 transition-opacity duration-base md:px-10 md:pb-8",
            stageHidden && "opacity-0",
          )}
        >
          <div className="pointer-events-auto flex flex-col items-start gap-3">
            <p className="hidden text-xs font-bold uppercase tracking-[0.22em] text-white/70 sm:block">{SITE.kabinet}</p>
            <div
              role="group"
              aria-label="Tata letak orbit"
              className="flex rounded-full border border-white/20 bg-white/10 p-1 backdrop-blur-glass-md"
            >
              {(["rings", "spiral"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-bold transition-all duration-base ease-out-expo focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light sm:px-5",
                    mode === m ? "bg-white text-navy shadow-sm" : "text-white/70 hover:text-white",
                  )}
                >
                  {m === "rings" ? "Rings" : "Spiral"}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden flex-col items-center gap-1.5 pb-1 text-center md:flex">
            <p aria-live="polite" className="text-sm font-bold">
              {String(front + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}{" "}
              <span className="font-medium text-white/70">Proker · {frontItem?.nama}</span>
            </p>
            <p className="text-xs font-semibold text-white/50">
              {done ? "Scroll untuk lanjut" : "Scroll untuk memutar · klik foto untuk detail"}
            </p>
          </div>

          <div className="pointer-events-auto flex w-40 flex-col items-end gap-2 text-right sm:w-56">
            <p className="text-sm font-bold">
              Putaran {turn} / {HERO.maxRotations}
            </p>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/15" aria-hidden>
              <div ref={barRef} className="h-full origin-left rounded-full bg-accent" style={{ transform: "scaleX(0)" }} />
            </div>
            <a
              href="#konten"
              className="inline-flex items-center gap-1 text-xs font-bold text-white/70 transition-colors hover:text-pink-light"
            >
              Lewati <ArrowDown aria-hidden className="size-3.5" />
            </a>
          </div>
        </div>
      </div>

      {viewer && (
        <ProkerViewer
          items={items}
          divisi={divisi}
          index={viewer.index}
          originRect={viewer.origin}
          getReturnRect={getReturnRect}
          onIndexChange={(index) => setViewer((v) => (v ? { ...v, index } : v))}
          onClose={closeViewer}
        />
      )}
    </section>
  );
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
