"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import type { Tokoh } from "@/lib/kabinet";
import { cn } from "@/lib/utils";

export function LeaderPortrait({ photos, name }: { photos: NonNullable<Tokoh["fotos"]>; name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.25 });
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [loaded, setLoaded] = useState<string[]>([]);
  const [failed, setFailed] = useState<string[]>([]);
  const frames = photos.filter((photo) => !failed.includes(photo.url));
  const active = index % Math.max(frames.length, 1);
  const allLoaded = frames.every((photo) => loaded.includes(photo.url));

  useEffect(() => {
    // Cached images can finish loading before React attaches onLoad.
    const ready = Array.from(ref.current?.querySelectorAll("img") ?? [])
      .filter((image) => image.complete && image.naturalWidth > 0)
      .map((image) => image.getAttribute("src")!)
      .filter(Boolean);
    setLoaded((current) => Array.from(new Set([...current, ...ready])));
  }, [photos]);

  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (!inView || !visible || reducedMotion || !allLoaded || frames.length < 2) return;
    // Let the first pose finish entering before the next pose appears.
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % frames.length), 1600);
    return () => window.clearInterval(timer);
  }, [inView, visible, reducedMotion, allLoaded, frames.length]);

  return (
    <div ref={ref} className="relative aspect-[3/4] w-full overflow-hidden" data-leader-portrait data-photo-index={active}
      data-playing={inView && visible && !reducedMotion && allLoaded}>
      <motion.div
        role="img" aria-label={`Foto ${name}`}
        className="absolute inset-0"
        initial={reducedMotion ? false : { opacity: 0, y: 96 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: reducedMotion ? 0 : 0.85, ease: [0.16, 1, 0.3, 1] }}
      >
        {frames.map((photo, position) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={photo.url} src={photo.url} alt="" aria-hidden="true" loading="lazy" decoding="async"
            style={{ transform: `scale(${photo.scale ?? 1})`, transformOrigin: "bottom center" }}
            onLoad={() => setLoaded((current) => current.includes(photo.url) ? current : [...current, photo.url])}
            onError={() => setFailed((current) => current.includes(photo.url) ? current : [...current, photo.url])}
            className={cn("absolute inset-0 size-full object-cover object-bottom transition-opacity duration-200 motion-reduce:transition-none", position === active ? "opacity-100" : "opacity-0")}
          />
        ))}
        {!frames.length && <span className="absolute inset-0 flex items-center justify-center text-sm text-muted">Foto belum tersedia</span>}
      </motion.div>
    </div>
  );
}
