-- Skema tabel artikel News BEM UI 2026 (Supabase / Postgres).
-- Kolom mengikuti data yang diterima: judul, ringkasan, isi, gambar_utama, penulis, tag, tanggal, sumber, lampiran.
-- Jalankan di Supabase SQL Editor. Bila tabel sudah ada dengan nama lain, ubah pemetaan di lib/news-data.ts (fromRow).

create table if not exists public.articles (
  id             bigint generated always as identity primary key,
  slug           text unique not null,   -- URL artikel, huruf kecil-dengan-strip, mis. analisis-kritis-kebijakan-ukt
  judul          text not null,
  ringkasan      text not null,          -- teks pratinjau di kartu & meta description
  isi            text not null,          -- teks biasa (## subjudul, > kutipan, - daftar) ATAU array blok JSON; HTML tidak dirender
  gambar_utama   text,                   -- path di R2 (mis. news/slug/hero.webp) atau URL penuh
  gambar_caption text,
  penulis        text not null,
  tag            text[] not null default '{}',
  tanggal        date not null,
  sumber         jsonb not null default '[]',   -- ["Teks"] atau [{"nama":"Kompas","url":"https://..."}]
  lampiran       jsonb not null default '[]',   -- [{"nama":"Kajian UKT.pdf","url":"news/ukt/kajian.pdf","tipe":"pdf","ukuran":"1,2 MB"}]
  kategori       text not null default 'kabar-ui' check (kategori in ('kajian-strategis','siaran-pers','opini-artikel','kabar-ui')),
  poin_utama     text[],                 -- opsional: 3-4 poin penting di atas artikel
  diperbarui     date,                   -- opsional: tanggal revisi
  koreksi        text,                   -- opsional: catatan koreksi
  seo            jsonb,                  -- opsional {title, description, ogImage}
  published      boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists articles_published_tanggal_idx on public.articles (published, tanggal desc);

-- Publik hanya boleh MEMBACA artikel yang sudah dipublikasikan. Tulis lewat sistem internal (service role).
alter table public.articles enable row level security;

drop policy if exists "baca artikel terbit" on public.articles;
create policy "baca artikel terbit" on public.articles
  for select to anon, authenticated
  using (published = true);

-- Bila tabel sudah ada:
-- alter table public.articles add column if not exists poin_utama text[], add column if not exists diperbarui date, add column if not exists koreksi text;
