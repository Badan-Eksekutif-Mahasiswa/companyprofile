import Image from "next/image";

const SOCIALS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/bemui_official/",
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
      </>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@bemuiofficial",
    icon: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M10 9.2v5.6l5-2.8z" fill="currentColor" />
      </>
    ),
  },
  {
    label: "X",
    href: "https://x.com/BEMUI_Official",
    icon: (
      <path
        fill="currentColor"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/bem-ui/",
    icon: (
      <path
        fill="currentColor"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"
      />
    ),
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@bem.ui?lang=id-ID",
    icon: (
      <path
        fill="currentColor"
        d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
      />
    ),
  },
];

/** Footer penuh selebar layar dan menempel di dasar halaman, memakai gaya design system (navy). */
export function SiteFooter() {
  return (
    <footer className="relative w-full overflow-hidden bg-navy px-6 pb-6 pt-10 text-white/65 md:px-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(55% 90% at 15% 0%, rgba(214,76,111,.22), transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-wrap">
        <div className="mb-6 flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <Image
                src="/logo-bem-ui.png"
                alt="Logo BEM UI"
                width={156}
                height={162}
                loading="eager"
                className="h-32 w-auto md:h-36"
              />
              <span className="text-3xl font-extrabold text-white md:text-4xl">#TerusTerang</span>
            </div>
            <p className="mb-4 text-sm leading-relaxed">Badan Eksekutif Mahasiswa Universitas Indonesia 2026.</p>
            <ul className="flex items-center gap-2.5">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors duration-fast hover:bg-accent hover:text-white focus-visible:bg-accent focus-visible:text-white focus-visible:outline-none"
                  >
                    <svg aria-hidden viewBox="0 0 24 24" className="size-[18px]">
                      {s.icon}
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col items-center text-center">
            <p className="mb-3 text-[13px]">Dikembangkan oleh</p>
            <Image
              src="/logo-mdt-white.png"
              alt="Mulmed Dev Team"
              width={1063}
              height={248}
              loading="eager"
              className="h-14 w-auto md:h-[72px]"
            />
          </div>
        </div>
        <div className="text-[13px]">© {new Date().getFullYear()} BEM UI</div>
      </div>
    </footer>
  );
}
