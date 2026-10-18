import * as React from "react";

export function WordRoll({ text }: { text: string }) {
  return (
    <span className="kd-wordroll" aria-label={text}>
      {text.trim().split(/\s+/).map((word, i) => (
        <CharRoll key={i} text={word} topClass="cat-char-top" botClass="cat-char-bot" charClass="cat-char" />
      ))}
    </span>
  );
}

/** Teks per-karakter yang "berputar" (char-top → char-bot) saat hover; delay 40ms × index lewat --i. */
export function CharRoll({ text, topClass = "char-top", botClass = "char-bot", charClass = "kd-char" }: { text: string; topClass?: string; botClass?: string; charClass?: string }) {
  return (
    <span className="kd-charroll" aria-label={text}>
      {Array.from(text).map((c, i) => (
        <span key={i} className={charClass} style={{ "--i": i } as React.CSSProperties} aria-hidden="true">
          <span className={topClass}>{c === " " ? " " : c}</span>
          <span className={botClass}>{c === " " ? " " : c}</span>
        </span>
      ))}
    </span>
  );
}
