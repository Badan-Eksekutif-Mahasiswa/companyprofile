const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function textureSource(getImageProps) {
  const source = readFileSync(path.join(__dirname, '../lib/media-texture.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, { exports, URL, require(name) {
    assert.equal(name, 'next/image');
    return { getImageProps };
  } });
  return exports.mediaTextureSource;
}

test('local dummy and same-origin photos retain their existing WebGL URLs', () => {
  const source = textureSource(() => assert.fail('Local images need no proxy'));
  for (const url of ['/api/placeholder?label=PHOTO', '/images/photo.png', 'https://site.example/photo.png'])
    assert.equal(source(url, 'https://site.example'), url);
});

test('remote photo textures use the allowlisted Next image optimizer without changing native URLs', () => {
  const remote = 'https://sit.example/api/website/v1/media/photo/';
  const source = textureSource((props) => {
    assert.equal(props.src, remote);
    assert.equal(props.quality, 88);
    assert.equal(props.width, 1024);
    return { props: { src: '/_next/image?url=PHOTO&w=2048&q=88' } };
  });
  assert.equal(source(remote, 'https://site.example'), '/_next/image?url=PHOTO&w=2048&q=88');
});

test('unsupported or rejected texture sources keep the native fallback available', () => {
  const source = textureSource(() => { throw new Error('Not allowlisted'); });
  for (const url of ['javascript:alert(1)', 'file:///private/image.png', 'https://other.example/image.png'])
    assert.equal(source(url, 'https://site.example'), null);
});

test('image optimization is restricted to the configured SIT media path, not an arbitrary remote proxy', async () => {
  const previous = { sit: process.env.SIT_API_URL, r2: process.env.NEXT_PUBLIC_R2_PUBLIC_URL };
  process.env.SIT_API_URL = 'https://cms.example/api/website/v1/';
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL = '';
  try {
    const config = await import(pathToFileURL(path.join(__dirname, '../next.config.mjs')).href + '?media-test');
    assert.deepEqual(config.default.images.remotePatterns, [{ protocol: 'https', hostname: 'cms.example',
      port: '', pathname: '/api/website/v1/media/**' }]);
  } finally {
    for (const [key, value] of [['SIT_API_URL', previous.sit], ['NEXT_PUBLIC_R2_PUBLIC_URL', previous.r2]]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
