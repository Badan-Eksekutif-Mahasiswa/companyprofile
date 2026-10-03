import { splitHighlight } from "@/lib/news";

/** Menyorot kata kunci pencarian dengan <mark>. */
export function Highlight({ text, q }: { text: string; q?: string }) {
  return (
    <>
      {splitHighlight(text, q).map((p, i) =>
        p.hit ? (
          <mark key={i} className="rounded bg-pink-pale px-0.5 text-inherit">
            {p.t}
          </mark>
        ) : (
          <span key={i}>{p.t}</span>
        )
      )}
    </>
  );
}
