"use client";

/**
 * Tampilan detail proker ⇄ biro/departemen di hero beranda (hanya di hero).
 * Lapisan & motion mengikuti halaman detail kabinet (components/kabinet/ProjectShell):
 * latar putih + BackgroundGrid, smooth scroll Lenis (lerp .05) yang disinkronkan ke ScrollTrigger,
 * kanvas distorsi gambar, kartu 30vw 1.4:1.9, dan transisi kartu "terbang" expo.inOut 1.5s.
 * Bedanya: semua terjadi di overlay, jadi tidak pindah halaman.
 */
import * as React from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { X } from "lucide-react";
import { BackgroundGrid } from "@/components/kabinet/BackgroundGrid";
import { DistortManager } from "@/components/kabinet/distort-manager";
import { ShellContext, type ShellCtx } from "@/components/kabinet/shell-context";
import "@/components/kabinet/project.css";
import "./hero-detail.css";
import type { Divisi } from "@/lib/kabinet";
import { loadDivisi } from "@/lib/divisi-client";
import type { HeroProker } from "@/types";
import { DivisiView, FloatingLabel, ProkerView, type EnterMode } from "./DetailViews";

type Rect = { left: number; top: number; width: number; height: number };
/** 4 sudut kartu di layar: kiri-atas, kanan-atas, kanan-bawah, kiri-bawah. */
type Quad = [number, number][];
type View = "proker" | "divisi";

const FLY = { duration: 1.5, ease: "expo.inOut" } as const; // sama dgn "Divisi Selanjutnya"

interface Props {
  items: HeroProker[];
  initialIndex: number;
  /** Posisi kartu orbit yang diklik (null = tanpa animasi terbang, mis. dari keyboard). */
  originRect: Quad | null;
  /** Posisi kartu orbit tujuan saat ditutup (null = memudar saja). */
  getReturnRect: (slug: string) => Quad | null;
  /** Bertambah saat diminta menutup dari luar (mis. klik "Beranda"). */
  closeSignal: number;
  onClose: () => void;
}

const quadOf = (r: Rect): Quad => [
  [r.left, r.top],
  [r.left + r.width, r.top],
  [r.left + r.width, r.top + r.height],
  [r.left, r.top + r.height],
];
/**
 * matrix3d yang memetakan kotak W×H (di 0,0) ke 4 sudut `q` (homografi persegi → segi empat, Heckbert).
 * Dengan ini klon bisa berangkat persis dari kartu orbit yang miring/berperspektif lalu meluruskan diri.
 */
function quadMatrix(q: Quad, W: number, H: number): string {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  let g = 0, h = 0;
  const den = dx1 * dy2 - dx2 * dy1;
  if ((Math.abs(dx3) > 1e-6 || Math.abs(dy3) > 1e-6) && Math.abs(den) > 1e-9) {
    g = (dx3 * dy2 - dx2 * dy3) / den;
    h = (dx1 * dy3 - dx3 * dy1) / den;
  }
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3;
  const d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
  return `matrix3d(${a / W},${d / W},0,${g / W},${b / H},${e / H},0,${h / H},0,0,1,0,${x0},${y0},0,1)`;
}
const lerpQuad = (a: Quad, b: Quad, t: number): Quad => a.map(([x, y], i) => [x + (b[i][0] - x) * t, y + (b[i][1] - y) * t]);
const rectOf = (el: Element): Rect => {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
};
/** Posisi kartu tengah di desktop; sama dengan aturan .kd.kd-hero di hero-detail.css. */
function heroPanelRect(): Rect {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(vw * 0.3, ((vh - 168) * 1.4) / 1.9);
  const height = (width * 1.9) / 1.4;
  return { left: (vw - width) / 2, top: 112 + (vh - 144 - height) / 2, width, height };
}

const mobileOrReduced = () => window.matchMedia("(max-width: 1024px), (hover: none), (prefers-reduced-motion: reduce)").matches;

