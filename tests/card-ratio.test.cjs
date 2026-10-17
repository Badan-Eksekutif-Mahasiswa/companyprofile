const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");
const postcss = require("postcss");

const read = (file) => readFileSync(path.join(__dirname, "..", file), "utf8");
const source = (file) => ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

test("orbit geometry and texture atlas use the same 3:4 portrait ratio", () => {
  const scene = source("components/home/orbit/scene.ts");
  const declarations = [];
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ["CARD_H", "CARD_W", "cw", "ch"].includes(node.name.getText(scene)))
      declarations.push(`const ${node.getText(scene)};`);
    ts.forEachChild(node, visit);
  }
  visit(scene);
  assert.equal(declarations.length, 4);
  const geometry = vm.runInNewContext(declarations.join("\n") + "\n({card: CARD_W / CARD_H, atlas: cw / ch})");
  assert.equal(geometry.card, 3 / 4);
  assert.equal(geometry.atlas, 3 / 4);
});

test("CSS main and next cards have the same 3:4 aspect ratio", () => {
  const ratios = [];
  postcss.parse(read("components/kabinet/project.css")).walkDecls("aspect-ratio", (decl) => {
    if ([".kd .hero__panel", ".kd .next__panel"].includes(decl.parent.selector)) ratios.push(decl.value);
  });
  assert.deepEqual(ratios, ["3 / 4", "3 / 4"]);
});

test("flying card target stays 3:4 and fits the available desktop height", () => {
  const file = source("components/home/detail/HeroDetail.tsx");
  const fn = file.statements.find((node) => ts.isFunctionDeclaration(node) && node.name.text === "heroPanelRect");
  assert.ok(fn);
  const { outputText } = ts.transpileModule(fn.getText(file), { compilerOptions: { target: ts.ScriptTarget.ES2022 } });
  for (const [innerWidth, innerHeight] of [[1920, 1080], [1440, 900], [1366, 768], [1024, 600]]) {
    const rect = vm.runInNewContext(outputText + "\nheroPanelRect()", { window: { innerWidth, innerHeight } });
    assert.ok(Math.abs(rect.width / rect.height - 3 / 4) < 1e-12);
    assert.ok(rect.height <= innerHeight - 168 + 1e-9);
    assert.ok(rect.top >= 112);
    assert.ok(rect.top + rect.height <= innerHeight - 32 + 1e-9);
  }
});
