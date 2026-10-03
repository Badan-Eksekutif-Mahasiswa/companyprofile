import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbProps {
  /** Item terakhir dianggap halaman aktif (tanpa href). */
  items: { label: string; href?: string }[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-2 text-[13.5px] font-semibold text-muted">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <React.Fragment key={it.label + i}>
              <li className={cn(last && "text-navy")} aria-current={last ? "page" : undefined}>
                {last || !it.href ? it.label : <Link href={it.href} className="transition-colors hover:text-accent">{it.label}</Link>}
              </li>
              {!last && <ChevronRight aria-hidden className="size-3.5 text-faint" />}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
