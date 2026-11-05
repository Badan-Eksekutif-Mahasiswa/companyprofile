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
| Data utama | API CMS SIT untuk kabinet, birdep, proker, statistik, dan berita |
| Data cadangan | JSON lokal untuk profil; Supabase atau contoh untuk berita saat SIT tidak dikonfigurasi |
| Deploy | Railway, panduan di [RAILWAY.md](RAILWAY.md) |

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
| `npm test` | Tes kontrak integrasi kabinet SIT |

### Variabel lingkungan

| Nama | Keterangan |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | URL publik website, untuk metadata/OG. |
| `NEXT_PUBLIC_YOUTUBE_VIDEO_ID` | ID video company profile (default `R5XbD1vjXlg`). |
| `SIT_API_URL` | URL API publik CMS, misalnya `https://sitbemui.com/api/website/v1`. |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Opsional, URL publik media yang memakai bucket langsung. |

## Struktur folder

```
app/
  page.tsx                Beranda
  kabinet/                Halaman kabinet + detail divisi (tim kabinet)
  design-system/          Dokumentasi visual design system
  api/stats/route.ts      GET /api/stats (v1 dummy)
  api/placeholder/        Gambar placeholder dinamis (tim kabinet)
  globals.css             Token design system (warna, radius, shadow, motion, glass)
components/
  ui/                     Komponen design system (Button, Badge, Card, SiteNav, SiteFooter, ...)
  webgl/                  MeshGradient (ogl)
  home/                   Section beranda + hero orbit
    orbit/scene.ts        Scene three.js: logo 3D + cincin kartu proker
    ProkerViewer.tsx      Tampilan zoom proker + kartu yang bisa dibalik
    DivisiBack.tsx        Sisi belakang kartu: ringkasan biro/departemen
  kabinet/, kabinet-list/ Komponen halaman kabinet (tim kabinet)
  proker/                 Komponen terkait proker (StatusBadge)
  layout/                 CustomCursor (hero beranda)
config/site.ts            Sosial media, pengaturan hero
data/                     Data v1 (lihat di bawah)
lib/
  kabinet.ts              Data kabinet & divisi (tim kabinet)
  data.ts                 Data beranda: proker, statistik, berita (server)
  unit.ts                 Jenis unit (BPH/Departemen/Biro) + ringkasan divisi
public/images/            Logo, foto dokumentasi proker, thumbnail berita
types/                    Tipe data beranda
```

## Beranda

Urutan section: **Hero orbit → Statistik → Tagline kabinet → Kabinet Kami → Berita Terbaru → Video → Footer**.

### Hero orbit (ala k95.it/en)

Latar, ukuran kartu, dan motion hero **mengikuti halaman detail kabinet** (`components/kabinet`): latar putih + grid silinder, kartu rasio 3:4, reveal teks per kata, smooth scroll Lenis, gelombang gambar saat scroll, dan transisi kartu terbang `expo.inOut` 1.5s. Komponen tim kabinet dipakai ulang tanpa diubah.

- **Orbit**: logo BEM UI 3D (ekstrusi siluet `components/home/orbit/logo-shapes.ts` + tekstur `public/images/logo-bem-ui.png`) dibungkus **20 proker unggulan** (`HERO.featured`, dipilih di `pickFeaturedProker` — tempat rotasi harian nanti) yang berputar otomatis (pelan). Perspektif kuat ala k95 (kartu belakang kecil, dekat besar), kartu mengisi sampai tepi layar dan lewat di balik navbar glass. **Scroll menggerakkan kartu turun** (berulang tanpa ujung) dan membuatnya bergelombang (shader sama dengan `DistortManager`). Kartu yang melintas di belakang logo **digeser menjauh** (tidak hilang) agar selalu berjarak dari logo.
- **Logo** hanya berputar (tidak mengikuti kursor). Klik logo → panel **filosofi logo** (isi resmi di `components/home/FilosofiLogo.tsx`; `data/filosofi-logo.json` opsional untuk override saat development).
- Selama hero ditahan, scroll menambah putaran (`HERO.maxRotations`) dan menggerakkan kartu turun, lalu halaman lanjut ke bawah.
- **Klik kartu** → kartu terbang ke tengah dan tampil **detail proker** (`components/home/detail`). **Klik kartu tengah / tab di kirinya / nama unit** → tampilan ditukar ke **detail biro/departemen** (isi sama dengan `/kabinet/[slug]`), klik lagi untuk kembali. Penukaran ini hanya ada di hero; halaman kabinet tetap seperti aslinya.
- Di bawah detail proker ada **Proker Selanjutnya** (transisi sama dengan "Divisi Selanjutnya"). Esc: kembali ke proker / tutup.
- Pengaturan ada di `config/site.ts` (`HERO`): jumlah cincin, kartu per cincin, kecepatan, batas putaran. Ukuran orbit/kamera di `components/home/orbit/scene.ts`.

