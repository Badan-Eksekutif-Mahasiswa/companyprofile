import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-[13px] py-[5px] text-[12.5px] font-bold leading-[1.3]",
  {
    variants: {
      variant: {
        navy: "bg-navy text-white",
        pink: "bg-pink-pale text-accent-hover",
        blue: "bg-blue-pale text-blue",
        maroon: "bg-maroon-pale text-maroon",
        red: "bg-red-pale text-red",
        outline: "border-[1.5px] border-border bg-white text-secondary",
      },
    },
    defaultVariants: { variant: "pink" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Titik status di kiri; warnanya ikut `dotClassName` (default currentColor). */
  dot?: boolean;
  dotClassName?: string;
}

export function Badge({ className, variant, dot, dotClassName, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span aria-hidden className={cn("size-1.5 rounded-full bg-current", dotClassName)} />}
      {children}
    </span>
  );
}
