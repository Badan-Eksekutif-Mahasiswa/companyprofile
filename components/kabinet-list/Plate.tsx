import { ArrowUpRight } from "lucide-react";
import type { Divisi } from "@/lib/kabinet";
import { cn } from "@/lib/utils";

/** Plat nama di atas gambar logo (glass dipakai karena duduk di atas gambar berwarna). Tagline muncul saat hover/fokus. */
export function Plate({ d, className, always }: { d: Divisi; className?: string; always?: boolean }) {
  return (
    <div className={cn("absolute inset-x-3 bottom-3 rounded-xl border border-glass-border bg-glass-strong p-3.5 shadow-glass-soft backdrop-blur-glass", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[15px] font-bold leading-tight text-navy">{d.nama}</span>
        <ArrowUpRight aria-hidden className="size-[18px] shrink-0 text-navy-50 transition-all duration-base group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
      </div>
      <div
        className={cn(
          "grid transition-all duration-base ease-out-expo",
          always ? "grid-rows-[1fr]" : "grid-rows-[0fr] opacity-0 group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus-visible:grid-rows-[1fr] group-focus-visible:opacity-100"
        )}
      >
        <div className="overflow-hidden">
          <p className="pt-2 text-[13px] leading-snug text-secondary">{d.tagline}</p>
        </div>
      </div>
    </div>
  );
}