Efisiensi: three.js dimuat setelah halaman tampil (logo PNG statis tampil lebih dulu dan jadi fallback tanpa WebGL); semua kartu + grid dalam satu WebGL context, kartu satu draw call (InstancedMesh + atlas); render berhenti saat hero tidak terlihat, tab tersembunyi, atau panel terbuka; tampilan detail (GSAP + Lenis) dan panel filosofi dimuat terpisah saat browser senggang; detail divisi diambil dari `/api/divisi/[slug]` (JSON statis hasil build) hanya saat dibutuhkan.

## Data

v1 memakai JSON di `data/`. Untuk migrasi ke SIT API (v2) cukup ganti isi fungsi di `lib/kabinet.ts` dan `lib/data.ts`; komponen UI tidak perlu diubah.

```
data/
  kabinet.json        info kabinet, ketua & wakil, misi (tim kabinet)
  divisi/[slug].json  detail tiap divisi: pengurus, staf, visi, misi (tim kabinet)
  proker.json         daftar proker; field `divisi` mengacu ke slug di divisi/ (beranda)
  filosofi-logo.json  filosofi logo (panel saat logo hero diklik)
  stats.json          statistik beranda
  news.json           artikel (sementara, v2 dari Supabase)
```

Jenis unit untuk label tab (BPH / Departemen / Biro) diturunkan di `lib/unit.ts`: slug `bph` → BPH, nama berawalan "Biro" → Biro, selain itu Departemen. Bila data divisi kelak punya field `type`, cukup ubah satu fungsi itu.

### Skema proker

Proker nantinya dikelola lewat **CRUD di sistem terpisah** (bukan di website ini); website hanya membaca dengan skema berikut:

```jsonc
{
  "slug": "kajian-strategis-sekolah-advokasi",
  "divisi": "kajian-strategis",   // slug di data/divisi/
  "nama": "Sekolah Advokasi",
  "status": "done",            // "upcoming" | "ongoing" | "done"
  "tanggal": "Maret 2026",
  "deskripsi": "Ringkasan satu kalimat.",
  "penjelasan": ["Paragraf 1", "Paragraf 2"],
  "foto_url": "/images/proker/kajian-strategis-sekolah-advokasi-cover.svg", // sampul 3:4, opsional
  "dokumentasi": [
    { "url": "/images/proker/kajian-strategis-sekolah-advokasi-1.svg", "caption": "Pembukaan kegiatan" }
  ]
}
```

**Sampul proker (`foto_url`) rasio 3:4** (disarankan 1200×1600), sama dengan kartu detail kabinet; dipakai di orbit dan kartu tengah. **Foto dokumentasi wajib rasio 4:3** (disarankan 1200×900). Bila `foto_url` kosong, `dokumentasi[0]` dipakai sebagai sampul.

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
| `/kabinet`, `/kabinet/[slug]` | Selesai (konten dummy, tim kabinet) |
| `/news`, `/news/[slug]` | Belum |

## Alur kerja Git

- `dev` adalah branch integrasi; fitur dikerjakan di `feature/*` (mis. `feature/home`, `feature/kabinet`, `feature/news`).
- Buka Pull Request ke `dev`.



