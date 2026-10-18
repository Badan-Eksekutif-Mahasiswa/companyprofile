const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs/promises');
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
  const bytes = await fs.readFile(path.join(__dirname, '../public/images/kabinet/kabem/yatalathof-01.png'));
  const storage = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(bytes);
  });
  const storagePort = await listen(storage);
  const localPhoto = '/images/kabinet/kabem/yatalathof-01.png';
  let apiPort;
  const unit = (slug, photo) => ({ id: slug === 'unit-remote' ? 1 : 2, cabinet_id: 1,
    slug, name: slug, kind: 'biro', group: 'internal', group_label: 'Bidang Internal',
    summary: '', description: 'Deskripsi unit', vision: 'Visi', missions: ['Misi'],
    cover_photo: { url: photo }, main_photo: { url: photo }, leaders: [], staff: [], programs: [] });
  const api = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/media/remote') {
      res.writeHead(302, { Location: `http://127.0.0.1:${storagePort}/image.png`, 'Access-Control-Allow-Origin': '*' });
      return res.end();
    }
    const remote = `http://127.0.0.1:${apiPort}/media/remote`;
    const cabinet = { id: 1, name: '#TerusTerang', description: 'Deskripsi kabinet', vision: 'Visi', missions: ['Misi'],
      leaders: [], main_photo: null, units: [unit('unit-remote', remote), unit('unit-webgl', localPhoto)],
      statistics: { units: 2, programs: 0, people: 0 } };
    const data = url.pathname.endsWith('/cabinets/1/') ? cabinet :
      url.pathname.endsWith('/cabinets/') ? { results: [{ id: 1 }] } : { results: [], pages: 1 };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  });
  apiPort = await listen(api);
  const reserve = http.createServer();
  const port = await listen(reserve);
  await new Promise((resolve) => reserve.close(resolve));
  const child = spawn(process.execPath, [path.join(__dirname, '../node_modules/next/dist/bin/next'),
    'start', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: path.join(__dirname, '..'), env: { ...process.env, NODE_ENV: 'production',
      SIT_API_URL: `http://127.0.0.1:${apiPort}/api/website/v1`, NEXT_PUBLIC_SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '', NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  child.stdout.on('data', (data) => { logs += data; });
  child.stderr.on('data', (data) => { logs += data; });
  let browser;
  try {
    const base = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw new Error(logs);
      try { ready = (await fetch(base + '/api/health')).ok; } catch { /* Wait for startup. */ }
      if (ready) break;
      await delay(200);
    }
    assert.ok(ready, logs);
    browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + '/kabinet');
      const card = page.locator('a[href="/kabinet/unit-remote"] img');
      await card.scrollIntoViewIfNeeded();
      await card.evaluate((image) => image.decode());
      await page.goto(base + '/kabinet/unit-remote');
      const images = page.locator('main.project .media-item__inner img');
      assert.equal(await images.count(), 2);
      for (const image of await images.all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate((element) => element.decode());
        await delay(1400);
        assert.equal(await image.getAttribute('crossorigin'), null);
        const state = await image.evaluate((element) => ({ width: element.naturalWidth,
          visibility: getComputedStyle(element).visibility, height: element.getBoundingClientRect().height }));
        assert.ok(state.width > 0 && state.height > 0);
        assert.equal(state.visibility, 'visible', 'CORS failure must retain native fallback');
        if (process.env.SIT_UI_SCREENSHOT_DIR) {
          await image.locator('..').screenshot({ path: path.join(process.env.SIT_UI_SCREENSHOT_DIR,
            `companyprofile-remote-${await image.getAttribute('class')}-${width}.png`) });
        }
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      console.log('PASS remote cover and main-photo fallback without storage CORS', width);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(base + '/kabinet/unit-webgl');
    await page.waitForFunction(() => document.querySelector('img.hero__panel-img')?.style.visibility === 'hidden');
    const painted = await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => {
      const canvas = document.querySelector('canvas.kd-distort-canvas');
      const gl = canvas.getContext('webgl2');
      const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
      gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      let visible = 0;
      for (let offset = 3; offset < pixels.length; offset += 4) if (pixels[offset] > 0) visible++;
      resolve(visible);
    })));
    assert.ok(painted > 1000, 'Compatible images must still render through WebGL');
    assert.deepEqual(errors, []);
    console.log('PASS compatible-image WebGL canvas is nonblank and no script errors');
  } finally {
    if (browser) await browser.close();
    child.kill();
    if (child.exitCode === null) await once(child, 'exit');
    await new Promise((resolve) => api.close(resolve));
    await new Promise((resolve) => storage.close(resolve));
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
