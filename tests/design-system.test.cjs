const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { clsx } = require("clsx");
const { twMerge } = require("tailwind-merge");
const postcss = require("postcss");
const ts = require("typescript");

function navbar(currentPath) {
  const source = readFileSync(path.join(__dirname, "../components/ui/navbar.tsx"), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  const exports = {};
  vm.runInNewContext(outputText, { exports, require(name) {
    if (name === "next/link") return ({ href, children, ...props }) => React.createElement("a", { href, ...props }, children);
    if (name === "next/navigation") return { usePathname: () => currentPath };
    if (name === "@/lib/utils") return { cn: (...inputs) => twMerge(clsx(inputs)) };
    return require(name);
  } });
  return renderToStaticMarkup(React.createElement(exports.Navbar, {
    links: [{ label: "Beranda", href: "/" }, { label: "Kabinet", href: "/kabinet" }, { label: "News", href: "/news" }],
  }));
}

test("navbar retains original glass recipe without scroll scaling or sliding underline", () => {
  const html = navbar("/");
  for (const token of ["max-w-[880px]", "rounded-full", "bg-glass-strong", "shadow-glass-soft", "backdrop-blur-glass"])
    assert.ok(html.includes(token), token);
  assert.ok(!html.includes("data-compact"));
  assert.ok(!html.includes("transition-[left,width,opacity]"));
  assert.ok(!html.includes("font-size"));
});

test("navbar still marks exact and nested active routes accessibly", () => {
  assert.match(navbar("/"), /href="\/" aria-current="page"/);
  assert.match(navbar("/kabinet/multimedia"), /href="\/kabinet" aria-current="page"/);
  assert.match(navbar("/news/berita"), /href="\/news" aria-current="page"/);
  assert.equal((navbar("/news").match(/aria-current="page"/g) || []).length, 1);
});

test("body and detail headings use shared design-system typography tokens", () => {
  const read = (file) => readFileSync(path.join(__dirname, "..", file), "utf8");
  const css = postcss.parse(read("app/globals.css"));
  const values = {};
  css.walkDecls((decl) => {
    if (decl.parent.selector === ":root" || decl.parent.selector === "body") values[decl.prop] = decl.value;
  });
  assert.equal(values["--font-body-size"], "15px");
  assert.equal(values["--font-body-weight"], "500");
  assert.equal(values["--font-heading-weight"], "700");
  assert.equal(values["font-size"], "var(--font-body-size)");
  assert.equal(values["font-weight"], "var(--font-body-weight)");
  assert.ok(read("app/layout.tsx").includes("Plus_Jakarta_Sans"));
  assert.ok(read("tailwind.config.ts").includes("var(--font-jakarta)"));
  const detail = postcss.parse(read("components/kabinet/project.css"));
  let checked = 0;
  detail.walkRules((rule) => {
    if (rule.selector.includes(".project h1") || rule.selector === ".kd .hero__title") {
      const weight = rule.nodes.find((node) => node.prop === "font-weight");
      if (weight) {
        assert.equal(weight.value, "var(--font-heading-weight)");
        checked++;
      }
    }
  });
  assert.equal(checked, 2);
});

test("BPH uses a centered wrapping layout without changing staff grids", () => {
  const read = (file) => readFileSync(path.join(__dirname, "..", file), "utf8");
  const css = postcss.parse(read("components/kabinet/project.css"));
  const centered = {};
  css.walkRules(".kd .team__grid--centered", (rule) => {
    rule.walkDecls((decl) => { centered[decl.prop] = decl.value; });
  });
  assert.equal(centered.display, "flex");
  assert.equal(centered["flex-wrap"], "wrap");
  assert.equal(centered["justify-content"], "center");
  const page = read("components/kabinet/ProjectPage.tsx");
  assert.match(page, /title="BPH" people=\{divisi.bph\} centered/);
  assert.match(page, /title="Staf" people=\{divisi.staff\} \/>/);
  assert.doesNotMatch(read("components/kabinet-list/DivisiGrid.tsx"), /Arahkan kursor|divisi yang bekerja bersama/);
});

test('birdep details use only the unit name and an unclipped, spacious info grid', () => {
  const read = (file) => readFileSync(path.join(__dirname, '..', file), 'utf8');
  for (const file of ['components/kabinet/ProjectPage.tsx', 'components/home/detail/DetailViews.tsx']) {
    assert.match(read(file), /className="hero__title hero--reveal-pending">\{divisi.nama\}/);
    assert.doesNotMatch(read(file), /className="hero__title hero--reveal-pending">\{divisi.title\}/);
    assert.match(read(file), /<WordRoll text=\{c.name\} \/>/);
  }
  const rules = {};
  postcss.parse(read('components/kabinet/project.css')).walkRules((rule) => {
    if (rule.parent.type !== 'root') return;
    const values = {};
    rule.walkDecls((declaration) => { values[declaration.prop] = declaration.value; });
    rules[rule.selector] = { ...rules[rule.selector], ...values };
  });
  assert.equal(rules['.kd .info__right']['grid-column'], '7 / -1');
  assert.equal(rules['.kd .description .rich-text']['line-height'], '1.5');
  assert.equal(rules['.kd .project p, .kd .rich-text, .kd .info__roles-list']['text-align'], 'justify');
  assert.equal(rules['.kd .project p, .kd .rich-text, .kd .info__roles-list']['text-align-last'], 'start');
  assert.equal(rules['.kd']['--detail-body'], '16px');
  assert.equal(rules['.kd']['--detail-description'], '18px');
  assert.equal(rules['.kd .kd-wordroll']['flex-wrap'], 'wrap');
  assert.equal(rules['.kd .kd-wordroll > .kd-charroll']['max-width'], '100%');
  assert.equal(rules['.kd .kd-wordroll > .kd-charroll']['flex-wrap'], 'wrap');
  assert.equal(rules['.kd .info__categories .info__category']['max-width'], '100%');
  assert.equal(rules['.kd .section--text > .rich-text']['grid-column'], '7 / -1');
  assert.equal(rules['.kd .section--text .section__subtitle']['font-size'], '14px');
  assert.equal(rules['.kd .misi-list li']['margin-bottom'], '20px');
});

test('program documentation uses landscape 16:9 without changing portrait covers', () => {
  const page = readFileSync(path.join(__dirname, '../components/home/detail/DetailViews.tsx'), 'utf8');
  const gallery = readFileSync(path.join(__dirname, '../components/home/detail/ProgramGallery.tsx'), 'utf8');
  assert.match(page, /<ProgramGallery photos=\{item.dokumentasi\}/);
  assert.doesNotMatch(page, /dokumentasi\.slice/);
  assert.match(gallery, /className="program-documentation" data-program-documentation/);
  assert.doesNotMatch(gallery, />Dokumentasi|Dokumentasi \d/);
  assert.match(gallery, /photos\.map/);
  assert.doesNotMatch(page, /aspect-\[4\/3\]/);
  const css = postcss.parse(readFileSync(path.join(__dirname, '../components/kabinet/project.css'), 'utf8'));
  const rules = {};
  css.walkRules((rule) => {
    if (rule.parent.type !== 'root') return;
    const values = {};
    rule.walkDecls((decl) => { values[decl.prop] = decl.value; });
    rules[rule.selector] = { ...rules[rule.selector], ...values };
  });
  assert.equal(rules['.kd .program-documentation']['aspect-ratio'], '16 / 9');
  assert.equal(rules['.kd .program-gallery__track']['overflow-x'], 'auto');
  assert.equal(rules['.kd .program-gallery__track']['scroll-snap-type'], 'x mandatory');
  assert.equal(rules['.kd .program-documentation > .media-item__inner']['position'], 'absolute');
  assert.equal(rules['.kd .program-documentation > .media-item__inner']['height'], '100%');
  let coverRatio;
  css.walkRules('.kd .hero__panel', (rule) => {
    rule.walkDecls('aspect-ratio', (declaration) => { coverRatio = declaration.value; });
  });
  assert.equal(coverRatio, '3 / 4');
});
