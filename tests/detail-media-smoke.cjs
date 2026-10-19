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

function canvasSignature(page) {
  return page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => {
    const canvas = document.querySelector('canvas.kd-distort-canvas');
    const gl = canvas.getContext('webgl2');
    const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let visible = 0, checksum = 0;
    for (let offset = 0; offset < pixels.length; offset += 16) {
      if (pixels[offset + 3] > 0) visible++;
      checksum = (checksum * 31 + pixels[offset] + pixels[offset + 1] * 3 + pixels[offset + 2] * 7 + pixels[offset + 3]) >>> 0;
    }
    resolve({ visible, checksum });
  })));
}

function orbitSignature(page) {
  return page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => {
    const canvas = document.querySelector('canvas[aria-label^="Logo BEM UI 3D"]');
    const gl = canvas.getContext('webgl2');
    const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let ink = 0, checksum = 0;
    for (let offset = 0; offset < pixels.length; offset += 16) {
      if (pixels[offset] + pixels[offset + 1] + pixels[offset + 2] < 690) ink++;
      checksum = (checksum * 31 + pixels[offset] + pixels[offset + 1] * 3 + pixels[offset + 2] * 7) >>> 0;
    }
    resolve({ ink, checksum });
  })));
}

async function scrollPhotoIntoView(page, image) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const box = await image.boundingBox();
    assert.ok(box);
    const height = page.viewportSize().height;
    if (box.y < height - 150 && box.y + box.height > 150) return;
    const distance = box.y + box.height / 2 - height / 2;
    await page.mouse.wheel(0, distance);
    await delay(650);
  }
  assert.fail('Photo did not scroll into the viewport');
}

