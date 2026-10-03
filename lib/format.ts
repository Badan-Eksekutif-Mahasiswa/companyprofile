import type { ProkerStatus } from "@/types";

export const STATUS_LABEL: Record<ProkerStatus, string> = {
  upcoming: "Akan Datang",
  ongoing: "Sedang Berjalan",
  done: "Selesai",
};

export function initials(nama: string) {
  return nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

const tanggalFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" });

/** "2026-03-15" → "15 Maret 2026" */
export function formatTanggal(iso: string) {
  return tanggalFmt.format(new Date(`${iso}T00:00:00`));
}

export const clamp =(v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
