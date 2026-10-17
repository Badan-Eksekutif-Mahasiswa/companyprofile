// Hanya untuk server. Membaca profil kabinet dan birdep dari API publik CMS SIT
// (/api/website/v1/cabinets/<id>/), lalu memetakannya ke tipe yang dipakai UI.
import "server-only";
import type { Divisi, Kabinet, Media, Person, Section, Tokoh } from "@/lib/kabinet";
import type { HeroProker } from "@/types";

const BASE = process.env.SIT_API_URL?.replace(/\/+$/, "");

interface ApiMedia {
  url: string;
  alt?: string;
  caption?: string;
}

interface ApiLeader {
  role_key: string;
  title: string;
  group: string;
  name: string;
  description: string;
  photo: ApiMedia | null;
  faculty?: string;
  cohort?: string;
  quote?: string;
}

interface ApiProgram {
  id: number;
  title: string;
  description: string;
  summary?: string;
  slug?: string;
  status?: HeroProker["status"];
  schedule?: string;
  main_photo: ApiMedia | null;
  gallery: (ApiMedia | null)[];
}

interface ApiUnit {
  id: number;
  slug: string;
  cabinet_id: number;
  name: string;
  kind: "biro" | "departemen" | "spi";
  group: string;
  group_label: string;
  summary: string;
  abbreviation?: string;
  roles?: string[];
  description: string;
  vision: string;
  missions: string[];
  main_photo: ApiMedia | null;
  leaders: ApiLeader[];
  staff: { id: number; name: string; photo: ApiMedia | null }[];
  programs: ApiProgram[];
}

export interface ApiCabinet {
  id: number;
  name: string;
  description: string;
  vision: string;
  missions: string[];
  mission_keywords?: string[];
  main_photo: ApiMedia | null;
  leaders: ApiLeader[];
  units: ApiUnit[];
  statistics: { units: number; programs: number; people: number; active_programs?: number;
                represented_students?: number | null; faculties?: number | null };
}

/** Kabinet terbaru yang sudah terbit di SIT; null bila SIT belum dikonfigurasi atau belum ada yang terbit. */
export async function fetchSitCabinet(): Promise<ApiCabinet | null> {
  if (!BASE) return null;
  const list = await fetch(`${BASE}/cabinets/`, { next: { revalidate: 60 } });
  if (!list.ok) throw new Error(`API SIT menjawab ${list.status}`);
  const latest = ((await list.json()) as { results: { id: number }[] }).results[0];
  if (!latest) return null;
  if (!Number.isSafeInteger(latest.id) || latest.id < 1) throw new Error("ID kabinet SIT tidak valid");
  const res = await fetch(`${BASE}/cabinets/${latest.id}/`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`API SIT menjawab ${res.status}`);
  return (await res.json()) as ApiCabinet;
}

const placeholder = (label: string, w: number, h: number, tone: string, sub: string, kind?: "logo") =>
  `/api/placeholder?${new URLSearchParams({ label, w: String(w), h: String(h), tone, sub, ...(kind ? { kind } : {}) })}`;

const media = (m: ApiMedia | null | undefined, alt: string, fallback: string): Media =>
  m?.url ? { url: m.url, alt: m.alt || m.caption || alt } : { url: fallback, alt };

/** "Departemen Kajian Strategis" → "KS"; "Satuan Pengendali Internal" → "SPI"; "Biro Multimedia" → "MULTIMEDIA". */
function singkatan(name: string) {
  const kata = name
    .replace(/^(biro|departemen)\s+/i, "")
    .split(/\s+/)
    .filter((w) => w && !/^(dan|dari|di|ke|untuk)$/i.test(w));
  return kata.length === 1 ? kata[0].toUpperCase() : kata.map((w) => w[0].toUpperCase()).join("");
}

/**
 * SIT menyimpan misi sebagai kalimat biasa, tanpa kata kunci yang dipakai tipografi besar.
 * ponytail: kata pertama yang belum dipakai misi lain; ganti dengan field `kunci` bila SIT menambahkannya.
 */
function misiDenganKunci(missions: string[]): Kabinet["misi"] {
  const dipakai = new Set<string>();
  return missions.map((teks) => {
    const kata = teks.replace(/[^\p{L}\s-]/gu, "").split(/\s+/).filter(Boolean);
    const kunci = kata.find((k) => !dipakai.has(k.toLowerCase())) ?? kata[0] ?? "Misi";
    dipakai.add(kunci.toLowerCase());
    return { teks, kunci: kunci[0].toUpperCase() + kunci.slice(1) };
  });
}

