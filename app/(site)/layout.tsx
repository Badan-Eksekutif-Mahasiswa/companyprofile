import { CustomCursor } from "@/components/layout/CustomCursor";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#konten"
        className="sr-only z-[80] rounded-full bg-accent px-4 py-2 font-bold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Lewati ke konten
      </a>
      <SiteHeader />
      {children}
      <CustomCursor />
    </>
  );
}
