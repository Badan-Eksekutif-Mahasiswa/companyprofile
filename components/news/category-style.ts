import { FileText, Megaphone, Newspaper, PenLine, type LucideIcon } from "lucide-react";
import type { BadgeProps } from "@/components/ui";
import type { NewsCategory } from "@/lib/news";

export interface CategoryStyle {
  badge: BadgeProps["variant"];
  /** Kelas gradient placeholder cover (token design system). */
  gradient: string;
  Icon: LucideIcon;
}

export const CATEGORY_STYLE: Record<NewsCategory, CategoryStyle> = {
  "kajian-strategis": { badge: "blue", gradient: "from-navy-5 to-navy-10", Icon: FileText },
  "siaran-pers": { badge: "maroon", gradient: "from-navy-5 to-navy-10", Icon: Megaphone },
  "opini-artikel": { badge: "pink", gradient: "from-navy-5 to-navy-10", Icon: PenLine },
  "kabar-ui": { badge: "navy", gradient: "from-navy-5 to-navy-10", Icon: Newspaper },
};

export const styleOf = (k?: NewsCategory | null): CategoryStyle => CATEGORY_STYLE[k ?? "kabar-ui"];
