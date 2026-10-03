/**
 * Scene WebGL hero beranda (ala k95.it): logo BEM UI 3D di tengah, dibungkus cincin
 * kartu proker yang berputar otomatis, di atas latar putih + grid silinder.
 *
 * Konsisten dengan halaman detail kabinet (components/kabinet):
 * - Grid: silinder garis navy 16% radius 30 dilihat dari dalam, parallax scroll .003 / smoothing .08
 *   (sama dengan BackgroundGrid).
 * - Kartu: rasio 1.4:1.9 (sama dengan .hero__panel), gelombang sinus + RGB-shift mengikuti
 *   kecepatan scroll (shader "shared-wave", sama dengan DistortManager).
 * - Logo hanya berputar; bisa diklik (filosofi logo).
 *
 * Efisiensi: semua kartu = 1 InstancedMesh + 1 atlas (1 draw call); grid digambar di context yang
 * sama; loop berhenti saat hero tidak terlihat, tab tersembunyi, atau panel terbuka.
 */
import {
  ACESFilmicToneMapping,
  BackSide,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  DynamicDrawUsage,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  LinearMipmapLinearFilter,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  NoColorSpace,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Raycaster,
  Scene,
  ShaderMaterial,
  Shape,
  Sphere,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { LOGO_SHAPES, LOGO_SIZE } from "./logo-shapes";

export type Rect = { left: number; top: number; width: number; height: number };
export type Pick = { kind: "card"; instance: number } | { kind: "logo" };

export interface OrbitOptions {
  canvas: HTMLCanvasElement;
  /** URL sampul tiap proker (index = index item), rasio 1.4:1.9. */
  images: string[];
  /** Pemetaan instance kartu → index item. Panjangnya = jumlah kartu. */
  slots: number[];
  perRing: number;
  logoSrc: string;
  logoBumpSrc: string;
  reduceMotion: boolean;
  /** Kecepatan putar otomatis (derajat/detik). */
  autoSpeed?: number;
  /** Item kartu yang di-hover, "logo", atau null. */
  onHover?: (target: number | "logo" | null) => void;
  onFront?: (item: number) => void;
}

export interface OrbitController {
  /** Putaran tambahan dari scroll (putaran penuh) + posisi scroll halaman (px) untuk parallax & gelombang. */
  setScroll(turns: number, scrollY: number): void;
  setPaused(paused: boolean): void;
  drag(dxPx: number): void;
  release(): void;
  pick(clientX: number, clientY: number): Pick | null;
  rectOf(instance: number): Rect | null;
  /** Kartu terlihat terbesar yang menampilkan item tertentu, untuk animasi kembali. */
  findVisible(item: number): { instance: number; rect: Rect } | null;
  setHidden(instance: number | null): void;
  dispose(): void;
}

const RAD = Math.PI / 180;
const BG = 0xffffff;
const NAVY = 0x0b102d;
// Ala k95: kamera tepat di depan dinding cincin → perspektif kuat (kartu belakang kecil, kartu
// dekat besar & terpotong di tepi layar). Kartu menghadap ke dalam (ke logo), potret 1.4:1.9.
const RADIUS = 6;
const CARD_H = 2.3;
const CARD_W = CARD_H * (1.4 / 1.9);
/** Jarak antarbaris; baris berulang tanpa ujung secara vertikal (scroll menggerakkan kartu turun). */
const ROW_PITCH = 3.2;
const CAM_Z = 8.2;
const CAM_FOV = 50;
const LOGO_SCALE = 1.1;
/** Setengah ukuran logo (world) + jarak minimum kartu dari logo. Kartu yang melintas di belakang logo didorong menjauh. */
const LOGO_HALF = 1.6;
const LOGO_GAP = 0.55;
const DEFAULT_AUTO_SPEED = 3;
/** Perjalanan vertikal kartu per px scroll (arah sama dengan parallax grid: turun saat scroll turun). */
const SCROLL_TRAVEL = 0.0035;
/** Kedalaman relief spiral di muka logo (skala bump three.js modern berbeda dari r128). */
const FACE_BUMP = 0.15;

/* Gelombang + RGB-shift mengikuti kecepatan scroll (port shared-wave k95, sama dgn DistortManager). */
const CARD_VERT = /* glsl */ `
uniform float uTime;
uniform float uVel;
attribute vec4 aUv;
attribute float aAlpha;
varying vec2 vLocal;
varying vec4 vRect;
varying float vAlpha;
varying float vWave;
void main() {
  vLocal = uv;
  vRect = aUv;
  vAlpha = aAlpha;
  vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
  float wave = sin(world.y * 0.55 + uTime * 0.8) * uVel;
  vWave = wave * 0.1;
  vec3 p = position;
  p.z += wave * 0.09;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0);
}`;

const CARD_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform float uVel;
varying vec2 vLocal;
varying vec4 vRect;
varying float vAlpha;
varying float vWave;
vec3 tex(vec2 l) {
  l = clamp(l, 0.0, 1.0);
  return texture2D(uMap, vRect.xy + l * vRect.zw).rgb;
}
void main() {
  if (vAlpha < 0.01) discard;
  // Sisi belakang dicerminkan supaya foto tidak terbalik saat terlihat dari belakang logo.
  vec2 l = vec2(gl_FrontFacing ? vLocal.x : 1.0 - vLocal.x, vLocal.y);
  float reduced = uVel * 0.015;
  l.y += sin(l.x * 10.0) * reduced * 0.05;
  float shift = reduced * 0.02;
  vec3 c = vec3(tex(l + vec2(shift, 0.0)).r, tex(l).g, tex(l - vec2(shift, 0.0)).b);
  c += vWave * 0.1 * vec3(0.2, 0.0, 0.3);
  gl_FragColor = vec4(gl_FrontFacing ? c : c * 0.85, vAlpha);
}`;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Gabungkan semua sampul ke satu canvas atlas (sel 1.4:1.9) + hitung UV tiap sel. */
async function buildAtlas(urls: string[]) {
  const imgs = await Promise.all(urls.map((u) => loadImage(u).catch(() => null)));
  const cols = Math.min(5, urls.length);
  const rows = Math.ceil(urls.length / cols);
  let cw = 440;
  let ch = 597; // 1.4:1.9, cukup tajam untuk kartu besar
  const scale = Math.min(1, 4096 / (rows * ch), 4096 / (cols * cw));
  cw = Math.floor(cw * scale);
  ch = Math.floor(ch * scale);
  const pad = 3;
  const W = cols * cw;
  const H = rows * ch;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext("2d")!;
  const uvs = new Float32Array(urls.length * 4);

  imgs.forEach((img, i) => {
    const cx = (i % cols) * cw;
    const cy = Math.floor(i / cols) * ch;
    g.fillStyle = "#f0f0f4";
    g.fillRect(cx, cy, cw, ch);
    if (img) {
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      g.save();
      g.beginPath();
      g.rect(cx, cy, cw, ch);
      g.clip();
      g.drawImage(img, cx + (cw - dw) / 2, cy + (ch - dh) / 2, dw, dh);
      g.restore();
    }
    uvs[i * 4] = (cx + pad) / W;
    uvs[i * 4 + 1] = 1 - (cy + ch - pad) / H;
    uvs[i * 4 + 2] = (cw - pad * 2) / W;
    uvs[i * 4 + 3] = (ch - pad * 2) / H;
  });
  return { canvas, uvs };
}

/** Grid silinder — parameter sama dengan components/kabinet/BackgroundGrid.tsx. */
function createGrid(aspectTall: boolean) {
  const RADIUS_GRID = 30;
  const yExtent = 22;
  const SEG = 200;
  const VERTICALS = 80;
  const RINGS = aspectTall ? 22 : 16;
  const v: number[] = [];
  for (let i = 0; i < VERTICALS; i++) {
    const a = (i / VERTICALS) * Math.PI * 2;
    const x = Math.cos(a) * RADIUS_GRID;
    const z = Math.sin(a) * RADIUS_GRID;
    v.push(x, -yExtent, z, x, yExtent, z);
  }
  for (let r = 0; r <= RINGS; r++) {
    const y = -yExtent + (r / RINGS) * yExtent * 2;
    for (let s = 0; s < SEG; s++) {
      const a = (s / SEG) * Math.PI * 2;
      const b = ((s + 1) / SEG) * Math.PI * 2;
      v.push(Math.cos(a) * RADIUS_GRID, y, Math.sin(a) * RADIUS_GRID, Math.cos(b) * RADIUS_GRID, y, Math.sin(b) * RADIUS_GRID);
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(v, 3));
  return { geo, period: (yExtent * 2) / RINGS };
}

export async function createOrbit(opts: OrbitOptions): Promise<OrbitController> {
  const { canvas, slots, perRing, reduceMotion } = opts;
  const AUTO_SPEED = opts.autoSpeed ?? DEFAULT_AUTO_SPEED;
  const N = slots.length;
  const rings = Math.ceil(N / perRing);
  const STEP = 360 / perRing;

  const [logoImg, bumpImg, atlas] = await Promise.all([
    loadImage(opts.logoSrc),
    loadImage(opts.logoBumpSrc),
    buildAtlas(opts.images),
  ]);

  const dpr = window.devicePixelRatio || 1;
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(dpr, 1.5));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.setClearColor(BG, 1);
  renderer.autoClear = false;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new Scene();
  const camera = new PerspectiveCamera(CAM_FOV, 1, 0.1, 100);
  camera.position.set(0, 0, CAM_Z);

  const disposables: Array<{ dispose(): void }> = [];

  /* ---------- grid latar (scene & kamera sendiri, sama dgn BackgroundGrid) ---------- */
  const gridScene = new Scene();
  const gridCamera = new PerspectiveCamera(52, 1, 0.1, 300);
  gridCamera.position.set(0, 0, 10);
  const gridMat = new LineBasicMaterial({ color: NAVY, transparent: true, opacity: 0.16, depthWrite: false, toneMapped: false });
  let grid = createGrid(false);
  let gridLines = new LineSegments(grid.geo, gridMat);
  gridScene.add(gridLines);
  disposables.push(gridMat);
  let gridTall = false;
  let gridPos = 0;
  let gridTarget = 0;
  const gridHalf = () => Math.max(grid.period * 0.5, 1e-4);
  const gridWrap = (v: number) => {
    const t = Math.max(grid.period, 2e-4);
    let r = ((v % t) + t) % t;
    if (r >= gridHalf()) r -= t;
    return r;
  };
  const gridShortest = (from: number, to: number) => {
    const t = Math.max(grid.period, 2e-4);
    let d = to - from;
    while (d > gridHalf()) d -= t;
    while (d < -gridHalf()) d += t;
    return d;
  };

  /* ---------- environment pantulan logo (dibuat sekali) ---------- */
  {
    const envScene = new Scene();
    const sg = new SphereGeometry(40, 32, 16);
    const pos = sg.attributes.position;
    const cols: number[] = [];
    const top = new Color(0.85, 0.88, 1.0);
    const mid = new Color(1.0, 0.75, 0.82);
    const bot = new Color(0.55, 0.6, 0.85);
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 40;
      const c = new Color();
      if (y > 0) c.copy(mid).lerp(top, Math.pow(y, 0.6));
      else c.copy(mid).lerp(bot, Math.pow(-y, 0.5));
      cols.push(c.r * 0.55, c.g * 0.55, c.b * 0.6);
    }
    sg.setAttribute("color", new Float32BufferAttribute(cols, 3));
    const sm = new MeshBasicMaterial({ vertexColors: true, side: BackSide });
    envScene.add(new Mesh(sg, sm));
    const tmp: Array<{ dispose(): void }> = [sg, sm];
    const panel = (w: number, h: number, x: number, y: number, z: number, k: number) => {
      const pg = new PlaneGeometry(w, h);
      const pm = new MeshBasicMaterial({ color: new Color(k, k, k), side: DoubleSide });
      const m = new Mesh(pg, pm);
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      envScene.add(m);
      tmp.push(pg, pm);
    };
    panel(26, 10, -14, 18, 14, 7);
    panel(5, 30, 24, 2, 8, 6);
    panel(5, 30, -26, 0, -6, 4);
    panel(30, 6, 0, -14, 18, 3);
    panel(18, 18, 0, 6, -28, 3);
    const pmrem = new PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(envScene, 0.02);
    scene.environment = envRT.texture;
    pmrem.dispose();
    tmp.forEach((d) => d.dispose());
    disposables.push(envRT);
  }
  const key = new DirectionalLight(0xffffff, 0.9 * Math.PI);
  key.position.set(-3, 5, 6);
  scene.add(key);
  const back = new DirectionalLight(0xffd6e0, 0.8 * Math.PI);
  back.position.set(3, 2, -6);
  scene.add(back);

  /* ---------- logo 3D (ekstrusi siluet) ---------- */
  const S = LOGO_SIZE;
  const K = 3.0 / S;
  const shapeFrom = (pts: [number, number][]) => {
    const sh = new Shape();
    pts.forEach(([x, y], i) => (i ? sh.lineTo(x, S - y) : sh.moveTo(x, S - y)));
    sh.closePath();
    return sh;
  };
  const center = (pts: [number, number][]) => {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [x, yy] of pts) {
      const y = S - yy;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x);
      y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  };
  const part = (pts: [number, number][], o: { depth: number; bt: number; bs: number }) => {
    const geo = new ExtrudeGeometry(shapeFrom(pts), {
      depth: o.depth, bevelEnabled: true, bevelThickness: o.bt, bevelSize: o.bs, bevelOffset: -o.bs,
      bevelSegments: 5, curveSegments: 1, steps: 1,
    });
    const pa = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < pa.count; i++) uv.setXY(i, pa.getX(i) / S, pa.getY(i) / S);
    const c = center(pts);
    geo.translate(-c.cx, -c.cy, -o.depth / 2);
    geo.scale(K, K, K);
    disposables.push(geo);
    return { geo, ...c };
  };

  const logoTex = new Texture(logoImg);
  logoTex.colorSpace = SRGBColorSpace;
  logoTex.anisotropy = maxAniso;
  logoTex.needsUpdate = true;
  const bumpTex = new Texture(bumpImg);
  bumpTex.anisotropy = maxAniso;
  bumpTex.needsUpdate = true;
  const faceMat = new MeshPhysicalMaterial({
    map: logoTex, bumpMap: bumpTex, bumpScale: FACE_BUMP, roughness: 0.42, metalness: 0,
    clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.7,
  });
  const sideMat = new MeshPhysicalMaterial({
    color: new Color(0xff8fab), roughness: 0.28, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 0.75,
  });
  const logoMats = [faceMat, sideMat];
  disposables.push(logoTex, bumpTex, faceMat, sideMat);

  const logo = new Group();
  scene.add(logo);
  const mainShape = LOGO_SHAPES.find((s) => s.kind === "main")!;
  const body = part(mainShape.pts, { depth: 64, bt: 24, bs: 15 });
  logo.add(new Mesh(body.geo, logoMats));
  LOGO_SHAPES.filter((s) => s.kind === "orb").forEach((s) => {
    const p = part(s.pts, { depth: 22, bt: 18, bs: 5 });
    const m = new Mesh(p.geo, logoMats);
    m.position.set((p.cx - body.cx) * K, (p.cy - body.cy) * K, 0.26);
    logo.add(m);
  });
  logo.scale.setScalar(LOGO_SCALE);

  /* ---------- kartu: 1 InstancedMesh + atlas ---------- */
  const atlasTex = new CanvasTexture(atlas.canvas);
  atlasTex.colorSpace = NoColorSpace; // nilai sRGB diteruskan apa adanya oleh shader
  atlasTex.minFilter = LinearMipmapLinearFilter;
  atlasTex.anisotropy = Math.min(8, maxAniso);
  const cardGeo = new PlaneGeometry(CARD_W, CARD_H, 6, 16); // segmen untuk gelombang
  const uvAttr = new Float32Array(N * 4);
  slots.forEach((item, i) => uvAttr.set(atlas.uvs.subarray(item * 4, item * 4 + 4), i * 4));
  cardGeo.setAttribute("aUv", new InstancedBufferAttribute(uvAttr, 4));
  const alpha = new InstancedBufferAttribute(new Float32Array(N), 1);
  alpha.setUsage(DynamicDrawUsage);
  cardGeo.setAttribute("aAlpha", alpha);
  const uniforms = { uMap: { value: atlasTex }, uTime: { value: 0 }, uVel: { value: 0 } };
  const cardMat = new ShaderMaterial({ uniforms, vertexShader: CARD_VERT, fragmentShader: CARD_FRAG, transparent: true, side: DoubleSide });
  const cards = new InstancedMesh(cardGeo, cardMat, N);
  cards.instanceMatrix.setUsage(DynamicDrawUsage);
  cards.frustumCulled = false;
  cards.boundingSphere = new Sphere(new Vector3(), RADIUS + 6); // posisi berubah tiap frame
  scene.add(cards);
  disposables.push(atlasTex, cardGeo, cardMat);

  /* ---------- state ---------- */
  let rot = 0;
  let vel = reduceMotion ? 0 : AUTO_SPEED;
  let dragging = false;
  let lastDragT = 0;
  let scrollDeg = 0;
  let scrollTarget = 0;
  let travel = 0;
  let travelTarget = 0;
  const push = new Float32Array(N); // pergeseran vertikal tiap kartu agar berjarak dari logo
  let lastScrollY: number | null = null;
  let waveTarget = 0;
  let wave = 0;
  let hidden: number | null = null;
  let paused = false;
  let inView = true;
  let raf = 0;
  let last = performance.now();
  const t0 = last;
  let front = -1;
  let hover: number | "logo" | null = null;
  let hoverDirty = false;
  const ptr = { cx: -1, cy: -1 };
  const dummy = new Object3D();
  const raycaster = new Raycaster();
  const ndc = new Vector2();
  const m4 = new Matrix4();
  const v3 = new Vector3();
  const pickTargets = [...logo.children, cards];

  /* ---------- ukuran ---------- */
  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const portrait = camera.aspect < 1;
    camera.fov = portrait ? 58 : CAM_FOV;
    camera.position.z = portrait ? 17 : CAM_Z;
    camera.updateProjectionMatrix();
    gridCamera.aspect = w / h;
    gridCamera.updateProjectionMatrix();
    const tall = h / w > 1;
    if (tall !== gridTall) {
      gridTall = tall;
      gridScene.remove(gridLines);
      grid.geo.dispose();
      grid = createGrid(tall);
      gridLines = new LineSegments(grid.geo, gridMat);
      gridScene.add(gridLines);
    }
    if (!raf) draw();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  /* ---------- update & render ---------- */
  const layout = () => {
    const total = rot + scrollDeg;
    // Tinggi total tumpukan baris; posisi y dibungkus (wrap) di rentang ini → kartu turun tanpa ujung.
    const span = rings * ROW_PITCH;
    const half = span / 2;
    let best = -Infinity;
    let bestI = 0;
    for (let i = 0; i < N; i++) {
      const r = Math.floor(i / perRing);
      const j = i % perRing;
      // cincin selang-seling digeser setengah langkah agar kartu tidak bertumpuk vertikal
      const th = (j * STEP + r * (STEP / 2) + total) * RAD;
      const yRing = (r - (rings - 1) / 2) * ROW_PITCH;
      const y0 = yRing + travel;
      const yw = ((((y0 + half) % span) + span) % span) - half;
      const x = RADIUS * Math.sin(th);
      const z = RADIUS * Math.cos(th);
      // Jaga jarak dari logo: kartu yang di layar akan tertutup logo didorong naik/turun secukupnya
      // sampai tepinya berjarak LOGO_GAP dari logo (tidak dipudarkan). Dihaluskan per kartu agar mengalir.
      const camZ = camera.position.z;
      const depth = camZ - z;
      const overlapX = LOGO_HALF / camZ + CARD_W / 2 / depth;
      const wx = 1 - smooth(overlapX, overlapX + 0.05, Math.abs(x) / depth);
      const wz = 1 - smooth(0.5, 2.5, z); // kartu di depan logo sudah dipudarkan (nearCam)
      const req = (depth * (LOGO_HALF + LOGO_GAP)) / camZ + CARD_H / 2;
      const want = Math.abs(yw) < req ? (Math.sign(yw) || 1) * (req - Math.abs(yw)) : 0;
      push[i] += (want * wx * wz - push[i]) * 0.12;
      const y = yw + push[i];
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, th + Math.PI, 0); // menghadap ke dalam (ke logo), seperti k95
      dummy.updateMatrix();
      cards.setMatrixAt(i, dummy.matrix);
      // Kartu yang terlalu dekat kamera (bagian depan cincin) dipudarkan; kartu di ujung atas/bawah
      // juga dipudarkan agar perpindahan wrap tidak terlihat.
      const nearCam = smooth(1.6, 3.2, z);
      const edgeY = smooth(half - 1.3, half - 0.15, Math.abs(yw));
      const op = i === hidden ? 0 : (1 - nearCam) * (1 - edgeY);
      alpha.setX(i, op);
      const score = (z + RADIUS) * op;
      if (score > best) {
        best = score;
        bestI = i;
      }
    }
    cards.instanceMatrix.needsUpdate = true;
    alpha.needsUpdate = true;
    const item = slots[bestI];
    if (item !== front) {
      front = item;
      opts.onFront?.(item);
    }
  };

  const draw = () => {
    renderer.clear();
    renderer.render(gridScene, gridCamera);
    renderer.clearDepth();
    renderer.render(scene, camera);
  };

  const updateHover = () => {
    if (!hoverDirty || dragging) return;
    hoverDirty = false;
    const p = ptr.cx < 0 ? null : pick(ptr.cx, ptr.cy);
    const target = p === null ? null : p.kind === "logo" ? "logo" : slots[p.instance];
    if (target !== hover) {
      hover = target;
      opts.onHover?.(target);
    }
  };

  const shouldRun = () => !paused && inView && !document.hidden;

  const frame = (now: number) => {
    raf = 0;
    if (!shouldRun()) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = (now - t0) / 1000;
    if (!dragging) {
      rot += vel * dt;
      vel += ((reduceMotion ? 0 : AUTO_SPEED) - vel) * Math.min(1, dt * 1.6);
    }
    scrollDeg += (scrollTarget - scrollDeg) * Math.min(1, dt * (reduceMotion ? 30 : 2.5));
    // kecepatan gelombang: konstanta sama dgn DistortManager (lerp .09, decay .965)
    wave += (waveTarget - wave) * 0.09;
    waveTarget *= 0.965;
    if (wave < 1e-4) wave = 0;
    uniforms.uVel.value = reduceMotion ? 0 : wave;
    uniforms.uTime.value = t;
    // grid: smoothing .08 (sama dgn BackgroundGrid)
    const d = gridShortest(gridPos, gridTarget);
    gridPos = Math.abs(d) > 1e-4 ? gridWrap(gridPos + d * 0.08) : gridTarget;
    gridLines.position.y = gridPos;
    travel += (travelTarget - travel) * (reduceMotion ? 1 : 0.05);
    layout();
    // logo hanya berputar, tidak mengikuti kursor
    logo.rotation.y = reduceMotion ? 0.6 : t * 0.3;
    draw();
    updateHover();
    raf = requestAnimationFrame(frame);
  };

  const kick = () => {
    if (!raf && shouldRun()) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };

  const io = new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    kick();
  });
  io.observe(canvas);
  const onVis = () => kick();
  document.addEventListener("visibilitychange", onVis);
  const onPointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    ptr.cx = inside ? e.clientX : -1;
    ptr.cy = inside ? e.clientY : -1;
    hoverDirty = true;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  /* ---------- API ---------- */
  function pick(clientX: number, clientY: number): Pick | null {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(pickTargets, false);
    for (const h of hits) {
      if (h.object === cards) {
        if (h.instanceId !== undefined && alpha.getX(h.instanceId) > 0.35) return { kind: "card", instance: h.instanceId };
        continue; // kartu pudar: tembus
      }
      return { kind: "logo" };
    }
    return null;
  }

  function rectOf(instance: number): Rect | null {
    const r = canvas.getBoundingClientRect();
    cards.getMatrixAt(instance, m4);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      v3.set((cx * CARD_W) / 2, (cy * CARD_H) / 2, 0).applyMatrix4(m4).project(camera);
      const sx = r.left + ((v3.x + 1) / 2) * r.width;
      const sy = r.top + ((1 - v3.y) / 2) * r.height;
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx);
      y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
    if (!isFinite(x0)) return null;
    return { left: x0, top: y0, width: x1 - x0, height: y1 - y0 };
  }

  resize();
  kick();

  return {
    setScroll(turns, scrollY) {
      scrollTarget = turns * 360;
      if (lastScrollY !== null) {
        const delta = scrollY - lastScrollY;
        if (delta !== 0) {
          gridTarget = gridWrap(gridTarget - delta * 0.003); // scrollParallax .003
          travelTarget -= delta * SCROLL_TRAVEL; // kartu ikut turun saat scroll turun
          waveTarget = Math.min(5, Math.abs(delta) * 0.25); // VEL_SCALE .25, clamp 5
        }
      }
      lastScrollY = scrollY;
    },
    setPaused(p) {
      paused = p;
      kick();
    },
    drag(dx) {
      const now = performance.now();
      const dtMs = Math.max(1, now - lastDragT);
      dragging = true;
      rot += dx * 0.2;
      vel = (dx * 0.2) / (dtMs / 1000);
      lastDragT = now;
    },
    release() {
      dragging = false;
      vel = Math.max(-240, Math.min(240, vel));
      if (Math.abs(vel) < 1 && !reduceMotion) vel = AUTO_SPEED;
    },
    pick,
    rectOf,
    findVisible(item) {
      let best: { instance: number; rect: Rect } | null = null;
      for (let i = 0; i < N; i++) {
        if (slots[i] !== item || alpha.getX(i) < 0.6) continue;
        const rect = rectOf(i);
        if (!rect) continue;
        const visible =
          rect.left + rect.width > 0 && rect.left < window.innerWidth && rect.top + rect.height > 0 && rect.top < window.innerHeight;
        if (visible && (!best || rect.width * rect.height > best.rect.width * best.rect.height)) best = { instance: i, rect };
      }
      return best;
    },
    setHidden(instance) {
      hidden = instance;
      if (!raf) {
        layout();
        draw();
      }
    },
    dispose() {
      cancelAnimationFrame(raf);
      raf = 0;
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onPointer);
      grid.geo.dispose();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    },
  };
}
