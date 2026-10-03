"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TabItem = { value: string; label: React.ReactNode };

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: "pill" | "underline";
  className?: string;
  "aria-label"?: string;
}

/** Tab list saja (kontrol). Panel konten dirender oleh pemakai berdasarkan `value`. */
export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  variant = "pill",
  className,
  "aria-label": ariaLabel,
}: TabsProps) {
  const [inner, setInner] = React.useState(defaultValue ?? items[0]?.value);
  const current = value ?? inner;
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const select = (v: string) => {
    if (value === undefined) setInner(v);
    onValueChange?.(v);
  };

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (i + dir + items.length) % items.length;
    refs.current[next]?.focus();
    select(items[next].value);
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        variant === "pill"
          ? "inline-flex gap-1 rounded-full bg-navy-5 p-[5px]"
          : "flex gap-7 border-b-[1.5px] border-divider",
        className
      )}
    >
      {items.map((t, i) => {
        const active = t.value === current;
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => select(t.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "font-bold transition-all duration-base ease-out-expo focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light",
              variant === "pill"
                ? cn(
                    "rounded-full px-5 py-[9px] text-sm",
                    active ? "bg-navy text-white shadow-sm" : "text-secondary hover:text-navy"
                  )
                : cn(
                    "-mb-[1.5px] border-b-[2.5px] px-0.5 py-3 text-[14.5px]",
                    active ? "border-accent text-navy" : "border-transparent text-muted hover:text-navy"
                  )
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
