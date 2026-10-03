import { cn } from "@/lib/utils";

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
