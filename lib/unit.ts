import type { Divisi } from "@/lib/kabinet";
import type { DivisiSummary, UnitType } from "@/types";

/**
 * Jenis unit diturunkan dari data divisi tim kabinet (skemanya belum punya field `type`):
 * slug "bph" → BPH, nama berawalan "Biro" → Biro, selain itu Departemen.
 * Bila nanti ada field `type` di data, ganti isi fungsi ini saja.
 */
export function unitType(d: Pick<Divisi, "slug" | "nama">): UnitType {
  if (d.slug === "bph") return "BPH";
  return /^biro\b/i.test(d.nama) ? "Biro" : "Departemen";
}

export function toSummary(d: Divisi): DivisiSummary {
  return {
    slug: d.slug,
    nama: d.nama,
    singkatan: d.singkatan,
    type: unitType(d),
    description: d.description,
    visi: d.visi,
    misi: d.misi,
    pengurus: d.bph.map((p) => ({ nama: p.nama, jabatan: p.jabatan, foto: p.foto.url })),
    stafCount: d.staff.length,
  };
}
