import * as React from "react";
import { extractHeadings, type Inline, type NewsBlock } from "@/lib/news";

function Runs({ runs, text }: { runs?: Inline[]; text: string }) {
  if (!runs) return <>{text}</>;
  return (
    <>
      {runs.map((r, k) => {
        let n: React.ReactNode = r.t;
        if (r.b) n = <strong>{n}</strong>;
        if (r.i) n = <em>{n}</em>;
        if (r.u) n = <u>{n}</u>;
        if (r.href)
          n = (
            <a href={r.href} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold text-accent underline underline-offset-2 hover:text-accent-hover">
              {n}
            </a>
          );
        return <React.Fragment key={k}>{n}</React.Fragment>;
      })}
    </>
  );
}

export function ArticleBody({ blocks }: { blocks: NewsBlock[] }) {
  const heads = extractHeadings(blocks);
  let h = 0;
  return (
    <div className="reader-body max-w-[720px] space-y-5 leading-[1.8] text-primary">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "p":
            return <p key={i}><Runs runs={b.runs} text={b.text} /></p>;
          case "h2": {
            const { id } = heads[h++];
            return (
              <h2 key={i} id={id} className="scroll-mt-28 pt-4 text-[1.4em] font-bold leading-snug text-navy">
                {b.text}
              </h2>
            );
          }
          case "h3": {
            const { id } = heads[h++];
            return (
              <h3 key={i} id={id} className="scroll-mt-28 pt-2 text-[1.2em] font-bold leading-snug text-navy">
                {b.text}
              </h3>
            );
          }
          case "quote":
            return (
              <blockquote key={i} className="border-l-4 border-accent pl-5 text-[1.2em] font-semibold italic leading-relaxed text-navy">
                <Runs runs={b.runs} text={b.text} />
                {b.cite && <footer className="mt-2 text-sm font-normal not-italic text-muted">— {b.cite}</footer>}
              </blockquote>
            );
          case "ul":
            return (
              <ul key={i} className="list-disc space-y-1.5 pl-6 marker:text-accent">
                {b.items.map((t, j) => <li key={j}><Runs runs={b.itemRuns?.[j]} text={t} /></li>)}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="list-decimal space-y-1.5 pl-6 marker:font-bold marker:text-accent">
                {b.items.map((t, j) => <li key={j}><Runs runs={b.itemRuns?.[j]} text={t} /></li>)}
              </ol>
            );
        }
      })}
    </div>
  );
}
