"use client";

import * as React from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BackgroundGrid } from "./BackgroundGrid";
import { Cursor } from "./Cursor";
import { ProjectNav } from "./ProjectNav";
import { DistortManager } from "./distort-manager";
import { ShellContext, type ShellCtx } from "./shell-context";
import "./project.css";

/**
 * Lapisan global halaman detail: smooth scroll (Lenis lerp .05) yang disinkronkan ke GSAP
 * ScrollTrigger, grid WebGL, kanvas distorsi gambar, kursor, dan nav.
 */
export function ProjectShell({ children }: { children: React.ReactNode }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [distort] = React.useState(() => new DistortManager());
  const [state, setState] = React.useState<Pick<ShellCtx, "lenis" | "ready">>({ lenis: null, ready: false });

  React.useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.classList.add("kd-root");
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    let lenis: Lenis | null = null;
    let tick: ((t: number) => void) | null = null;
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.05, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1, syncTouch: true, syncTouchLerp: 0.05, autoRaf: false });
      lenis.on("scroll", ScrollTrigger.update);
      tick = (t) => lenis!.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    // kanvas distorsi: hanya desktop dengan hover, bukan reduced-motion
    const desktop = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1025px)").matches;
    if (desktop && !reduced && canvasRef.current) distort.init(canvasRef.current, lenis);

    setState({ lenis, ready: true });

    return () => {
      distort.dispose();
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
      document.documentElement.classList.remove("kd-root");
      setState({ lenis: null, ready: false });
    };
  }, [distort]);

  const ctx = React.useMemo<ShellCtx>(() => ({ ...state, distort }), [state, distort]);

  return (
    <ShellContext.Provider value={ctx}>
      <div className="kd">
        {state.ready && <BackgroundGrid />}
        <canvas ref={canvasRef} className="kd-distort-canvas" aria-hidden="true" />
        <Cursor />
        <ProjectNav />
        {children}
      </div>
    </ShellContext.Provider>
  );
}
