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
      <Image src="/images/logo-bem-ui.png" alt="Logo BEM UI" width={876} height={876} priority className="size-8 shrink-0 sm:size-11" />
    </Link>
  );
}

/** Floating glass mengikuti design system, dengan tiga link tetap tersedia di mobile. */
export function SiteNav() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 pt-4">
      {/* grid 3 kolom agar link tetap di tengah walau slot kanan kosong */}
      <Navbar logo={<SiteLogo />} links={LINKS} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] [&>*:first-child]:justify-self-start [&_ul]:flex [&_ul]:gap-3 [&_ul]:text-[13px] sm:[&_ul]:gap-[26px] sm:[&_ul]:text-[14.5px]" />
    </div>
  );
}
