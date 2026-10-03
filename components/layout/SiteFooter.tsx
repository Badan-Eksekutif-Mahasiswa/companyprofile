import Link from "next/link";
import { NavbarLogo } from "@/components/ui";
import { SITE } from "@/config/site";
import { InstagramIcon as Instagram, XIcon as Twitter, YoutubeIcon as Youtube } from "./SocialIcons";

export function SiteFooter() {
  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid max-w-wrap gap-10 px-5 py-14 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <NavbarLogo className="text-xl text-white">BEM UI 2026</NavbarLogo>
          <p className="mt-3 max-w-xs text-sm text-white/60">Gedung Pusgiwa UI Lt. 1, Kampus UI Depok. {SITE.kabinet}.</p>
        </div>
        <nav aria-label="Navigasi footer">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">Jelajahi</p>
          <ul className="mt-3 space-y-2 text-sm font-semibold">
            {SITE.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-white/80 transition-colors hover:text-pink-light">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">Ikuti Kami</p>
          <ul className="mt-3 flex gap-2">
            {(
              [
                ["Instagram", SITE.social.instagram, Instagram],
                ["YouTube", SITE.social.youtube, Youtube],
                ["Twitter / X", SITE.social.twitter, Twitter],
              ] as const
            ).map(([label, href, Icon]) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-accent"
                >
                  <Icon aria-hidden className="size-[18px]" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-wrap px-5 py-5 text-xs text-white/50">© 2026 BEM UI. All rights reserved.</p>
      </div>
    </footer>
  );
}
