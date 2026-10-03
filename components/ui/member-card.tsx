import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface MemberCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  role: string;
  /** Mis. fakultas / angkatan. */
  meta?: string;
  /** URL foto; kalau kosong tampil placeholder gradient + inisial. */
  photo?: string | null;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function MemberCard({ name, role, meta, photo, className, ...props }: MemberCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-base ease-out-expo hover:-translate-y-1 hover:shadow-lg",
        className
      )}
      {...props}
    >
      <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-pink-light to-blue-soft text-[40px] font-extrabold text-white">
        {photo ? (
          <Image src={photo} alt={name} fill sizes="(max-width: 560px) 100vw, 280px" className="object-cover" />
        ) : (
          <span aria-hidden>{initials(name)}</span>
        )}
      </div>
      <div className="p-5">
        <div className="mb-0.5 text-base font-bold">{name}</div>
        <div className="mb-3 text-[13px] font-semibold text-accent-hover">{role}</div>
        {meta && <div className="text-[12.5px] text-muted">{meta}</div>}
      </div>
    </div>
  );
}
