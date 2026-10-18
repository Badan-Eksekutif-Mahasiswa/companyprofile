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
  const initial = JSON.parse(await fs.readFile(path.join(__dirname, '../data/kabinet.json'), 'utf8'));
  const photos = [1, 2, 3].map((pose) => ({ url: `/images/kabinet/kabem/yatalathof-0${pose}.png` }));
  const leader = { name: 'Pengurus Uji', role_key: 'koorbid-internal', title: 'Koordinator Bidang Internal',
    group: 'internal', description: 'Deskripsi pengurus', faculty: 'FEB', cohort: '2022', quote: '',
    photo: photos[0], photo_2: photos[1], photo_3: photos[2] };
  const unit = { id: 1, cabinet_id: 7, slug: 'unit-uji', name: 'Biro Uji', kind: 'biro', group: 'internal',
    group_label: 'Bidang Internal', summary: '', description: 'Deskripsi unit', vision: 'Visi', missions: ['Misi'],
    main_photo: null, cover_photo: null, leaders: [{ ...leader, name: 'Pengurus BPH Uji', role_key: 'kepala', title: 'Kepala Biro' }],
    staff: [], programs: [] };
  const chairs = [initial.ketua, initial.wakil].map((person, index) => ({
    role_key: index ? 'wakil-ketua' : 'ketua', title: person.jabatan, name: person.nama,
    faculty: index ? 'FK' : 'FEB', cohort: index ? '2023' : '2022', quote: person.kutipan,
    description: '', group: '', photo: person.fotos[0], photo_2: person.fotos[1], photo_3: person.fotos[2],
  }));
  const cabinet = { id: 7, name: initial.nama, description: initial.deskripsi, vision: initial.visi,
    missions: initial.misi.map((mission) => mission.teks), mission_keywords: initial.misi.map((mission) => mission.kunci),
    main_photo: null, leaders: [...chairs, leader, { ...leader, name: 'PI belum lengkap', description: '' }],
    units: [unit], statistics: { units: 1, programs: 0, people: 4 } };
  const api = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');
    const data = url.pathname.endsWith('/cabinets/7/') ? cabinet :
      url.pathname.endsWith('/cabinets/') ? { results: [{ id: 7 }] } : { results: [], pages: 1 };
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(data));
  });
  const apiPort = await listen(api);
  const reserve = http.createServer();
  const port = await listen(reserve);
  await new Promise((resolve) => reserve.close(resolve));
  const child = spawn(process.execPath, [path.join(__dirname, '../node_modules/next/dist/bin/next'),
    'start', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'production', SIT_API_URL: `http://127.0.0.1:${apiPort}/api/website/v1`,
      NEXT_PUBLIC_SUPABASE_URL: '', NEXT_PUBLIC_SUPABASE_ANON_KEY: '', NEXT_TELEMETRY_DISABLED: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
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
    for (const route of ['/kabinet', '/kabinet/unit-uji']) {
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(base + route);
        if (route === '/kabinet') {
          assert.equal(await page.locator('h1').innerText(), '#TerusTerang');
          assert.equal(await page.locator('main header').getByText('BEM UI 2026', { exact: true }).count(), 0);
          assert.equal(await page.locator('main header').getByText(initial.visi, { exact: true }).count(), 1);
          assert.equal(await page.locator('section[aria-label="Misi"] p').count(), 3);
          assert.equal(await page.locator('figure.person-card').count(), 1);
          assert.equal(await page.getByText('PI belum lengkap', { exact: true }).count(), 0);
          await page.waitForFunction(() => {
            const visible = [...document.querySelectorAll('main header .opacity-100')];
            return visible.length >= 3 && visible.every((element) => Number(getComputedStyle(element).opacity) === 1);
          });
          if (process.env.SIT_UI_SCREENSHOT_DIR) {
            await page.screenshot({ path: path.join(process.env.SIT_UI_SCREENSHOT_DIR, `companyprofile-cabinet-${width}.png`) });
          }
        }
        const portrait = page.locator('figure.person-card [data-leader-portrait]').first();
        await portrait.scrollIntoViewIfNeeded();
        await page.waitForFunction(() => document.querySelector('figure.person-card [data-leader-portrait]')?.dataset.playing === 'true');
        assert.equal(await portrait.locator('img').count(), 3);
        assert.equal(await portrait.locator('img').evaluateAll((images) => images.every((image) => image.naturalWidth > 0)), true);
        const initialIndex = await portrait.getAttribute('data-photo-index');
        await page.waitForFunction((index) => document.querySelector('figure.person-card [data-leader-portrait]')?.dataset.photoIndex !== index, initialIndex);
        const box = await portrait.boundingBox();
        assert.ok(Math.abs(box.width / box.height - 3/4) < 0.01);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        const alpha = await portrait.locator('img').first().evaluate((image) => {
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
          const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
          let transparent = 0, opaque = 0;
          for (let offset = 3; offset < pixels.length; offset += 400) {
            if (pixels[offset] === 0) transparent++;
            if (pixels[offset] === 255) opaque++;
          }
          return { transparent, opaque };
        });
        assert.ok(alpha.transparent > 0 && alpha.opaque > 0, 'Portrait must retain both subject and transparency');
        if (process.env.SIT_UI_SCREENSHOT_DIR) {
          await fs.mkdir(process.env.SIT_UI_SCREENSHOT_DIR, { recursive: true });
          await portrait.locator('..').screenshot({ path: path.join(process.env.SIT_UI_SCREENSHOT_DIR,
            `companyprofile-poses-${route === '/kabinet' ? 'pi' : 'bph'}-${width}.png`) });
        }
        console.log('PASS animated transparent portrait', route, width);
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(base + '/kabinet');
    const portrait = page.locator('figure.person-card [data-leader-portrait]').first();
    await portrait.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('figure.person-card img')?.complete);
    await delay(2000);
    assert.equal(await portrait.getAttribute('data-photo-index'), '0');
    assert.equal(await portrait.getAttribute('data-playing'), 'false');
    assert.deepEqual(errors, []);
    console.log('PASS reduced-motion preference and no browser errors');
  } finally {
    if (browser) await browser.close();
    child.kill();
    if (child.exitCode === null) await once(child, 'exit');
    await new Promise((resolve) => api.close(resolve));
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
