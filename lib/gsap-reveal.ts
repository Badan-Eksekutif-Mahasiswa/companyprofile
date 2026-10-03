import type { gsap as Gsap } from "gsap";
import type { ScrollTrigger as ST } from "gsap/ScrollTrigger";

/**
 * Port util reveal k95: pecah teks jadi kata (masking overflow:hidden), kata dikelompokkan
 * per baris visual, lalu naik dari yPercent 115 → 0 dengan expo.out saat masuk viewport.
 */
type Els = string | Element | Element[] | NodeListOf<Element> | null | undefined;

const toArray = (n: Els): Element[] =>
  !n ? [] : typeof n === "string" ? Array.from(document.querySelectorAll(n)) : n instanceof Element ? [n] : Array.from(n as ArrayLike<Element>).filter((e) => e instanceof Element);

function groupByLine(words: HTMLElement[]): HTMLElement[][] {
  const rows: { top: number; left: number; words: HTMLElement[] }[] = [];
  words.forEach((w) => {
    const r = w.getBoundingClientRect();
    let row = rows.find((x) => Math.abs(x.top - r.top) <= 2);
    if (!row) rows.push((row = { top: r.top, left: r.left, words: [] }));
    row.words.push(w);
  });
  return rows.sort((a, b) => (Math.abs(a.top - b.top) > 2 ? a.top - b.top : a.left - b.left)).map((r) => r.words);
}

export function createReveal(gsap: typeof Gsap) {
  const triggers = new Set<ST>();
  const originals = new Map<Element, string>();

  const prepareWords = (els: Els) => {
    const out: { container: Element; words: HTMLElement[] }[] = [];
    toArray(els).forEach((el) => {
      const host = el as HTMLElement;
      if (host.dataset.wordRevealPrepared === "1") {
        const words = Array.from(host.querySelectorAll<HTMLElement>(".word-reveal"));
        if (words.length) out.push({ container: el, words });
        return;
      }
      originals.set(el, el.innerHTML);
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
          if (!n.nodeValue || !/\S/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
          const p = n.parentElement;
          if (!p || p.closest(".word-reveal-wrap") || ["SCRIPT", "STYLE", "TEXTAREA"].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      const nodes: Node[] = [];
      for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
      nodes.forEach((node) => {
        const frag = document.createDocumentFragment();
        (node.nodeValue ?? "").split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) return void frag.appendChild(document.createTextNode(part));
          const wrap = document.createElement("span");
          wrap.className = "word-reveal-wrap";
          const inner = document.createElement("span");
          inner.className = "word-reveal";
          inner.textContent = part;
          wrap.appendChild(inner);
          frag.appendChild(wrap);
        });
        node.parentNode?.replaceChild(frag, node);
      });
      const words = Array.from(host.querySelectorAll<HTMLElement>(".word-reveal"));
      if (words.length) {
        host.dataset.wordRevealPrepared = "1";
        out.push({ container: el, words });
      }
    });
    return out;
  };

  function revealWords(o: {
    elements: Els;
    trigger?: Element | null;
    start?: string;
    duration?: number;
    delay?: number;
    lineStagger?: number;
    wordStagger?: number;
    ease?: string;
  }) {
    const { trigger = null, start = "top 90%", duration = 0.95, delay = 0, lineStagger = 0.055, wordStagger = 0.018, ease = "expo.out" } = o;
    prepareWords(o.elements).forEach(({ container, words }) => {
      const lines = groupByLine(words);
      gsap.set(words, { yPercent: 115, opacity: 0 });
      const tl = gsap.timeline({ scrollTrigger: { trigger: trigger || container, start, once: true } });
      lines.forEach((line, i) => tl.to(line, { yPercent: 0, opacity: 1, duration, stagger: wordStagger, ease }, delay + i * lineStagger));
      if (tl.scrollTrigger) triggers.add(tl.scrollTrigger);
    });
  }

  function revealBlocks(o: {
    elements: Els;
    start?: string;
    duration?: number;
    delay?: number;
    y?: number;
    ease?: string;
    fromVars?: gsap.TweenVars;
    toVars?: gsap.TweenVars;
  }) {
    const { start = "top 92%", duration = 1.05, delay = 0, y = 24, ease = "expo.out", fromVars = {}, toVars = {} } = o;
    toArray(o.elements).forEach((el) => {
      const tween = gsap.fromTo(
        el,
        { y, opacity: 0, ...fromVars },
        { y: 0, opacity: 1, duration, delay, ease, ...toVars, scrollTrigger: { trigger: el, start, once: true } }
      );
      if (tween.scrollTrigger) triggers.add(tween.scrollTrigger);
    });
  }

  function cleanup() {
    triggers.forEach((t) => t.kill());
    triggers.clear();
    originals.forEach((html, el) => {
      if (el.isConnected) {
        el.innerHTML = html;
        delete (el as HTMLElement).dataset.wordRevealPrepared;
      }
    });
    originals.clear();
  }

  return { revealWords, revealBlocks, cleanup };
}
