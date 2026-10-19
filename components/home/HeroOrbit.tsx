"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@/components/kabinet/project.css";
import { HERO, SITE } from "@/config/site";
import { clamp } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HeroProker } from "@/types";
import type { OrbitController, Quad } from "./orbit/scene";
import type { LogoPhilosophy } from "./FilosofiLogo";

// Dimuat terpisah (GSAP + Lenis tidak ikut bundle awal); diunduh saat browser senggang.
const loadDetail = () => import("./detail/HeroDetail");
const loadFilosofi = () => import("./FilosofiLogo");
const HeroDetail = dynamic(() => loadDetail().then((m) => m.HeroDetail), { ssr: false });
const FilosofiLogo = dynamic(() => loadFilosofi().then((m) => m.FilosofiLogo), { ssr: false });

const TOTAL_SLOTS = HERO.rings * HERO.cardsPerRing;

/**
 * Hero beranda ala k95.it: logo BEM UI 3D di tengah dibungkus kartu proker yang berputar
 * otomatis di atas latar putih + grid, sama dengan halaman detail kabinet.
 * Scroll menambah putaran sampai HERO.maxRotations, lalu halaman lanjut ke bawah.
 * Klik kartu → detail proker (bisa ditukar ke detail biro/departemen); klik logo → filosofi logo.
 */
