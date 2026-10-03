import { cn } from "@/lib/utils";

/** Kata sorot di judul: chip kaca, sama dengan "Terus Terang" di hero Kabinet. Taruh di atas area berwarna (mesh). */
export function GlassHighlight({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-xl border border-glass-border bg-glass px-[0.22em] pb-[0.04em] text-maroon shadow-glass backdrop-blur-glass",
        className
      )}
    >
      {children}
    </span>
  );
}
