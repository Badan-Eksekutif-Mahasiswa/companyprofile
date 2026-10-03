"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface DropdownProps {
  /** Elemen pemicu; di-render di dalam <button>. */
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}

/** Menu popover sederhana: klik di luar / Esc menutup. */
export function Dropdown({ trigger, children, align = "left", className }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const root = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative inline-block">
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {trigger}
      </button>
      {open && (
        <div onClick={() => setOpen(false)} className={cn("absolute top-full z-40 mt-2", align === "right" ? "right-0" : "left-0")}>
          <DropdownMenu className={className}>{children}</DropdownMenu>
        </div>
      )}
    </div>
  );
}

/** Panel menu (bisa dipakai tanpa trigger untuk demo / statis). */
export function DropdownMenu({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div role="menu" className={cn("w-[230px] rounded-lg border border-border bg-white p-2 shadow-lg", className)} {...props} />
  );
}

export interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  danger?: boolean;
}

export function DropdownItem({ icon, danger, className, children, ...props }: DropdownItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm font-semibold transition-colors [&_svg]:size-4",
        danger ? "text-red hover:bg-red-pale" : "text-secondary hover:bg-navy-5 hover:text-navy",
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div role="separator" className="mx-1 my-1.5 h-px bg-divider" />;
}
