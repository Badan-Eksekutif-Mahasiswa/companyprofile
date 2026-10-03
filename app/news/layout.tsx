import Link from "next/link";
import { Navbar, buttonVariants } from "@/components/ui";
import { NewsBackdrop } from "@/components/news/backdrop";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Kabinet", href: "/kabinet" },
  { label: "News", href: "/news" },
];

/** Navbar pill glass + latar blob dipasang di level layout supaya kaca navbar punya warna di belakangnya. */
export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <NewsBackdrop />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-white">
        Lewati ke konten
      </a>
      <div className="pt-4">
        <Navbar
          links={LINKS}
          actions={
            <>
              <ul className="flex items-center gap-3 pr-2 text-[13px] font-semibold text-secondary md:hidden">
                {LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
              <Link href="/kabinet" className={buttonVariants({ size: "sm", className: "hidden sm:inline-flex" })}>
                Lihat Kabinet
              </Link>
            </>
          }
        />
      </div>
      {children}
    </div>
  );
}
