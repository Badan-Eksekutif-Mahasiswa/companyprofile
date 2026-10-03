"use client";

import * as React from "react";
import { Renderer, Program, Mesh, Triangle, Color } from "ogl";
import { cn } from "@/lib/utils";

const vertex = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// 4 blob radial, posisi & alpha mengikuti stop mesh-bg (CSS fallback), bergerak pelan.
const fragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec3 uBlue;
uniform vec3 uPinkLight;
uniform vec3 uPink;
uniform vec3 uBlueSoft;

// elips: pusat c, radius r (fraksi layar); bobot 1 di pusat → 0 di tepi
float blob(vec2 uv, vec2 c, vec2 r) {
  vec2 d = (uv - c) / r;
  return 1.0 - smoothstep(0.0, 1.0, length(d));
}

vec3 layer(vec3 base, vec3 col, float a) {
  return mix(base, col, a);
}

void main() {
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y); // origin kiri-atas, seperti CSS
  float t = uTime * 0.12;

  vec3 c = vec3(1.0);
  vec2 o1 = vec2(sin(t * 1.0), cos(t * 1.3)) * 0.05;
  vec2 o2 = vec2(cos(t * 1.1 + 1.0), sin(t * 0.9)) * 0.05;
  vec2 o3 = vec2(sin(t * 0.8 + 2.0), cos(t * 1.2 + 0.5)) * 0.07;
  vec2 o4 = vec2(cos(t * 1.4 + 3.0), sin(t * 1.0 + 1.5)) * 0.06;

  c = layer(c, uBlueSoft, blob(uv, vec2(0.30, 0.70) + o4, vec2(0.30, 0.36)) * 0.45);
  c = layer(c, uPink,     blob(uv, vec2(0.50, 0.48) + o3, vec2(0.46, 0.50)) * 0.38);
  c = layer(c, uPinkLight,blob(uv, vec2(0.86, 0.10) + o2, vec2(0.38, 0.46)) * 0.85);
  c = layer(c, uBlue,     blob(uv, vec2(0.14, 0.20) + o1, vec2(0.42, 0.50)) * 0.50);

  gl_FragColor = vec4(c, 1.0);
}
`;

export interface MeshGradientProps {
  className?: string;
  /** Kecepatan animasi, 1 = default. */
  speed?: number;
}

/**
 * Background mesh gradient animasi (WebGL via OGL). Selalu merender CSS fallback
 * (.mesh-fallback) di belakang canvas: dipakai untuk SSR, sebelum WebGL siap,
 * prefers-reduced-motion, dan browser tanpa WebGL.
 * Ukuran mengikuti parent (absolute inset-0) — beri `className` untuk atur tinggi.
 */
export default function MeshGradient({ className, speed = 1 }: MeshGradientProps) {
  const host = React.useRef<HTMLDivElement>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio || 1, 1.5), alpha: false, antialias: false });
    } catch {
      return; // WebGL tidak tersedia → tetap pakai fallback CSS
    }
    const gl = renderer.gl;
    if (!gl) return;

    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    canvas.setAttribute("aria-hidden", "true");
    el.appendChild(canvas);

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uBlue: { value: new Color("#475CA3") },
        uPinkLight: { value: new Color("#FFCED8") },
        uPink: { value: new Color("#D64C6F") },
        uBlueSoft: { value: new Color("#9CB3D3") },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const resize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let raf = 0;
    let running = false;
    let visible = true;
    let start = performance.now();
    let elapsed = 0;

    const frame = (now: number) => {
      elapsed += (now - start) / 1000;
      start = now;
      program.uniforms.uTime.value = elapsed * speed;
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(frame);
    };
    const play = () => {
      if (running || !visible || document.hidden) return;
      running = true;
      start = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      visible ? play() : pause();
    });
    io.observe(el);
    const onVis = () => (document.hidden ? pause() : play());
    document.addEventListener("visibilitychange", onVis);

    renderer.render({ scene: mesh }); // frame pertama sebelum fade-in
    setReady(true);
    play();

    return () => {
      pause();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [speed]);

  return (
    <div aria-hidden className={cn("mesh-mask pointer-events-none absolute inset-x-0 top-0 h-[760px] overflow-hidden", className)}>
      <div className="mesh-fallback absolute inset-0" />
      <div
        ref={host}
        className={cn("absolute inset-0 transition-opacity duration-slow", ready ? "opacity-100" : "opacity-0")}
      />
    </div>
  );
}
