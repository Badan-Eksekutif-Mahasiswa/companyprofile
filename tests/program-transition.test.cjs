const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function setup(reduced = false) {
  const elements = [];
  const timers = new Set();
  const events = new Map();
  const timelines = [];
  const body = { appendChild: (element) => elements.push(element) };
  const createElement = () => ({ dataset: {}, style: {}, children: [], setAttribute() {},
    append(...children) { this.children.push(...children); },
    remove() { elements.splice(elements.indexOf(this), 1); } });
  const gsap = { timeline() {
    const timeline = { steps: [], killed: false,
      to(target, options) { this.steps.push({ target, options }); return this; },
      call(callback) { this.steps.push({ callback }); return this; },
      kill() { this.killed = true; } };
    timelines.push(timeline);
    return timeline;
  } };
  const exports = {};
  const code = ts.transpileModule(readFileSync(path.join(__dirname, '../lib/program-transition.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, require: () => ({ gsap }), document: { body, createElement },
    window: { matchMedia: () => ({ matches: reduced }),
      addEventListener: (name, callback) => events.set(name, callback),
      removeEventListener: (name) => events.delete(name) },
    setTimeout: (callback) => { timers.add(callback); return callback; },
    clearTimeout: (callback) => timers.delete(callback) });
  const source = { currentSrc: '/poster.png', src: '/fallback.png',
    getBoundingClientRect: () => ({ left: 20, top: 300, width: 180, height: 240 }) };
  const panel = { getBoundingClientRect: () => ({ left: 500, top: 120, width: 300, height: 400 }) };
  return { ...exports, elements, timers, events, timelines, source, panel };
}

test('poster persists across navigation until the matching detail is ready, then lands and cleans up', () => {
  const state = setup();
  let navigations = 0;
  state.beginProgramTransition('one', state.source, () => navigations++);
  state.beginProgramTransition('two', state.source, () => navigations++);
  assert.equal(state.elements.length, 1);
  const timeline = state.timelines[0];
  const layer = state.elements[0];
  assert.equal(layer.dataset.programTransition, 'one');
  assert.equal(layer.children[1].src, '/poster.png');
  assert.match(layer.children[1].style.cssText, /left:20px;top:300px;width:180px;height:240px/);
  assert.equal(navigations, 0);
  timeline.steps[1].callback();
  assert.equal(navigations, 1);
  state.finishProgramTransition('two', state.panel);
  assert.equal(timeline.steps.length, 2);
  state.finishProgramTransition('one', state.panel);
  state.finishProgramTransition('one', state.panel);
  assert.equal(timeline.steps.length, 5);
  assert.equal(timeline.steps[2].options.left, 500);
  assert.equal(timeline.steps[2].options.height, 400);
  assert.ok(timeline.steps[2].options.duration > 0);
  timeline.steps[4].callback();
  assert.equal(state.elements.length, 0);
  assert.equal(state.timers.size, 0);
  assert.equal(state.events.size, 0);
});

test('reduced motion skips spatial animation, and back, timeout or navigation failure remove the cover', () => {
  for (const cancelBy of ['back', 'timeout', 'failure', 'complete']) {
    const state = setup(true);
    state.beginProgramTransition('one', state.source, () => { if (cancelBy === 'failure') throw new Error('offline'); });
    const timeline = state.timelines[0];
    assert.equal(timeline.steps[0].options.duration, 0);
    if (cancelBy === 'back') state.events.get('popstate')();
    if (cancelBy === 'timeout') [...state.timers][0]();
    if (cancelBy === 'failure') timeline.steps[1].callback();
    if (cancelBy === 'complete') {
      timeline.steps[1].callback();
      state.finishProgramTransition('one', state.panel);
      assert.equal(timeline.steps[2].options.duration, 0);
      assert.equal(timeline.steps[3].options.duration, 0);
      timeline.steps[4].callback();
    }
    assert.equal(state.elements.length, 0);
    assert.equal(state.timers.size, 0);
    assert.equal(state.events.size, 0);
    assert.equal(timeline.killed, true);
  }
});
