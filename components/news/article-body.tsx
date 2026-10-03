import type { NewsBlock } from "@/lib/news";

/** Render blok artikel. Teks selalu di-escape React; tidak ada HTML mentah. */
export function ArticleBody({ blocks }: { blocks: NewsBlock[] }) {
  return (
    <div className="max-w-[720px] space-y-5 text-[17px] leading-[1.8] text-primary">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "p":
            return <p key={i}>{b.text}</p>;
          case "h2":
            return (
              <h2 key={i} className="pt-4 text-2xl font-extrabold leading-snug text-navy">
                {b.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="pt-2 text-xl font-bold leading-snug text-navy">
                {b.text}
              </h3>
            );
          case "quote":
            return (
              <blockquote key={i} className="border-l-4 border-accent pl-5 text-xl font-semibold italic leading-relaxed text-navy">
                {b.text}
                {b.cite && <footer className="mt-2 text-sm font-normal not-italic text-muted">— {b.cite}</footer>}
              </blockquote>
            );
          case "ul":
            return (
              <ul key={i} className="list-disc space-y-1.5 pl-6 marker:text-accent">
                {b.items.map((t, j) => <li key={j}>{t}</li>)}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="list-decimal space-y-1.5 pl-6 marker:font-bold marker:text-accent">
                {b.items.map((t, j) => <li key={j}>{t}</li>)}
              </ol>
            );
        }
      })}
    </div>
  );
}
