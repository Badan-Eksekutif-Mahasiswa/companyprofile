import Link from "next/link";
import { buttonVariants } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="grid min-h-[100svh] place-items-center bg-navy px-5 text-center text-white">
      <div>
        <p className="text-[clamp(6rem,22vw,14rem)] font-extrabold leading-none tracking-[-0.05em] text-pink-light">404</p>
        <h1 className="mt-2 text-2xl">Halaman tidak ditemukan</h1>
        <p className="mx-auto mt-2 max-w-sm text-white/60">Halaman yang kamu cari tidak ada atau belum tersedia.</p>
        <Link href="/" className={buttonVariants({ variant: "primary", className: "mt-8" })}>
          Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}
