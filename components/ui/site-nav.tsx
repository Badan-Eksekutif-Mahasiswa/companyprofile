import Image from "next/image";
import Link from "next/link";
import { Navbar } from "./navbar";

const LINKS = [
  { label: "Beranda", href: "/" },
  { label: "Kabinet", href: "/kabinet" },
  { label: "News", href: "/news" },
];

function SiteLogo() {
  return (
    <Link href="/" className="flex items-center" aria-label="Badan Eksekutif Mahasiswa Universitas Indonesia, Beranda">
      <Image src="/images/logo-bem-ui.png" alt="Logo BEM UI" width={876} height={876} priority className="size-11 shrink-0" />
    </Link>
  );
}

/** Navbar situs: melebar di paling atas halaman, memendek jadi pill saat discroll. */
export function SiteNav() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 pt-4">
      {/* grid 3 kolom agar link tetap di tengah walau slot kanan kosong */}
      <Navbar logo={<SiteLogo />} links={LINKS} className="grid grid-cols-[1fr_auto_1fr] [&>*:first-child]:justify-self-start" />
    </div>
  );
}
