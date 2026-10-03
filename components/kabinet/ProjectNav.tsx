"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CharRoll } from "./CharRoll";

const LINKS = [
  { label: "Beranda", href: "/" },
  { label: "Kabinet", href: "/kabinet" },
  { label: "News", href: "/news" },
];

/** Nav fixed transparan ala k95: logo kiri, link kanan dengan dot aktif + char-roll saat hover. */
export function ProjectNav() {
  const pathname = usePathname();
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => setReady(true), []);

  return (
    <nav className={`kd-nav${ready ? " kd-nav--ready" : ""}`}>
      <div className="kd-nav__logo">
        <Link href="/" data-hover>
          <span className="kd-nav__logo-dot" />
          Kabinet TT
        </Link>
      </div>
      <ul className="kd-nav__links">
        {LINKS.map((l) => {
          const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link href={l.href} className={`kd-nav__link${active ? " is-active" : ""}`} data-hover>
                <span className="kd-nav__link-dot" />
                <CharRoll text={l.label} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