export function HeroDetail({ items, initialIndex, originRect, getReturnRect, closeSignal, onClose }: Props) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const distortCanvas = React.useRef<HTMLCanvasElement>(null);
  const flyerRef = React.useRef<HTMLDivElement>(null);
  const flyerImg = React.useRef<HTMLImageElement>(null);
  const busy = React.useRef(true);

  const [distort] = React.useState(() => new DistortManager());
  const [shell, setShell] = React.useState<Pick<ShellCtx, "lenis" | "ready">>({ lenis: null, ready: false });
  const [index, setIndex] = React.useState(initialIndex);
  const [view, setView] = React.useState<View>("proker");
  const [enter, setEnter] = React.useState<EnterMode>("fly");
  const [panelHidden, setPanelHidden] = React.useState(Boolean(originRect));
  const [divisi, setDivisi] = React.useState<{ slug: string; data: Divisi } | null>(null);
  const [label, setLabel] = React.useState<string | null>(null);

  const item = items[index];
  const next = items.length > 1 ? items[(index + 1) % items.length] : null;
  const unitProker = React.useMemo(() => items.filter((p) => p.unit.slug === item.unit.slug), [items, item.unit.slug]);
  const divisiData = divisi?.slug === item.unit.slug ? divisi.data : null;

  /* ---- shell: Lenis di overlay + ScrollTrigger + kanvas distorsi (port ProjectShell) ---- */
  React.useEffect(() => {
    const wrapper = wrapRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.defaults({ scroller: wrapper });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lenis: Lenis | null = null;
    let tick: ((t: number) => void) | null = null;
    if (!reduced) {
      lenis = new Lenis({ wrapper, content, lerp: 0.05, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1, syncTouch: true, syncTouchLerp: 0.05, autoRaf: false });
      lenis.on("scroll", ScrollTrigger.update);
      tick = (t) => lenis!.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(500, 33); // frame berat saat panel dipasang tidak membuat kartu terbang meloncat
    }
    const desktop = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1025px)").matches;
    if (desktop && !reduced && distortCanvas.current) distort.init(distortCanvas.current, lenis);
    setShell({ lenis, ready: true });

    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    const canvas = distortCanvas.current;
    return () => {
      distort.dispose();
      // renderer.dispose() tidak melepas konteks WebGL. Tanpa ini, setiap buka-tutup panel menambah konteks
      // baru sampai browser membuang yang paling lama — yaitu milik orbit → hero jadi putih kosong.
      // Ditunda 1 tick: di StrictMode efek dipasang ulang pada kanvas yang sama (masih terpasang di DOM).
      if (canvas) {
        setTimeout(() => {
          if (canvas.isConnected) return;
          const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
          gl?.getExtension("WEBGL_lose_context")?.loseContext();
        }, 0);
      }
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
      ScrollTrigger.defaults({ scroller: window });
      html.style.overflow = prevOverflow;
    };
  }, [distort]);

  /* ---- muat detail divisi lebih awal agar tukar tampilan langsung ---- */
  React.useEffect(() => {
    let alive = true;
    loadDivisi(item.unit.slug)
      .then((data) => alive && setDivisi({ slug: item.unit.slug, data }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [item.unit.slug]);

  /* ---- kartu terbang dari `from` ke kartu tengah, lalu kloningnya memudar (pola ProjectPage) ---- */
  // Klon berukuran kartu tengah; posisinya murni lewat matrix3d dari 4 sudut, jadi gambar tidak pernah terpotong.
  const placeFlyer = React.useCallback((src: string, q: Quad) => {
    const flyer = flyerRef.current!;
    const { width, height } = heroPanelRect();
    if (flyerImg.current!.getAttribute("src") !== src) flyerImg.current!.src = src;
    Object.assign(flyer.style, { left: "0px", top: "0px", width: `${width}px`, height: `${height}px`, opacity: "1", visibility: "visible" });
    flyer.style.transform = quadMatrix(q, width, height);
    return { width, height };
  }, []);

  const flyTo = React.useCallback(
    (src: string, from: Quad, to: Quad) => {
      const flyer = flyerRef.current!;
      const { width, height } = placeFlyer(src, from);
      const st = { p: 0 };
      return gsap.to(st, {
        p: 1,
        ...FLY,
        onUpdate: () => {
          flyer.style.transform = quadMatrix(lerpQuad(from, to, st.p), width, height);
        },
      });
    },
    [placeFlyer],
  );

  const land = React.useCallback(() => {
    setPanelHidden(false);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        gsap.to(flyerRef.current, {
          opacity: 0,
          duration: 0.45,
          ease: "power2.out",
          onComplete: () => {
            if (flyerRef.current) flyerRef.current.style.visibility = "hidden";
            busy.current = false;
          },
        });
      }),
    );
  }, []);

  /* ---- buka: overlay memudar masuk, kartu orbit terbang ke tengah ---- */
  React.useLayoutEffect(() => {
    const wrap = wrapRef.current!;
    gsap.fromTo(wrap, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power2.out" });
    const panel = wrap.querySelector(".hero__panel");
    if (!originRect || !panel) {
      busy.current = false;
      return;
    }
    // Mulai terbang setelah 2 frame: kerja berat saat mount (kanvas distorsi, Lenis) selesai dulu.
    const from = originRect;
    placeFlyer(item.foto_url, from);
    let tw: gsap.core.Tween | null = null;
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        tw = flyTo(item.foto_url, from, quadOf(rectOf(panel)));
        tw.then(land);
      }),
    );
    return () => {
      cancelAnimationFrame(raf);
      tw?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- tukar tampilan proker ⇄ biro/departemen (klik kartu / tab / nama unit) ---- */
  const toggle = React.useCallback(async () => {
    if (busy.current) return;
    const target: View = view === "proker" ? "divisi" : "proker";
    busy.current = true;
    if (target === "divisi" && !divisiData) {
      try {
        const data = await loadDivisi(item.unit.slug);
        setDivisi({ slug: item.unit.slug, data });
      } catch {
        busy.current = false;
        return;
      }
    }
    setLabel(null);
    const root = contentRef.current!;
    const fade = root.querySelectorAll(".hero__title, .hero__year, .hero-tab, .info, .section, .next-project");
    const inner = root.querySelectorAll(".hero__panel .media-item__inner");
    await gsap
      .timeline()
      .to(fade, { opacity: 0, duration: 0.35, ease: "power2.out" }, 0)
      .to(inner, { opacity: 0, scale: 0.94, duration: 0.5, ease: "power2.in" }, 0);
    shell.lenis?.scrollTo(0, { immediate: true, force: true });
    wrapRef.current!.scrollTop = 0;
    setEnter("toggle");
    setView(target);
    setTimeout(() => (busy.current = false), 700);
  }, [view, divisiData, item.unit.slug, shell.lenis]);

  /* ---- pilih proker lain dari daftar (tampilan divisi) → kembali ke tampilan proker ---- */
  const selectProker = React.useCallback(
    async (slug: string) => {
      const i = items.findIndex((p) => p.slug === slug);
      if (i < 0 || busy.current) return;
      if (i === index) return toggle();
      busy.current = true;
      const root = contentRef.current!;
      await gsap.to(root.querySelectorAll(".hero__row, .info, .section"), { opacity: 0, duration: 0.35, ease: "power2.out" });
      shell.lenis?.scrollTo(0, { immediate: true, force: true });
      wrapRef.current!.scrollTop = 0;
      setEnter("toggle");
      setIndex(i);
      setView("proker");
      setTimeout(() => (busy.current = false), 700);
    },
    [items, index, toggle, shell.lenis],
  );

  /* ---- "Proker Selanjutnya": klon kartu terbang ke tengah (port goNext ProjectPage) ---- */
  const goNext = React.useCallback(() => {
    if (!next || busy.current) return;
    const root = contentRef.current!;
    const nextIndex = (index + 1) % items.length;
    const panel = root.querySelector<HTMLElement>(".next__panel");
    const finish = () => {
      shell.lenis?.scrollTo(0, { immediate: true, force: true });
      wrapRef.current!.scrollTop = 0;
      setEnter("fly");
      setIndex(nextIndex);
      setView("proker");
    };
    setLabel(null);
    if (!panel || mobileOrReduced()) {
      finish();
      return;
    }
    busy.current = true;
    const to = heroPanelRect();
    shell.lenis?.stop();
    const from = rectOf(panel);
    panel.style.opacity = "0";
    setPanelHidden(true);
    gsap
      .timeline({
        onComplete() {
          shell.lenis?.start();
          finish();
          land();
        },
      })
      .to(root.querySelectorAll(".hero__row, .info, .section, .next__left, .next__right"), { opacity: 0, duration: 0.35, ease: "power2.out" }, 0)
      // kanvas distorsi hanya membaca opacity elemen gambar itu sendiri, jadi pudarkan langsung
      .to(root.querySelectorAll(".media-item__inner"), { opacity: 0, duration: 0.35, ease: "power2.out" }, 0)
      .add(flyTo(next.foto_url, quadOf(from), quadOf(to)), 0);
  }, [next, index, items.length, shell.lenis, flyTo, land]);

  /* ---- tutup: kartu tengah terbang kembali ke orbit ---- */
  const close = React.useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setLabel(null);
    shell.lenis?.scrollTo(0, { immediate: true, force: true });
    wrapRef.current!.scrollTop = 0;
    const root = contentRef.current!;
    const panel = root.querySelector(".hero__panel");
    const back = getReturnRect(item.slug);
    const fadeWrap = gsap.to(wrapRef.current, { opacity: 0, duration: 0.5, delay: back ? 0.55 : 0.1, ease: "power2.out" });
    if (panel && back) {
      const from = rectOf(panel);
      setPanelHidden(true);
      gsap.to(root.querySelectorAll(".hero__row > :not(.hero__col--cover), .hero-tab, .info, .section, .next-project"), { opacity: 0, duration: 0.3 });
      await Promise.all([flyTo(item.foto_url, quadOf(from), back).duration(1.2), fadeWrap]);
    } else {
      await fadeWrap;
    }
    onClose();
  }, [shell.lenis, getReturnRect, item, flyTo, onClose]);

  const initialSignal = React.useRef(closeSignal);
  React.useEffect(() => {
    if (closeSignal === initialSignal.current) return;
    busy.current = false; // tutup tetap jalan walau animasi lain sedang berlangsung
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeSignal]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (view === "divisi") toggle();
      else close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, toggle, close]);

  const ctx = React.useMemo<ShellCtx>(() => ({ ...shell, distort }), [shell, distort]);
  const common = { item, panelHidden, play: !panelHidden, enter, onToggle: toggle, onHoverLabel: setLabel };

  return (
    <ShellContext.Provider value={ctx}>
      <div
        ref={wrapRef}
        role="dialog"
        aria-modal="true"
        aria-label={view === "proker" ? `Detail proker ${item.nama}` : `Detail ${item.unit.nama}`}
        className="fixed inset-0 z-40 overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{ opacity: 0 }}
      >
        <div ref={contentRef} className="kd kd-hero">
          {shell.ready && <BackgroundGrid />}
          <canvas ref={distortCanvas} className="kd-distort-canvas" aria-hidden="true" />
          {view === "proker" || !divisiData ? (
            <ProkerView key={`p-${item.slug}`} {...common} next={next} unitProker={unitProker} onNext={goNext} />
          ) : (
            <DivisiView key={`d-${item.unit.slug}-${item.slug}`} {...common} divisi={divisiData} unitProker={unitProker} onSelectProker={selectProker} />
          )}
          <FloatingLabel text={label} />
        </div>
      </div>

      {/* klon kartu yang terbang (orbit ⇄ tengah, Proker Selanjutnya) */}
      <div ref={flyerRef} aria-hidden className="pointer-events-none fixed z-[45] overflow-hidden will-change-transform" style={{ visibility: "hidden", transformOrigin: "0 0" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={flyerImg} alt="" className="block size-full object-cover" />
      </div>

      <button
        type="button"
        onClick={close}
        aria-label="Tutup dan kembali ke orbit"
        data-hover
        className="fixed bottom-6 right-6 z-[46] flex size-12 md:bottom-auto md:top-24 items-center justify-center rounded-full border border-glass-border bg-glass-strong text-navy shadow-glass-soft backdrop-blur-glass transition-transform duration-base ease-out-expo hover:scale-105 md:right-[58px]"
      >
        <X aria-hidden className="size-5" />
      </button>
    </ShellContext.Provider>
  );
}
