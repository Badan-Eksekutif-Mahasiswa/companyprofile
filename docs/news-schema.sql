-- Skema tabel artikel News BEM UI 2026 (Supabase / Postgres).
-- Jalankan di Supabase: SQL Editor. Sesuaikan bila tabel sudah ada, lalu ubah mapper di lib/news.ts (fromRow).

create table if not exists public.articles (
  slug          text primary key,
  judul         text not null,
  kategori      text not null check (kategori in ('kajian-strategis','siaran-pers','opini-artikel','kabar-ui')),
  tag           text[] not null default '{}',
  tanggal       date not null,
  penulis       text not null,
  estimasi_baca int  not null default 3,
  excerpt       text not null,
  hero_image    text,                 -- path di R2 (mis. news/slug/hero.webp) atau URL penuh
  caption       text,
  body          jsonb not null default '[]',  -- array blok: {type:"p"|"h2"|"h3"|"quote"|"ul"|"ol", ...}
  seo           jsonb,                -- {title, description, ogImage}
  published     boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists articles_published_tanggal_idx on public.articles (published, tanggal desc);

-- Publik hanya boleh MEMBACA artikel yang sudah dipublikasikan. Tulis lewat sistem internal (service role).
alter table public.articles enable row level security;

drop policy if exists "baca artikel terbit" on public.articles;
create policy "baca artikel terbit" on public.articles
  for select to anon, authenticated
  using (published = true);