export function HeroOrbit({ items, allItems, initialProkerSlug, logoPhilosophy }: { items: HeroProker[]; allItems: HeroProker[]; initialProkerSlug?: string; logoPhilosophy?: LogoPhilosophy }) {
  const router = useRouter();
  const wrapRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const ctrlRef = useRef<OrbitController | null>(null);
  const pointer = useRef({ down: false, x: 0, y: 0, moved: 0 });
  const lastFocus = useRef<HTMLElement | null>(null);

  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [, setFront] = useState(0);
  const [hover, setHover] = useState<number | "logo" | null>(null);
  const initialIndex = allItems.findIndex((program) => program.slug === initialProkerSlug);
  const [detail, setDetail] = useState<{ index: number; origin: Quad | null } | null>(() => initialIndex < 0 ? null : { index: initialIndex, origin: null });
  const [sceneEnabled, setSceneEnabled] = useState(initialIndex < 0);
  const [filosofi, setFilosofi] = useState(false);
  // Klik "Beranda"/logo navbar saat panel terbuka → panel ditutup (pakai animasi tutupnya), lalu ke atas.
  const [closeSignal, setCloseSignal] = useState(0);
  const openRef = useRef(false);
  const goTop = useRef(false);
  openRef.current = detail !== null || filosofi;

  useEffect(() => {
    if (!initialProkerSlug) return;
    const index = allItems.findIndex((program) => program.slug === initialProkerSlug);
    if (index < 0) return;
    ctrlRef.current?.setPaused(true);
    setFilosofi(false);
    setDetail({ index, origin: null });
  }, [initialProkerSlug, allItems]);

  // Instance kartu → index proker. Langkah coprime agar kartu bertetangga tidak sama.
  const slots = useMemo(() => {
    const n = items.length;
    if (!n) return [];
    const step = [7, 5, 11, 13].find((s) => gcd(s, n) === 1) ?? 1;
    return Array.from({ length: TOTAL_SLOTS }, (_, i) => (i * step) % n);
  }, [items.length]);

  // Muat scene WebGL setelah halaman tampil (three.js di chunk terpisah).
  useEffect(() => {
    if (!sceneEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas || items.length === 0) { setStatus("failed"); return; }
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
          autoSpeed: HERO.autoSpeed,
          reduceMotion,
          onFront: setFront,
          onHover: setHover,
        }),
      )
      .then((ctrl) => {
        if (disposed) return ctrl.dispose();
        ctrlRef.current = ctrl;
        ctrl.setPaused(openRef.current);
        ctrl.setScroll(0, window.scrollY);
        setStatus("ready");
        const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1500));
        idle(() => {
          void loadDetail();
          void loadFilosofi();
        });
      })
      .catch(() => !disposed && setStatus("failed"));

    return () => {
      disposed = true;
      ctrlRef.current?.dispose();
      ctrlRef.current = null;
    };
  }, [items, slots, sceneEnabled]);

  // Progress scroll di dalam hero yang "ditahan" (sticky) → putaran tambahan + parallax grid.
  useEffect(() => {
    const onScroll = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const progress = clamp(-rect.top / Math.max(1, rect.height - window.innerHeight), 0, 1);
      ctrlRef.current?.setScroll(progress * HERO.maxRotations, window.scrollY);
      // Kursor diam saat halaman discroll → tidak ada pointermove; label jangan ikut terbawa keluar hero.
      if (rect.bottom < window.innerHeight) setHover(null);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [status]);

  // Label "Lihat" / "Filosofi" mengikuti kursor (pola floating label halaman detail kabinet).
  useEffect(() => {
    if (hover === null) return;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0, first = true;
    const move = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (first) {
        x = tx;
        y = ty;
        first = false;
      }
    };
    const loop = () => {
      x += (tx - x) * 0.1;
      y += (ty - y) * 0.1;
      if (labelRef.current) labelRef.current.style.transform = `translate(${x + 30}px, calc(${y}px - 50%))`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", move);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, [hover]);

  const openItem = useCallback((index: number, origin: Quad | null) => {
    lastFocus.current = document.activeElement as HTMLElement | null;
    ctrlRef.current?.setPaused(true);
    setHover(null);
    setDetail({ index: Math.max(0, allItems.findIndex((p) => p.slug === items[index]?.slug)), origin });
  }, [items, allItems]);

  const openFilosofi = useCallback(() => {
    lastFocus.current = document.activeElement as HTMLElement | null;
    ctrlRef.current?.setPaused(true);
    setHover(null);
    setFilosofi(true);
  }, []);

  // Drag horizontal memutar orbit; klik tanpa geser membuka proker / filosofi logo.
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
    const hit = ctrl?.pick(e.clientX, e.clientY);
    if (!ctrl || !hit) return;
    if (hit.kind === "logo") openFilosofi();
    else {
      ctrl.setHidden(hit.instance); // kartu asli disembunyikan selama klonnya terbang
      openItem(slots[hit.instance], ctrl.quadOf(hit.instance));
    }
  };
  const onPointerCancel = () => {
    pointer.current.down = false;
    ctrlRef.current?.release();
  };

  const getReturnRect = useCallback(
    (slug: string): Quad | null => {
      const ctrl = ctrlRef.current;
      const item = items.findIndex((p) => p.slug === slug);
      const hit = ctrl && item >= 0 ? ctrl.findVisible(item) : null;
      if (!hit) return null;
      ctrl!.setHidden(hit.instance); // disembunyikan sampai kartu yang terbang mendarat
      return hit.quad;
    },
    [items],
  );

  const resume = useCallback(() => {
    ctrlRef.current?.setHidden(null);
    ctrlRef.current?.setPaused(false);
    lastFocus.current?.focus?.({ preventScroll: true });
    if (goTop.current) {
      goTop.current = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  // Link ke beranda ("Beranda" / logo navbar) saat sudah di beranda: Next tidak berpindah halaman,
  // jadi tangani sendiri → tutup panel yang terbuka lalu gulir ke atas.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!a || (a.target && a.target !== "_self")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== "/" || url.search || url.hash || window.location.pathname !== "/") return;
      e.preventDefault();
      e.stopPropagation();
      if (openRef.current) {
        goTop.current = true;
        setCloseSignal((n) => n + 1);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const hoverText = hover === "logo" ? "Filosofi" : hover !== null ? "Lihat" : null;

  return (
    <section
      ref={wrapRef}
      aria-label="Program kerja BEM UI 2026"
      className="relative bg-white text-navy"
      style={{ height: `${items.length ? 100 + HERO.maxRotations * HERO.viewportsPerRotation * 100 : 100}svh` }}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <h1 className="sr-only">
          BEM UI 2026, {SITE.kabinet} {SITE.tagline}
        </h1>

        {/* Panggung WebGL: grid + logo + kartu */}
        <canvas
          ref={canvasRef}
          aria-label="Logo BEM UI 3D dibungkus foto program kerja yang berputar. Klik logo untuk filosofi logo."
          data-hover={hover !== null ? "" : undefined}
          className={cn(
            "absolute inset-0 h-full w-full touch-pan-y transition-opacity duration-700",
            status === "ready" ? "opacity-100" : "opacity-0",
            hover !== null && "cursor-pointer",
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={onPointerCancel}
        />
        {/* Logo statis: tampil selama scene dimuat / bila WebGL tidak didukung */}
        <button
          type="button"
          onClick={openFilosofi}
          aria-label="Lihat filosofi logo"
          tabIndex={status === "ready" ? -1 : 0}
          className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700",
            status === "ready" ? "pointer-events-none opacity-0" : "opacity-100",
          )}
        >
          <Image
            src="/images/logo-bem-ui.png"
            alt=""
            width={876}
            height={876}
            priority
            className={cn("h-auto w-[min(48vw,300px)]", status === "loading" && "animate-pulse")}
          />
        </button>

        {/* Akses keyboard / pembaca layar: daftar proker + filosofi logo (muncul saat difokus) */}
        <nav
          aria-label="Daftar program kerja"
          className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:left-5 focus-within:top-24 focus-within:z-30 focus-within:max-h-[60svh] focus-within:w-72 focus-within:overflow-y-auto focus-within:rounded-xl focus-within:border focus-within:border-border focus-within:bg-white focus-within:p-4 focus-within:text-navy focus-within:shadow-lg"
        >
          <button type="button" onClick={openFilosofi} className="mb-2 w-full text-left text-sm font-bold hover:text-accent">
            Filosofi logo
          </button>
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

      </div>

      {/* Label glass mengikuti kursor (gaya .next__floating-label) */}
      <div
        ref={labelRef}
        aria-hidden
        className={cn(
          "pointer-events-none fixed left-0 top-0 z-[60] whitespace-nowrap rounded-full border border-glass-border bg-glass-strong px-4 py-2.5 text-base uppercase text-navy shadow-glass-soft backdrop-blur-[10px] transition-[opacity,visibility] duration-300 [@media(hover:none)]:hidden",
          hoverText ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        {hoverText ?? "Lihat"}
      </div>

      {detail && (
        <HeroDetail
          items={allItems}
          closeSignal={closeSignal}
          initialIndex={detail.index}
          originRect={detail.origin}
          getReturnRect={getReturnRect}
          onClose={() => {
            setDetail(null);
            setSceneEnabled(true);
            resume();
            if (initialProkerSlug) router.replace("/", { scroll: false });
          }}
        />
      )}
      {filosofi && (
        <FilosofiLogo
          content={logoPhilosophy}
          closeSignal={closeSignal}
          onClose={() => {
            setFilosofi(false);
            resume();
          }}
        />
      )}
    </section>
  );
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
