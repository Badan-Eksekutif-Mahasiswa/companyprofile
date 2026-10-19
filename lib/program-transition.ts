"use client";

import { gsap } from "gsap";

type Transition = {
  slug: string;
  layer: HTMLDivElement;
  poster: HTMLImageElement;
  timeline: gsap.core.Timeline;
  timeout: ReturnType<typeof setTimeout>;
  cancel: () => void;
  finishing: boolean;
};

let active: Transition | null = null;

/** Keep the selected poster visible across the route change, like the next-unit cover. */
export function beginProgramTransition(slug: string, source: HTMLImageElement, navigate: () => void) {
  if (active) return;
  const rect = source.getBoundingClientRect();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const layer = document.createElement("div");
  layer.dataset.programTransition = slug;
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText = "position:fixed;inset:0;z-index:80;overflow:hidden;";
  const backdrop = document.createElement("div");
  backdrop.style.cssText = "position:absolute;inset:0;background:white;opacity:0;";
  const poster = document.createElement("img");
  poster.src = source.currentSrc || source.src;
  poster.alt = "";
  poster.style.cssText = `position:absolute;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;object-fit:cover;display:block;`;
  layer.append(backdrop, poster);
  document.body.appendChild(layer);

  const timeline = gsap.timeline();
  const cancel = () => {
    if (active?.layer !== layer) return;
    timeline.kill();
    clearTimeout(active.timeout);
    window.removeEventListener("popstate", cancel);
    layer.remove();
    active = null;
  };
  active = { slug, layer, poster, timeline, cancel, finishing: false, timeout: setTimeout(cancel, 12000) };
  window.addEventListener("popstate", cancel, { once: true });
  timeline.to(backdrop, { opacity: 1, duration: reduced ? 0 : 0.2, ease: "power2.out" }).call(() => {
    try { navigate(); } catch { cancel(); }
  });
}

export function finishProgramTransition(slug: string, panel: HTMLElement) {
  const transition = active;
  if (!transition || transition.slug !== slug || transition.finishing) return;
  transition.finishing = true;
  const rect = panel.getBoundingClientRect();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  transition.timeline
    .to(transition.poster, { left: rect.left, top: rect.top, width: rect.width, height: rect.height,
      duration: reduced ? 0 : 0.8, ease: "power3.inOut" })
    .to(transition.layer, { opacity: 0, duration: reduced ? 0 : 0.3, ease: "power2.out" })
    .call(transition.cancel);
}
