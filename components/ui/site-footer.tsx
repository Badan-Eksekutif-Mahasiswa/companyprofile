import { NavbarLogo } from "./navbar";

export function SiteFooter() {
  return (
    <div className="mx-auto max-w-wrap px-6 pb-8">
      <footer className="rounded-2xl bg-navy px-6 pb-8 pt-14 text-white/65 md:px-10">
        <div className="mb-10 max-w-[280px]">
          <NavbarLogo className="mb-3 text-white" />
          <p className="text-sm leading-relaxed">Badan Eksekutif Mahasiswa Universitas Indonesia 2026 — Terus Terang.</p>
        </div>
        <div className="border-t border-white/10 pt-6 text-[13px]">© 2026 BEM UI — Kabinet Terus Terang</div>
      </footer>
    </div>
  );
}
