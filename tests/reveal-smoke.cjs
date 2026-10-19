const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const ts = require('typescript');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');

async function main() {
  const source = await fs.readFile(path.join(root, 'lib/gsap-reveal.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const projectSource = await fs.readFile(path.join(root, 'lib/project-text-reveal.ts'), 'utf8');
  const projectCode = ts.transpileModule(projectSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
  try {
    for (const width of [1440, 390]) for (const overlay of [false, true]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setContent(`<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1">
        <style>
          body { margin:0; color:#10152f; font:16px/1.5 Arial,sans-serif; }
          #scroller { ${overlay ? 'position:fixed;inset:0;overflow:auto;' : ''} }
          .spacer { height:1200px; }
          section { padding:30px; max-width:700px; margin:auto; }
          .word-reveal-wrap { display:inline-block; overflow:hidden; vertical-align:baseline; }
          .word-reveal { display:inline-block; }
        </style>
        <div id="scroller"><div class="spacer"></div><section id="target">
          <h2 id="label">Visi dan Misi</h2>
          <p id="paragraph">Mewujudkan Biro Multimedia yang integratif dalam sistem, partisipatif dalam komunikasi,
          dan berdampak bagi mahasiswa melalui pengelolaan website, sistem digital, dan konten yang interaktif serta bermanfaat.</p>
          <div id="block">Mengelola komunikasi dan informasi untuk mahasiswa.</div>
        </section><div class="spacer"></div></div>`);
      await page.addScriptTag({ path: path.join(root, 'node_modules/gsap/dist/gsap.js') });
      await page.addScriptTag({ path: path.join(root, 'node_modules/gsap/dist/ScrollTrigger.js') });
      await page.addScriptTag({ content: `{ const exports = {}; const require = () => ({ ScrollTrigger: window.ScrollTrigger }); ${outputText}; window.createReveal = exports.createReveal; }` });
      await page.evaluate((overlay) => {
        gsap.registerPlugin(ScrollTrigger);
        if (overlay) ScrollTrigger.defaults({ scroller: document.getElementById('scroller') });
        window.reveal = createReveal(gsap);
        reveal.revealWords({ elements: document.querySelectorAll('#label, #paragraph'), duration: 0.5, wordStagger: 0, lineStagger: 0.03 });
        reveal.revealBlocks({ elements: document.getElementById('block'), duration: 0.5, y: 24,
          fromVars: { opacity: 1, clipPath: 'inset(0 0 100% 0)' }, toVars: { opacity: 1, clipPath: 'inset(0 0 0% 0)' } });
        window.scrollToReveal = (position) => {
          const scroller = overlay ? document.getElementById('scroller') : document.scrollingElement;
          const target = document.getElementById('target');
          scroller.scrollTop = position === 'above' ? 0 : position === 'below' ? target.offsetTop + target.offsetHeight + 150 : target.offsetTop - 160;
          ScrollTrigger.update();
        };
        ScrollTrigger.refresh();
      }, overlay);
      assert.equal(await page.locator('#paragraph').getAttribute('data-word-reveal-prepared'), '1');
      for (const direction of ['down', 'up', 'down', 'up']) {
        await page.evaluate((direction) => scrollToReveal(direction === 'down' ? 'above' : 'below'), direction);
        await page.waitForTimeout(100);
        await page.evaluate(() => scrollToReveal('visible'));
        await page.waitForFunction((direction) => {
          const word = document.querySelector('#paragraph .word-reveal');
          const y = Number(gsap.getProperty(word, 'yPercent'));
          const blockY = Number(gsap.getProperty(document.getElementById('block'), 'y'));
          const sign = direction === 'down' ? -1 : 1;
          return y * sign > 1 && y * sign < 115 && blockY * sign > 0;
        }, direction);
        await page.waitForFunction(() => [...document.querySelectorAll('.word-reveal')].every((word) =>
          Math.abs(Number(gsap.getProperty(word, 'yPercent'))) < 0.01 && Number(getComputedStyle(word).opacity) === 1));
        await page.waitForFunction(() => getComputedStyle(document.getElementById('block')).clipPath === 'inset(0px 0px 0%)');
        assert.equal(await page.locator('#paragraph .word-reveal-wrap .word-reveal-wrap').count(), 0);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        console.log('PASS text moves with scroll direction', width, overlay ? 'overlay' : 'window', direction);
      }
      if (process.env.SIT_UI_SCREENSHOT_DIR) {
        await page.screenshot({ path: path.join(process.env.SIT_UI_SCREENSHOT_DIR, `companyprofile-repeat-text-${width}-${overlay ? 'overlay' : 'window'}.png`) });
      }
      await page.evaluate(() => {
        reveal.cleanup();
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      });
      assert.equal(await page.locator('.word-reveal').count(), 0);
      assert.equal(await page.locator('[data-word-reveal-prepared]').count(), 0);
      await page.addScriptTag({ content: `{ const exports = {}; ${projectCode}; window.revealProjectText = exports.revealProjectText; }` });
      const coverage = await page.evaluate((overlay) => {
        const root = document.getElementById('target');
        root.classList.add('project');
        root.innerHTML = `<div id="hero" class="hero__row"><h1 id="title" class="hero__title hero--reveal-pending">Biro Multimedia</h1>
          <div id="year" class="hero__year">Tahun 2026</div></div>
          <h3 id="category-label" class="info__label">Kategori</h3>
          <a id="category" class="info__category"><span class="kd-wordroll"><span class="kd-charroll">Kantor Komunikasi</span></span></a>
          <ul class="info__roles-list"><li id="role">Mengelola website.</li></ul>
          <div class="description"><div class="rich-text"><p id="description">Deskripsi unit.</p></div></div>
          <section class="section--text"><h2 id="vision-label" class="section__subtitle">Visi</h2><div class="rich-text"><p id="vision">Visi unit.</p>
          <ol class="misi-list"><li id="mission-1">Misi satu.</li><li id="mission-2">Misi dua.</li></ol></div></section>
          <div class="media-caption"><div id="caption-label" class="label_info">Dokumentasi 01</div><p id="caption">Dokumentasi kegiatan.</p></div>
          <h2 id="bph-label" class="section__subtitle">BPH</h2><h2 id="staff-label" class="section__subtitle">Staf</h2>
          <figure class="person-card"><figcaption><div id="person-name">Nama pengurus</div><div id="person-role">Kepala Biro</div><div id="person-academic">Fakultas 2023</div></figcaption></figure>
          <li class="proker-row"><button id="program-button"><span id="program-title">Program satu</span><span id="program-status">Selesai</span></button></li>
          <li class="proker-row"><span><span id="other-title">Program lain</span><span id="other-status">Akan datang</span></span></li>
          <h2 id="next-title" class="next__title">Divisi selanjutnya</h2><div class="next__right"><span id="next-label" class="label_info">Selanjutnya</span></div>`;
        window.categoryNode = root.querySelector('.kd-charroll');
        window.programClicks = 0;
        root.querySelector('#program-button').addEventListener('click', () => window.programClicks++);
        (overlay ? document.getElementById('scroller') : document.scrollingElement).scrollTop = 0;
        window.reveal = createReveal(gsap);
        revealProjectText(root, reveal, 0);
        const registered = new Set(ScrollTrigger.getAll().map((trigger) => trigger.trigger.id));
        const expected = [...root.querySelectorAll('[id]')].map((element) => element.id).filter((id) => !['title', 'program-button'].includes(id));
        const missing = expected.filter((id) => !registered.has(id));
        const uncovered = [];
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (/\S/.test(node.nodeValue) && !node.parentElement.closest('.word-reveal, .info__category, .misi-list li')) {
            uncovered.push(node.nodeValue.trim());
          }
        }
        return { missing, uncovered, titlePrepared: root.querySelector('#title').dataset.wordRevealPrepared };
      }, overlay);
      assert.deepEqual(coverage.missing, [], 'Every text group needs its own repeatable trigger');
      assert.deepEqual(coverage.uncovered, [], 'No document text may be left outside the shared reveal setup');
      assert.equal(coverage.titlePrepared, '1');
      assert.equal(await page.locator('.kd-charroll .word-reveal').count(), 0, 'Character-roll hover markup must stay intact');
      await page.evaluate(() => reveal.cleanup());
      await page.locator('#program-button').click();
      assert.equal(await page.evaluate(() => window.programClicks), 1, 'Text cleanup must preserve program navigation handlers');
      assert.equal(await page.evaluate(() => document.querySelector('.kd-charroll') === window.categoryNode), true);
      console.log('PASS complete shared text coverage', width, overlay ? 'overlay' : 'window');
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
