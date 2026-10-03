/**
 * Scene WebGL hero beranda (ala k95.it): logo BEM UI 3D di tengah, DIBUNGKUS cincin/spiral
 * kartu proker 4:3 yang berputar otomatis, di dalam dinding grid melengkung.
 * Diadaptasi dari paket bem-ui-3d (Three.js r128) ke modul `three` modern.
 *
 * Efisiensi:
 * - Semua kartu = 1 InstancedMesh + 1 texture atlas → 1 draw call.
 * - Loop render berhenti saat hero tidak terlihat, tab tersembunyi, atau viewer proker terbuka.
 * - Pixel ratio dibatasi, environment map dibuat sekali, bevel logo ringan.
 */
import {
  ACESFilmicToneMapping,
  BackSide,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  DynamicDrawUsage,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  LinearMipmapLinearFilter,
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
  RepeatWrapping,
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

export type OrbitMode = "rings" | "spiral";
export type Rect = { left: number; top: number; width: number; height: number };

export interface OrbitOptions {
  canvas: HTMLCanvasElement;
  /** URL foto sampul tiap proker (index = index item), rasio 4:3. */
  images: string[];
  /** Pemetaan instance kartu → index item. Panjangnya = jumlah kartu. */
  slots: number[];
  perRing: number;
  logoSrc: string;
  logoBumpSrc: string;
  bgColor: string;
  reduceMotion: boolean;
  /** Kecepatan putar otomatis (derajat/detik). */
  autoSpeed?: number;
  onHover?: (item: number | null) => void;
  onFront?: (item: number) => void;
}

export interface OrbitController {
  setMode(mode: OrbitMode): void;
  /** Putaran tambahan dari scroll (dalam satuan putaran penuh). */
  setScrollTurns(turns: number): void;
  setPaused(paused: boolean): void;
  drag(dxPx: number): void;
  release(): void;
  /** Instance kartu di bawah titik layar (null jika kosong / tertutup logo). */
  pick(clientX: number, clientY: number): number | null;
  rectOf(instance: number): Rect | null;
  /** Kartu terlihat terbesar yang menampilkan item tertentu, untuk animasi kembali. */
  findVisible(item: number): { instance: number; rect: Rect } | null;
  setHidden(instance: number | null): void;
  dispose(): void;
}

const RAD = Math.PI / 180;
const RADIUS = 3.7; // cincin membungkus logo
const RING_PITCH = 1.55;
const SPIRAL_PITCH = 1.2;
const CARD_W = 1.4; // 4:3
const CARD_H = 1.05;
const DEFAULT_AUTO_SPEED = 6;
/** Kedalaman relief spiral di muka logo (skala bump three.js modern berbeda dari r128). */
const FACE_BUMP = 0.15;

const CARD_VERT = /* glsl */ `
attribute vec4 aUv;
attribute float aAlpha;
varying vec2 vLocal;
varying vec4 vRect;
varying float vAlpha;
void main() {
  vLocal = uv;
  vRect = aUv;
  vAlpha = aAlpha;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}`;

// Sisi belakang kartu dicerminkan supaya foto tidak terbalik saat terlihat dari belakang logo.
const CARD_FRAG = /* glsl */ `
uniform sampler2D uMap;
varying vec2 vLocal;
varying vec4 vRect;
varying float vAlpha;
void main() {
  if (vAlpha < 0.01) discard;
  vec2 l = vec2(gl_FrontFacing ? vLocal.x : 1.0 - vLocal.x, vLocal.y);
  vec3 c = texture2D(uMap, vRect.xy + l * vRect.zw).rgb;
  gl_FragColor = vec4(gl_FrontFacing ? c : c * 0.82, vAlpha);
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

/** Gabungkan semua foto sampul ke satu canvas atlas (sel 4:3) + hitung UV tiap sel. */
async function buildAtlas(urls: string[], fallback: string) {
  const imgs = await Promise.all(urls.map((u) => loadImage(u).catch(() => null)));
  const cols = Math.min(6, urls.length);
  const rows = Math.ceil(urls.length / cols);
  let cw = 400;
  let ch = 300;
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
    g.fillStyle = fallback;
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

export async function createOrbit(opts: OrbitOptions): Promise<OrbitController> {
  const { canvas, slots, perRing, reduceMotion } = opts;
  const AUTO_SPEED = opts.autoSpeed ?? DEFAULT_AUTO_SPEED;
  const N = slots.length;
  const rings = Math.ceil(N / perRing);
  const STEP = 360 / perRing;

  const [logoImg, bumpImg, atlas] = await Promise.all([
    loadImage(opts.logoSrc),
    loadImage(opts.logoBumpSrc),
    buildAtlas(opts.images, "#171d40"),
  ]);

  const dpr = window.devicePixelRatio || 1;
  const renderer = new WebGLRenderer({ canvas, antialias: dpr < 2, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(dpr, 1.5));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new Scene();
  scene.background = new Color(opts.bgColor);
  const camera = new PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 11.5);

  const disposables: Array<{ dispose(): void }> = [];

  /* ---------- environment pantulan (dibuat sekali) ---------- */
  {
    const envScene = new Scene();
    const sg = new SphereGeometry(40, 32, 16);
    const pos = sg.attributes.position;
    const cols: number[] = [];
    const top = new Color(0.55, 0.65, 1.0);
    const mid = new Color(1.0, 0.55, 0.7);
    const bot = new Color(0.01, 0.01, 0.45);
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 40;
      const c = new Color();
      if (y > 0) c.copy(mid).lerp(top, Math.pow(y, 0.6));
      else c.copy(mid).lerp(bot, Math.pow(-y, 0.5));
      cols.push(c.r * 0.4, c.g * 0.4, c.b * 0.5);
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
  // Lampu dari belakang agar sisi belakang logo tidak hitam saat berputar.
  const back = new DirectionalLight(0xffd6e0, 0.8 * Math.PI);
  back.position.set(3, 2, -6);
  scene.add(back);

  /* ---------- dinding grid melengkung ---------- */
  {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    g.fillStyle = opts.bgColor;
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = "rgba(156,179,211,0.16)"; // --blue-soft tipis
    g.fillRect(0, 0, 128, 3);
    g.fillRect(0, 0, 3, 128);
    const t = new CanvasTexture(c);
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(94, 60);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = maxAniso;
    const geo = new CylinderGeometry(15, 15, 60, 64, 1, true);
    const mat = new MeshBasicMaterial({ map: t, side: BackSide, toneMapped: false });
    scene.add(new Mesh(geo, mat));
    disposables.push(t, geo, mat);
  }

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
    // UV planar dari posisi → tekstur logo menempel di muka depan.
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
  const orbs = LOGO_SHAPES.filter((s) => s.kind === "orb").map((s, i) => {
    const p = part(s.pts, { depth: 22, bt: 18, bs: 5 });
    const m = new Mesh(p.geo, logoMats);
    m.userData.base = new Vector3((p.cx - body.cx) * K, (p.cy - body.cy) * K, 0.26);
    m.userData.phase = i * 2.1;
    m.position.copy(m.userData.base);
    logo.add(m);
    return m;
  });
  logo.scale.setScalar(1.2);

  /* ---------- kartu: 1 InstancedMesh + atlas ---------- */
  const atlasTex = new CanvasTexture(atlas.canvas);
  atlasTex.colorSpace = NoColorSpace; // nilai sRGB diteruskan apa adanya oleh shader
  atlasTex.minFilter = LinearMipmapLinearFilter;
  atlasTex.anisotropy = Math.min(8, maxAniso);
  const cardGeo = new PlaneGeometry(CARD_W, CARD_H);
  const uvAttr = new Float32Array(N * 4);
  slots.forEach((item, i) => uvAttr.set(atlas.uvs.subarray(item * 4, item * 4 + 4), i * 4));
  cardGeo.setAttribute("aUv", new InstancedBufferAttribute(uvAttr, 4));
  const alpha = new InstancedBufferAttribute(new Float32Array(N), 1);
  alpha.setUsage(DynamicDrawUsage);
  cardGeo.setAttribute("aAlpha", alpha);
  const cardMat = new ShaderMaterial({
    uniforms: { uMap: { value: atlasTex } },
    vertexShader: CARD_VERT,
    fragmentShader: CARD_FRAG,
    transparent: true,
    side: DoubleSide,
  });
  const cards = new InstancedMesh(cardGeo, cardMat, N);
  cards.instanceMatrix.setUsage(DynamicDrawUsage);
  cards.frustumCulled = false;
  cards.boundingSphere = new Sphere(new Vector3(), RADIUS + 5); // posisi berubah tiap frame
  scene.add(cards);
  disposables.push(atlasTex, cardGeo, cardMat);

  /* ---------- state ---------- */
  let rot = 0;
  let vel = reduceMotion ? 0 : AUTO_SPEED;
  let dragging = false;
  let lastDragT = 0;
  let mode = 0;
  let modeTarget = 0;
  let scrollDeg = 0;
  let scrollTarget = 0;
  let hidden: number | null = null;
  let paused = false;
  let inView = true;
  let raf = 0;
  let last = performance.now();
  let front = -1;
  let hover: number | null = null;
  let hoverDirty = false;
  const ptr = { x: 0, y: 0, cx: -1, cy: -1 };
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
    camera.fov = portrait ? 52 : 40;
    camera.position.z = portrait ? 15 : 11.5;
    camera.updateProjectionMatrix();
    if (!raf) renderer.render(scene, camera);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  /* ---------- update & render ---------- */
  const layout = () => {
    const m = mode;
    const total = rot + scrollDeg;
    const span = ((N * STEP) / 360) * SPIRAL_PITCH;
    let best = -Infinity;
    let bestI = 0;
    for (let i = 0; i < N; i++) {
      const r = Math.floor(i / perRing);
      const j = i % perRing;
      // cincin selang-seling digeser setengah langkah agar kartu tidak bertumpuk vertikal
      const th = (j * STEP + r * (STEP / 2) * (1 - m) + total) * RAD;
      const yRing = ((rings - 1) / 2 - r) * RING_PITCH;
      let ySp = ((i * STEP + total) / 360) * SPIRAL_PITCH - span / 2;
      ySp = ((((ySp + span / 2) % span) + span) % span) - span / 2;
      const y = yRing + (ySp - yRing) * m;
      const x = RADIUS * Math.sin(th);
      const z = RADIUS * Math.cos(th);
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, th, 0); // menghadap keluar
      dummy.updateMatrix();
      cards.setMatrixAt(i, dummy.matrix);
      // Kartu yang lewat tepat di depan logo dipudarkan agar logo tetap terlihat.
      const blockLogo = smooth(1.6, 2.6, z) * (1 - smooth(1.0, 1.7, Math.abs(x))) * (1 - smooth(1.7, 2.1, Math.abs(y)));
      const op = i === hidden ? 0 : (1 - blockLogo) * (1 - smooth(2.6, 3.4, Math.abs(y)));
      alpha.setX(i, op);
      const score = z * op;
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

  const animateLogo = (t: number) => {
    logo.rotation.y = (reduceMotion ? 0.6 : t * 0.5) + ptr.x * 0.7;
    logo.rotation.x = ptr.y * 0.35 + (reduceMotion ? 0 : Math.sin(t * 0.6) * 0.07);
    logo.rotation.z = reduceMotion ? 0 : Math.sin(t * 0.4) * 0.05;
    logo.position.y = reduceMotion ? 0 : Math.sin(t * 0.9) * 0.08;
    for (const o of orbs) {
      const b = o.userData.base as Vector3;
      const ph = o.userData.phase as number;
      o.position.set(
        b.x,
        b.y + (reduceMotion ? 0 : Math.sin(t * 1.3 + ph) * 0.06),
        b.z + (reduceMotion ? 0 : Math.cos(t * 1.1 + ph) * 0.05),
      );
    }
  };

  const updateHover = () => {
    if (!hoverDirty || dragging) return;
    hoverDirty = false;
    const inst = ptr.cx < 0 ? null : pick(ptr.cx, ptr.cy);
    const item = inst === null ? null : slots[inst];
    if (item !== hover) {
      hover = item;
      opts.onHover?.(item);
    }
  };

  const shouldRun = () => !paused && inView && !document.hidden;

  const frame = (now: number) => {
    raf = 0;
    if (!shouldRun()) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now / 1000;
    if (!dragging) {
      rot += vel * dt;
      vel += ((reduceMotion ? 0 : AUTO_SPEED) - vel) * Math.min(1, dt * 1.6);
    }
    scrollDeg += (scrollTarget - scrollDeg) * Math.min(1, dt * (reduceMotion ? 30 : 5));
    mode += (modeTarget - mode) * Math.min(1, dt * 3.2);
    layout();
    animateLogo(t);
    renderer.render(scene, camera);
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
    ptr.x = (e.clientX - r.left) / r.width - 0.5;
    ptr.y = (e.clientY - r.top) / r.height - 0.5;
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    ptr.cx = inside ? e.clientX : -1;
    ptr.cy = inside ? e.clientY : -1;
    hoverDirty = true;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  /* ---------- API ---------- */
  function pick(clientX: number, clientY: number): number | null {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(pickTargets, false);
    for (const h of hits) {
      if (h.object === cards) {
        if (h.instanceId !== undefined && alpha.getX(h.instanceId) > 0.35) return h.instanceId;
        continue; // kartu pudar: tembus
      }
      return null; // tertutup logo
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

  const renderOnce = () => {
    layout();
    renderer.render(scene, camera);
  };

  resize();
  kick();

  return {
    setMode(next) {
      modeTarget = next === "spiral" ? 1 : 0;
      kick();
    },
    setScrollTurns(turns) {
      scrollTarget = turns * 360;
    },
    setPaused(p) {
      paused = p;
      kick();
    },
    drag(dx) {
      const now = performance.now();
      const dtMs = Math.max(1, now - lastDragT);
      dragging = true;
      rot += dx * 0.25;
      vel = (dx * 0.25) / (dtMs / 1000);
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
      if (!raf) renderOnce();
    },
    dispose() {
      cancelAnimationFrame(raf);
      raf = 0;
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onPointer);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    },
  };
}
