const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const React = require("react");
const ts = require("typescript");

function video() {
  const state = [];
  let cursor = 0;
  const exports = {};
  const source = readFileSync(path.join(__dirname, "../components/home/VideoSection.tsx"), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  vm.runInNewContext(outputText, { exports, require(name) {
    if (name === "react") return { useState(initial) {
      const slot = cursor++;
      if (!(slot in state)) state[slot] = initial;
      return [state[slot], (value) => { state[slot] = typeof value === "function" ? value(state[slot]) : value; }];
    } };
    if (name === "@/config/site") return { SITE: { social: { youtube: "https://youtube.com/@BEMUI" } }, YOUTUBE_VIDEO_ID: "test-video" };
    if (name === "@/components/ui") return { buttonVariants: () => "" };
    if (name === "@/lib/utils") return { cn: () => "" };
    if (name === "./SectionHeading") return { SectionHeading: () => null };
    return require(name);
  } });
  function find(node, type) {
    if (!React.isValidElement(node)) return null;
    if (node.type === type) return node;
    return React.Children.toArray(node.props.children).map((child) => find(child, type)).find(Boolean);
  }
  return (type) => { cursor = 0; return find(exports.VideoSection(), type); };
}

test("video thumbnail starts at maximum quality and is not faded", () => {
  const render = video();
  const image = render("img");
  assert.match(image.props.src, /\/maxresdefault\.jpg$/);
  assert.doesNotMatch(image.props.className, /opacity-|blur/);
  image.props.onLoad({ currentTarget: { naturalWidth: 1280 } });
  assert.equal(render("img").props.src, image.props.src);
  assert.equal(render("iframe"), undefined);
  render("button").props.onClick();
  assert.match(render("iframe").props.src, /youtube-nocookie\.com\/embed\/test-video\?autoplay=1/);
});

test("missing thumbnails and YouTube placeholders fall back without looping", () => {
  const render = video();
  render("img").props.onError();
  assert.match(render("img").props.src, /\/sddefault\.jpg$/);
  render("img").props.onLoad({ currentTarget: { naturalWidth: 120 } });
  assert.match(render("img").props.src, /\/hqdefault\.jpg$/);
  render("img").props.onError();
  assert.match(render("img").props.src, /\/hqdefault\.jpg$/);
});
