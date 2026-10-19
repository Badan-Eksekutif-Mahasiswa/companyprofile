import type { createReveal } from "./gsap-reveal";

export function revealProjectText(root: HTMLElement, reveal: ReturnType<typeof createReveal>, heroDelay = 0.5) {
  const q = (selector: string) => Array.from(root.querySelectorAll(selector));
  const timing = { duration: 1.05, lineStagger: 0.085, wordStagger: 0, ease: "expo.out" };
  reveal.revealWords({ elements: q(".hero__title"), trigger: root.querySelector(".hero__row"),
    start: "top bottom", delay: heroDelay, ...timing });
  reveal.revealWords({ elements: q(".hero__year"), start: "top bottom", delay: heroDelay, ...timing });
  reveal.revealWords({ elements: q([
    ".info__label",
    ".info__roles-list li",
    ".description .rich-text p",
    ".section__subtitle",
    ".section--text .rich-text p",
    ".media-caption .label_info",
    ".media-caption p",
    ".person-card figcaption > div",
    ".proker-row button > span",
    ".proker-row > span > span",
    ".next__title",
    ".next__right .label_info",
  ].join(", ")), start: "top 92%", ...timing });
  // Keep character-roll hover behavior and numbered mission markers intact.
  reveal.revealBlocks({ elements: q(".info__category, .misi-list li"), start: "top 92%", duration: timing.duration,
    ease: timing.ease, y: 24, fromVars: { opacity: 1, clipPath: "inset(0 0 100% 0)" },
    toVars: { opacity: 1, clipPath: "inset(0 0 0% 0)" } });
  q(".hero--reveal-pending, .project--reveal-pending").forEach((element) => {
    element.classList.remove("hero--reveal-pending", "project--reveal-pending");
  });
}
