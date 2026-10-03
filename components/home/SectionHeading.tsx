import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  id,
  className,
  invert,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  id?: string;
  className?: string;
  invert?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <p className={cn("text-xs font-bold uppercase tracking-[0.2em]", invert ? "text-pink-light" : "text-accent")}>{eyebrow}</p>
      <h2 id={id} className={cn("mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl", invert && "text-white")}>
        {title}
      </h2>
      {description && <p className={cn("mt-4 text-[17px] leading-relaxed", invert ? "text-white/70" : "text-secondary")}>{description}</p>}
    </div>
  );
}
