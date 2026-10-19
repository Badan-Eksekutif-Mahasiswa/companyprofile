const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { setTimeout: delay } = require('node:timers/promises');
const { chromium } = require('playwright');

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server.address().port;
}

async function main() {
  let published = false;
  let unavailable = false;
  const article = { slug: 'artikel-baru-dari-sit', title: 'Artikel Baru dari SIT', category: 'news',
    summary: 'Ringkasan artikel terbit', body: '<p>Isi pertama artikel baru.</p>',
    cover: { url: '/images/logo-bem-ui.png' }, tags: [], attachments: [], references: [],
    author: { display: 'Biro Uji' }, published_at: '2026-10-19T08:00:00Z' };
  const requests = [];
  const api = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    requests.push(url.pathname);
    let status = 200;
    let data;
    if (url.pathname === '/api/website/v1/articles/') data = { results: published ? [article] : [], pages: 1 };
    else if (url.pathname === `/api/website/v1/articles/${article.slug}/` && unavailable) {
      status = 503;
      data = { detail: 'private-database-framework-error' };
    } else if (url.pathname === `/api/website/v1/articles/${article.slug}/` && published) data = article;
    else { status = 404; data = { detail: 'Not found' }; }
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' });
    res.end(JSON.stringify(data));
  });
  const apiPort = await listen(api);
  const reserve = http.createServer();
  const port = await listen(reserve);
  await new Promise((resolve) => reserve.close(resolve));
  const base = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [path.join(__dirname, '../node_modules/next/dist/bin/next'),
    'start', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'production', SIT_API_URL: `http://127.0.0.1:${apiPort}/api/website/v1`,
      ENABLE_DEMO_DATA: 'false', NEXT_PUBLIC_SUPABASE_URL: '', NEXT_PUBLIC_SUPABASE_ANON_KEY: '', NEXT_TELEMETRY_DISABLED: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  child.stdout.on('data', (data) => { logs += data; });
  child.stderr.on('data', (data) => { logs += data; });
  let browser;
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw new Error(logs);
      try { ready = (await fetch(base + '/api/health')).ok; } catch {}
      if (ready) break;
      await delay(200);
    }
    assert.ok(ready, logs);
    const detail = `${base}/news/${article.slug}`;
    const missing = await fetch(detail);
    assert.equal(missing.status, 404);
    published = true;
    assert.ok((await (await fetch(base + '/news')).text()).includes(article.title));
    const fresh = await fetch(detail);
    const html = await fresh.text();
    assert.equal(fresh.status, 200, 'A just-published article must be readable immediately after appearing in the list');
    assert.equal(html.match(/<h1[^>]*>(.*?)<\/h1>/s)?.[1], article.title);
    assert.ok(html.includes('Isi pertama artikel baru.'));
    console.log('PASS publication after an earlier 404 opens immediately from the fresh news list');
    article.body = '<p>Isi artikel yang telah diperbarui.</p>';
    assert.ok((await (await fetch(detail)).text()).includes('Isi artikel yang telah diperbarui.'));
    assert.ok(requests.includes(`/api/website/v1/articles/${article.slug}/`), 'Detail must use its own API endpoint');
    console.log('PASS article detail uses its own endpoint and does not retain outdated content');

    browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
    const page = await browser.newPage();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + '/news');
      await page.getByRole('link', { name: article.title, exact: true }).click();
      await page.waitForURL(detail);
      await page.getByRole('heading', { name: article.title, exact: true }).waitFor();
      await page.getByText('Isi artikel yang telah diperbarui.', { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      if (process.env.SIT_UI_SCREENSHOT_DIR) {
        await page.screenshot({ path: path.join(process.env.SIT_UI_SCREENSHOT_DIR, `companyprofile-news-detail-${width}.png`) });
      }
      console.log('PASS click from news list renders published article', width);
    }
    unavailable = true;
    await page.goto(detail);
    await page.getByRole('heading', { name: 'Artikel belum dapat dimuat', exact: true }).waitFor();
    const message = await page.locator('#main').innerText();
    assert.doesNotMatch(message, /private-database|framework|API SIT|Supabase|Artikel tidak ditemukan/i);
    unavailable = false;
    await page.getByRole('button', { name: 'Coba lagi', exact: true }).click();
    await page.getByRole('heading', { name: article.title, exact: true }).waitFor();
    await page.goto(base + '/news/artikel-tidak-ada');
    await page.getByRole('heading', { name: 'Artikel tidak ditemukan', exact: true }).waitFor();
    console.log('PASS temporary failures are not false 404s, safe retry works, missing articles remain 404');
  } catch (error) {
    console.error(logs);
    throw error;
  } finally {
    await browser?.close();
    child.kill();
    if (child.exitCode === null) await once(child, 'exit');
    await new Promise((resolve) => api.close(resolve));
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
