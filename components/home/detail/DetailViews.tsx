"use client";

/**
 * Isi tampilan detail di hero beranda. Markup & kelas sama dengan halaman detail kabinet
 * (components/kabinet/ProjectPage + project.css) supaya tampilan dan motion-nya identik:
 * hero row (judul · kartu 30vw 1.4:1.9 · label), info grid, section teks, media, tim.
 */
import * as React from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, RotateCw } from "lucide-react";
import { CharRoll } from "@/components/kabinet/CharRoll";
import { useShell } from "@/components/kabinet/shell-context";
import type { Divisi, Person } from "@/lib/kabinet";
import { createReveal } from "@/lib/gsap-reveal";
import { STATUS_LABEL } from "@/lib/format";
import { unitType } from "@/lib/unit";
import type { HeroProker } from "@/types";

export type EnterMode = "fly" | "toggle";

/* ---------- media: <img> tetap di DOM, di desktop digambar kanvas distorsi (sama dgn ProjectPage) ---------- */
function MediaAsset({ src, alt, className = "media-item__el" }: { src: string; alt: string; className?: string }) {
  const { distort } = useShell();
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || !distort) return;
    distort.register(el, src);
    return () => distort.unregister(el);
  }, [distort, src]);
  return (
    <div ref={ref} className="media-item__inner">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={className} src={src} alt={alt} crossOrigin="anonymous" />
    </div>
  );
}

function PersonCard({ p }: { p: Person }) {
  return (
    <figure className="person-card group relative m-0 aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-navy-5 shadow-sm transition-shadow duration-base ease-out-expo hover:shadow-lg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.foto.url} alt={p.foto.alt ?? p.nama} loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.06]" />
      <figcaption className="absolute inset-x-3 bottom-3 rounded-xl border border-glass-border bg-glass-strong p-3 shadow-glass-soft backdrop-blur-glass">
        <div className="text-[14px] font-bold leading-tight text-navy">{p.nama}</div>
        <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-secondary">{p.jabatan}</div>
      </figcaption>
    </figure>
  );
}

/* ---------- kartu tengah + tab di kirinya; klik salah satunya = tukar tampilan ---------- */
function CardPanel({
  src,
  alt,
  tabTitle,
  tabSub,
  hidden,
  onToggle,
  onHoverLabel,
  hoverText,
}: {
  src: string;
  alt: string;
  tabTitle: string;
  tabSub?: string;
  hidden: boolean;
  onToggle: () => void;
  onHoverLabel: (text: string | null) => void;
  hoverText: string;
}) {
  return (
    <div className="hero__col hero__col--cover">
      <div className="relative">
        <button
          type="button"
          onClick={onToggle}
          data-hover
          aria-label={hoverText}
          className="hero-tab absolute right-full top-6 z-[2] flex flex-col items-center gap-3 rounded-l-xl border border-r-0 border-border bg-white px-2 py-4 text-navy shadow-sm transition-colors duration-base hover:bg-pink-pale"
        >
          <span className="rotate-180 text-[13px] font-bold uppercase tracking-[0.08em] [writing-mode:vertical-rl]">{tabTitle}</span>
          {tabSub && <span className="rotate-180 text-[11px] font-bold uppercase tracking-[0.16em] text-accent [writing-mode:vertical-rl]">{tabSub}</span>}
          <RotateCw aria-hidden className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          onMouseEnter={() => onHoverLabel(hoverText)}
          onMouseLeave={() => onHoverLabel(null)}
          data-hover
          aria-label={hoverText}
          className="hero__panel block p-0"
          style={{ visibility: hidden ? "hidden" : "visible", border: 0, cursor: "pointer", background: "transparent" }}
        >
          <MediaAsset src={src} alt={alt} className="hero__panel-img" />
        </button>
      </div>
    </div>
  );
}

