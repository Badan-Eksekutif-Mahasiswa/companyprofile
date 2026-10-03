import { SiteFooter, SiteNav } from "@/components/ui";
import { NewsBackdrop } from "@/components/news/backdrop";

/** SiteNav/SiteFooter dipakai bersama halaman lain. Latar blob di level layout supaya kaca navbar punya warna di belakangnya. */
export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <NewsBackdrop />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-white"
      >
        Lewati ke konten
      </a>
      <SiteNav />
      {children}
      <SiteFooter />
    </div>
  );
}
