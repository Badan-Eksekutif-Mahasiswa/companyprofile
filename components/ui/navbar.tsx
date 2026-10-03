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
  return (
    <header className="sticky top-4 z-50 flex justify-center px-5">
      <nav
        aria-label="Utama"
        className={cn(
          "flex w-full max-w-[880px] items-center justify-between gap-7 rounded-full border border-glass-border bg-glass-strong py-2 pl-[22px] pr-2 shadow-glass-soft backdrop-blur-glass",
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
