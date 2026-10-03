"use client";

import { animate, motion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCw, X } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { StatusBadge } from "@/components/proker/StatusBadge";
import { cn } from "@/lib/utils";
import type { DivisiSummary, HeroProker } from "@/types";
import { DivisiBack } from "./DivisiBack";

type Rect = { left: number; top: number; width: number; height: number };

const EASE = [0.16, 1, 0.3, 1] as const; // --ease-out design system
const CARD_RADIUS = 20; // --r-xl

const toRect = (r: DOMRect): Rect => ({ left: r.left, top: r.top, width: r.width, height: r.height });

interface Props {
  items: HeroProker[];
  /** Ringkasan semua divisi (kunci = slug), untuk sisi belakang kartu. */
  divisi: Record<string, DivisiSummary>;
  index: number;
  /** Posisi kartu yang diklik di layar, titik awal animasi zoom (null = fade). */
  originRect: Rect | null;
  /** Posisi kartu tujuan saat viewer ditutup (null = fade saja). */
  getReturnRect: (slug: string) => Rect | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/**
 * Tampilan "zoom" saat foto proker di orbit diklik (layar kedua k95).
 * Kartu foto 4:3 bisa DIBALIK lewat tab unit (Biro/Departemen) untuk menampilkan
 * detail divisi di sisi belakangnya, tanpa pindah halaman.
 */
export function ProkerViewer({ items, divisi, index, originRect, getReturnRect, onIndexChange, onClose }: Props) {
  const item = items[index];
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const flyerRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const closingRef = useRef(false);
  const [settled, setSettled] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [doc, setDoc] = useState(0);
  // Sisi belakang tetap dirender setelah pertama dibuka agar tidak kosong saat kartu berputar balik.
  const [backMounted, setBackMounted] = useState(false);
  // Gambar yang "terbang" dikunci agar tidak berganti saat animasi tutup.
  const [flyerSrc, setFlyerSrc] = useState(item.foto_url);

  const docs = item.dokumentasi.length ? item.dokumentasi : [{ url: item.foto_url, caption: item.nama }];
  const activeDoc = docs[Math.min(doc, docs.length - 1)];

  // Ganti proker → kartu kembali ke depan & foto pertama.
  useEffect(() => {
    setFlipped(false);
    setDoc(0);
  }, [index]);

  useEffect(() => {
    if (flipped) setBackMounted(true);
  }, [flipped]);

  // Sisi kartu yang tidak terlihat tidak boleh bisa difokus.
  useEffect(() => {
    frontRef.current?.toggleAttribute("inert", flipped);
    backRef.current?.toggleAttribute("inert", !flipped);
  }, [flipped, settled]);

  // Masuk: latar memudar, foto terbang dari kartu orbit ke slot.
  useLayoutEffect(() => {
    const flyer = flyerRef.current;
    const slot = slotRef.current;
    if (!flyer || !slot) return;
    const target = toRect(slot.getBoundingClientRect());
    const from = originRect ?? target;
    Object.assign(flyer.style, px(from), { opacity: originRect ? "1" : "0", borderRadius: "4px" });

    const anims = [
      animate(bgRef.current!, { opacity: [0, 1] }, { duration: 0.45, ease: "easeOut" }),
      animate(flyer, { ...pxNum(target), opacity: 1, borderRadius: `${CARD_RADIUS}px` }, { duration: 0.85, ease: EASE }),
    ];
    anims[1].then(() => setSettled(true));
    return () => anims.forEach((a) => a.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(async () => {
    if (closingRef.current) return;
    closingRef.current = true;
    const flyer = flyerRef.current;
    const slot = slotRef.current;
    if (!flyer || !slot) return onClose();

    setFlyerSrc(item.foto_url);
    Object.assign(flyer.style, px(toRect(slot.getBoundingClientRect())), { opacity: "1" });
    setSettled(false);
    setFlipped(false);

    const back = getReturnRect(item.slug);
    await Promise.all([
      animate(contentRef.current!, { opacity: 0 }, { duration: 0.25 }),
      animate(controlsRef.current!, { opacity: 0 }, { duration: 0.25 }),
      animate(bgRef.current!, { opacity: 0 }, { duration: 0.5, delay: 0.3 }),
      back
        ? animate(flyer, { ...pxNum(back), borderRadius: "4px" }, { duration: 0.75, ease: EASE })
        : animate(flyer, { opacity: 0, scale: 0.9 }, { duration: 0.4 }),
    ]);
    onClose();
  }, [getReturnRect, item, onClose]);

  const go = useCallback(
    (dir: 1 | -1) => onIndexChange((index + dir + items.length) % items.length),
    [index, items.length, onIndexChange],
  );

  const selectProker = (slug: string) => {
    const i = items.findIndex((p) => p.slug === slug);
    if (i >= 0) onIndexChange(i);
  };

  const toggleFlip = () => setFlipped((f) => !f);

  // Scroll lock + fokus awal.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    closeBtnRef.current?.focus({ preventScroll: true });
    return () => {
      html.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (flipped) setFlipped(false);
        else close();
      } else if (!flipped && e.key === "ArrowRight") go(1);
      else if (!flipped && e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, flipped, go]);

  const counter = `${String(index + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;

  return (
    <div role="dialog" aria-modal="true" aria-label={`Program kerja ${item.nama}`} className="fixed inset-0 z-[60]">
      <div ref={bgRef} className="absolute inset-0 bg-navy" style={{ opacity: 0 }} />

      <div ref={contentRef} className="relative h-full overflow-y-auto overflow-x-hidden overscroll-contain text-white">
        <div className="mx-auto grid min-h-full max-w-[1280px] items-center gap-10 px-5 pb-28 pt-24 md:items-start md:pt-28 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] md:gap-12 md:px-10">
          {/* Kartu foto 4:3 yang bisa dibalik */}
          <div className="pl-10 sm:pl-12 md:sticky md:top-28">
            <div ref={slotRef} className="relative mx-auto aspect-[4/3] w-full max-w-[min(100%,calc(66svh*4/3))]">
              {settled && (
                <>
                  {/* Tab unit di sisi kiri kartu */}
                  <motion.button
                    type="button"
                    onClick={toggleFlip}
                    aria-pressed={flipped}
                    aria-label={flipped ? "Balik kartu ke foto proker" : `Lihat detail ${item.unit.nama}`}
                    data-cursor={flipped ? "Balik" : "Detail"}
                    className={cn(
                      "group absolute right-full top-6 z-10 flex flex-col items-center gap-3 rounded-l-xl border border-r-0 px-2 py-4 transition-colors duration-base sm:px-2.5 sm:py-5",
                      flipped
                        ? "border-white bg-white text-navy"
                        : "border-glass-border bg-glass-strong text-navy shadow-glass-soft backdrop-blur-glass hover:bg-white",
                    )}
                    initial={{ x: 32, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.45, ease: EASE, delay: 0.1 }}
                  >
                    <span className="rotate-180 text-base font-extrabold tracking-tight [writing-mode:vertical-rl] sm:text-lg">
                      {flipped ? "Proker" : item.unit.type}
                    </span>
                    {!flipped && (
                      <span className="rotate-180 text-[10px] font-bold uppercase tracking-[0.18em] text-accent [writing-mode:vertical-rl] sm:text-[11px]">
                        {item.unit.singkatan}
                      </span>
                    )}
                    <RotateCw aria-hidden className="size-4 transition-transform duration-slow group-hover:rotate-90" />
                  </motion.button>

                  <div className="absolute inset-0 [perspective:1800px]">
                    <div
                      className="relative h-full w-full transition-transform duration-[800ms] ease-out-expo [transform-style:preserve-3d]"
                      style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
                    >
                      {/* Depan: foto dokumentasi */}
                      <div
                        ref={frontRef}
                        className="absolute inset-0 overflow-hidden rounded-xl bg-navy-80 shadow-xl [backface-visibility:hidden]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <motion.img
                          key={activeDoc.url}
                          src={activeDoc.url}
                          alt={`Dokumentasi ${item.nama}: ${activeDoc.caption}`}
                          className="h-full w-full object-cover"
                          initial={{ opacity: 0.5 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                        <span className="absolute bottom-3 left-3 rounded-full border border-glass-border bg-glass-strong px-3 py-1 text-xs font-bold text-navy backdrop-blur-glass-md">
                          {activeDoc.caption}
                        </span>
                      </div>
                      {/* Belakang: detail biro/departemen */}
                      <div
                        ref={backRef}
                        className="absolute inset-0 overflow-y-auto overscroll-contain rounded-xl bg-white text-navy shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]"
                      >
                        {backMounted && (
                          <DivisiBack
                            divisi={divisi[item.unit.slug]}
                            proker={items.filter((p) => p.unit.slug === item.unit.slug)}
                            currentProker={item.slug}
                            onSelectProker={selectProker}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Galeri dokumentasi (semua 4:3) */}
            {settled && docs.length > 1 && (
              <ul className="mx-auto mt-4 flex max-w-[min(100%,calc(66svh*4/3))] gap-3" aria-label="Foto dokumentasi">
                {docs.map((d, i) => (
                  <li key={d.url} className="w-24 sm:w-28">
                    <button
                      type="button"
                      onClick={() => {
                        setDoc(i);
                        setFlipped(false);
                      }}
                      aria-label={`Foto dokumentasi ${i + 1}: ${d.caption}`}
                      aria-current={i === doc ? "true" : undefined}
                      className={cn(
                        "block aspect-[4/3] w-full overflow-hidden rounded-md ring-2 transition-all duration-base",
                        i === doc && !flipped ? "ring-accent" : "opacity-60 ring-transparent hover:opacity-100",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={d.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Info proker */}
          <motion.div
            key={item.slug}
            className="max-w-xl"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: settled ? 0 : 0.45 } } }}
          >
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-soft">Program Kerja · {counter}</p>
            </Reveal>
            <Reveal>
              <h2 className="mt-3 text-[clamp(2rem,4.2vw,3.5rem)] font-extrabold leading-[1.02] tracking-tight">{item.nama}</h2>
            </Reveal>
            <Reveal>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-white/70">
                <StatusBadge status={item.status} onDark />
                {item.tanggal && <span>{item.tanggal}</span>}
              </div>
            </Reveal>
            <Reveal>
              <div className="mt-6 space-y-3 text-[15px] leading-relaxed text-white/80">
                {item.penjelasan.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </div>
            </Reveal>
            <Reveal>
              <button
                type="button"
                onClick={toggleFlip}
                className="group mt-8 flex w-full items-center gap-4 rounded-xl border border-white/15 bg-white/5 p-4 text-left transition-colors duration-base hover:bg-white/10"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">Diselenggarakan oleh</span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Badge variant="pink">{item.unit.type}</Badge>
                    <span className="font-bold">{item.unit.nama}</span>
                  </span>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-pink-light">
                  <RotateCw aria-hidden className="size-4 transition-transform duration-slow group-hover:rotate-90" />
                  {flipped ? "Lihat foto" : "Lihat detail"}
                </span>
              </button>
            </Reveal>
          </motion.div>
        </div>
      </div>

      {/* Foto yang "terbang" antara orbit dan slot */}
      <div
        ref={flyerRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 overflow-hidden shadow-xl"
        style={{ visibility: settled ? "hidden" : "visible" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={flyerSrc} alt="" className="h-full w-full object-cover" />
      </div>

      {/* Kontrol */}
      <div ref={controlsRef}>
        <Button
          ref={closeBtnRef}
          variant="outline"
          iconOnly
          onClick={close}
          aria-label="Tutup dan kembali ke orbit"
          data-cursor="Tutup"
          className="fixed right-5 top-5 z-10 md:right-10"
        >
          <X />
        </Button>
        <div className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between bg-gradient-to-t from-navy via-navy/80 to-transparent px-5 py-5 md:px-10">
          <Button variant="ghost" size="sm" onClick={() => go(-1)} className="text-white hover:bg-white/10 hover:text-white">
            <ChevronLeft /> Sebelumnya
          </Button>
          <span className="hidden text-xs font-semibold text-white/50 md:block">
            {flipped ? "Esc untuk kembali ke foto" : "Esc untuk menutup · ← → untuk pindah proker"}
          </span>
          <Button variant="ghost" size="sm" onClick={() => go(1)} className="text-white hover:bg-white/10 hover:text-white">
            Berikutnya <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Reveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}

function px(r: Rect) {
  return { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` };
}
function pxNum(r: Rect) {
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}
