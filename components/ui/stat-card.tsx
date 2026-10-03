import * as React from "react";
import { cn } from "@/lib/utils";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  value: React.ReactNode;
  label: React.ReactNode;
}

export function StatCard({ value, label, className, ...props }: StatCardProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-navy p-[26px] text-white", className)} {...props}>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[30px] -top-[30px] size-[140px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(214,76,111,.35), transparent 70%)" }}
      />
      <div className="relative mb-1 text-4xl font-extrabold tracking-tight">{value}</div>
      <div className="relative text-[13.5px] text-white/65">{label}</div>
    </div>
  );
}
