"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function NavbarLogo({ className, children = "Kabinet TT" }: { className?: string; children?: React.ReactNode }) {
  return (
    <Link href="/" className={cn("flex items-center gap-[9px] text-[17px] font-extrabold text-navy", className)}>
      <span aria-hidden className="size-[9px] rounded-full bg-accent" />
      {children}
    </Link>
  );
}

export interface NavbarProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  logo?: React.ReactNode;
  links?: { label: string; href: string }[];
  /** Slot kanan, mis. tombol Masuk / CTA. */
  actions?: React.ReactNode;
}

/**
 * Floating pill glass. Taruh di atas area berwarna (mis. <MeshGradient /> di level
 * halaman) — backdrop-blur tidak kelihatan di atas putih polos.
 */
export function Navbar({ logo = <NavbarLogo />, links = [], actions, className, ...props }: NavbarProps) {
  // Di paling atas halaman navbar melebar hampir selebar layar; mulai scroll → memendek jadi pill 880px.
  const [atTop, setAtTop] = React.useState(true);
  React.useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-4 z-50 flex justify-center px-5">
      <nav
        aria-label="Utama"
        style={{ maxWidth: atTop ? "min(1480px, 100%)" : "880px" }}
        className={cn(
          "flex w-full items-center justify-between gap-7 rounded-full border border-glass-border bg-glass-strong py-2 pl-[22px] pr-2 shadow-glass-soft backdrop-blur-glass transition-[max-width,padding,box-shadow] duration-[700ms] ease-out-expo motion-reduce:transition-none",
          atTop ? "pl-8 pr-3" : "",
          className
        )}
        {...props}
      >
        {logo}
        {links.length > 0 && (
          <ul className="hidden items-center gap-[26px] text-[14.5px] font-semibold text-secondary md:flex">
            {links.map((l) => (
              <li key={l.href + l.label}>
                <Link href={l.href} className="transition-colors hover:text-navy">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-1.5">{actions}</div>
      </nav>
    </header>
  );
}
