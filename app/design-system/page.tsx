"use client";

import * as React from "react";
import { AlertTriangle, FolderOpen, LogOut, Mail, Plus, Settings, Star, Sparkles, Bell, User, Zap, Diamond } from "lucide-react";
import {
  Alert, Avatar, AvatarGroup, Badge, Breadcrumb, Button, Card, CardDescription, CardIcon, CardTitle,
  Checkbox, Dropdown, DropdownItem, DropdownMenu, DropdownSeparator, EmptyState, Field, Input,
  InputWithIcon, MemberCard, Modal, Navbar, Pagination, Progress, Select, Skeleton,
  StatCard, Tabs, Textarea, Toast,
} from "@/components/ui";
import { MeshGradient } from "@/components/webgl";

function Section({ id, eyebrow, title, desc, children }: { id: string; eyebrow: string; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="py-[88px] max-sm:py-14">
      <div className="mb-10 max-w-[640px]">
        <Badge variant="pink" className="mb-4 text-[13px] px-3.5 py-1.5">{eyebrow}</Badge>
        <h2 className="mb-2.5 text-[32px] leading-[1.15]">{title}</h2>
        {desc && <p className="text-base leading-relaxed text-secondary">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-3.5 text-xs font-bold uppercase tracking-wider text-faint">{children}</div>
);

const swatches = [
  ["Navy", "#0B102D", "var(--navy)"], ["Blue", "#475CA3", "var(--blue)"], ["Blue Soft", "#9CB3D3", "var(--blue-soft)"],
  ["Maroon", "#5E121C", "var(--maroon)"], ["Red", "#82181A", "var(--red)"], ["Pink / Accent", "#D64C6F", "var(--pink)"],
  ["Pink Light", "#FFCED8", "var(--pink-light)"], ["Pink Pale", "#FFF2F5", "var(--pink-pale)"],
  ["Off White", "#FAFAFA", "var(--off-white)"], ["Border", "#E7E7EC", "var(--border)"],
] as const;

export default function DesignSystemPage() {
  const [modal, setModal] = React.useState(false);
  const [page, setPage] = React.useState(1);

  return (
    <div className="relative pb-28">
      <MeshGradient />

      <div className="relative z-10 pt-4">
        <Navbar
          links={[{ label: "Kabinet", href: "/kabinet" }, { label: "Program Kerja", href: "#" }, { label: "Divisi", href: "#" }, { label: "Kontak", href: "#" }]}
          actions={<><Button variant="ghost" size="sm">Masuk</Button><Button size="sm">Gabung Divisi</Button></>}
        />
      </div>

      <header className="relative z-10 px-6 pb-[110px] pt-[120px] text-center">
        <Badge className="mb-[22px] px-3.5 py-1.5 text-[13px]">Design System v3</Badge>
        <h1 className="mx-auto mb-5 max-w-[820px] text-[clamp(40px,6vw,68px)] leading-[1.05]">
          Fondasi visual untuk{" "}
          <span className="inline-flex items-center rounded-lg border border-glass-border bg-glass px-[22px] py-1 text-maroon shadow-glass backdrop-blur-glass">
            Kabinet Terus Terang
          </span>
        </h1>
        <p className="mx-auto mb-9 max-w-[520px] text-lg leading-relaxed text-secondary">
          Token, komponen, dan pola interaksi — base putih, palet resmi, eksekusi bersih ala pintarly.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg">Mulai Belajar Sekarang</Button>
          <Button size="lg" variant="outline">Lihat Komponen</Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-wrap px-6">
        <Section id="colors" eyebrow="01 — Warna" title="Palet Resmi" desc="Base putih dengan lima warna identitas: navy, biru, maroon, merah, dan pink.">
          <div className="grid grid-cols-2 gap-5 md:grid-cols-5">
            {swatches.map(([name, hex, v]) => (
              <div key={name} className="overflow-hidden rounded-xl border border-border shadow-xs">
                <div className="h-24 border-b border-border" style={{ background: v }} />
                <div className="bg-white px-4 py-3.5">
                  <div className="text-sm font-bold">{name}</div>
                  <div className="font-mono text-[12.5px] text-muted">{hex}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="type" eyebrow="02 — Tipografi" title="Plus Jakarta Sans" desc="Satu typeface saja, bold dan tegas.">
          {[
            ["Judul Besar", "text-[64px] font-bold", "64px / 700 / -2%"],
            ["Judul Halaman", "text-[44px] font-bold", "44px / 700 / -2%"],
            ["Judul Seksi", "text-[32px] font-bold", "32px / 700"],
            ["Judul Kartu", "text-[22px] font-bold", "22px / 700"],
            ["Body besar — untuk intro paragraf", "text-[17px] font-semibold", "17px / 600"],
            ["Body reguler — teks konten utama", "text-[15px] font-medium text-secondary", "15px / 500"],
            ["LABEL KECIL", "text-[13px] font-bold text-muted", "13px / 700"],
          ].map(([s, c, m]) => (
            <div key={s} className="flex items-baseline justify-between gap-6 border-b border-divider py-5 last:border-0">
              <span className={c}>{s}</span>
              <span className="whitespace-nowrap text-[13px] text-muted max-sm:hidden">{m}</span>
            </div>
          ))}
        </Section>

        <Section id="buttons" eyebrow="03 — Tombol" title="Buttons" desc="Pill penuh, bold 700, shadow tipis.">
          <div className="mb-11"><Label>Varian</Label>
            <div className="flex flex-wrap items-center gap-3">
              <Button>Mulai Belajar</Button><Button variant="navy">Navy</Button><Button variant="blue">Blue</Button>
              <Button variant="outline">Outline</Button><Button variant="ghost">Ghost</Button><Button variant="danger">Hapus</Button>
            </div></div>
          <div className="mb-11"><Label>Ukuran</Label>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg">Large</Button><Button size="md">Medium</Button><Button size="sm">Small</Button><Button size="xs">Extra small</Button>
            </div></div>
          <div><Label>Dengan ikon &amp; status</Label>
            <div className="flex flex-wrap items-center gap-3">
              <Button><Zap strokeWidth={2.5} />Daftar Sekarang</Button>
              <Button variant="outline" iconOnly aria-label="Tambah"><Plus /></Button>
              <Button disabled>Diproses…</Button>
            </div></div>
        </Section>

        <Section id="badges" eyebrow="04 — Badge & Tag" title="Badges">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="navy">Terbaru</Badge><Badge variant="pink">Dibuka</Badge><Badge variant="blue">Info</Badge>
            <Badge variant="maroon">Penting</Badge><Badge variant="red">Ditutup</Badge>
            <Badge variant="outline" dot dotClassName="text-success">Aktif</Badge>
          </div>
        </Section>

        <Section id="cards" eyebrow="05 — Kartu" title="Cards" desc="Radius 28px, border abu netral, shadow lembut yang membesar saat hover.">
          <div className="grid gap-5 md:grid-cols-3">
            <Card><CardIcon className="bg-pink-pale text-accent-hover"><Sparkles /></CardIcon><CardTitle>Program Kerja</CardTitle><CardDescription>Rangkuman seluruh proker tiap divisi, lengkap dengan timeline dan PIC.</CardDescription></Card>
            <Card variant="feature"><CardIcon className="bg-navy text-white"><Star /></CardIcon><CardTitle>Divisi Unggulan</CardTitle><CardDescription>Shadow lebih kuat untuk konten yang ingin ditonjolkan.</CardDescription></Card>
            <Card variant="flat"><CardIcon className="bg-blue-pale text-blue"><Diamond /></CardIcon><CardTitle>Dokumentasi</CardTitle><CardDescription>Varian datar untuk list panjang tanpa shadow berat.</CardDescription></Card>
          </div>
        </Section>

        <Section id="glass" eyebrow="05b — Glass" title="Liquid Glass" desc="Dipakai selektif — hanya di elemen yang duduk di atas area berwarna (hero, spotlight), bukan di semua card.">
          <div className="relative overflow-hidden rounded-2xl px-8 py-16">
            <div className="mesh-fallback absolute inset-0" />
            <div className="relative grid gap-5 md:grid-cols-3">
              {[["Divisi Kominfo", <Sparkles key="a" />, "text-accent-hover"], ["Divisi PSDM", <Diamond key="b" />, "text-blue"], ["Divisi Eksternal", <Star key="c" />, "text-maroon"]].map(([t, i, c]) => (
                <Card key={t as string} variant="glass">
                  <CardIcon className={`bg-white/60 ${c}`}>{i}</CardIcon>
                  <CardTitle>{t}</CardTitle>
                  <CardDescription>Glass card di atas mesh — border putih transparan + inset highlight.</CardDescription>
                </Card>
              ))}
            </div>
          </div>
        </Section>

        <Section id="members" eyebrow="06 — Anggota" title="Member Card">
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            <MemberCard name="Akmal Ramadhan" role="Ketua BEM UI" meta="Fakultas Teknik" />
            <MemberCard name="Siti Nuraini" role="Wakil Ketua" meta="FISIP" />
            <MemberCard name="Dimas Prakoso" role="Kepala Divisi PSDM" meta="FEB" />
            <MemberCard name="Acan" role="UI/UX & Frontend" meta="Fasilkom" />
          </div>
        </Section>

        <Section id="stats" eyebrow="07 — Statistik" title="Stat Cards">
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            <StatCard value="34" label="Divisi & Biro" /><StatCard value="900+" label="Anggota Aktif" />
            <StatCard value="120" label="Program Kerja" /><StatCard value="18" label="Fakultas Terlibat" />
          </div>
        </Section>

        <Section id="forms" eyebrow="08 — Form" title="Form Elements">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nama Lengkap" htmlFor="f-nama"><Input id="f-nama" placeholder="Tulis nama lengkap kamu" /></Field>
            <Field label="Email" htmlFor="f-email"><InputWithIcon id="f-email" icon={<Mail />} placeholder="nama@ui.ac.id" /></Field>
            <Field label="Pilih Divisi" htmlFor="f-div"><Select id="f-div"><option>PSDM</option><option>Kominfo</option><option>Eksternal</option></Select></Field>
            <Field label="Nomor WhatsApp" htmlFor="f-wa" error="Nomor tidak valid, cek lagi ya."><Input id="f-wa" defaultValue="08xx-xx" aria-invalid /></Field>
            <Field label="Motivasi" htmlFor="f-mot" className="md:col-span-2"><Textarea id="f-mot" placeholder="Ceritakan motivasi kamu bergabung…" /></Field>
            <Checkbox defaultChecked label="Saya setuju dengan ketentuan pendaftaran" />
          </div>
        </Section>

        <Section id="tabs" eyebrow="09 — Tabs" title="Tabs">
          <div className="mb-11"><Label>Pill</Label>
            <Tabs aria-label="Filter" items={[{ value: "all", label: "Semua" }, { value: "int", label: "Internal" }, { value: "ext", label: "Eksternal" }, { value: "psdm", label: "PSDM" }]} /></div>
          <div><Label>Underline</Label>
            <Tabs variant="underline" aria-label="Profil" items={[{ value: "p", label: "Profil" }, { value: "pk", label: "Program Kerja" }, { value: "a", label: "Anggota" }, { value: "g", label: "Galeri" }]} /></div>
        </Section>

        <Section id="toast" eyebrow="10 — Toast" title="Notifications">
          <div className="grid gap-5 md:grid-cols-2">
            <Toast variant="success" title="Berhasil disimpan" description="Perubahan profil kamu sudah tersimpan." />
            <Toast variant="error" title="Gagal mengunggah" description="Ukuran file maksimal 5MB." />
            <Toast variant="warning" title="Sesi akan berakhir" description="Simpan progres kamu sebelum 5 menit." />
            <Toast variant="info" title="Pendaftaran dibuka" description="Periode baru mulai 1 November." />
          </div>
        </Section>

        <Section id="alerts" eyebrow="11 — Alert" title="Alerts">
          <div className="flex flex-col gap-3">
            <Alert variant="success" title="Pendaftaran berhasil">Tim akan menghubungi kamu lewat email dalam 3 hari kerja.</Alert>
            <Alert variant="error" title="Terjadi kesalahan">Periksa kembali data yang kamu masukkan.</Alert>
            <Alert variant="warning" title="Perhatian">Batas waktu pengumpulan berkas 23:59 WIB hari ini.</Alert>
            <Alert variant="info" title="Info">Jadwal wawancara akan diumumkan lewat grup line.</Alert>
          </div>
        </Section>

        <Section id="modal" eyebrow="12 — Modal" title="Dialog">
          <Button variant="outline" onClick={() => setModal(true)}>Buka dialog</Button>
          <Modal
            open={modal}
            onClose={() => setModal(false)}
            icon={<AlertTriangle />}
            title="Batalkan pendaftaran?"
            description="Data yang sudah kamu isi akan hilang dan tidak bisa dikembalikan."
            actions={<><Button variant="outline" onClick={() => setModal(false)}>Batal</Button><Button variant="danger" onClick={() => setModal(false)}>Ya, Batalkan</Button></>}
          />
        </Section>

        <Section id="avatars" eyebrow="13 — Avatar" title="Avatars">
          <div className="mb-6 flex items-center gap-3"><Avatar name="A" size="xs" /><Avatar name="B" size="sm" /><Avatar name="C" size="md" /><Avatar name="D" size="lg" /></div>
          <AvatarGroup extra={9}><Avatar name="A" /><Avatar name="B" /><Avatar name="C" /></AvatarGroup>
        </Section>

        <Section id="progress" eyebrow="14 — Progress" title="Progress Bar">
          <div className="flex max-w-[420px] flex-col gap-5">
            <Progress label="Kelengkapan berkas" value={80} />
            <Progress label="Progres seleksi" value={45} barClassName="bg-blue" />
          </div>
        </Section>

        <Section id="dropdown" eyebrow="15 — Dropdown" title="Dropdown Menu">
          <div className="flex flex-wrap items-start gap-10">
            <DropdownMenu>
              <DropdownItem icon={<User />}>Profil Saya</DropdownItem>
              <DropdownItem icon={<Settings />}>Pengaturan</DropdownItem>
              <DropdownItem icon={<Bell />}>Notifikasi</DropdownItem>
              <DropdownSeparator />
              <DropdownItem icon={<LogOut />} danger>Keluar</DropdownItem>
            </DropdownMenu>
            <Dropdown trigger={<span className="inline-flex rounded-full border-[1.5px] border-border px-6 py-3 text-[15px] font-bold">Interaktif ▾</span>}>
              <DropdownItem icon={<User />}>Profil Saya</DropdownItem>
              <DropdownItem icon={<LogOut />} danger>Keluar</DropdownItem>
            </Dropdown>
          </div>
        </Section>

        <Section id="misc" eyebrow="16 — Lainnya" title="Breadcrumb, Pagination, Skeleton, Empty State">
          <div className="mb-11"><Label>Breadcrumb</Label><Breadcrumb items={[{ label: "Beranda", href: "/" }, { label: "Kabinet", href: "/kabinet" }, { label: "PSDM" }]} /></div>
          <div className="mb-11"><Label>Pagination</Label><Pagination page={page} pageCount={3} onPageChange={setPage} /></div>
          <div className="mb-11"><Label>Skeleton Loading</Label>
            <div className="flex items-center gap-3.5">
              <Skeleton className="size-[52px] rounded-full" />
              <div className="flex flex-1 flex-col gap-2"><Skeleton className="h-3.5 w-2/5" /><Skeleton className="h-3 w-[70%]" /></div>
            </div></div>
          <div><Label>Empty State</Label>
            <Card className="max-w-[360px]" variant="flat">
              <EmptyState icon={<FolderOpen />} title="Belum ada data" description="Program kerja divisi ini akan muncul di sini." action={<Button size="sm">Tambah Proker</Button>} />
            </Card>
          </div>
        </Section>

        <Section id="preview" eyebrow="17 — Contoh Halaman" title="Preview Hero Kabinet">
          <div className="relative overflow-hidden rounded-2xl bg-navy px-10 py-16 text-center text-white">
            <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 60% at 50% 0%, rgba(214,76,111,.35), transparent 70%)" }} />
            <div className="relative">
              <Badge className="mb-[18px] bg-white/10 text-white">Kabinet 2026</Badge>
              <h2 className="mb-3 text-[clamp(28px,4vw,42px)]">Terus Terang, Terus Bergerak</h2>
              <p className="mx-auto mb-7 max-w-[480px] text-white/70">Kenali struktur, visi, dan seluruh jajaran Kabinet Terus Terang BEM UI 2026.</p>
              <Button size="lg">Lihat Struktur Kabinet</Button>
            </div>
          </div>
        </Section>
      </main>

    </div>
  );
}
