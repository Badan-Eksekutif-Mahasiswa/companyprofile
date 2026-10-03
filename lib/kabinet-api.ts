// Hanya untuk server. Membaca profil kabinet dan birdep dari API publik CMS SIT
// (/api/website/v1/cabinets/<tahun>/), lalu memetakannya ke tipe yang dipakai UI.
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
}

interface ApiProgram {
  id: number;
  title: string;
  description: string;
  main_photo: ApiMedia | null;
  gallery: (ApiMedia | null)[];
}

interface ApiUnit {
  id: number;
  slug: string;
  year: number;
  name: string;
  kind: "biro" | "departemen" | "spi";
  group: string;
  group_label: string;
  summary: string;
  description: string;
  vision: string;
  missions: string[];
  main_photo: ApiMedia | null;
  leaders: ApiLeader[];
  staff: { id: number; name: string; photo: ApiMedia | null }[];
  programs: ApiProgram[];
}

export interface ApiCabinet {
  year: number;
  name: string;
  description: string;
  vision: string;
  missions: string[];
  main_photo: ApiMedia | null;
  leaders: ApiLeader[];
  units: ApiUnit[];
  statistics: { units: number; programs: number; people: number };
}

/** Kabinet terbaru yang sudah terbit di SIT; null bila SIT belum dikonfigurasi atau belum ada yang terbit. */
export async function fetchSitCabinet(): Promise<ApiCabinet | null> {
  if (!BASE) return null;
  const list = await fetch(`${BASE}/cabinets/`, { next: { revalidate: 60 } });
  if (!list.ok) throw new Error(`API SIT menjawab ${list.status}`);
  const latest = ((await list.json()) as { results: { year: number }[] }).results[0];
  if (!latest) return null;
  const res = await fetch(`${BASE}/cabinets/${latest.year}/`, { next: { revalidate: 60 } });
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

function tokoh(leader: ApiLeader | undefined, jabatan: string, fallback: Tokoh): Tokoh {
  if (!leader?.name) return fallback;
  return {
    nama: leader.name,
    jabatan: leader.title || jabatan,
    // SIT belum menyimpan fakultas; kutipan memakai deskripsi singkat pengurus.
    fakultas: "",
    kutipan: leader.description,
    foto: media(leader.photo, `Foto ${leader.name}`, fallback.foto.url),
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
      ...media(p.main_photo, p.title, placeholder(`${singkat} — PROKER`, 1200, 1500, "navy", "FOTO PROKER")),
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
  const singkat = singkatan(unit.name);
  const cover = media(unit.main_photo, `Foto ${unit.name}`, placeholder(`FOTO ${singkat}`, 1400, 1900, "navy", "COVER"));
  const bph = unit.leaders.filter((l) => l.name).map((l) => orang(l.name, l.title, l.photo, unit.name));
  return {
    order,
    slug: unit.slug,
    title: `${unit.name} | ${cabinetName}`,
    nama: unit.name,
    singkatan: singkat,
    tagline: unit.summary,
    year: String(unit.year),
    categories: [{ name: unit.group_label, slug: unit.group }],
    roles: [],
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

export function toKabinet(api: ApiCabinet, fallback: Kabinet): Kabinet {
  const byRole = new Map(api.leaders.map((l) => [l.role_key, l]));
  return {
    nama: api.name,
    periode: `BEM UI ${api.year}`,
    deskripsi: api.description,
    visi: api.vision,
    misi: misiDenganKunci(api.missions),
    ketua: tokoh(byRole.get("ketua"), `Ketua BEM UI ${api.year}`, fallback.ketua),
    wakil: tokoh(byRole.get("wakil-ketua"), `Wakil Ketua BEM UI ${api.year}`, fallback.wakil),
    stats: {
      divisi: api.statistics.units,
      anggota: api.statistics.people,
      proker: api.statistics.programs,
      // SIT belum menghitung fakultas, jadi angka ini tetap dari data/kabinet.json.
      fakultas: fallback.stats.fakultas,
    },
    proker: api.units.flatMap((u) =>
      u.programs.map((p) => ({
        divisi: u.slug,
        title: p.title,
        date: u.name,
        image: p.main_photo?.url ?? placeholder(`${singkatan(u.name)} — PROKER`, 1200, 1500, "navy", "FOTO PROKER"),
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
          slug: `${u.slug}-${p.id}`,
          divisi: u.slug,
          nama: p.title,
          // SIT belum menyimpan status dan tanggal proker; UI menyembunyikan keduanya bila kosong.
          deskripsi: p.description,
          penjelasan: p.description ? [p.description] : [],
          foto_url,
          dokumentasi: p.gallery.flatMap((g) => (g?.url ? [{ url: g.url, caption: g.caption ?? "" }] : [])),
          unit: { slug: u.slug, nama: u.name, singkatan: singkatan(u.name), type: unitType({ slug: u.slug, nama: u.name }) },
        },
      ];
    }),
  );
}
