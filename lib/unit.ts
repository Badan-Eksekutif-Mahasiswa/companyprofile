import type { Divisi } from "@/lib/kabinet";
import type { UnitType } from "@/types";

/**
 * Jenis unit diturunkan dari data divisi tim kabinet (skemanya belum punya field `type`):
 * slug "bph" → BPH, nama berawalan "Biro" → Biro, selain itu Departemen.
 * Bila nanti ada field `type` di data, ganti isi fungsi ini saja.
 */
export function unitType(d: Pick<Divisi, "slug" | "nama">): UnitType {
  if (d.slug === "bph") return "BPH";
  return /^biro\b/i.test(d.nama) ? "Biro" : "Departemen";
}

