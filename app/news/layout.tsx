import { SiteFooter, SiteNav } from "@/components/ui";

/** SiteNav/SiteFooter dipakai bersama halaman lain. */
export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="print:hidden sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-white"
      >
        Lewati ke konten
      </a>
      <div className="print:hidden"><SiteNav /></div>
      {children}
      <div className="print:hidden"><SiteFooter /></div>
    </div>
  );
}
