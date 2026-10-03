import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0–100 */
  value: number;
  label?: string;
  /** Kelas warna bar, default bg-accent. */
  barClassName?: string;
}

export function Progress({ value, label, barClassName, className, ...props }: ProgressProps) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className={className} {...props}>
      {label && (
        <div className="mb-2 flex justify-between text-[13px] font-semibold text-secondary">
          <span>{label}</span>
          <span>{Math.round(v)}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={v}
        className="h-[9px] overflow-hidden rounded-full bg-navy-5"
      >
        <div
          className={cn("h-full rounded-full bg-accent transition-[width] duration-slow ease-out-expo", barClassName)}
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}
