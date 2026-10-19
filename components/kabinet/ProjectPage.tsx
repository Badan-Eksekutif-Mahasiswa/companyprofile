"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Divisi, Media, Person, Section } from "@/lib/kabinet";
import { createReveal } from "@/lib/gsap-reveal";
import { revealProjectText } from "@/lib/project-text-reveal";
import { beginProgramTransition } from "@/lib/program-transition";
import { WordRoll } from "./CharRoll";
import { useShell } from "./shell-context";
import { PersonCard } from "./PersonCard";

declare global {
  interface Window {
    __kdClone?: HTMLElement | null;
  }
}

/* <img> tetap ada di DOM (layout, SEO, fallback); di desktop gambar digambar oleh kanvas WebGL. */
function MediaAsset({ media, imgClass = "media-item__el" }: { media: Media; imgClass?: string }) {
  const { distort } = useShell();
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || !distort) return;
    distort.register(el, media.url);
    return () => distort.unregister(el);
  }, [distort, media.url]);
  return (
    <div ref={ref} className="media-item__inner">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={imgClass} src={media.url} alt={media.alt} />
    </div>
  );
}

function TeamSection({ title, people, centered = false }: { title: string; people: Person[]; centered?: boolean }) {
  if (!people.length) return null;
  return (
    <section className="section section--team">
      <h2 className="section__subtitle">{title}</h2>
      <div className={`team__grid${centered ? " team__grid--centered" : ""}`}>
        {people.map((p, i) => (
          <PersonCard key={i} p={p} academic={centered} />
        ))}
      </div>
    </section>
  );
}

function Caption({ m }: { m: Media }) {
  if (!m.title && !m.desc) return null;
  return (
    <div className="media-caption">
      {m.title && <div className="label_info">{m.title}</div>}
      {m.desc && <p>{m.desc}</p>}
    </div>
  );
}

function SectionMedia({ media }: { media: Media }) {
  const router = useRouter();
  if (!media.prokerSlug) return <MediaAsset media={media} />;
  const href = `/?proker=${encodeURIComponent(media.prokerSlug)}`;
  const preloadDetail = () => { void import("@/components/home/detail/HeroDetail").catch(() => {}); };
  return (
    <Link
      href={href}
      onMouseEnter={preloadDetail}
      onFocus={preloadDetail}
      onClick={(event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const image = event.currentTarget.querySelector("img");
        if (!image) return;
        event.preventDefault();
        preloadDetail();
        beginProgramTransition(media.prokerSlug!, image, () => router.push(href));
      }}
      aria-label={`Lihat detail proker ${media.title || media.alt}`}
      className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      data-hover
    >
      <MediaAsset media={media} />
    </Link>
  );
}

function renderSection(s: Section, i: number) {
  switch (s.type) {
    case "media-single":
      return (
        <section key={i} className={`section section--media-single section--${s.position ?? "center"}`}>
          <div className="media-item">
            <div className="media-single__content">
              <SectionMedia media={s.media} />
              <Caption m={s.media} />
            </div>
          </div>
        </section>
      );
    case "media-duo":
      return (
        <section key={i} className="section section--media-duo">
          <div className="duo">
            <div className="media-item col-6">
              <SectionMedia media={s.media_left} />
              <Caption m={s.media_left} />
            </div>
            <div className="media-item col-6 col-start-7">
              <SectionMedia media={s.media_right} />
              <Caption m={s.media_right} />
            </div>
          </div>
        </section>
      );
    case "media-trio":
      return (
        <section key={i} className="section section--media-trio">
          <div className="trio">
            {[s.media_1, s.media_2, s.media_3].map((m, j) => (
              <div key={j} className="media-item">
                <SectionMedia media={m} />
              </div>
            ))}
          </div>
        </section>
      );
    case "text-block":
      return (
        <section key={i} className="section section--text">
          {s.subtitle && <h2 className="section__subtitle col-start-1 col-3">{s.subtitle}</h2>}
          <div className="rich-text col-7 col-start-7" dangerouslySetInnerHTML={{ __html: s.content.map((p) => `<p>${p}</p>`).join("") }} />
        </section>
      );
  }
}

