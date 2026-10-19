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
  photo_2?: ApiMedia | null;
  photo_3?: ApiMedia | null;
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
  cover_photo?: ApiMedia | null;
  leaders: ApiLeader[];
  staff: { id: number; name: string; work_area?: string; photo: ApiMedia | null }[];
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

/** Published units do not depend on publication of their parent cabinet profile. */
export async function fetchSitUnits(): Promise<ApiUnit[] | null> {
  if (!BASE) return null;
  const response = await fetch(`${BASE}/units/`, { next: { revalidate: 60 } });
  if (!response.ok) throw new Error(`API SIT menjawab ${response.status}`);
  const units = ((await response.json()) as { results: ApiUnit[] }).results;
  // Routes use a slug, so retain units from one (latest) cabinet only.
  const latest = Math.max(0, ...units.map((unit) => unit.cabinet_id));
  return units.filter((unit) => unit.cabinet_id === latest);
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

const hasPoseFields = (leader: ApiLeader | undefined) => !!leader &&
  (Object.hasOwn(leader, "photo_2") || Object.hasOwn(leader, "photo_3"));

function photoSequence(leader: ApiLeader | undefined): Media[] {
  return [leader?.photo, leader?.photo_2, leader?.photo_3]
    .flatMap((photo) => photo?.url ? [{ url: photo.url, alt: photo.alt || leader?.name || "" }] : []);
}

function tokoh(leader: ApiLeader | undefined, jabatan: string): Tokoh {
  const name = leader?.name || "";
  return {
    nama: name,
    jabatan: leader?.title || jabatan,
    fakultas: [leader?.faculty, leader?.cohort].filter(Boolean).join(" "),
    kutipan: leader?.quote || leader?.description || "",
    foto: media(leader?.photo || leader?.photo_2 || leader?.photo_3, `Foto ${name || jabatan}`, placeholder(jabatan, 1200, 1500, "navy", "FOTO")),
    ...(hasPoseFields(leader) ? { fotos: photoSequence(leader) } : {}),
  };
}

const orang = (nama: string, jabatan: string, foto: ApiMedia | null, unit: string): Person => ({
  nama,
  jabatan,
  foto: media(foto, `${jabatan} ${unit}`, placeholder(nama.toUpperCase() || "FOTO", 1200, 1500, "navy", jabatan.toUpperCase())),
});

const programSlug = (unit: ApiUnit, program: ApiProgram) => `${unit.slug}-${program.slug || program.id}`;

function sectionsDariProker(unit: ApiUnit, singkat: string): Section[] {
  const kartu = unit.programs.map(
    (p): Media => {
      const photo = p.main_photo?.url ? p.main_photo : p.gallery.find((image) => image?.url);
      return {
        ...media(photo, p.title, placeholder(`${singkat} — PROKER`, 1200, 1600, "navy", "FOTO PROKER")),
        title: p.title,
        desc: p.description,
        ...(photo?.url ? { prokerSlug: programSlug(unit, p) } : {}),
      };
    },
  );
  const out: Section[] = [];
  if (unit.main_photo?.url) {
    out.push({ type: "media-single", position: "center",
      media: media(unit.main_photo, `Foto utama ${unit.name}`, "") });
  }
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
  const cover = media(Object.hasOwn(unit, "cover_photo") ? unit.cover_photo : unit.main_photo,
    `Foto bersama ${unit.name}`, placeholder(`FOTO ${singkat}`, 1200, 1600, "navy", "COVER"));
  const bph = unit.leaders.filter((l) => l.name).map((l) => ({
    ...orang(l.name, l.title, l.photo, unit.name),
    foto: media(l.photo || l.photo_2 || l.photo_3, l.name, placeholder(l.title, 1200, 1600, "navy", "FOTO")),
    fotos: hasPoseFields(l) ? photoSequence(l) : undefined,
    jurusanAngkatan: l.description,
  }));
  return {
    order,
    slug: unit.slug,
    title: [unit.name, cabinetName].filter(Boolean).join(" | "),
    nama: unit.name,
    singkatan: singkat,
    tagline: unit.summary,
    categories: [{ name: unit.group_label, slug: unit.group }],
    roles: unit.roles ?? [],
    description: unit.description,
    visi: unit.vision,
    misi: unit.missions,
    bph,
    staff: unit.staff.map((s) => orang(s.name, s.work_area?.trim() || "", s.photo, unit.name)),
    cover,
    logo: { url: placeholder(singkat, 1200, 1200, "navy", "LOGO", "logo"), alt: `Logo ${unit.name}` },
    foto_bph: cover,
    sections: sectionsDariProker(unit, singkat),
  };
}

export function toKabinet(api: ApiCabinet, portrait?: Pick<Tokoh, "nama" | "fakultas" | "fotos">, vicePortrait?: Pick<Tokoh, "nama" | "fakultas" | "fotos">): Kabinet {
  const byRole = new Map(api.leaders.map((l) => [l.role_key, l]));
  const ketua = tokoh(byRole.get("ketua"), "Ketua BEM UI");
  const wakil = tokoh(byRole.get("wakil-ketua"), "Wakil Ketua BEM UI");
  const personKey = (name: string) => name.normalize("NFKD").replace(/[^a-z0-9]/gi, "").toLowerCase();
  // A local photo sequence must never be assigned to a different CMS office-holder.
  for (const [leader, local] of [[ketua, portrait], [wakil, vicePortrait]] as const) {
    if (local?.fotos?.length && !leader.fotos && leader.nama && personKey(leader.nama) === personKey(local.nama)) {
      leader.fotos = local.fotos;
      leader.foto = local.fotos[0];
      leader.fakultas = local.fakultas;
    }
  }
  return {
    nama: api.name,
    deskripsi: api.description,
    visi: api.vision,
    misi: misiDenganKunci(api.missions).map((mission, index) => ({
      ...mission, kunci: api.mission_keywords?.[index] || mission.kunci,
    })),
    ketua,
    wakil,
    pengurusInti: api.leaders.filter((leader) => leader.name.trim() && leader.description.trim()
      && photoSequence(leader).length > 0 && !["ketua", "wakil-ketua"].includes(leader.role_key))
      .map((leader) => ({
        ...orang(leader.name, leader.title, leader.photo || leader.photo_2 || leader.photo_3 || null, api.name),
        fotos: photoSequence(leader),
        jurusanAngkatan: [leader.faculty, leader.cohort].filter(Boolean).join(" "),
      })),
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

export function toHeroProker(api: Pick<ApiCabinet, "units">, unitType: (d: Pick<Divisi, "slug" | "nama">) => HeroProker["unit"]["type"]): HeroProker[] {
  return api.units.flatMap((u) =>
    u.programs.flatMap((p) => {
      const foto_url = p.main_photo?.url || p.gallery.find((g) => g?.url)?.url;
      if (!foto_url) return [];
      return [
        {
          slug: programSlug(u, p),
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
