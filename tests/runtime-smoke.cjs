const assert = require("node:assert/strict");
const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const { setTimeout: delay } = require("node:timers/promises");

async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return server.address().port;
}

async function verifyEmptyState(apiUrl, publishedUnit) {
  const reserve = http.createServer();
  const port = await listen(reserve);
  await new Promise((resolve) => reserve.close(resolve));
  const child = spawn(process.execPath, [path.join(__dirname, "../node_modules/next/dist/bin/next"),
    "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, NODE_ENV: "production", SIT_API_URL: apiUrl, ENABLE_DEMO_DATA: "true",
      NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "", NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  child.stdout.on("data", (data) => { logs += data; });
  child.stderr.on("data", (data) => { logs += data; });
  const base = `http://127.0.0.1:${port}`;
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw new Error(logs);
      try { ready = (await fetch(`${base}/api/health`)).ok; } catch { /* Wait for startup. */ }
      if (ready) break;
      await delay(200);
    }
    assert.ok(ready, logs);
    for (const route of ["/", "/kabinet", "/news"]) {
      const response = await fetch(base + route);
      assert.equal(response.status, 200, route + logs);
      const html = await response.text();
      assert.doesNotMatch(html, /Placeholder|Nama Kepala Departemen|Analisis Kritis Kebijakan UKT|Rapat Kerja BEM/);
      if (route === "/kabinet" && publishedUnit) {
        assert.ok(html.includes(publishedUnit.name));
        assert.ok(html.includes(`/kabinet/${publishedUnit.slug}`));
        assert.ok(html.includes("#TerusTerang"));
      }
    }
    if (publishedUnit) {
      assert.equal((await fetch(`${base}/kabinet/${publishedUnit.slug}`)).status, 200);
      const division = await (await fetch(`${base}/api/divisi/${publishedUnit.slug}`)).json();
      assert.equal(division.nama, publishedUnit.name);
    }
    assert.equal((await fetch(base + "/news/analisis-kritis-kebijakan-ukt-baru")).status, 404);
    assert.equal((await fetch(base + "/kabinet/kominfo")).status, 404);
    console.log("PASS", publishedUnit ? "published birdep without published cabinet" : "empty/unavailable CMS without dummy content");
  } finally {
    child.kill();
    if (child.exitCode === null) await once(child, "exit");
  }
}

async function main() {
  const requests = [];
  const unit = { id: 91, cabinet_id: 7, slug: "unit-baru-dari-cms", name: "Biro Uji CMS",
    kind: "biro", group: "internal", group_label: "Internal", abbreviation: "UJI",
    summary: "Ringkasan resmi CMS", description: "Deskripsi resmi CMS", roles: ["Tugas CMS"],
    vision: "Visi CMS", missions: ["Misi CMS"],
    main_photo: { url: "/api/placeholder?label=MAIN&w=1600&h=900", alt: "Foto utama lebar" },
    cover_photo: { url: "/api/placeholder?label=COVER&w=1200&h=1600", alt: "Foto bersama BPH" },
    leaders: [], staff: [], programs: [] };
  const cabinet = { id: 7, name: "Kabinet Uji CMS", description: "Deskripsi kabinet CMS",
    vision: "Visi kabinet CMS", missions: ["Misi kabinet"], main_photo: null, leaders: [], units: [unit],
    statistics: { units: 1, programs: 0, people: 3, active_programs: 0, represented_students: 1234, faculties: 2 } };
  const article = { slug: "berita-uji-cms", category: "news", title: "Berita Uji CMS", summary: "Ringkasan berita CMS",
    body: "<p>Isi berita resmi CMS</p>", published_at: "2026-10-17T08:00:00Z", tags: [], attachments: [] };
  const api = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    requests.push(url.pathname);
    let data;
    if (url.pathname === "/api/website/v1/cabinets/") data = { results: [{ id: 7 }] };
    if (url.pathname === "/api/website/v1/cabinets/7/") data = cabinet;
    if (url.pathname === "/api/website/v1/articles/") data = { results: [article], pages: 1 };
    if (url.pathname === "/units-only/cabinets/") data = { results: [] };
    if (url.pathname === "/units-only/units/") data = { results: [unit] };
    if (url.pathname === "/units-only/articles/") data = { results: [], pages: 1 };
    res.writeHead(data ? 200 : 404, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data || { detail: "Not found" }));
  });
  const apiPort = await listen(api);
  const reserved = http.createServer();
  const port = await listen(reserved);
  await new Promise((resolve) => reserved.close(resolve));
  const child = spawn(process.execPath, [path.join(__dirname, "../node_modules/next/dist/bin/next"),
    "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, SIT_API_URL: `http://127.0.0.1:${apiPort}/api/website/v1`,
      NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "", NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  child.stdout.on("data", (data) => { logs += data; });
  child.stderr.on("data", (data) => { logs += data; });
  try {
    const base = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw new Error(logs);
      try { ready = (await fetch(`${base}/api/health`)).ok; } catch { /* Wait for startup. */ }
      if (ready) break;
      await delay(200);
    }
    assert.ok(ready, "Production server did not start: " + logs);
    for (const [route, expected] of [["/", "Berita Uji CMS"], ["/kabinet", "#UjiCMS"],
      ["/kabinet/unit-baru-dari-cms", "Biro Uji CMS"], ["/news", "Berita Uji CMS"],
      ["/news/berita-uji-cms", "Isi berita resmi CMS"]]) {
      const response = await fetch(base + route);
      assert.equal(response.status, 200, route + " failed: " + logs);
      assert.ok((await response.text()).includes(expected), route + " did not render CMS content");
      console.log("PASS", route);
    }
    const division = await (await fetch(`${base}/api/divisi/unit-baru-dari-cms`)).json();
    assert.equal(division.nama, unit.name);
    assert.equal(division.year, undefined);
    assert.equal(division.cover.url, unit.cover_photo.url);
    assert.equal(division.foto_bph.url, unit.cover_photo.url);
    assert.equal(division.sections[0].media.url, unit.main_photo.url);
    const stats = await (await fetch(`${base}/api/stats`)).json();
    assert.deepEqual(stats, { mahasiswa_terwakili: 1234, proker_aktif: 0, fungsionaris: 3 });
    assert.equal((await fetch(`${base}/api/divisi/tidak-ada`)).status, 404);
    assert.equal((await fetch(`${base}/news/analisis-kritis-kebijakan-ukt-baru`)).status, 404);
    assert.ok(requests.includes("/api/website/v1/cabinets/7/"));
    assert.ok(!requests.some((url) => url.includes("undefined")));
    console.log("PASS runtime division, statistics, missing content and ID-based API requests");
    await verifyEmptyState("");
    await verifyEmptyState(`http://127.0.0.1:${apiPort}/unavailable`);
    await verifyEmptyState(`http://127.0.0.1:${apiPort}/units-only`, unit);
  } finally {
    child.kill();
    if (child.exitCode === null) await once(child, "exit");
    await new Promise((resolve) => api.close(resolve));
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
