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
  "kajian-strategis": { badge: "blue", gradient: "from-blue-pale to-blue-soft", Icon: FileText },
  "siaran-pers": { badge: "maroon", gradient: "from-maroon-pale to-pink-light", Icon: Megaphone },
  "opini-artikel": { badge: "pink", gradient: "from-pink-pale to-pink-light", Icon: PenLine },
  "kabar-ui": { badge: "navy", gradient: "from-blue-pale to-pink-pale", Icon: Newspaper },
};
