import { PenLine, ShieldCheck, FileText, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";
import { JENIS_KONTEN, type NewsCategory } from "@/lib/news";

const LOOK: Record<NewsCategory, { cls: string; Icon: typeof ShieldCheck }> = {
  "siaran-pers": { cls: "border-navy bg-navy text-white", Icon: ShieldCheck },
  "opini-artikel": { cls: "border-accent bg-white text-accent", Icon: PenLine },
  "kajian-strategis": { cls: "border-navy-5 bg-blue-pale text-navy", Icon: FileText },
  "kabar-ui": { cls: "border-navy-5 bg-navy-5 text-navy", Icon: Newspaper },
};

export function ContentLabel({ kategori }: { kategori: NewsCategory }) {
  const { label, note } = JENIS_KONTEN[kategori];
  const { cls, Icon } = LOOK[kategori];
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <span className={cn("inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-1.5 text-[13px] font-extrabold uppercase tracking-wide", cls)}>
        <Icon className="size-4" aria-hidden />
        {label}
      </span>
      {note && <span className="text-[13px] font-semibold text-secondary">{note}</span>}
    </div>
  );
}
