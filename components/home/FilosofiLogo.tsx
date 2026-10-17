"use client";

import * as React from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { X } from "lucide-react";
export type LogoPhilosophy = { judul: string; ringkasan: string; elemen: { nama: string; makna: string }[]; warna: { nama: string; hex: string; makna: string }[] };

/** The production dialog displays only approved brand information. */
export function FilosofiLogo({ closeSignal, onClose, content }: { closeSignal: number; onClose: () => void; content?: LogoPhilosophy }) {
  const filosofi = content ?? { judul: "Logo BEM UI 2026", ringkasan: "", elemen: [], warna: [] };
  const backdrop = React.useRef<HTMLDivElement>(null);
  const card = React.useRef<HTMLDivElement>(null);
  const closeBtn = React.useRef<HTMLButtonElement>(null);
  const closing = React.useRef(false);

  React.useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tl = gsap.timeline();
    tl.fromTo(backdrop.current, { opacity: 0 }, { opacity: 1, duration: reduced ? 0 : 0.45, ease: "power2.out" });
    tl.fromTo(card.current, { opacity: 0, y: reduced ? 0 : 60 }, { opacity: 1, y: 0, duration: reduced ? 0 : 1.05, ease: "expo.out" }, 0.05);
    tl.fromTo(
      card.current!.querySelectorAll("[data-reveal]"),
      { opacity: 0, y: reduced ? 0 : 24 },
      { opacity: 1, y: 0, duration: reduced ? 0 : 1.05, ease: "expo.out", stagger: 0.06 },
      0.2,
    );
    closeBtn.current?.focus({ preventScroll: true });
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      tl.kill();
      html.style.overflow = prev;
    };
  }, []);

  const close = React.useCallback(async () => {
    if (closing.current) return;
    closing.current = true;
    await Promise.all([
      gsap.to(card.current, { opacity: 0, y: 40, duration: 0.35, ease: "power2.in" }),
      gsap.to(backdrop.current, { opacity: 0, duration: 0.4, delay: 0.1, ease: "power2.out" }),
    ]);
    onClose();
  }, [onClose]);

  const initialSignal = React.useRef(closeSignal);
  React.useEffect(() => {
    if (closeSignal !== initialSignal.current) close();
  }, [closeSignal, close]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div className="fixed inset-0 z-40 grid place-items-center px-4 pb-6 pt-24 sm:px-8 sm:pt-28" role="dialog" aria-modal="true" aria-labelledby="filosofi-title">
      <div ref={backdrop} className="absolute inset-0 bg-white/70 backdrop-blur-glass-md" style={{ opacity: 0 }} onClick={close} />
      <div
        ref={card}
        style={{ opacity: 0 }}
        className="relative grid max-h-[calc(100svh-8.5rem)] w-[min(100%,920px)] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-white shadow-xl md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
      >
        <div className="relative flex items-center justify-center overflow-hidden bg-pink-pale p-10 md:p-12">
          <Image
            src="/images/logo-bem-ui.png"
            alt="Logo Kabinet TerusTerang BEM UI 2026"
            width={876}
            height={876}
            className="h-auto w-[min(56vw,300px)] animate-[spin_40s_linear_infinite] motion-reduce:animate-none"
          />
        </div>
        <div className="p-7 sm:p-10">
          <p data-reveal className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">
            Kabinet TerusTerang · BEM UI 2026
          </p>
          <h2 id="filosofi-title" data-reveal className="mt-2 text-[clamp(1.75rem,3vw,2.5rem)] font-bold uppercase leading-none tracking-normal">
            {filosofi.judul}
          </h2>
          <p data-reveal className="mt-5 text-[17px] leading-relaxed text-secondary">
            {filosofi.ringkasan}
          </p>

          <ol className="mt-8 border-t border-divider">
            {filosofi.elemen.map((e, i) => (
              <li key={e.nama} data-reveal className="grid grid-cols-[2.5rem_1fr] gap-x-2 border-b border-divider py-4">
                <span className="text-sm text-muted">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="text-base font-bold uppercase tracking-[0.04em]">{e.nama}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-secondary">{e.makna}</p>
                </div>
              </li>
            ))}
          </ol>

          {filosofi.warna.length > 0 && <h3 data-reveal className="mt-8 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">
            Warna
          </h3>}
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {filosofi.warna.map((w) => (
              <li key={w.hex} data-reveal className="rounded-xl border border-border p-3">
                <span className="block h-10 rounded-lg" style={{ background: w.hex }} aria-hidden />
                <p className="mt-2 text-sm font-bold">
                  {w.nama} <span className="font-medium text-muted">{w.hex}</span>
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-secondary">{w.makna}</p>
              </li>
            ))}
          </ul>
        </div>

        <button
          ref={closeBtn}
          type="button"
          onClick={close}
          aria-label="Tutup filosofi logo"
          className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full border border-border bg-white text-navy shadow-sm transition-transform duration-base ease-out-expo hover:scale-105"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>
    </div>
  );
}
