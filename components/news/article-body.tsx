import { extractHeadings, type NewsBlock } from "@/lib/news";

/** Render blok artikel. Teks selalu di-escape React; tidak ada HTML mentah. Subjudul punya id + tautan langsung. */
export function ArticleBody({ blocks }: { blocks: NewsBlock[] }) {
  const heads = extractHeadings(blocks);
  let h = 0;
  const anchor = (id: string, text: string) => (
    <a href={`#${id}`} aria-label={`Tautan ke bagian: ${text}`} className="ml-2 text-accent no-underline opacity-0 outline-none transition-opacity duration-fast focus-visible:opacity-100 group-hover:opacity-100 print:hidden">
      #
    </a>
  );
  return (
    <div className="reader-body max-w-[720px] space-y-5 leading-[1.8] text-primary">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "p":
            return <p key={i}>{b.text}</p>;
          case "h2": {
            const { id } = heads[h++];
            return (
              <h2 key={i} id={id} className="group scroll-mt-28 pt-4 text-[1.4em] font-extrabold leading-snug text-navy">
                {b.text}
                {anchor(id, b.text)}
              </h2>
            );
          }
          case "h3": {
            const { id } = heads[h++];
            return (
              <h3 key={i} id={id} className="group scroll-mt-28 pt-2 text-[1.2em] font-bold leading-snug text-navy">
                {b.text}
                {anchor(id, b.text)}
              </h3>
            );
          }
          case "quote":
            return (
              <blockquote key={i} className="border-l-4 border-accent pl-5 text-[1.2em] font-semibold italic leading-relaxed text-navy">
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
