/**
 * Spesifikasi motion terpusat (acuan: feel K95).
 *
 * Semua nilai gerak halaman News dibaca dari sini, jadi tuning
 * setelah dibandingkan side-by-side dengan K95 cukup edit satu file.
 * Nilai awal = tebakan, BELUM diukur dari K95 (source K95 tidak bisa dibaca).
 * Selaras dengan token CSS di globals.css (--ease-out, --dur-*).
 */
export const MOTION = {
  /** cubic-bezier ease-out-expo, sama dengan --ease-out. */
  ease: [0.16, 1, 0.3, 1] as const,
  duration: { fast: 0.15, base: 0.22, slow: 0.38, reveal: 0.8 },
  reveal: {
    /** Jarak geser awal (px) dan jeda antar elemen (ms). */
    y: 24,
    stagger: 70,
    /** Bagian elemen yang harus terlihat sebelum muncul. */
    threshold: 0.12,
  },
  /** Interpolasi (lerp) untuk gerak yang mengikuti kursor/scroll; 0–1 per frame. */
  lerp: 0.1,
  smoothScroll: { duration: 1.2, wheelMultiplier: 1 },
} as const;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
