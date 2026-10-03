"use client";

import * as React from "react";
import { useShell } from "./shell-context";

/**
 * Grid WebGL: silinder garis tipis (radius 30) dilihat dari dalam, ring horizontal bergeser
 * pelan mengikuti scroll dan di-wrap. Port dari ThreeBackgroundGrid k95
 * (scrollParallax .003, smoothing .08). Warna garis: navy dari design system.
 */
export function BackgroundGrid({ opacity = 0.16, scrollParallax = 0.003, smoothing = 0.08 }: { opacity?: number; scrollParallax?: number; smoothing?: number }) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const { lenis } = useShell();

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      if (cancelled) return;

      const RADIUS = 30;
      const w = () => window.innerWidth;
      const h = () => window.innerHeight;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      } catch {
        return;
      }
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(w(), h(), false);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(52, w() / Math.max(h(), 1), 0.1, 300);
      camera.position.set(0, 0, 10);

      const material = new THREE.LineBasicMaterial({ color: 0x0b102d, transparent: true, opacity, depthWrite: false });
      let lines: InstanceType<typeof THREE.LineSegments> | null = null;
      let period = 2;
      let pos = 0; // posisi tampil (smoothed)
      let target = 0; // posisi target dari scroll

      const half = () => Math.max(period * 0.5, 1e-4);
      const wrap = (v: number) => {
        const t = Math.max(period, 2e-4);
        let r = ((v % t) + t) % t;
        if (r >= half()) r -= t;
        return r;
      };
      const shortest = (from: number, to: number) => {
        const t = Math.max(period, 2e-4);
        let d = to - from;
        while (d > half()) d -= t;
        while (d < -half()) d += t;
        return d;
      };

      const build = () => {
        if (lines) {
          scene.remove(lines);
          lines.geometry.dispose();
        }
        const ratio = h() / Math.max(w(), 1);
        const tall = ratio > 1;
        const yExtent = tall ? Math.max(30, 22 * Math.min(ratio, 2.2)) : 22;
        const SEG = 200;
        const VERTICALS = 80;
        const RINGS = tall ? 22 : 16;
        const v: number[] = [];
        for (let i = 0; i < VERTICALS; i++) {
          const a = (i / VERTICALS) * Math.PI * 2;
          const x = Math.cos(a) * RADIUS;
          const z = Math.sin(a) * RADIUS;
          v.push(x, -yExtent, z, x, yExtent, z);
        }
        for (let r = 0; r <= RINGS; r++) {
          const y = -yExtent + (r / RINGS) * yExtent * 2;
          for (let s = 0; s < SEG; s++) {
            const a = (s / SEG) * Math.PI * 2;
            const b = ((s + 1) / SEG) * Math.PI * 2;
            v.push(Math.cos(a) * RADIUS, y, Math.sin(a) * RADIUS, Math.cos(b) * RADIUS, y, Math.sin(b) * RADIUS);
          }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
        period = (yExtent * 2) / Math.max(RINGS, 1);
        pos = wrap(pos);
        target = wrap(target);
        lines = new THREE.LineSegments(geo, material);
        lines.renderOrder = -10;
        lines.position.y = pos;
        scene.add(lines);
      };
      build();

      let last: number | null = null;
      const onScroll = (e: { scroll: number }) => {
        if (last === null) {
          last = e.scroll;
          return;
        }
        const d = e.scroll - last;
        last = e.scroll;
        if (d !== 0) target = wrap(target - d * scrollParallax);
      };
      if (lenis) lenis.on("scroll", onScroll);
      else {
        // tanpa Lenis (mis. reduced motion): ikuti scroll native
        const native = () => onScroll({ scroll: window.scrollY });
        window.addEventListener("scroll", native, { passive: true });
        const prev = cleanup;
        cleanup = () => {
          prev();
          window.removeEventListener("scroll", native);
        };
      }

      let raf = 0;
      const frame = () => {
        raf = requestAnimationFrame(frame);
        const d = shortest(pos, target);
        pos = Math.abs(d) > 1e-4 ? wrap(pos + d * smoothing) : target;
        if (lines) lines.position.y = pos;
        renderer.render(scene, camera);
      };
      frame();

      let timer: ReturnType<typeof setTimeout> | undefined;
      const onResize = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          camera.aspect = w() / Math.max(h(), 1);
          camera.updateProjectionMatrix();
          renderer.setSize(w(), h(), false);
          build();
        }, 140);
      };
      window.addEventListener("resize", onResize);
      requestAnimationFrame(() => (canvas.style.opacity = "1"));

      const prevCleanup = cleanup;
      cleanup = () => {
        prevCleanup();
        cancelAnimationFrame(raf);
        clearTimeout(timer);
        window.removeEventListener("resize", onResize);
        lenis?.off("scroll", onScroll);
        if (lines) lines.geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [lenis, opacity, scrollParallax, smoothing]);

  return <canvas ref={ref} className="kd-grid-canvas" aria-hidden="true" />;
}
