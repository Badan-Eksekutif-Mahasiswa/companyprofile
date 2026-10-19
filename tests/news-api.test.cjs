const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies, extra = {}) {
  const code = ts.transpileModule(readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, URL, console,
    process: { env: { SIT_API_URL: 'https://sit.example/api/website/v1/' } },
    require(name) { assert.ok(name in dependencies, `Unexpected dependency: ${name}`); return dependencies[name]; },
    ...extra });
  return exports;
}

function api(fetch) {
  return load('lib/news-api.ts', {
    '@/lib/news-parse': { estimateReadMinutes: () => 1 },
    '@/lib/news-html': { parseHtml: (text) => [{ type: 'p', text }] },
  }, { fetch });
}

test('article detail reads the encoded slug directly without persistent caching', async () => {
  const calls = [];
  const adapter = api(async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200, json: async () => ({ slug: 'article-one', title: 'Artikel terbit', body: 'Isi resmi' }) };
  });
  const article = await adapter.fetchSitArticle('article/one');
  assert.equal(calls[0].url, 'https://sit.example/api/website/v1/articles/article%2Fone/');
  assert.equal(calls[0].options.cache, 'no-store');
  assert.equal(article.judul, 'Artikel terbit');
  assert.equal(article.body[0].text, 'Isi resmi');
});

test('only a detail 404 is missing; API and network failures remain retryable errors', async () => {
  assert.equal(await api(async () => ({ status: 404, ok: false })).fetchSitArticle('missing'), undefined);
  for (const status of [401, 429, 500, 503]) {
    await assert.rejects(api(async () => ({ status, ok: false })).fetchSitArticle('live'), new RegExp(String(status)));
  }
  await assert.rejects(api(async () => { throw new Error('offline'); }).fetchSitArticle('live'), /offline/);
});

function newsData(sit, detail, demo = []) {
  return load('lib/news-data.ts', {
    '@/lib/supabase/server': { isSupabaseConfigured: () => false },
    '@/lib/news-api': { isSitConfigured: () => sit, fetchSitArticle: detail,
      fetchSitArticles: () => { throw new Error('Detail must not depend on the news list'); } },
    '@/lib/media': {}, '@/lib/news': {}, '@/lib/news-parse': {},
    '@/lib/demo-data': { readDemoJson: () => demo },
  });
}

test('CMS detail never searches a cached or failed list or falls back to dummy content', async () => {
  const article = { slug: 'new', judul: 'Baru terbit' };
  assert.equal(await newsData(true, async (slug) => slug === 'new' ? article : undefined).getNewsBySlug('new'), article);
  assert.equal(await newsData(true, async () => undefined, [article]).getNewsBySlug('new'), undefined);
  await assert.rejects(newsData(true, async () => { throw new Error('unavailable'); }).getNewsBySlug('new'), /unavailable/);
  assert.equal(await newsData(false, undefined, [article]).getNewsBySlug('new'), article);
});
