"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button, Navbar, NavbarLogo } from "@/components/ui";
import { SITE } from "@/config/site";
import { cn } from "@/lib/utils";

/** Navbar glass (design system) dibuat fixed + drawer untuk mobile. */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 pt-4 [&_nav]:pointer-events-auto">
        <Navbar
          logo={<NavbarLogo>BEM UI 2026</NavbarLogo>}
          links={[...SITE.nav]}
          actions={
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              className="md:hidden"
              aria-label="Buka menu"
              aria-expanded={open}
              aria-controls="menu-mobile"
              onClick={() => setOpen(true)}
            >
              <Menu />
            </Button>
          }
        />
      </div>

      <div
        id="menu-mobile"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={cn(
          "fixed inset-0 z-[70] flex flex-col bg-white transition-[opacity,visibility] duration-base md:hidden",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <NavbarLogo>BEM UI 2026</NavbarLogo>
          <Button variant="outline" size="sm" iconOnly aria-label="Tutup menu" onClick={() => setOpen(false)}>
            <X />
          </Button>
        </div>
        <ul className="mt-6 space-y-2 px-5">
          {SITE.nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "block rounded-xl px-4 py-3 text-3xl font-extrabold tracking-tight",
                  isActive(item.href) ? "bg-pink-pale text-accent" : "text-navy hover:bg-navy-5",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-auto px-5 pb-8 text-sm text-muted">
          {SITE.kabinet} · {SITE.tagline}
        </p>
      </div>
    </>
  );
}
