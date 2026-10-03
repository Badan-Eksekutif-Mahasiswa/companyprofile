import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-2xl p-7 transition-all duration-base ease-out-expo",
  {
    variants: {
      variant: {
        default:
          "border border-border bg-white shadow-sm hover:-translate-y-1 hover:shadow-lg",
        feature:
          "border border-border bg-white shadow-lg hover:-translate-y-1 hover:shadow-xl",
        flat: "border border-border bg-white shadow-none hover:shadow-sm",
        // Glass: HANYA di atas area berwarna (mesh/hero/spotlight), jangan di putih polos.
        glass:
          "border border-glass-border bg-glass-strong shadow-glass-soft backdrop-blur-glass-lg hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(255,255,255,.55),0_28px_52px_rgba(11,16,45,.18),inset_0_1px_0_rgba(255,255,255,.8)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props} />
  )
);
Card.displayName = "Card";

export function CardIcon({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mb-[18px] flex size-12 items-center justify-center rounded-lg text-[22px]", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("mb-2 text-lg", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-[14.5px] leading-relaxed text-secondary", className)} {...props} />;
}
