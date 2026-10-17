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

test("BPH academic subtitle comes from the SIT field without replacing the role", () => {
  const leader = { ...cabinet.leaders[0], description: "Kedokteran 2023", title: "Wakil Kepala Eksternal" };
  const mapped = adapter().toDivisi({ ...unit, leaders: [leader] }, 1, cabinet.name);
  assert.equal(mapped.bph[0].jurusanAngkatan, "Kedokteran 2023");
  assert.equal(mapped.bph[0].jabatan, "Wakil Kepala Eksternal");
  assert.equal(adapter().toDivisi({ ...unit, leaders: [{ ...leader, description: "" }] }, 1, cabinet.name).bph[0].jurusanAngkatan, "");
});

test("group cover and wide main photo stay separate from individual portraits", () => {
  const group = { url: "https://sit.example/media/group/" };
  const individual = { url: "https://sit.example/media/person/" };
  const mapped = adapter().toDivisi({ ...unit, cover_photo: group,
    leaders: [{ ...cabinet.leaders[0], photo: individual }] }, 1, cabinet.name);
  assert.equal(mapped.cover.url, group.url);
  assert.equal(mapped.foto_bph.url, group.url);
  assert.equal(mapped.sections[0].media.url, media.url);
  assert.equal(mapped.bph[0].foto.url, individual.url);
  assert.equal(adapter().toDivisi(unit, 1, cabinet.name).cover.url, media.url);
  assert.match(adapter().toDivisi({ ...unit, cover_photo: null }, 1, cabinet.name).cover.url, /placeholder/);
  const empty = adapter().toDivisi({ ...unit, main_photo: null, cover_photo: group, programs: [] }, 1, cabinet.name);
  assert.equal(empty.sections.length, 0);
  assert.equal(empty.cover.url, group.url);
});

test("local chairman sequence is attached only to the same CMS person", () => {
  const profile = JSON.parse(readFileSync(path.join(__dirname, "../config/leader-portraits.json"), "utf8")).ketua;
  const api = adapter();
  const samePerson = { ...cabinet, leaders: [{ ...cabinet.leaders[0], name: profile.nama.toUpperCase() }] };
  const result = api.toKabinet(samePerson, profile);
  assert.equal(result.ketua.fakultas, "FEB 2022");
  assert.equal(result.ketua.fotos.length, 3);
  assert.equal(result.ketua.foto.url, profile.fotos[0].url);
  assert.equal(api.toKabinet(cabinet, profile).ketua.fotos, undefined);
  assert.equal(api.toKabinet({ ...cabinet, leaders: [] }, profile).ketua.fotos, undefined);
});

test("chairman images exist as alpha PNGs with consistent dimensions", () => {
  const profile = JSON.parse(readFileSync(path.join(__dirname, "../config/leader-portraits.json"), "utf8")).ketua;
  assert.equal(profile.nama, "Yatalathof Ma'sum Imawan");
  assert.equal(profile.fakultas, "FEB 2022");
  assert.equal(profile.fotos.length, 3);
  const dimensions = profile.fotos.map((photo) => {
    const png = readFileSync(path.join(__dirname, "../public", photo.url));
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(png[25], 6, "PNG must retain RGBA transparency");
    return [png.readUInt32BE(16), png.readUInt32BE(20)].join("x");
  });
  assert.equal(new Set(dimensions).size, 1);
});

test("vice-chair sequence is matched by role and person without replacing CMS quotes", () => {
  const local = JSON.parse(readFileSync(path.join(__dirname, "../config/leader-portraits.json"), "utf8"));
  const api = adapter();
  const cms = { ...cabinet, leaders: [...cabinet.leaders, {
    ...cabinet.leaders[0], role_key: "wakil-ketua", name: "FATHIMAH AZZAHRA",
  }] };
  const result = api.toKabinet(cms, local.ketua, local.wakil);
  assert.equal(result.wakil.fakultas, "FK 2023");
  assert.equal(result.wakil.fotos.length, 3);
  assert.equal(result.wakil.kutipan, "Kutipan CMS");
  assert.equal(result.ketua.fotos, undefined);
  assert.equal(api.toKabinet(cabinet, local.ketua, local.wakil).wakil.fotos, undefined);
  cms.leaders[1].name = "Wakil lain";
  assert.equal(api.toKabinet(cms, local.ketua, local.wakil).wakil.fotos, undefined);
});

test("vice-chair portraits retain alpha and a consistent frame size", () => {
  const profile = JSON.parse(readFileSync(path.join(__dirname, "../config/leader-portraits.json"), "utf8")).wakil;
  assert.equal(profile.nama, "Fathimah Azzahra");
  assert.equal(profile.fakultas, "FK 2023");
  assert.equal(profile.fotos.length, 3);
  const dimensions = profile.fotos.map((photo) => {
    const png = readFileSync(path.join(__dirname, "../public", photo.url));
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(png[25], 6);
    assert.ok((photo.scale ?? 1) > 0 && (photo.scale ?? 1) <= 1);
    return [png.readUInt32BE(16), png.readUInt32BE(20)].join("x");
  });
  assert.equal(new Set(dimensions).size, 1);
});
