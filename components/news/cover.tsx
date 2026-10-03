import Image from "next/image";
import { cn } from "@/lib/utils";
import type { NewsCategory } from "@/lib/news";
import { styleOf } from "./category-style";

export interface CoverProps {
  kategori?: NewsCategory;
  src?: string;
  className?: string;
  sizes?: string;
}

export function Cover({ kategori, src, className, sizes = "(min-width: 1024px) 33vw, 100vw" }: CoverProps) {
  const { gradient, Icon } = styleOf(kategori);
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br", gradient, className)}>
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.06]"
        />
      ) : (
        <Icon
          aria-hidden
          strokeWidth={1.5}
          className="absolute bottom-4 left-4 size-10 text-navy-30 transition-transform duration-slow ease-out-expo group-hover:scale-110"
        />
      )}
    </div>
  );
}
