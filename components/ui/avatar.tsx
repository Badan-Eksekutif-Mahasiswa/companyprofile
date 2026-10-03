import * as React from "react";
import Image from "next/image";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-[2.5px] border-white bg-gradient-to-br from-pink-light to-blue-soft font-extrabold text-white shadow-xs",
  {
    variants: {
      size: {
        xs: "size-[26px] text-[10px]",
        sm: "size-[34px] text-xs",
        md: "size-[46px] text-[15px]",
        lg: "size-16 text-xl",
      },
    },
    defaultVariants: { size: "md" },
  }
);

const px = { xs: 26, sm: 34, md: 46, lg: 64 } as const;

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof avatarVariants> {
  name: string;
  src?: string | null;
}

export function Avatar({ name, src, size = "md", className, children, ...props }: AvatarProps) {
  return (
    <span className={cn(avatarVariants({ size }), className)} {...props}>
      {src ? (
        <Image src={src} alt={name} width={px[size ?? "md"]} height={px[size ?? "md"]} className="size-full object-cover" />
      ) : (
        <span aria-label={name}>{children ?? name.trim().charAt(0).toUpperCase()}</span>
      )}
    </span>
  );
}

/** Tumpuk avatar; anak langsung <Avatar>. Sisa jumlah dikirim lewat `extra`. */
export function AvatarGroup({
  children,
  extra,
  size = "md",
  className,
}: {
  children: React.ReactNode;
  extra?: number;
  size?: AvatarProps["size"];
  className?: string;
}) {
  return (
    <div className={cn("flex [&>*:not(:first-child)]:-ml-3", className)}>
      {children}
      {extra ? (
        <Avatar name={`+${extra}`} size={size} className="bg-none bg-navy-5 text-secondary">
          +{extra}
        </Avatar>
      ) : null}
    </div>
  );
}
