import type * as THREE_NS from "three";
import type Lenis from "lenis";

type Three = typeof THREE_NS;

type Entry = {
  el: HTMLElement;
  src: string;
  mesh: THREE_NS.Mesh | null;
  material: THREE_NS.ShaderMaterial | null;
  texture: THREE_NS.Texture | null;
  img: HTMLImageElement | null;
  ready: boolean;
  inView: boolean;
  loadId: number;
};

/* Shader di-port dari canvas "shared-wave" k95: plane per media, gelombang sinus di sumbu Z
   yang amplitudonya mengikuti kecepatan scroll, plus RGB-shift + sedikit distorsi Y. */
const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uScrollVelocity;
  uniform float uMoohStrength;
  uniform float uMoohFrequency;
  varying vec2 vUv;
  varying float vWave;
  void main() {
    vUv = uv;
    vec3 newPosition = position;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    float sinPhase = sin(worldPosition.y * uMoohFrequency + uTime * 0.8);
    float waveBase = sinPhase * uScrollVelocity;
    vWave = waveBase * 0.1;
    newPosition.z += waveBase * uMoohStrength * 0.5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uScrollVelocity;
  uniform float uTargetAspect;
  uniform float uSourceAspect;
  uniform float uMoohRgbShift;
  uniform float uMoohDistortion;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vWave;

  // object-fit: cover di dalam shader
  vec2 cover(vec2 uv) {
    if (uSourceAspect <= 0.0) return uv;
    vec2 r = uv;
    if (uTargetAspect > uSourceAspect) r.y = 0.5 + (uv.y - 0.5) * (uSourceAspect / uTargetAspect);
    else r.x = 0.5 + (uv.x - 0.5) * (uTargetAspect / uSourceAspect);
    return r;
  }

  void main() {
    vec2 newUv = vUv;
    float reduced = uScrollVelocity * 0.015;
    newUv.y += sin(newUv.x * 10.0) * reduced * uMoohDistortion;
    float shift = reduced * uMoohRgbShift;
    float r = texture2D(uTexture, cover(newUv + vec2(shift, 0.0))).r;
    float g = texture2D(uTexture, cover(newUv)).g;
    float b = texture2D(uTexture, cover(newUv - vec2(shift, 0.0))).b;
    vec4 color = vec4(r, g, b, 1.0);
    color.rgb += vWave * 0.1 * vec3(0.2, 0.0, 0.3);
    color.a *= uOpacity;
    gl_FragColor = color;
  }
`;

// konstanta velocity dari k95: skala 0.25, clamp 5
const VEL_SCALE = 0.25;
const VEL_MAX = 5;

export class DistortManager {
  private entries = new Map<HTMLElement, Entry>();
  private THREE: Three | null = null;
  private renderer: THREE_NS.WebGLRenderer | null = null;
  private scene: THREE_NS.Scene | null = null;
  private camera: THREE_NS.PerspectiveCamera | null = null;
  private geometry: THREE_NS.PlaneGeometry | null = null;
  private uniforms: Record<string, { value: number }> = {};
  private io: IntersectionObserver | null = null;
  private raf = 0;
  private canvas: HTMLCanvasElement | null = null;
  private lenis: Lenis | null = null;
  private w = 0;
  private h = 0;
  private velTarget = 0;
  private vel = 0;
  private t0 = 0;
  private disposed = false;
  private gen = 0;
  private readonly fov = 50;

  private camZ(h: number) {
    return h / (2 * Math.tan((this.fov * Math.PI) / 360));
  }

  register(el: HTMLElement, src: string) {
    if (this.entries.has(el)) return this.update(el, src);
    const entry: Entry = { el, src, mesh: null, material: null, texture: null, img: null, ready: false, inView: false, loadId: 0 };
    this.entries.set(el, entry);
    if (this.THREE) this.build(entry);
  }

  update(el: HTMLElement, src: string) {
    const e = this.entries.get(el);
    if (!e || e.src === src) return;
    e.src = src;
    e.ready = false;
    this.setNativeHidden(e, false);
    if (this.THREE && e.inView) this.load(e);
  }

  unregister(el: HTMLElement) {
    const e = this.entries.get(el);
    if (!e) return;
    this.io?.unobserve(el);
    if (e.mesh) this.scene?.remove(e.mesh);
    e.material?.dispose();
    e.texture?.dispose();
    this.setNativeHidden(e, false);
    this.entries.delete(el);
  }

  async init(canvas: HTMLCanvasElement, lenis: Lenis | null): Promise<boolean> {
    const gen = ++this.gen;
    const THREE = await import("three");
    if (gen !== this.gen) return false;
    this.disposed = false;
    this.THREE = THREE;
    this.canvas = canvas;
    this.lenis = lenis;
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: "high-performance" });
    } catch {
      this.renderer = null;
      return false;
    }
    const r = this.renderer;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NoToneMapping;
    r.setClearColor(0x000000, 0);
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(this.fov, 1, 1, 10);
    this.geometry = new THREE.PlaneGeometry(1, 1, 24, 48);
    this.uniforms = {
      uTime: { value: 0 },
      uScrollVelocity: { value: 0 },
      uMoohStrength: { value: 15 },
      uMoohFrequency: { value: 0.0055 },
      uMoohRgbShift: { value: 0.02 },
      uMoohDistortion: { value: 0.05 },
    };
    this.resize();
    window.addEventListener("resize", this.onResize);
    lenis?.on("scroll", this.onScroll);

    this.io = new IntersectionObserver(
      (list) => {
        for (const it of list) {
          const e = this.entries.get(it.target as HTMLElement);
          if (!e) continue;
          e.inView = it.isIntersecting;
          if (e.inView && !e.img) this.load(e);
        }
      },
      { rootMargin: "400px 0px" }
    );
    this.t0 = performance.now();
    this.entries.forEach((e) => this.build(e));
    this.raf = requestAnimationFrame(this.tick);
    return true;
  }

  private onResize = () => this.resize();

  private resize() {
    if (!this.renderer || !this.camera) return;
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.camera.aspect = this.w / Math.max(1, this.h);
    this.camera.position.z = this.camZ(this.h);
    this.camera.far = this.camZ(this.h) * 4;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.w, this.h, false);
  }

  private onScroll = (e: { velocity: number }) => {
    let v = (e.velocity ?? 0) * VEL_SCALE;
    v = Math.max(-VEL_MAX, Math.min(VEL_MAX, v));
    this.velTarget = Math.abs(v);
  };

  private build(e: Entry) {
    const THREE = this.THREE!;
    e.material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      uniforms: {
        uTexture: { value: null },
        uTime: this.uniforms.uTime,
        uScrollVelocity: this.uniforms.uScrollVelocity,
        uMoohStrength: this.uniforms.uMoohStrength,
        uMoohFrequency: this.uniforms.uMoohFrequency,
        uMoohRgbShift: this.uniforms.uMoohRgbShift,
        uMoohDistortion: this.uniforms.uMoohDistortion,
        uOpacity: { value: 1 },
        uTargetAspect: { value: 1 },
        uSourceAspect: { value: 1 },
      },
    });
    e.material.toneMapped = false;
    e.mesh = new THREE.Mesh(this.geometry!, e.material);
    e.mesh.visible = false;
    e.mesh.frustumCulled = false;
    this.scene!.add(e.mesh);
    this.io!.observe(e.el);
  }

  private load(e: Entry) {
    const THREE = this.THREE!;
    const id = ++e.loadId;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.src = e.src;
    e.img = img;
    img
      .decode()
      .then(() => {
        if (id !== e.loadId || !e.material) return;
        e.texture?.dispose();
        const tex = new THREE.Texture(img);
        tex.needsUpdate = true;
        tex.generateMipmaps = false;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        e.texture = tex;
        e.material.uniforms.uTexture.value = tex;
        e.material.uniforms.uSourceAspect.value = (img.naturalWidth || 1) / Math.max(img.naturalHeight || 1, 1);
        e.ready = true;
      })
      .catch(() => {
        if (id === e.loadId) e.img = null;
      });
  }

  /** Sembunyikan <img> native saat mesh WebGL yang menggambar (tetap di DOM untuk layout/SEO). */
  private setNativeHidden(e: Entry, hidden: boolean) {
    const img = e.el.querySelector("img");
    if (img) img.style.visibility = hidden ? "hidden" : "";
  }

  private tick = (now: number) => {
    if (this.disposed || !this.renderer || !this.scene || !this.camera) return;
    this.raf = requestAnimationFrame(this.tick);

    this.vel += (this.velTarget - this.vel) * 0.09;
    this.velTarget *= 0.965;
    if (this.vel < 1e-4) this.vel = 0;
    if (this.velTarget < 1e-4) this.velTarget = 0;
    this.uniforms.uTime.value = (now - this.t0) / 1000;
    this.uniforms.uScrollVelocity.value = this.vel;

    const halfW = this.w * 0.5;
    const halfH = this.h * 0.5;
    this.entries.forEach((e) => {
      if (!e.mesh || !e.material) return;
      if (!e.ready || !e.inView) {
        e.mesh.visible = false;
        this.setNativeHidden(e, false);
        return;
      }
      const r = e.el.getBoundingClientRect();
      if (r.bottom < -300 || r.top > this.h + 300 || r.right < 0 || r.left > this.w) {
        e.mesh.visible = false;
        this.setNativeHidden(e, false);
        return;
      }
      e.mesh.visible = true;
      e.mesh.position.set(r.left + r.width / 2 - halfW, -(r.top + r.height / 2 - halfH), 0);
      e.mesh.scale.set(r.width, r.height, 1);
      const u = e.material.uniforms;
      const op = parseFloat(getComputedStyle(e.el).opacity);
      u.uOpacity.value = Number.isFinite(op) ? Math.max(0, Math.min(1, op)) : 1;
      u.uTargetAspect.value = r.width / Math.max(r.height, 1);
      this.setNativeHidden(e, true);
    });
    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    this.gen++;
    this.disposed = true;
    this.THREE = null;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    this.lenis?.off("scroll", this.onScroll);
    this.io?.disconnect();
    this.entries.forEach((e) => {
      e.material?.dispose();
      e.texture?.dispose();
      this.setNativeHidden(e, false);
    });
    this.entries.clear();
    this.geometry?.dispose();
    this.renderer?.dispose();
    this.renderer = null;
  }
}