async function assertInfoLayout(page, width) {
  const layout = await page.locator('.info').evaluate((info) => {
    const category = info.querySelector('.info__category');
    const column = info.querySelector('.info__left').getBoundingClientRect();
    const roles = info.querySelector('.info__roles').getBoundingClientRect();
    return {
      text: category.getAttribute('aria-label') || category.querySelector('[aria-label]').getAttribute('aria-label'),
      contained: [...category.querySelectorAll('.cat-char')].every((char) => {
        const box = char.getBoundingClientRect();
        return box.left >= column.left - 1 && box.right <= column.right + 1;
      }),
      separated: column.right < roles.left,
      categoryFont: getComputedStyle(category).fontSize,
      descriptionFont: getComputedStyle(info.querySelector('.description .rich-text')).fontSize,
      paragraphAlignment: getComputedStyle(info.querySelector('.description p')).textAlign,
      rolesJustified: [...info.querySelectorAll('.info__roles-list li')]
        .every((item) => getComputedStyle(item).textAlign === 'justify' && getComputedStyle(item).textAlignLast === 'start'),
    };
  });
  assert.equal(layout.text, 'Kantor Komunikasi dan Informasi');
  assert.ok(layout.contained, `Category must stay inside its column at ${width}px`);
  assert.ok(layout.separated, `Category and roles must not overlap at ${width}px`);
  assert.equal(layout.categoryFont, width <= 500 ? '15px' : '16px');
  assert.equal(layout.descriptionFont, width <= 500 ? '16px' : '18px');
  assert.equal(layout.paragraphAlignment, 'justify');
  assert.ok(layout.rolesJustified, 'Each role must be justified with a natural last line');
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
  const mediaPath = '/api/website/v1/media/00000000-0000-4000-8000-000000000001/';
  const apiRequests = [];
  const unit = (slug, photo) => ({ id: slug === 'unit-remote' ? 1 : 2, cabinet_id: 1,
    slug, name: slug, kind: 'biro', group: 'kominfo', group_label: 'Kantor Komunikasi dan Informasi',
    roles: ['Mengelola dan mengoptimalkan kanal media sosial resmi BEM UI 2026.',
      'Mengembangkan dan mengintegrasikan Sistem Informasi Terintegrasi (SIT).'],
    summary: '', description: 'Deskripsi unit', vision: 'Visi', missions: ['Misi'],
    cover_photo: { url: photo }, main_photo: { url: photo }, leaders: [], staff: [],
    programs: slug === 'unit-gallery' ? [{ id: 99, slug: 'program-dokumentasi', title: 'Program dokumentasi',
      status: 'done', schedule: '', summary: 'Ringkasan', description: 'Deskripsi program',
      main_photo: { url: localPhoto }, gallery: [1, 2, 3].map((i) => ({ url: `${localPhoto}?documentation=${i}`, caption: `Kegiatan ${i}` })) }] : [] });
  const api = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    apiRequests.push(url.pathname);
    if (url.pathname === mediaPath) {
      res.writeHead(302, { Location: `http://127.0.0.1:${storagePort}/image.png`, 'Access-Control-Allow-Origin': '*' });
      return res.end();
    }
    const remote = `http://127.0.0.1:${apiPort}${mediaPath}`;
    const cabinet = { id: 1, name: '#TerusTerang', description: 'Deskripsi kabinet', vision: 'Visi', missions: ['Misi'],
      leaders: [], main_photo: null, units: [unit('unit-remote', remote), unit('unit-webgl', localPhoto),
        unit('unit-fallback', `http://127.0.0.1:${storagePort}/image.png`), unit('unit-gallery', localPhoto)],
      statistics: { units: 4, programs: 1, people: 0 } };
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
    const optimized = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (new URL(response.url()).pathname === '/_next/image' && response.status() === 200) optimized.push(response.url());
    });
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + '/kabinet');
      const card = page.locator('a[href="/kabinet/unit-remote"] img');
      await card.scrollIntoViewIfNeeded();
      await card.evaluate((image) => image.decode());
      await page.goto(base + '/kabinet/unit-remote');
      assert.equal((await page.locator('h1').textContent()).trim(), 'unit-remote');
      await assertInfoLayout(page, width);
      const images = page.locator('main.project .media-item__inner img');
      assert.equal(await images.count(), 2);
      for (const image of await images.all()) {
        await scrollPhotoIntoView(page, image);
        await image.evaluate((element) => element.decode());
        await delay(1400);
        assert.equal(await image.getAttribute('crossorigin'), null);
        const state = await image.evaluate((element) => ({ width: element.naturalWidth,
          visibility: getComputedStyle(element).visibility, height: element.getBoundingClientRect().height }));
        assert.ok(state.width > 0 && state.height > 0);
        if (width > 1024) {
          await page.waitForFunction((element) => element.style.visibility === 'hidden', await image.elementHandle());
          const before = await canvasSignature(page);
          assert.ok(before.visible > 1000, 'Remote photo must paint actual canvas pixels');
          await page.mouse.wheel(0, 140);
          await delay(180);
          const after = await canvasSignature(page);
          assert.notEqual(before.checksum, after.checksum, 'Photo canvas must react to scrolling');
        } else {
          assert.equal(state.visibility, 'visible', 'Mobile retains the native image');
        }
        if (process.env.SIT_UI_SCREENSHOT_DIR) {
          await image.locator('..').screenshot({ path: path.join(process.env.SIT_UI_SCREENSHOT_DIR,
            `companyprofile-remote-${await image.getAttribute('class')}-${width}.png`) });
        }
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      if (process.env.SIT_UI_SCREENSHOT_DIR) {
        const info = await page.locator('.info').boundingBox();
        await page.mouse.wheel(0, info.y + info.height / 2 - 450);
        await delay(1500);
        await page.waitForFunction(() => getComputedStyle(document.querySelector('.info__category')).opacity === '1');
        await page.screenshot({ path: path.join(process.env.SIT_UI_SCREENSHOT_DIR,
          `companyprofile-category-layout-${width}.png`) });
      }
      console.log('PASS remote cover and main photo without storage CORS; WebGL on desktop, native on mobile', width);
    }
    for (const width of [1764, 1280, 768, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await assertInfoLayout(page, width);
    }
    console.log('PASS long category stays contained and typography is compact across six viewport widths');
    assert.ok(optimized.length > 0, 'SIT textures must use the same-origin image optimizer');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(base + '/kabinet/unit-fallback');
    const fallback = page.locator('img.hero__panel-img');
    await fallback.evaluate((image) => image.decode());
    await delay(1500);
    assert.equal(await fallback.evaluate((image) => getComputedStyle(image).visibility), 'visible');
    const denied = await fetch(`${base}/_next/image?url=${encodeURIComponent(`http://127.0.0.1:${storagePort}/image.png`)}&w=2048&q=88`);
    assert.equal(denied.status, 400, 'Unconfigured image hosts remain blocked');
    const privatePath = `http://127.0.0.1:${apiPort}/private/image.png`;
    const deniedPath = await fetch(`${base}/_next/image?url=${encodeURIComponent(privatePath)}&w=2048&q=88`);
    assert.equal(deniedPath.status, 400);
    assert.ok(!apiRequests.includes('/private/image.png'), 'Only the public SIT media path may be proxied');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(base + '/kabinet/unit-webgl');
    await page.waitForFunction(() => document.querySelector('img.hero__panel-img')?.style.visibility === 'hidden');
    assert.ok((await canvasSignature(page)).visible > 1000, 'Compatible images must still render through WebGL');
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + '/');
      const open = page.getByRole('button', { name: /^Program dokumentasi/ });
      await open.focus();
      await open.press('Enter');
      const gallery = page.locator('[data-program-documentation]');
      await gallery.first().waitFor();
      assert.equal(await gallery.count(), 3);
      for (const frame of await gallery.all()) {
        const box = await frame.boundingBox();
        assert.ok(Math.abs(box.width / box.height - 16 / 9) < 0.01);
        const meshBounds = await frame.locator('.media-item__inner').boundingBox();
        assert.ok(Math.abs(meshBounds.width / meshBounds.height - 16 / 9) < 0.01,
          'WebGL texture bounds must match the 16:9 frame');
        const imageBounds = await frame.locator('img').boundingBox();
        assert.ok(Math.abs(imageBounds.width / imageBounds.height - 16 / 9) < 0.01,
          'Native image must also fit the 16:9 frame');
        await frame.locator('img').evaluate((image) => image.decode());
      }
      if (process.env.SIT_UI_SCREENSHOT_DIR) {
        await page.mouse.move(width * 0.7, 450);
        await scrollPhotoIntoView(page, gallery.first());
        const box = await gallery.first().boundingBox();
        await page.mouse.wheel(0, box.y - 160);
        await delay(1800);
        await page.screenshot({ path: path.join(process.env.SIT_UI_SCREENSHOT_DIR, `companyprofile-documentation-16x9-${width}.png`) });
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      console.log('PASS three 16:9 documentation photos in actual program view', width);

      await page.goto(base + '/kabinet/unit-gallery');
      const poster = page.getByRole('link', { name: 'Lihat detail proker Program dokumentasi', exact: true });
      assert.equal(await poster.getAttribute('href'), '/?proker=unit-gallery-program-dokumentasi');
      const caption = poster.locator('..').locator('.media-caption');
      const posterBox = await poster.boundingBox();
      const captionBox = await caption.boundingBox();
      assert.ok(captionBox.y >= posterBox.y + posterBox.height - 1, 'Single-poster caption stays below the image');
      await scrollPhotoIntoView(page, poster.locator('img'));
      if (width === 1440) {
        await poster.focus();
        await poster.press('Enter');
      } else {
        await poster.click();
      }
      await page.waitForURL('**/?proker=unit-gallery-program-dokumentasi');
      const dialog = page.getByRole('dialog', { name: 'Detail proker Program dokumentasi', exact: true });
      await dialog.waitFor();
      assert.equal((await dialog.locator('h1').textContent()).trim(), 'Program dokumentasi');
      assert.equal(await dialog.locator('[data-program-documentation]').count(), 3);
      if (process.env.SIT_UI_SCREENSHOT_DIR) {
        await delay(1600);
        await page.screenshot({ path: path.join(process.env.SIT_UI_SCREENSHOT_DIR, `companyprofile-poster-detail-${width}.png`) });
      }
      await page.reload();
      await dialog.waitFor();
      await page.goBack();
      await page.waitForURL('**/kabinet/unit-gallery');
      await page.goForward();
      await page.waitForURL('**/?proker=unit-gallery-program-dokumentasi');
      await dialog.waitFor();
      await page.getByRole('button', { name: 'Tutup dan kembali ke orbit' }).click();
      await page.waitForURL(base + '/');
      await dialog.waitFor({ state: 'detached' });
      assert.equal(await page.evaluate(() => document.documentElement.style.overflow), '');
      await delay(1800);
      const orbitBefore = await orbitSignature(page);
      await delay(250);
      const orbitAfter = await orbitSignature(page);
      assert.ok(orbitAfter.ink > 1000, 'Orbit must display real logo/photo pixels after returning from detail');
      assert.notEqual(orbitAfter.checksum, orbitBefore.checksum, 'Orbit resumes moving after closing a linked detail');
      if (process.env.SIT_UI_SCREENSHOT_DIR) {
        await page.screenshot({ path: path.join(process.env.SIT_UI_SCREENSHOT_DIR, `companyprofile-random-orbit-${width}.png`) });
      }
      console.log('PASS poster to existing program detail, reload, browser back/forward and close', width);
    }
    await page.goto(base + '/?proker=not-a-published-program');
    assert.equal(await page.getByRole('dialog').count(), 0);
    console.log('PASS unknown program link leaves the homepage usable');
    assert.deepEqual(errors, []);
    console.log('PASS compatible-image WebGL canvas is nonblank and no script errors');
  } catch (error) {
    console.error(logs);
    if (browser) {
      for (const page of browser.contexts().flatMap((context) => context.pages())) {
        console.error(await page.evaluate(() => ({
          canvas: !!document.querySelector('canvas.kd-distort-canvas'),
          textures: performance.getEntriesByType('resource').filter((entry) => entry.name.includes('/_next/image'))
            .map((entry) => ({ url: entry.name, duration: entry.duration })),
          images: [...document.querySelectorAll('main.project img')].map((image) => ({
            loaded: image.complete && image.naturalWidth > 0, visibility: image.style.visibility,
          })),
        })));
      }
    }
    throw error;
  } finally {
    if (browser) await browser.close();
    child.kill();
    if (child.exitCode === null) await once(child, 'exit');
    await new Promise((resolve) => api.close(resolve));
    await new Promise((resolve) => storage.close(resolve));
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
