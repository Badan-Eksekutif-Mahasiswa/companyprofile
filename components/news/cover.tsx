import Image from "next/image";
import { cn } from "@/lib/utils";
import type { NewsCategory } from "@/lib/news";
import { CATEGORY_STYLE } from "./category-style";

export interface CoverProps {
  kategori: NewsCategory;
  /** Gambar hero artikel. Kosong = placeholder gradient + ikon kategori. */
  src?: string;
  className?: string;
  sizes?: string;
}

/** Cover dekoratif (alt kosong): judul artikel sudah menjelaskan konteksnya. */
export function Cover({ kategori, src, className, sizes = "(min-width: 1024px) 33vw, 100vw" }: CoverProps) {
  const { gradient, Icon } = CATEGORY_STYLE[kategori];
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br", gradient, className)}>
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-slow ease-out-expo group-hover:scale-105"
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