/* ---------- reveal & scroll animation: port dari ProjectPage (nilai durasi/ease sama) ---------- */
function useProjectReveal(root: React.RefObject<HTMLElement>, play: boolean, enter: EnterMode) {
  const { ready } = useShell();
  React.useEffect(() => {
    const el = root.current;
    if (!el || !ready || !play) return;
    const q = <T extends Element>(sel: string) => Array.from(el.querySelectorAll<T>(sel));
    const reveal = createReveal(gsap);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduced) {
        q(".hero--reveal-pending, .project--reveal-pending").forEach((n) => n.classList.remove("hero--reveal-pending", "project--reveal-pending"));
        return;
      }
      const title = q(".hero__title");
      const year = q(".hero__year");
      const infoBits = [...q(".info__label"), ...q(".info__category"), ...q(".info__roles-list li")];
      const textBits = [...q(".description .rich-text"), ...q(".section--text .section__subtitle"), ...q(".section--text .rich-text")];
      const delay = enter === "toggle" ? 0.15 : 0.5;

      reveal.revealWords({ elements: title, trigger: el.querySelector(".hero__row"), start: "top bottom", duration: 1.05, delay, lineStagger: 0.085, wordStagger: 0, ease: "expo.out" });
      gsap.set(title, { opacity: 1 });
      title.forEach((n) => n.classList.remove("hero--reveal-pending"));
      reveal.revealBlocks({ elements: year, start: "top bottom", duration: 1.05, delay, y: 24 });
      year.forEach((n) => n.classList.remove("hero--reveal-pending"));

      infoBits.forEach((n) => n.classList.remove("project--reveal-pending"));
      reveal.revealBlocks({
        elements: infoBits,
        start: "top 92%",
        duration: 1.05,
        y: 24,
        fromVars: { opacity: 1, clipPath: "inset(0 0 100% 0)" },
        toVars: { opacity: 1, clipPath: "inset(0 0 0% 0)" },
      });
      reveal.revealWords({ elements: textBits, start: "top 92%", duration: 1.05, lineStagger: 0.085, wordStagger: 0, ease: "expo.out" });

      q(".section .media-item__inner").forEach((n) => {
        gsap.fromTo(n, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: n, start: "top 88%", once: true } });
      });
      q(".media-caption, .person-card, .proker-row").forEach((n) => {
        gsap.fromTo(n, { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 1.05, ease: "expo.out", scrollTrigger: { trigger: n, start: "top 92%", once: true } });
      });
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1025px)", () => {
        q(".section--media-trio").forEach((sec) => {
          const items = sec.querySelectorAll(".media-item");
          gsap.fromTo(items, { y: (i: number) => [60, 200, 340][i] ?? 0 }, { y: 0, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "center center", scrub: true, invalidateOnRefresh: true } });
        });
      });
      // tukar tampilan: kartu muncul kembali (pasangan dari animasi keluar di HeroDetail)
      if (enter === "toggle") {
        gsap.fromTo(q(".hero__panel .media-item__inner"), { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.9, ease: "expo.out" });
        gsap.fromTo(q(".hero-tab"), { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 0.7, ease: "expo.out", delay: 0.2 });
      }
    }, el);

    let t: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(t);
      t = setTimeout(() => ScrollTrigger.refresh(), 80);
    };
    q<HTMLImageElement>("img").forEach((img) => {
      if (!img.complete) {
        img.addEventListener("load", refresh, { once: true });
        img.addEventListener("error", refresh, { once: true });
      }
    });
    refresh();
    return () => {
      clearTimeout(t);
      reveal.cleanup();
      ctx.revert();
    };
  }, [root, ready, play, enter]);
}

