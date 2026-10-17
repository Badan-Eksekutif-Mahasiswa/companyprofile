const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

// Exercise the server-only adapter with controlled fetch responses, without Next or secrets.
function adapter(fetch, base = "https://sit.example/api/website/v1/") {
  const source = readFileSync(path.join(__dirname, "../lib/kabinet-api.ts"), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports, fetch, URLSearchParams,
    process: { env: { SIT_API_URL: base } },
    require(name) {
      assert.equal(name, "server-only");
      return {};
    },
  });
  return exports;
}

const media = { url: "https://sit.example/api/website/v1/media/test/" };
const unit = {
  id: 9, cabinet_id: 7, slug: "multimedia", name: "Biro Multimedia",
  abbreviation: "MM", kind: "biro", group: "internal", group_label: "Internal",
  summary: "Ringkasan CMS", roles: ["Kelola website"], description: "Deskripsi CMS",
  vision: "Visi", missions: ["Misi"], main_photo: media, leaders: [], staff: [],
  programs: [{ id: 3, slug: "sit", title: "SIT", description: "Lengkap", summary: "Singkat",
    status: "ongoing", schedule: "Oktober", main_photo: media, gallery: [media, null] }],
};
const cabinet = {
  id: 7, name: "Kabinet CMS", description: "Deskripsi resmi", vision: "Visi",
  missions: ["Satu misi"], mission_keywords: ["Kolaborasi"], main_photo: media,
  leaders: [{ role_key: "ketua", name: "Ketua CMS", title: "Ketua", description: "Bio",
    faculty: "Fasilkom", cohort: "2023", quote: "Kutipan CMS", photo: media }],
  units: [unit], statistics: { units: 1, programs: 1, people: 4, active_programs: 1,
    represented_students: 1000, faculties: 14 },
};

test("loads published cabinet by ID without requiring a year", async () => {
  const urls = [];
  const api = adapter(async (url) => {
    urls.push(url);
    return { ok: true, json: async () => urls.length === 1 ? { results: [{ id: 7 }] } : cabinet };
  });
  assert.equal((await api.fetchSitCabinet()).id, 7);
  assert.deepEqual(urls, ["https://sit.example/api/website/v1/cabinets/",
    "https://sit.example/api/website/v1/cabinets/7/"]);
});

test("unconfigured or empty CMS returns null", async () => {
  assert.equal(await adapter(() => assert.fail("fetch should not run"), "").fetchSitCabinet(), null);
  assert.equal(await adapter(async () => ({ ok: true, json: async () => ({ results: [] }) })).fetchSitCabinet(), null);
});

test("reports invalid IDs and HTTP failures instead of fetching undefined", async () => {
  await assert.rejects(adapter(async () => ({ ok: true, json: async () => ({ results: [{}] }) })).fetchSitCabinet(), /ID kabinet/);
  await assert.rejects(adapter(async () => ({ ok: false, status: 503 })).fetchSitCabinet(), /503/);
  let calls = 0;
  await assert.rejects(adapter(async () => ++calls === 1
    ? { ok: true, json: async () => ({ results: [{ id: 7 }] }) }
    : { ok: false, status: 404 }).fetchSitCabinet(), /404/);
});

test("maps CMS roles, abbreviations, leaders and mission keywords without dates or dummy names", () => {
  const api = adapter();
  const division = api.toDivisi(unit, 1, cabinet.name);
  assert.equal(division.singkatan, "MM");
  assert.equal(division.roles[0], "Kelola website");
  assert.equal(Object.hasOwn(division, "year"), false);
  const result = api.toKabinet(cabinet);
  assert.equal(Object.hasOwn(result, "periode"), false);
  assert.equal(result.ketua.nama, "Ketua CMS");
  assert.equal(result.ketua.fakultas, "Fasilkom / 2023");
  assert.equal(result.ketua.kutipan, "Kutipan CMS");
  assert.equal(result.wakil.nama, "");
  assert.equal(result.misi[0].kunci, "Kolaborasi");
  assert.equal(result.stats.fakultas, 14);
});

test("maps published program status, summary, schedule and nullable gallery", () => {
  const [program] = adapter().toHeroProker(cabinet, () => "Biro");
  assert.equal(program.slug, "multimedia-sit");
  assert.equal(program.status, "ongoing");
  assert.equal(program.tanggal, "Oktober");
  assert.equal(program.deskripsi, "Singkat");
  assert.equal(program.dokumentasi.length, 1);
  assert.equal(program.unit.singkatan, "MM");
});

test("empty published cabinet does not invent programs or faculty counts", () => {
  const api = adapter();
  const empty = { ...cabinet, units: [], leaders: [], statistics: { units: 0, programs: 0, people: 0 } };
  assert.equal(api.toKabinet(empty).proker.length, 0);
  assert.equal(api.toKabinet(empty).stats.fakultas, 0);
  assert.equal(api.toHeroProker(empty, () => "Biro").length, 0);
});
