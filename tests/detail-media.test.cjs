const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');

for (const [file, props] of [
  ['components/kabinet/ProjectPage.tsx', { media: { url: 'https://images.example/group.png', alt: 'Foto bersama' } }],
  ['components/home/detail/DetailViews.tsx', { src: 'https://images.example/group.png', alt: 'Foto bersama' }],
]) {
  test(`${file} keeps native media visible without requiring object-storage CORS`, () => {
    const source = readFileSync(path.join(__dirname, '..', file), 'utf8') + '\nexport { MediaAsset };';
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    });
    const exports = {};
    vm.runInNewContext(outputText, { exports, require(name) {
      if (name === 'react' || name === 'react/jsx-runtime') return require(name);
      if (name.endsWith('shell-context')) return { useShell: () => ({ distort: null }) };
      return {};
    } });
    const html = renderToStaticMarkup(React.createElement(exports.MediaAsset, props));
    assert.match(html, /<img[^>]*src="https:\/\/images.example\/group.png"/);
    assert.match(html, /alt="Foto bersama"/);
    assert.doesNotMatch(html, /crossorigin=/i);
  });
}