/* ---------- label "Lihat" yang mengikuti kursor (sama dgn ProjectPage) ---------- */
export function FloatingLabel({ text }: { text: string | null }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [shown, setShown] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (text) setShown(text);
  }, [text]);
  React.useEffect(() => {
    if (!text) return;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0, first = true;
    const move = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (first) {
        x = tx;
        y = ty;
        first = false;
      }
    };
    const loop = () => {
      x += (tx - x) * 0.1;
      y += (ty - y) * 0.1;
      if (ref.current) ref.current.style.transform = `translate(${x + 30}px, calc(${y}px - 50%))`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", move);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, [text]);
  return (
    <div ref={ref} className={`next__floating-label${text ? " next__floating-label--visible" : ""}`} aria-hidden>
      {shown}
    </div>
  );
}

interface ViewProps {
  item: HeroProker;
  panelHidden: boolean;
  play: boolean;
  enter: EnterMode;
  onToggle: () => void;
  onHoverLabel: (text: string | null) => void;
}

/* ================= Tampilan detail PROKER ================= */
export function ProkerView({
  item,
  next,
  unitProker,
  onNext,
  ...p
}: ViewProps & { next: HeroProker | null; unitProker: HeroProker[]; onNext: () => void }) {
  const root = React.useRef<HTMLElement>(null);
  useProjectReveal(root, p.play, p.enter);
  const type = item.unit.type;
  const docs = item.dokumentasi.slice(0, 3);
  const others = unitProker.filter((x) => x.slug !== item.slug);

  return (
    <main ref={root} className="project">
      <section className="hero__row">
        <div className="hero__col hero__col--title">
          <h1 className="hero__title hero--reveal-pending">{item.nama}</h1>
        </div>
        <CardPanel
          src={item.foto_url}
          alt={`Sampul ${item.nama}`}
          tabTitle={type}
          tabSub={item.unit.singkatan}
          hidden={p.panelHidden}
          onToggle={p.onToggle}
          onHoverLabel={p.onHoverLabel}
          hoverText={`Lihat ${type}`}
        />
        <div className="hero__col hero__col--year">
          <div className="hero__year label_info hero--reveal-pending">
            {STATUS_LABEL[item.status]} · {item.tanggal}
          </div>
        </div>
      </section>

      <section className="info">
        <div className="info__left col-2">
          <div className="info__categories">
            <h3 className="label_info info__label project--reveal-pending">Diselenggarakan oleh</h3>
            <div>
              <button type="button" onClick={p.onToggle} className="info__category project--reveal-pending text-left" data-hover>
                <CharRoll text={item.unit.nama} topClass="cat-char-top" botClass="cat-char-bot" charClass="cat-char" />
              </button>
            </div>
          </div>
        </div>
        <div className="info__roles col-start-3 col-2">
          <h3 className="label_info info__label project--reveal-pending">Status</h3>
          <ul className="info__roles-list">
            <li className="project--reveal-pending">{STATUS_LABEL[item.status]}</li>
            {item.tanggal && <li className="project--reveal-pending">{item.tanggal}</li>}
          </ul>
        </div>
        <div className="info__right col-start-7 col-8">
          <section className="description">
            <div className="rich-text description__text">
              <p>
                <span className="description__inline-label">(INFO)</span> {item.deskripsi}
              </p>
            </div>
          </section>
        </div>
      </section>

      <section className="section section--text">
        <h2 className="section__subtitle col-start-1 col-3">Penjelasan</h2>
        <div className="rich-text col-7 col-start-7">
          {item.penjelasan.map((t) => (
            <p key={t.slice(0, 48)}>{t}</p>
          ))}
        </div>
      </section>

      {docs.length > 0 && (
        <section className="section section--media-trio">
          <div className="trio">
            {docs.map((d, i) => (
              <div key={d.url} className="media-item">
                <div className="aspect-[4/3] overflow-hidden [&_.media-item__inner]:h-full [&_img]:h-full [&_img]:object-cover">
                  <MediaAsset src={d.url} alt={`Dokumentasi ${i + 1} ${item.nama}: ${d.caption}`} />
                </div>
                <div className="media-caption">
                  <div className="label_info">Dokumentasi {String(i + 1).padStart(2, "0")}</div>
                  <p>{d.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="section section--text">
          <h2 className="section__subtitle col-start-1 col-3">Proker lain {item.unit.singkatan}</h2>
          <ul className="col-6 col-start-7">
            {others.map((o) => (
              <li key={o.slug} className="proker-row border-b border-navy-10 py-4 first:border-t">
                <span className="flex items-baseline justify-between gap-6 text-[1.25em]">
                  <span>{o.nama}</span>
                  <span className="label_info shrink-0 opacity-60">{STATUS_LABEL[o.status]}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {next && (
        <section
          className="next-project"
          data-hover
          onClick={onNext}
          onMouseEnter={() => p.onHoverLabel("Lihat")}
          onMouseLeave={() => p.onHoverLabel(null)}
        >
          <div className="next__left">
            <h2 className="next__title">{next.nama}</h2>
          </div>
          <div className="next__center">
            <div className="next__panel">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="next__img" src={next.foto_url} alt={next.nama} />
            </div>
          </div>
          <div className="next__right">
            <span className="label_info">Proker Selanjutnya</span>
          </div>
        </section>
      )}
    </main>
  );
}

/* ================= Tampilan detail BIRO / DEPARTEMEN (isi sama dgn halaman detail kabinet) ================= */
export function DivisiView({
  item,
  divisi,
  unitProker,
  onSelectProker,
  ...p
}: ViewProps & { divisi: Divisi; unitProker: HeroProker[]; onSelectProker: (slug: string) => void }) {
  const root = React.useRef<HTMLElement>(null);
  useProjectReveal(root, p.play, p.enter);

  return (
    <main ref={root} className="project">
      <section className="hero__row">
        <div className="hero__col hero__col--title">
          <h1 className="hero__title hero--reveal-pending">{divisi.title}</h1>
        </div>
        <CardPanel
          src={divisi.cover.url}
          alt={divisi.cover.alt}
          tabTitle="Proker"
          tabSub={item.unit.singkatan}
          hidden={p.panelHidden}
          onToggle={p.onToggle}
          onHoverLabel={p.onHoverLabel}
          hoverText="Lihat Proker"
        />
        <div className="hero__col hero__col--year">
          <div className="hero__year label_info hero--reveal-pending">Tahun {divisi.year}</div>
        </div>
      </section>

      <section className="info">
        <div className="info__left col-2">
          <div className="info__categories">
            <h3 className="label_info info__label project--reveal-pending">{unitType(divisi)}</h3>
            <div>
              {divisi.categories.map((c) => (
                <span key={c.slug} className="info__category project--reveal-pending">
                  <CharRoll text={c.name} topClass="cat-char-top" botClass="cat-char-bot" charClass="cat-char" />
                </span>
              ))}
            </div>
          </div>
        </div>
        {divisi.roles.length > 0 && (
          <div className="info__roles col-start-3 col-2">
            <h3 className="label_info info__label project--reveal-pending">Peran</h3>
            <ul className="info__roles-list">
              {divisi.roles.map((r) => (
                <li key={r} className="project--reveal-pending">
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="info__right col-start-7 col-8">
          <section className="description">
            <div className="rich-text description__text">
              <p>
                <span className="description__inline-label">(INFO)</span> {divisi.description}
              </p>
            </div>
          </section>
        </div>
      </section>

      <section className="section section--text">
        <h2 className="section__subtitle col-start-1 col-3">Visi</h2>
        <div className="rich-text col-7 col-start-7">
          <p>{divisi.visi}</p>
        </div>
      </section>
      <section className="section section--text">
        <h2 className="section__subtitle col-start-1 col-3">Misi</h2>
        <div className="rich-text col-7 col-start-7">
          <ol className="misi-list">
            {divisi.misi.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ol>
        </div>
      </section>

      {unitProker.length > 0 && (
        <section className="section section--text">
          <h2 className="section__subtitle col-start-1 col-3">Program Kerja</h2>
          <ul className="col-6 col-start-7">
            {unitProker.map((o) => (
              <li key={o.slug} className="proker-row border-b border-navy-10 first:border-t">
                <button
                  type="button"
                  data-hover
                  onClick={() => onSelectProker(o.slug)}
                  className="flex w-full items-baseline justify-between gap-6 py-4 text-left text-[1.25em] transition-opacity hover:opacity-60"
                >
                  <span>
                    {o.nama}
                    {o.slug === item.slug && <span className="label_info ml-3 text-accent">· sedang dilihat</span>}
                  </span>
                  <span className="label_info shrink-0 opacity-60">{STATUS_LABEL[o.status]}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {divisi.bph.length > 0 && (
        <section className="section section--team">
          <h2 className="section__subtitle">BPH</h2>
          <div className="team__grid">
            {divisi.bph.map((x, i) => (
              <PersonCard key={i} p={x} />
            ))}
          </div>
        </section>
      )}
      {divisi.staff.length > 0 && (
        <section className="section section--team">
          <h2 className="section__subtitle">Staff</h2>
          <div className="team__grid">
            {divisi.staff.map((x, i) => (
              <PersonCard key={i} p={x} />
            ))}
          </div>
        </section>
      )}

      <section className="section section--text">
        <h2 className="section__subtitle col-start-1 col-3">Halaman divisi</h2>
        <div className="rich-text col-7 col-start-7">
          <p>
            <Link href={`/kabinet/${divisi.slug}`} className="inline-flex items-center gap-2 underline underline-offset-4" data-hover>
              Buka profil lengkap {divisi.nama} <ArrowUpRight aria-hidden className="size-5" />
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
