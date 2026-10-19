"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Dokumentasi } from "@/types";

export function ProgramGallery({ photos, name }: { photos: Dokumentasi[]; name: string }) {
  const track = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<{ id: number; x: number; left: number } | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [position, setPosition] = React.useState({ first: 0, last: 0, previous: false, next: false });

  const updatePosition = React.useCallback(() => {
    const element = track.current;
    if (!element) return;
    const bounds = element.getBoundingClientRect();
    const visible = Array.from(element.children).flatMap((child, index) => {
      const box = child.getBoundingClientRect();
      return box.right > bounds.left + 1 && box.left < bounds.right - 1 ? [index] : [];
    });
    const next = { first: visible[0] ?? 0, last: visible[visible.length - 1] ?? 0,
      previous: element.scrollLeft > 1, next: element.scrollLeft < element.scrollWidth - element.clientWidth - 1 };
    setPosition((current) => current.first === next.first && current.last === next.last
      && current.previous === next.previous && current.next === next.next ? current : next);
  }, []);

  React.useEffect(() => {
    const element = track.current;
    if (!element) return;
    const observer = new ResizeObserver(updatePosition);
    observer.observe(element);
    updatePosition();
    return () => observer.disconnect();
  }, [photos.length, updatePosition]);

  const goTo = (index: number) => {
    const element = track.current;
    const slide = element?.children[Math.max(0, Math.min(photos.length - 1, index))] as HTMLElement | undefined;
    if (!element || !slide) return;
    element.scrollTo({ left: slide.offsetLeft, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  if (!photos.length) return null;
  return (
    <section className="section program-gallery" aria-label={`Galeri ${name}`}>
      <div className="program-gallery__controls">
        <span className="program-gallery__counter" aria-live="polite" aria-atomic="true">
          {position.first + 1}{position.last > position.first ? `-${position.last + 1}` : ""} / {photos.length}
        </span>
        <button type="button" onClick={() => goTo(position.first - 1)} disabled={!position.previous}
          aria-label="Foto sebelumnya" title="Foto sebelumnya" className="program-gallery__button" data-hover>
          <ArrowLeft aria-hidden className="size-5" />
        </button>
        <button type="button" onClick={() => goTo(position.first + 1)} disabled={!position.next}
          aria-label="Foto berikutnya" title="Foto berikutnya" className="program-gallery__button" data-hover>
          <ArrowRight aria-hidden className="size-5" />
        </button>
      </div>
      <div ref={track} className={`program-gallery__track${dragging ? " is-dragging" : ""}`} tabIndex={0}
        role="group" aria-roledescription="karusel" aria-label={`Foto ${name}`} data-lenis-prevent onScroll={updatePosition}
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          goTo(event.key === "Home" ? 0 : event.key === "End" ? photos.length - 1 : position.first + (event.key === "ArrowRight" ? 1 : -1));
        }}
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse" || event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.focus({ preventScroll: true });
          drag.current = { id: event.pointerId, x: event.clientX, left: event.currentTarget.scrollLeft };
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }}
        onPointerMove={(event) => {
          if (drag.current?.id !== event.pointerId) return;
          event.currentTarget.scrollLeft = drag.current.left - (event.clientX - drag.current.x);
        }}
        onPointerUp={finishDrag} onPointerCancel={finishDrag} onLostPointerCapture={finishDrag}>
        {photos.map((photo, index) => (
          <figure key={`${photo.url}-${index}`} className="program-gallery__slide" role="group"
            aria-roledescription="slide" aria-label={`${index + 1} dari ${photos.length}`}>
            <div className="program-documentation" data-program-documentation>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.caption || `Foto ${index + 1} ${name}`} loading="lazy" draggable={false} />
            </div>
            {photo.caption && <figcaption className="media-caption"><p>{photo.caption}</p></figcaption>}
          </figure>
        ))}
      </div>
    </section>
  );
}
