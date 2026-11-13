// Human page background: a slowly turning spiral galaxy made of THREE.Points.
//
// Cheap on purpose: two draw calls (disc + starfield), all particle data built
// once on the CPU, the per-frame work is rotating one object. DPR capped, loop
// stopped while the tab is hidden, one static frame under prefers-reduced-motion.
// Dark theme gets the full additive galaxy; light theme a quieter ink-on-paper
// version. Everything is dynamically imported so a blocked CDN falls back to CSS.

const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const canvas = document.getElementById("galaxy");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch { return false; }
}

function fallback(reason) {
  document.body.classList.add("no-webgl");
  document.body.dataset.galaxy = "fallback:" + reason;
}

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const VERT = `
  attribute float aSize;
  attribute vec3 aColor;
  uniform float uScale;
  varying vec3 vColor;
  void main() {
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = max(aSize * uScale / -mv.z, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;
const FRAG = `
  uniform sampler2D uMap;
  uniform float uAlpha;
  uniform float uInk;
  varying vec3 vColor;
  void main() {
    float a = texture2D(uMap, gl_PointCoord).a * uAlpha;
    gl_FragColor = vec4(vColor * uInk, a);
  }
`;

async function main() {
  if (!canvas) return;
  if (!webglAvailable()) return fallback("no-webgl");

  let THREE;
  try { THREE = await import(THREE_URL); } catch { return fallback("cdn"); }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
  } catch { return fallback("renderer"); }
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); stop(); fallback("context-lost"); });
  renderer.setClearColor(0x000000, 0);

  const small = window.innerWidth < 700 || (window.devicePixelRatio || 1) < 1;
  const COUNT = small ? 22000 : 48000;
  const STARS = small ? 700 : 1600;
  const ARMS = 4, R = 10;

  // Soft round sprite, drawn once on a 2D canvas.
  const sc = document.createElement("canvas");
  sc.width = sc.height = 64;
  const sctx = sc.getContext("2d");
  const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  sctx.fillStyle = grad; sctx.fillRect(0, 0, 64, 64);
  const sprite = new THREE.CanvasTexture(sc);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  camera.position.set(0, 0, 24);

  function makeMaterial(alpha) {
    return new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uMap: { value: sprite }, uScale: { value: 300 }, uAlpha: { value: alpha }, uInk: { value: 1 } },
    });
  }

  // ---- galaxy disc ----
  const rnd = mulberry32(2026);
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
  const pos = new Float32Array(COUNT * 3), colr = new Float32Array(COUNT * 3), size = new Float32Array(COUNT);
  const core = new THREE.Color("#ffd8a0"), teal = new THREE.Color("#22d3a6"), violet = new THREE.Color("#8b6cff"), pink = new THREE.Color("#ff8fb1");
  const c = new THREE.Color();
  for (let i = 0; i < COUNT; i++) {
    const bulge = rnd() < 0.16;
    let x, y, z, t;
    if (bulge) {
      const r = Math.pow(rnd(), 1.6) * R * 0.22;
      const a = rnd() * Math.PI * 2;
      x = Math.cos(a) * r; z = Math.sin(a) * r; y = gauss() * r * 0.5; t = r / R;
    } else {
      const r = (0.05 + 0.95 * Math.pow(rnd(), 0.75)) * R;
      const arm = Math.floor(rnd() * ARMS) * (Math.PI * 2 / ARMS);
      const a = arm + 2.9 * Math.log(1 + r * 0.55) + (rnd() - 0.5) * 0.12;
      // Scatter piles up on the arm: cubed uniform, random sign.
      const spread = (0.12 + 0.1 * r) * Math.pow(rnd(), 2.4) * (rnd() < 0.5 ? -1 : 1) * 2.2;
      const sa = rnd() * Math.PI * 2, sr = Math.abs(gauss()) * 0.35;
      x = Math.cos(a) * r - Math.sin(a) * spread + Math.cos(sa) * sr;
      z = Math.sin(a) * r + Math.cos(a) * spread + Math.sin(sa) * sr;
      y = gauss() * 0.45 * Math.exp(-r / 5);
      t = r / R;
    }
    pos.set([x, y, z], i * 3);
    if (t < 0.12) c.copy(core).lerp(teal, t / 0.12 * 0.35);
    else if (t < 0.5) c.copy(teal).lerp(violet, (t - 0.12) / 0.38);
    else c.copy(violet).lerp(pink, Math.min(1, (t - 0.5) / 0.5) * 0.85);
    const lum = 0.55 + rnd() * 0.45;
    colr.set([c.r * lum, c.g * lum, c.b * lum], i * 3);
    size[i] = (bulge ? 0.9 : 0.6) + rnd() * rnd() * 2.4;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aColor", new THREE.BufferAttribute(colr, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  const discMat = makeMaterial(0.7);
  const disc = new THREE.Points(geo, discMat);
  disc.frustumCulled = false;

  // ---- background starfield (fixed, on a far shell) ----
  const srnd = mulberry32(77);
  const spos = new Float32Array(STARS * 3), scol = new Float32Array(STARS * 3), ssz = new Float32Array(STARS);
  for (let i = 0; i < STARS; i++) {
    const u = srnd() * 2 - 1, a = srnd() * Math.PI * 2, s = Math.sqrt(1 - u * u), d = 60 + srnd() * 30;
    spos.set([s * Math.cos(a) * d, u * d, s * Math.sin(a) * d - 20], i * 3);
    const w = 0.5 + srnd() * 0.5, warm = srnd() < 0.25;
    scol.set(warm ? [w, w * 0.85, w * 0.7] : [w * 0.8, w * 0.9, w], i * 3);
    ssz[i] = 1.4 + srnd() * srnd() * 4;
  }
  const sgeo = new THREE.BufferGeometry();
  sgeo.setAttribute("position", new THREE.BufferAttribute(spos, 3));
  sgeo.setAttribute("aColor", new THREE.BufferAttribute(scol, 3));
  sgeo.setAttribute("aSize", new THREE.BufferAttribute(ssz, 1));
  const starMat = makeMaterial(0.9);
  const stars = new THREE.Points(sgeo, starMat);
  stars.frustumCulled = false;
  scene.add(stars);

  // pivot tilts the disc and carries the screen offset; disc spins inside it.
  const pivot = new THREE.Group();
  pivot.add(disc);
  scene.add(pivot);
  const TILT = 1.05; // ~60 degrees from face-on

  // ---- theme ----
  let hidden = false;
  function applyTheme() {
    // Light theme: the page's own light background reads better than a smeared galaxy.
    const light = root.getAttribute("data-theme") === "light";
    hidden = light;
    canvas.style.display = light ? "none" : "";
    for (const m of [discMat, starMat]) {
      m.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
      m.uniforms.uInk.value = light ? 0.55 : 1;
      m.needsUpdate = true;
    }
    discMat.uniforms.uAlpha.value = light ? 0.16 : 0.7;
    starMat.uniforms.uAlpha.value = light ? 0.0 : 0.9;
    if (!running) draw(staticTime);
  }
  new MutationObserver(applyTheme).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  // ---- size, DPR, pointer, scroll ----
  let dprCap = Math.min(window.devicePixelRatio || 1, 1.75);
  let W = 1, H = 1;
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    renderer.setPixelRatio(dprCap);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    // Point size in pixels at distance z = aSize * scale / z; keep it proportional to the viewport.
    const scale = dprCap * Math.min(H, 1100) * (small ? 0.8 : 1);
    discMat.uniforms.uScale.value = scale * 0.07;
    starMat.uniforms.uScale.value = scale * 0.12;
    // Core sits upper-right behind the hero; on tall narrow screens pull it more central and shrink.
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    base.x = Math.min(halfH * camera.aspect * 0.74, 20) * (W < 700 ? 0.4 : 1);
    base.y = halfH * (W < 700 ? 0.3 : 0.62);
    base.s = W < 700 ? 0.8 : 1.1;
    if (!running) draw(staticTime);
  }
  const base = { x: 0, y: 0, s: 1 };
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 }, scroll = { v: 0, t: 0 };
  if (!reduceMotion) {
    window.addEventListener("pointermove", (e) => {
      pointer.tx = (e.clientX / W - 0.5) * 2;
      pointer.ty = (e.clientY / H - 0.5) * 2;
    }, { passive: true });
    window.addEventListener("scroll", () => { scroll.t = window.scrollY; }, { passive: true });
  }

  const TURN = 210; // seconds per revolution
  function draw(t) {
    if (hidden) return;
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    scroll.v += (scroll.t - scroll.v) * 0.06;
    disc.rotation.y = (t / TURN) * Math.PI * 2;
    pivot.rotation.x = TILT + pointer.y * 0.04;
    pivot.rotation.z = -0.28 + pointer.x * 0.05;
    pivot.position.set(base.x + pointer.x * 0.5, base.y + scroll.v * 0.004, 0);
    pivot.scale.setScalar(base.s);
    stars.rotation.y = t * 0.0006;
    stars.position.x = pointer.x * 0.8;
    renderer.render(scene, camera);
  }

  // ---- loop ----
  let running = false, raf = 0, clockStart = 0, pausedAt = 0;
  const staticTime = 30;
  let slow = 0, frames = 0, last = 0;
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (!clockStart) clockStart = now;
    draw((now - clockStart) / 1000 + staticTime);
    if (last) { frames++; if (now - last > 34) slow++; }
    last = now;
    if (frames === 120) {
      if (slow > 40 && dprCap > 1) { dprCap = 1; resize(); }
      frames = 0; slow = 0;
    }
  }
  function start() {
    if (running || reduceMotion) return;
    running = true; last = 0;
    if (pausedAt) { clockStart += performance.now() - pausedAt; pausedAt = 0; }
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (!running) return;
    running = false; cancelAnimationFrame(raf); pausedAt = performance.now();
  }

  document.addEventListener("visibilitychange", () => { document.hidden ? stop() : start(); });
  window.addEventListener("resize", resize);

  resize();
  applyTheme();
  draw(staticTime);
  document.body.classList.add("galaxy-ready");
  document.body.dataset.galaxy = reduceMotion ? "static" : "webgl";
  start();
}

main().catch(() => fallback("error"));
