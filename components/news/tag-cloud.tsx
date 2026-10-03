import { cn } from "@/lib/utils";
import type { TagCount } from "@/lib/news";

export interface TagCloudProps {
  tags: TagCount[];
  active?: string | null;
  onSelect: (key: string | null) => void;
}

/** Ukuran font mengikuti frekuensi; jumlah artikel tetap ditulis supaya tidak bergantung pada ukuran saja. */
export function TagCloud({ tags, active, onSelect }: TagCloudProps) {
  if (tags.length === 0) return null;
  const max = Math.max(...tags.map((t) => t.count));
  const min = Math.min(...tags.map((t) => t.count));
  const size = (c: number) => {
    const ratio = max === min ? 0.5 : (c - min) / (max - min);
    return `${(0.875 + ratio * 0.5).toFixed(3)}rem`;
  };

  return (
    <section aria-labelledby="topik-populer" className="mt-20 rounded-2xl border border-border bg-navy-5 p-8">
      <h2 id="topik-populer" className="text-xl font-extrabold text-navy">
        Topik Populer
      </h2>
      <ul className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-2">
        {tags.map((t) => {
          const on = active === t.key;
          return (
            <li key={t.key}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onSelect(on ? null : t.key)}
                style={{ fontSize: size(t.count) }}
                className={cn(
                  "rounded-full px-3 py-1 font-bold outline-none transition-colors duration-fast focus-visible:ring-4 focus-visible:ring-pink-pale",
                  on ? "bg-accent text-white" : "bg-navy-5 text-navy hover:bg-pink-pale hover:text-accent"
                )}
              >
                #{t.label} <span className={cn("text-[0.75em] font-semibold", on ? "text-white opacity-80" : "text-muted")}>{t.count}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
