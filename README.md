# Website BEM UI 2026 — Kabinet TerusTerang

Website utama Badan Eksekutif Mahasiswa Universitas Indonesia 2026. Detail fitur, user flow, sitemap, dan arsitektur data ada di dokumen **PRD**, **User Flow**, dan **Wireframe** Website BEM UI 2026 (Biro Multimedia Developer).

## Tech stack

| Layer | Teknologi |
| --- | --- |
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS 3 + design system internal (`app/globals.css`, `components/ui`) |
| 3D / WebGL | `three` (hero orbit + logo 3D), `ogl` (MeshGradient) |
| Animasi UI | `framer-motion` |
| Ikon | `lucide-react` |
| Data v1 | Flat JSON di `data/` |
| Data v2 (rencana) | SIT BEM UI (CRUD) + Supabase |
| Deploy | Vercel (auto-deploy dari GitHub) |

## Menjalankan secara lokal

Butuh Node.js 18.17+ (disarankan 20/22).

```bash
npm install
cp .env.example .env.local   # opsional, isi variabel bila perlu
npm run dev                  # http://localhost:3000
```

| Script | Fungsi |
| --- | --- |
| `npm run dev` | Server development |
| `npm run build` | Build produksi (sekaligus type check & lint) |
| `npm run start` | Menjalankan hasil build |
| `npm run lint` | ESLint |

### Variabel lingkungan

| Nama | Keterangan |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | URL publik website, untuk metadata/OG. |
| `NEXT_PUBLIC_YOUTUBE_VIDEO_ID` | ID video company profile. Kosong = tampil tautan ke channel YouTube. |

## Struktur folder

```
app/
  (site)/                 halaman publik (punya navbar + kursor)
    page.tsx              Beranda
    kabinet/[slug]/       Detail biro/departemen
  design-system/          Dokumentasi visual design system
  api/stats/route.ts      GET /api/stats (v1 dummy)
  globals.css             Token design system (warna, radius, shadow, motion, glass)
components/
  ui/                     Komponen design system (Button, Badge, Card, Navbar, ...)
  webgl/                  MeshGradient (ogl)
  home/                   Section beranda + hero orbit
    orbit/scene.ts        Scene three.js: logo 3D + kartu proker (Rings/Spiral)
    ProkerViewer.tsx      Tampilan zoom proker + kartu yang bisa dibalik
    DivisiBack.tsx        Sisi belakang kartu: ringkasan biro/departemen
  divisi/                 Konten halaman detail divisi
  proker/                 Komponen terkait proker (StatusBadge)
  layout/                 SiteHeader, SiteFooter, CustomCursor
config/site.ts            Navigasi, sosial media, pengaturan hero
data/                     Data v1 (lihat di bawah)
lib/
  data.ts                 Data access layer (server)
  divisi-client.ts        Loader divisi on-demand di klien
public/images/            Logo, foto proker, cover divisi, thumbnail berita
types/                    Tipe data bersama
```

## Beranda

Urutan section: **Hero orbit → Statistik → Tagline kabinet → Kabinet Kami → Berita Terbaru → Video → Footer**.

### Hero orbit (ala k95.it/en)

- Logo BEM UI 3D (ekstrusi dari siluet `components/home/orbit/logo-shapes.ts` + tekstur `public/images/logo-bem-ui.png`) dibungkus kartu proker yang berputar otomatis, mode **Rings** dan **Spiral**.
- Scroll menambah putaran sampai batas `HERO.maxRotations` (default 2); setelah itu halaman lanjut ke section berikutnya. Ada tombol **Lewati**.
- Klik kartu → foto membesar (viewer). Tab **Biro/Departemen** di sisi kartu **membalik kartu** dan menampilkan detail divisi di belakangnya, tanpa pindah halaman. Esc: balik kartu / tutup viewer. Panah kiri/kanan: pindah proker.
- Pengaturan ada di `config/site.ts` (`HERO`): jumlah cincin, kartu per cincin, kecepatan, batas putaran, warna latar.

Efisiensi: three.js dimuat terpisah setelah halaman tampil (logo PNG statis tampil lebih dulu dan menjadi fallback bila WebGL tidak didukung); semua kartu dirender dalam satu draw call (InstancedMesh + atlas); render berhenti saat hero tidak terlihat, tab tersembunyi, atau viewer terbuka; data divisi diunduh hanya saat kartu dibalik.

## Data

v1 memakai JSON di `data/`, dibaca lewat `lib/data.ts`. Untuk migrasi ke SIT API (v2) cukup ganti isi fungsi di `lib/data.ts` dan `lib/divisi-client.ts`; komponen UI tidak perlu diubah.

```
data/
  kabinet.json        info kabinet (deskripsi, visi, misi, nilai utama, kata kabem)
  struktur.json       daftar divisi + urutan (dipakai juga untuk prev/next)
  stats.json          statistik beranda
  news.json           artikel (sementara, v2 dari Supabase)
  divisi/[slug].json  detail tiap divisi + anggota + proker
```

### Skema proker

Proker nantinya dikelola lewat **CRUD di sistem terpisah** (bukan di website ini); website hanya membaca dengan skema berikut:

```jsonc
{
  "slug": "kastrat-sekolah-advokasi",
  "nama": "Sekolah Advokasi",
  "status": "done",            // "upcoming" | "ongoing" | "done"
  "tanggal": "Maret 2026",
  "deskripsi": "Ringkasan satu kalimat.",
  "penjelasan": ["Paragraf 1", "Paragraf 2"],
  "foto_url": "/images/proker/kastrat-sekolah-advokasi-1.svg", // sampul, opsional
  "dokumentasi": [
    { "url": "/images/proker/kastrat-sekolah-advokasi-1.svg", "caption": "Pembukaan kegiatan" }
  ]
}
```

**Semua foto proker & dokumentasi wajib rasio 4:3** (disarankan 1200×900) agar konsisten di orbit, viewer, dan halaman divisi. Bila `foto_url` kosong, `dokumentasi[0]` dipakai sebagai sampul.

> Seluruh isi data dan gambar di repo ini masih **dummy** (placeholder SVG). Ganti dengan konten resmi sebelum rilis.

## Design system

Token ada di `app/globals.css` (palet navy, blue, maroon, red, pink; radius; shadow; motion; glass) dan dipetakan ke Tailwind di `tailwind.config.ts`. Komponen siap pakai di `components/ui` (lihat `/design-system`). Aturan singkat:

- Glass (`Card variant="glass"`, `Navbar`) hanya di atas area berwarna.
- Font: Plus Jakarta Sans (`--font-jakarta`).
- Gunakan `cn()` dari `lib/utils.ts` untuk menggabungkan kelas.

## Status halaman

| Route | Status |
| --- | --- |
| `/` | Selesai (konten dummy) |
| `/kabinet/[slug]` | Selesai (konten dummy) |
| `/kabinet` | Belum |
| `/news`, `/news/[slug]` | Belum |

## Alur kerja Git

- `dev` adalah branch integrasi; fitur dikerjakan di `feature/*` (mis. `feature/home`, `feature/kabinet`, `feature/news`).
- Buka Pull Request ke `dev`.
