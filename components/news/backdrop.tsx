/** Latar blob warna lembut supaya kaca (glass) punya sesuatu untuk diburamkan. Dekoratif. */
export function NewsBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px] overflow-hidden">
      <div className="news-drift absolute -left-24 -top-24 size-[460px] rounded-full bg-pink-light opacity-70 blur-3xl [animation:news-drift_16s_ease-in-out_infinite]" />
      <div className="news-drift absolute right-[-8%] top-24 size-[520px] rounded-full bg-blue-soft opacity-50 blur-3xl [animation:news-drift_20s_ease-in-out_infinite_reverse]" />
      <div className="news-drift absolute left-1/3 top-[420px] size-[380px] rounded-full bg-maroon-pale blur-3xl [animation:news-drift_24s_ease-in-out_infinite]" />
    </div>
  );
}
