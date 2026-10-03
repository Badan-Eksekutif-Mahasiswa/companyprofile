import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const btn =
  "flex size-[38px] items-center justify-center rounded-full text-sm font-bold text-secondary transition-colors hover:bg-navy-5 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light";

export function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  return (
    <nav aria-label="Paginasi" className={cn("flex items-center gap-1.5", className)}>
      <button type="button" aria-label="Sebelumnya" className={btn} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft className="size-4" />
      </button>
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          type="button"
          aria-current={p === page ? "page" : undefined}
          className={cn(btn, p === page && "bg-navy text-white hover:bg-navy")}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}
      <button type="button" aria-label="Berikutnya" className={btn} disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