function tokoh(leader: ApiLeader | undefined, jabatan: string): Tokoh {
  const name = leader?.name || "";
  return {
    nama: name,
    jabatan: leader?.title || jabatan,
    fakultas: [leader?.faculty, leader?.cohort].filter(Boolean).join(" / "),
    kutipan: leader?.quote || leader?.description || "",
    foto: media(leader?.photo, `Foto ${name || jabatan}`, placeholder(jabatan, 1200, 1500, "navy", "FOTO")),
  };
}

const orang = (nama: string, jabatan: string, foto: ApiMedia | null, unit: string): Person => ({
  nama,
  jabatan,
  foto: media(foto, `${jabatan} ${unit}`, placeholder(nama.toUpperCase() || "FOTO", 1200, 1500, "navy", jabatan.toUpperCase())),
});

function sectionsDariProker(unit: ApiUnit, singkat: string): Section[] {
  const kartu = unit.programs.map(
    (p): Media => ({
      ...media(p.main_photo, p.title, placeholder(`${singkat} — PROKER`, 1200, 1600, "navy", "FOTO PROKER")),
      title: p.title,
      desc: p.description,
    }),
  );
  const out: Section[] = [];
  for (let i = 0; i < kartu.length; i += 2) {
    out.push(
      kartu[i + 1]
        ? { type: "media-duo", media_left: kartu[i], media_right: kartu[i + 1] }
        : { type: "media-single", position: "center", media: kartu[i] },
    );
  }
  return out;
}

export function toDivisi(unit: ApiUnit, order: number, cabinetName: string): Divisi {
  const singkat = unit.abbreviation || singkatan(unit.name);
  const cover = media(unit.main_photo, `Foto ${unit.name}`, placeholder(`FOTO ${singkat}`, 1200, 1600, "navy", "COVER"));
  const bph = unit.leaders.filter((l) => l.name).map((l) => orang(l.name, l.title, l.photo, unit.name));
  return {
    order,
    slug: unit.slug,
    title: `${unit.name} | ${cabinetName}`,
    nama: unit.name,
    singkatan: singkat,
    tagline: unit.summary,
    categories: [{ name: unit.group_label, slug: unit.group }],
    roles: unit.roles ?? [],
    description: unit.description,
    visi: unit.vision,
    misi: unit.missions,
    bph,
    staff: unit.staff.map((s) => orang(s.name, "Staf", s.photo, unit.name)),
    cover,
    logo: { url: placeholder(singkat, 1200, 1200, "navy", "LOGO", "logo"), alt: `Logo ${unit.name}` },
    foto_bph: bph[0]?.foto ?? cover,
    sections: sectionsDariProker(unit, singkat),
  };
}

export function toKabinet(api: ApiCabinet): Kabinet {
  const byRole = new Map(api.leaders.map((l) => [l.role_key, l]));
  return {
    nama: api.name,
    deskripsi: api.description,
    visi: api.vision,
    misi: misiDenganKunci(api.missions).map((mission, index) => ({
      ...mission, kunci: api.mission_keywords?.[index] || mission.kunci,
    })),
    ketua: tokoh(byRole.get("ketua"), "Ketua BEM UI"),
    wakil: tokoh(byRole.get("wakil-ketua"), "Wakil Ketua BEM UI"),
    stats: {
      divisi: api.statistics.units,
      anggota: api.statistics.people,
      proker: api.statistics.programs,
      fakultas: api.statistics.faculties ?? 0,
    },
    proker: api.units.flatMap((u) =>
      u.programs.map((p) => ({
        divisi: u.slug,
        title: p.title,
        date: p.schedule || "",
        image: p.main_photo?.url ?? placeholder(`${singkatan(u.name)} — PROKER`, 1200, 1600, "navy", "FOTO PROKER"),
      })),
    ),
  };
}

export function toHeroProker(api: ApiCabinet, unitType: (d: Pick<Divisi, "slug" | "nama">) => HeroProker["unit"]["type"]): HeroProker[] {
  return api.units.flatMap((u) =>
    u.programs.flatMap((p) => {
      const foto_url = p.main_photo?.url ?? p.gallery.find((g) => g?.url)?.url;
      if (!foto_url) return [];
      return [
        {
          slug: `${u.slug}-${p.slug || p.id}`,
          divisi: u.slug,
          nama: p.title,
          status: p.status || undefined,
          tanggal: p.schedule || undefined,
          deskripsi: p.summary || p.description,
          penjelasan: p.description ? [p.description] : [],
          foto_url,
          dokumentasi: p.gallery.flatMap((g) => (g?.url ? [{ url: g.url, caption: g.caption ?? "" }] : [])),
          unit: { slug: u.slug, nama: u.name, singkatan: u.abbreviation || singkatan(u.name), type: unitType({ slug: u.slug, nama: u.name }) },
        },
      ];
    }),
  );
}
