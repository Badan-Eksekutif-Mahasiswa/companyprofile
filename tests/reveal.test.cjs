const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

test('word and block movement follows scroll direction and cleans up triggers and animations', () => {
  const source = readFileSync(path.join(__dirname, '../lib/gsap-reveal.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  class Element {
    dataset = { wordRevealPrepared: '1' };
    getBoundingClientRect() { return { top: 0, left: 0 }; }
    querySelectorAll() { return [new Element()]; }
  }
  const exports = {};
  const settings = [];
  let killed = 0, killedAnimations = 0;
  const fromValues = [];
  vm.runInNewContext(outputText, { exports, Element, require(name) {
    assert.equal(name, 'gsap/ScrollTrigger');
    return { ScrollTrigger: { create(config) { settings.push(config); return { kill() { killed++; } }; } } };
  } });
  const animation = () => ({
    fromTo(_element, from) { fromValues.push(from); return this; },
    invalidate() { return this; }, restart(includeDelay) { assert.equal(includeDelay, true); return this; }, kill() { killedAnimations++; },
  });
  const reveal = exports.createReveal({
    set() {},
    timeline() { return animation(); },
    fromTo(_element, from) { fromValues.push(from); return animation(); },
  });
  const element = new Element();
  reveal.revealWords({ elements: element });
  reveal.revealBlocks({ elements: element, fromVars: { clipPath: 'inset(0 0 100% 0)' } });
  assert.equal(settings.length, 2);
  for (const config of settings) {
    assert.equal(config.once, false);
    assert.equal(config.end, 'bottom top');
    assert.equal(config.trigger, element);
  }
  settings.forEach((config) => config.onEnter());
  assert.equal(fromValues[0].yPercent(), -115);
  assert.equal(fromValues[1].y(), -24);
  assert.equal(fromValues[1].clipPath(), 'inset(0 0 100% 0)');
  settings.forEach((config) => config.onEnterBack());
  assert.equal(fromValues[0].yPercent(), 115);
  assert.equal(fromValues[1].y(), 24);
  assert.equal(fromValues[1].clipPath(), 'inset(100% 0 0 0)');
  reveal.cleanup();
  assert.equal(killed, 2);
  assert.equal(killedAnimations, 2);
});

test('both detail views share complete text coverage and one timing configuration', () => {
  for (const file of ['components/kabinet/ProjectPage.tsx', 'components/home/detail/DetailViews.tsx']) {
    const source = readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.match(source, /revealProjectText\(el, reveal/);
    assert.doesNotMatch(source, /const (infoBits|textBits) =/);
  }
  const source = readFileSync(path.join(__dirname, '../lib/project-text-reveal.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, { exports });
  const queries = [];
  const calls = [];
  exports.revealProjectText({
    querySelectorAll(selector) { queries.push(selector); return []; }, querySelector() { return null; },
  }, { revealWords(options) { calls.push(options); }, revealBlocks(options) { calls.push(options); } });
  for (const selector of ['.section__subtitle', '.media-caption p', '.person-card figcaption > div',
    '.proker-row button > span', '.next__title', '.misi-list li']) {
    assert.ok(queries.some((query) => query.includes(selector)), selector);
  }
  assert.ok(calls.every((options) => options.duration === 1.05 && options.ease === 'expo.out'));
});
