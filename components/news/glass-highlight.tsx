import { cn } from "@/lib/utils";

/** Kata sorot di judul: chip kaca (glass) seperti di pintarly.id. Taruh di atas area berwarna. */
export function GlassHighlight({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block -rotate-1 rounded-full border border-glass-border bg-glass px-[0.35em] py-[0.02em] text-accent shadow-glass-soft backdrop-blur-glass",
        className
      )}
    >
      {children}
    </span>
  );
}
