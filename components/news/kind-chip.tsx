import { cn } from "@/lib/utils";
import { JENIS_KONTEN, type NewsCategory } from "@/lib/news";

export function KindChip({ kategori, className }: { kategori: NewsCategory; className?: string }) {
  return (
    <span
      className={cn(
        "rounded-xl border border-glass-border bg-glass-strong px-3 py-1.5 text-[12px] font-bold leading-none text-navy shadow-glass-soft backdrop-blur-glass",
        className
      )}
    >
      {JENIS_KONTEN[kategori].label}
    </span>
  );
}
