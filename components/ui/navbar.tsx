"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  // Di paling atas: pill maks. 880px. Mulai scroll → memendek jadi 620px (mobile: menyempit 32px), logo & teks mengecil.
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/"));
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
        data-compact={!atTop}
        style={{ maxWidth: atTop ? "min(880px, 100%)" : "min(620px, calc(100% - 32px))" }}
        className={cn(
          "group/nav flex w-full items-center justify-between gap-3 rounded-full sm:gap-7 border border-glass-border bg-glass-strong py-1.5 pl-4 pr-2 shadow-glass-soft backdrop-blur-glass transition-[max-width,padding,box-shadow] duration-[700ms] ease-out-expo motion-reduce:transition-none",
          atTop ? "py-2 sm:pl-6 sm:pr-3" : "py-1 sm:pl-5",
          className
        )}
        {...props}
      >
        {logo}
        {links.length > 0 && <NavLinks links={links} isActive={isActive} />}
        <div className="flex items-center gap-1.5">{actions}</div>
      </nav>
    </header>
  );
}

/** Link tengah + garis bawah yang meluncur ke link yang di-hover, lalu kembali ke halaman aktif. */
function NavLinks({ links, isActive }: { links: { label: string; href: string }[]; isActive: (href: string) => boolean }) {
  const listRef = React.useRef<HTMLUListElement>(null);
  const activeIndex = links.findIndex((l) => isActive(l.href));
  const [hovered, setHovered] = React.useState<number | null>(null);
  const [bar, setBar] = React.useState<{ left: number; width: number } | null>(null);
  const target = hovered ?? (activeIndex >= 0 ? activeIndex : null);

  React.useLayoutEffect(() => {
    const measure = () => {
      const el = target === null ? null : listRef.current?.querySelectorAll<HTMLElement>("a")[target];
      setBar(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
    };
    measure();
    // Ukuran font berubah saat navbar memendek → ukur ulang garis bawah.
    const ro = new ResizeObserver(measure);
    if (listRef.current) ro.observe(listRef.current);
    return () => ro.disconnect();
  }, [target, links]);

  return (
    <ul
      ref={listRef}
      onMouseLeave={() => setHovered(null)}
      className="relative flex items-center gap-4 text-[15px] font-semibold text-secondary transition-[font-size] duration-500 ease-out-expo sm:gap-8 sm:text-[17px] group-data-[compact=true]/nav:text-[14px] sm:group-data-[compact=true]/nav:gap-6 sm:group-data-[compact=true]/nav:text-[15px]"
    >
      {links.map((l, i) => (
        <li key={l.href + l.label}>
          <Link
            href={l.href}
            aria-current={isActive(l.href) ? "page" : undefined}
            onMouseEnter={() => setHovered(i)}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered(null)}
            className={cn("block py-1.5 transition-colors hover:text-navy", isActive(l.href) && "font-bold text-navy")}
          >
            {l.label}
          </Link>
        </li>
      ))}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-navy transition-[left,width,opacity] duration-500 ease-out-expo motion-reduce:transition-none"
        style={{ left: bar?.left ?? 0, width: bar?.width ?? 0, opacity: bar ? 1 : 0 }}
      />
    </ul>
  );
}
