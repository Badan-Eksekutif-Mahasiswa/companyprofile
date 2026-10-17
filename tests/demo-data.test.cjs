const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function reader(env, exists = true) {
  let reads = 0;
  const exports = {};
  const { outputText } = ts.transpileModule(readFileSync(path.join(__dirname, "../lib/demo-data.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  });
  vm.runInNewContext(outputText, { exports, process: { env, cwd: () => "/workspace" }, require(name) {
    if (name === "server-only") return {};
    if (name === "node:fs") return { existsSync: () => exists, readFileSync: () => { reads++; return '{"example":true}'; } };
    return require(name);
  } });
  return { read: exports.readDemoJson, reads: () => reads };
}

test("production cannot read demo fixtures even when explicitly enabled", () => {
  const fixture = reader({ NODE_ENV: "production", ENABLE_DEMO_DATA: "true" });
  assert.equal(fixture.read("kabinet.json"), undefined);
  assert.equal(fixture.reads(), 0);
});

test("demo fixtures are optional and confined to local development", () => {
  const fixture = reader({ NODE_ENV: "development" });
  assert.equal(fixture.read("kabinet.json").example, true);
  assert.equal(reader({ NODE_ENV: "development", ENABLE_DEMO_DATA: "false" }).read("kabinet.json"), undefined);
  assert.equal(reader({ NODE_ENV: "development" }, false).read("kabinet.json"), undefined);
});
