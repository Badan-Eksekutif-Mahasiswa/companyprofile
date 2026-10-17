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
