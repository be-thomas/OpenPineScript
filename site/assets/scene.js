// Gate background: a slowly scrolling field of 3D candlesticks with a glowing
// moving average ribbon running through every row, the way a Pine plot() does.
//
// Cheap on purpose: two InstancedMesh draw calls for all candles, matrices
// rewritten only when the field scrolls by a whole bar, DPR capped, loop stopped
// while the tab is hidden, and one static frame under prefers-reduced-motion.
// Everything is dynamically imported so a blocked CDN falls back to CSS.

const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const canvas = document.getElementById("scene");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch { return false; }
}

function fallback(reason) {
  document.body.classList.add("no-webgl");
  document.body.dataset.scene = "fallback:" + reason;
}

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main() {
  if (!canvas) return;
  if (!webglAvailable()) return fallback("no-webgl");

  let THREE;
  try { THREE = await import(THREE_URL); } catch { return fallback("cdn"); }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch { return fallback("renderer"); }
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); stop(); fallback("context-lost"); });

  const BG = 0x05060a;
  const ROWS = 13, BARS = 76, DX = 0.5, DZ = 1.7, LEN = BARS + 900;
  const UP = new THREE.Color("#26d9a0"), DOWN = new THREE.Color("#ff5c7a");

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, 9, 34);
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 80);

  scene.add(new THREE.AmbientLight(0xffffff, 1.15));
  const sun = new THREE.DirectionalLight(0xbfa8ff, 1.6);
  sun.position.set(-6, 10, 8);
  scene.add(sun);

  // One random walk per row, mean-reverting so rows stay in a band.
  const rows = [];
  for (let r = 0; r < ROWS; r++) {
    const rnd = mulberry32(1337 + r * 97);
    const o = new Float32Array(LEN), h = new Float32Array(LEN), l = new Float32Array(LEN), c = new Float32Array(LEN), ma = new Float32Array(LEN);
    let p = 1.6 + rnd() * 0.8;
    const base = 1.8 + Math.sin(r * 0.9) * 0.5;
    for (let i = 0; i < LEN; i++) {
      const open = p;
      p += (rnd() - 0.5) * 0.62 + (base - p) * 0.035;
      p = Math.max(0.4, p);
      o[i] = open; c[i] = p;
      h[i] = Math.max(open, p) + rnd() * 0.32;
      l[i] = Math.max(0.05, Math.min(open, p) - rnd() * 0.32);
    }
    let sum = 0;
    for (let i = 0; i < LEN; i++) {
      sum += c[i];
      if (i >= 20) sum -= c[i - 20];
      ma[i] = i >= 19 ? sum / 20 : c[i];
    }
    rows.push({ o, h, l, c, ma });
  }

  const total = ROWS * BARS;
  const box = new THREE.BoxGeometry(1, 1, 1);
  const bodies = new THREE.InstancedMesh(box, new THREE.MeshLambertMaterial({ color: 0xffffff }), total);
  const wicks = new THREE.InstancedMesh(box, new THREE.MeshLambertMaterial({ color: 0xffffff }), total);
  bodies.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  wicks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  bodies.frustumCulled = false; wicks.frustumCulled = false;

  const field = new THREE.Group();
  field.add(bodies, wicks);
  scene.add(field);

  const lines = rows.map((_, r) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(BARS * 3), 3));
    const mat = new THREE.LineBasicMaterial({ color: r % 2 ? 0x8b6cff : 0xffb86b, transparent: true, opacity: 0.85 });
    const line = new THREE.Line(geo, mat);
    line.frustumCulled = false;
    field.add(line);
    return line;
  });

  const grid = new THREE.GridHelper(80, 80, 0x2a3270, 0x14183a);
  grid.position.set(0, -0.02, -12);
  scene.add(grid);

  // Dust.
  const DUST = 260;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(DUST * 3);
  const drnd = mulberry32(9);
  for (let i = 0; i < DUST; i++) {
    dustPos[i * 3] = (drnd() - 0.5) * 36;
    dustPos[i * 3 + 1] = drnd() * 9;
    dustPos[i * 3 + 2] = -drnd() * 24 + 4;
  }
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x9fe9d4, size: 0.05, transparent: true, opacity: 0.55, depthWrite: false }));
  scene.add(dust);

  const m4 = new THREE.Matrix4(), pos = new THREE.Vector3(), scl = new THREE.Vector3(), quat = new THREE.Quaternion();
  const col = new THREE.Color();
  let lastIdx = -1;

  function fillField(idx) {
    const halfW = (BARS - 1) * DX / 2;
    let n = 0;
    for (let r = 0; r < ROWS; r++) {
      const row = rows[r];
      const z = -r * DZ;
      const lp = lines[r].geometry.attributes.position;
      for (let b = 0; b < BARS; b++) {
        const i = idx + b;
        const x = b * DX - halfW;
        const o = row.o[i], c = row.c[i], h = row.h[i], l = row.l[i];
        const up = c >= o;
        // Fade the ends of the row into the background.
        const e = Math.min(b, BARS - 1 - b) / 12;
        const fade = Math.max(0, Math.min(1, e)) * (1 - r / (ROWS * 1.25));

        pos.set(x, (o + c) / 2, z);
        scl.set(0.32, Math.max(Math.abs(c - o), 0.05), 0.32);
        m4.compose(pos, quat, scl); bodies.setMatrixAt(n, m4);
        col.copy(up ? UP : DOWN).multiplyScalar(fade); bodies.setColorAt(n, col);

        pos.set(x, (h + l) / 2, z);
        scl.set(0.045, Math.max(h - l, 0.05), 0.045);
        m4.compose(pos, quat, scl); wicks.setMatrixAt(n, m4);
        col.copy(up ? UP : DOWN).multiplyScalar(fade * 0.7); wicks.setColorAt(n, col);
        n++;

        lp.setXYZ(b, x, row.ma[i] + 0.02, z + 0.05);
      }
      lp.needsUpdate = true;
    }
    bodies.instanceMatrix.needsUpdate = true; wicks.instanceMatrix.needsUpdate = true;
    if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
    if (wicks.instanceColor) wicks.instanceColor.needsUpdate = true;
  }

  // ---- size, DPR, pointer ----
  let dprCap = Math.min(window.devicePixelRatio || 1, 1.75);
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setPixelRatio(dprCap);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Portrait screens need to pull back to keep the field in view.
    camera.fov = w / h < 0.8 ? 62 : 46;
    camera.updateProjectionMatrix();
    if (!running) draw(staticTime);
  }
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!reduceMotion) {
    window.addEventListener("pointermove", (e) => {
      pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  const SPEED = 1.1; // bars per second
  function draw(t) {
    const shift = t * SPEED;
    const idx = Math.floor(shift);
    if (idx !== lastIdx) { fillField(idx); lastIdx = idx; }
    field.position.x = -(shift - idx) * DX;

    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    const sway = reduceMotion ? 0.12 : Math.sin(t * 0.07) * 0.32;
    camera.position.set(Math.sin(sway) * 12 + pointer.x * 1.6, 5.4 - pointer.y * 0.8, 9 + Math.cos(sway) * 2);
    camera.lookAt(pointer.x * 0.8, 1.4, -10);

    const dp = dust.geometry.attributes.position;
    for (let i = 0; i < DUST; i++) {
      let y = dp.getY(i) + 0.0035;
      if (y > 9) y = 0;
      dp.setY(i, y);
    }
    dp.needsUpdate = true;
    renderer.render(scene, camera);
  }

  // ---- loop ----
  let running = false, raf = 0, clockStart = 0, pausedAt = 0, staticTime = 14;
  let slow = 0, frames = 0, last = 0;
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (!clockStart) clockStart = now;
    draw((now - clockStart) / 1000 + staticTime);
    // If the machine struggles, drop to DPR 1 once rather than stutter.
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
  window.stopScene = stop;

  document.addEventListener("visibilitychange", () => { document.hidden ? stop() : start(); });
  window.addEventListener("resize", resize);

  resize();
  draw(staticTime);
  document.body.classList.add("scene-ready");
  document.body.dataset.scene = reduceMotion ? "static" : "webgl";
  if (reduceMotion) document.body.classList.add("static-scene-ok");
  start();
}

main().catch(() => fallback("error"));
