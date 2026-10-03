import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const toastIcon = cva("flex size-[34px] shrink-0 items-center justify-center rounded-full [&_svg]:size-[18px]", {
  variants: {
    variant: {
      success: "bg-success-pale text-success",
      error: "bg-red-pale text-red",
      warning: "bg-warning-pale text-warning",
      info: "bg-blue-pale text-blue",
    },
  },
  defaultVariants: { variant: "info" },
});

const icons: Record<NonNullable<VariantProps<typeof toastIcon>["variant"]>, LucideIcon> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export interface ToastProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">, VariantProps<typeof toastIcon> {
  title: React.ReactNode;
  description?: React.ReactNode;
}

/** Tampilan toast saja (presentasional). Provider/queue ditambahkan saat dibutuhkan. */
export function Toast({ variant = "info", title, description, className, ...props }: ToastProps) {
  const Icon = icons[variant ?? "info"];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("flex max-w-[380px] items-start gap-3 rounded-xl border border-border bg-white px-[18px] py-4 shadow-lg", className)}
      {...props}
    >
      <div className={toastIcon({ variant })}>
        <Icon aria-hidden />
      </div>
      <div>
        <div className="mb-0.5 text-[14.5px] font-bold">{title}</div>
        {description && <div className="text-[13px] text-secondary">{description}</div>}
      </div>
    </div>
  );
}
