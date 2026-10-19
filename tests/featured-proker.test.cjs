const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function sampler(random = Math.random) {
  const { outputText } = ts.transpileModule(readFileSync(path.join(__dirname, "../lib/data.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, { exports, Math: Object.assign(Object.create(Math), { random }),
    require: () => ({}) });
  return (items, limit) => Array.from(exports.pickFeaturedProker(items, limit));
}

const program = (slug, unit = "one") => ({ slug, foto_url: `/${slug}.png`, unit: { slug: unit } });

test("orbit samples from all units without mutating inputs or duplicating programs", () => {
  const first = program("a");
  const second = program("b", "two");
  const third = program("c", "three");
  const input = Object.freeze([first, second, third, first, { ...program("no-photo"), foto_url: "" }]);
  const select = sampler(() => 0.99);
  assert.deepEqual(select(input, 2).map((item) => item.slug), ["c", "a"]);
  assert.equal(select(input, 20).length, 3);
  assert.equal(new Set(select(input, 20).map((item) => item.slug)).size, 3);
  assert.deepEqual(select([], 20), []);
  for (const limit of [0, -1, NaN, Infinity]) assert.deepEqual(select(input, limit), []);
  assert.equal(select(input, 1.9).length, 1);
  assert.equal(input[0], first);
});

test("every ordered sample has the same probability regardless of unit order", () => {
  const items = [program("a"), program("b"), program("c", "two")];
  const results = new Set();
  for (let first = 0; first < 3; first++) for (let second = 0; second < 2; second++) {
    const draws = [(first + 0.5) / 3, (second + 0.5) / 2];
    const select = sampler(() => draws.shift());
    results.add(select(items, 2).map((item) => item.slug).join(","));
  }
  assert.equal(results.size, 6);
});
