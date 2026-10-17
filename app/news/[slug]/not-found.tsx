import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto max-w-wrap px-4 py-32 text-center sm:px-6">
      <h1 className="text-3xl font-bold text-navy">Artikel tidak ditemukan</h1>
      <p className="mt-3 text-secondary">Tautan mungkin salah atau artikelnya sudah dipindahkan.</p>
      <Link href="/news" className="mt-6 inline-block font-bold text-accent underline underline-offset-2">Kembali ke Berita &amp; Artikel</Link>
    </main>
  );
}
