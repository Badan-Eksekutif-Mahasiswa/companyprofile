const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');

test('cabinet hero shows one hashtag heading without year badge or Kabinet prefix', () => {
  const source = readFileSync(path.join(__dirname, '../components/kabinet-list/KabinetHero.tsx'), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const exports = {};
  vm.runInNewContext(outputText, { exports, require(name) {
    if (name === '@/components/webgl') return { MeshGradient: () => null };
    if (name === './Reveal') return { Reveal: ({ as = 'div', children }) => React.createElement(as, null, children) };
    return require(name);
  } });
  for (const nama of ['Kabinet Terus Terang', 'Terus Terang', '#TerusTerang']) {
    const html = renderToStaticMarkup(React.createElement(exports.KabinetHero, {
      kabinet: { nama, periode: 'BEM UI 2026', visi: 'Visi resmi', deskripsi: 'Deskripsi' },
    }));
    assert.match(html, /<h1[^>]*><span>#TerusTerang<\/span><\/h1>/);
    assert.doesNotMatch(html, /Kabinet|BEM UI 2026/);
    assert.match(html, /Visi resmi/);
  }
});

test('initial cabinet has official vision and three missions, leaving only description and quotes pending', () => {
  const initial = JSON.parse(readFileSync(path.join(__dirname, 'fixtures/cabinet-initial.json'), 'utf8'));
  assert.equal(initial.nama, '#TerusTerang');
  assert.equal(initial.misi.length, 3);
  assert.match(initial.visi, /^Terwujudnya gerakan mahasiswa yang konvergen/);
  assert.equal(initial.ketua.fakultas, 'FEB 2022');
  assert.equal(initial.wakil.fakultas, 'FK 2023');
  assert.match(initial.deskripsi, /akan diperbarui/);
  assert.match(initial.ketua.kutipan, /akan diperbarui/);
  assert.match(initial.wakil.kutipan, /akan diperbarui/);
});