export function ProjectPage({ divisi, next }: { divisi: Divisi; next: Divisi | null }) {
  const router = useRouter();
  const { lenis, ready } = useShell();
  const root = React.useRef<HTMLElement>(null);
  const nextPanel = React.useRef<HTMLDivElement>(null);
  const nextLeft = React.useRef<HTMLDivElement>(null);
  const nextRight = React.useRef<HTMLDivElement>(null);
  const label = React.useRef<HTMLDivElement>(null);
  const [labelOn, setLabelOn] = React.useState(false);
  const busy = React.useRef(false);

  /* ---- reveal & scroll animations ---- */
  React.useEffect(() => {
    const el = root.current;
    if (!el || !ready) return;
    const q = <T extends Element>(sel: string) => Array.from(el.querySelectorAll<T>(sel));
    const reveal = createReveal(gsap);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduced) {
        q(".hero--reveal-pending, .project--reveal-pending").forEach((n) => n.classList.remove("hero--reveal-pending", "project--reveal-pending"));
        return;
      }
      revealProjectText(el, reveal);

      // media: fade + naik; mesh WebGL ikut membaca opacity & posisi elemen
      q(".section .media-item__inner").forEach((n) => {
        gsap.fromTo(n, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: n, start: "top 88%", once: true } });
      });

      q(".person-card").forEach((n) => {
        gsap.fromTo(n, { opacity: 0 }, { opacity: 1, duration: 1.05, ease: "expo.out", scrollTrigger: { trigger: n, start: "top 92%", once: true } });
      });

      // trio: parallax bertingkat (hanya desktop)
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1025px)", () => {
        q(".section--media-trio").forEach((sec) => {
          const items = sec.querySelectorAll(".media-item");
          gsap.fromTo(items, { y: (i: number) => [60, 200, 340][i] ?? 0 }, { y: 0, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "center center", scrub: true, invalidateOnRefresh: true } });
        });
      });
    }, el);

    // tinggi halaman berubah saat gambar selesai dimuat
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
    window.addEventListener("load", refresh);
    refresh();

    return () => {
      clearTimeout(t);
      window.removeEventListener("load", refresh);
      reveal.cleanup();
      ctx.revert();
    };
  }, [ready, divisi.slug]);

  /* ---- sisa transisi dari "Divisi Selanjutnya": clone cover memudar setelah hero siap ---- */
  React.useEffect(() => {
    const clone = window.__kdClone;
    if (!clone) return;
    window.__kdClone = null;
    lenis?.scrollTo(0, { immediate: true, force: true });
    const hero = root.current?.querySelector<HTMLImageElement>(".hero__panel-img");
    const done = () =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => gsap.to(clone, { opacity: 0, duration: 0.45, ease: "power2.out", onComplete: () => clone.remove() }))
      );
    if (!hero || hero.complete) done();
    else {
      hero.addEventListener("load", done, { once: true });
      hero.addEventListener("error", done, { once: true });
    }
  }, [lenis]);

  /* ---- label "Lihat" mengikuti kursor ---- */
  React.useEffect(() => {
    if (!labelOn) return;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const move = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    const loop = () => {
      x += (tx - x) * 0.1;
      y += (ty - y) * 0.1;
      if (label.current) label.current.style.transform = `translate(${x + 30}px, calc(${y}px - 50%))`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", move);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, [labelOn]);

  const goNext = () => {
    if (!next || busy.current) return;
    busy.current = true;
    const url = `/kabinet/${next.slug}`;
    const panel = nextPanel.current;
    const mobile = window.matchMedia("(max-width: 1024px), (hover: none)").matches;
    if (!panel || mobile || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(url);
      return;
    }
    const r = panel.getBoundingClientRect();
    const tw = window.innerWidth * 0.3;
    const th = tw * (4 / 3);
    const left = (window.innerWidth - tw) / 2;
    const top = (window.innerHeight - th) / 2;
    lenis?.stop();
    panel.style.opacity = "0";

    const clone = document.createElement("div");
    clone.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;overflow:hidden;z-index:9990;pointer-events:none;`;
    const img = document.createElement("img");
    img.src = next.cover.url;
    img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
    clone.appendChild(img);
    document.body.appendChild(clone);

    const fade = document.querySelectorAll(".kd .hero__row, .kd .info, .kd .section, .kd .collaborators, .kd-distort-canvas");
    const side = [nextLeft.current, nextRight.current].filter(Boolean);
    gsap
      .timeline({
        onComplete() {
          window.__kdClone = clone;
          router.push(url);
        },
      })
      .to(fade, { opacity: 0, duration: 0.35, ease: "power2.out" }, 0)
      .to(side, { opacity: 0, duration: 0.25, ease: "power2.out" }, 0)
      .to(clone, { left, top, width: tw, height: th, duration: 1.5, ease: "expo.inOut" });
  };

  return (
    <main ref={root} className="project">
      <section className="hero__row">
        <div className="hero__col hero__col--title">
          <h1 className="hero__title hero--reveal-pending">{divisi.nama}</h1>
        </div>
        <div className="hero__col hero__col--cover">
          <div className="hero__panel">
            <MediaAsset media={divisi.cover} imgClass="hero__panel-img" />
          </div>
        </div>
        <div className="hero__col hero__col--year">
          {divisi.year && <div className="hero__year label_info hero--reveal-pending">Tahun — {divisi.year}</div>}
        </div>
      </section>

      <section className="info">
        <div className="info__left col-1">
          <div className="info__categories">
            <h3 className="label_info info__label project--reveal-pending">Kategori</h3>
            <div>
              {divisi.categories.map((c) => (
                <Link key={c.slug} href={`/kabinet?kategori=${c.slug}`} className="info__category project--reveal-pending" data-hover>
                  <WordRoll text={c.name} />
                </Link>
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
            <div
              className="rich-text description__text"
              dangerouslySetInnerHTML={{ __html: `<p><span class="description__inline-label">(INFO)</span> ${divisi.description}</p>` }}
            />
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
            {divisi.misi.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ol>
        </div>
      </section>

      {divisi.sections.map(renderSection)}

      <TeamSection title="BPH" people={divisi.bph} centered />
      <TeamSection title="Staf" people={divisi.staff} />

      {next && (
        <section
          className="next-project"
          data-hover
          onClick={goNext}
          onMouseEnter={() => setLabelOn(true)}
          onMouseLeave={() => setLabelOn(false)}
        >
          <div className="next__left" ref={nextLeft}>
            <h2 className="next__title">{next.nama}</h2>
          </div>
          <div className="next__center">
            <div className="next__panel" ref={nextPanel}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="next__img" src={next.cover.url} alt={next.nama} />
            </div>
          </div>
          <div className="next__right" ref={nextRight}>
            <span className="label_info">Divisi Selanjutnya</span>
          </div>
        </section>
      )}

      <div ref={label} className={`next__floating-label${labelOn ? " next__floating-label--visible" : ""}`}>
        Lihat
      </div>
    </main>
  );
}
