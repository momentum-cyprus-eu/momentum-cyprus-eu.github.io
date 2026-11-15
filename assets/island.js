// The island: a live three.js model of Cyprus built from real terrain (cyprus-height.png, see tools/terrain.js),
// drawn as white stone on paper. It sits in a fixed canvas behind the page and shows through the two transparent
// sections: the hero (the whole island, which turns toward you as the hero scrolls away) and Locations (the camera flies from
// the whole island down to Paphos and around it while that section is pinned). 1 world unit = 1 km, north is -z.
import * as THREE from 'three';

const ASSETS = new URL('./', import.meta.url);
const PAPER = 'vec3(0.929, 0.906, 0.863)';
const CITIES = { paphos: [32.42, 34.775] };
const CENTRE = [33.33, 35.06];
const ISLAND_KM = 216;                                   // Cape Arnauti to Cape Andreas, about

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = t => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;

async function terrain(step) {
  const meta = await (await fetch(new URL('cyprus-height.json', ASSETS))).json();
  const blob = await (await fetch(new URL('cyprus-height.png', ASSETS))).blob();
  const bmp = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
  const cv = document.createElement('canvas'); cv.width = bmp.width; cv.height = bmp.height;
  const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(bmp, 0, 0);
  const px = cx.getImageData(0, 0, bmp.width, bmp.height).data;
  const w = Math.floor((bmp.width - 1) / step) + 1, h = Math.floor((bmp.height - 1) / step) + 1, m = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * step * bmp.width + x * step) * 4; m[y * w + x] = px[i] * 256 + px[i + 1] - meta.offset;
  }
  const merc = lat => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
  const kmW = meta.width * meta.metresPerPixel / 1000, kmH = meta.height * meta.metresPerPixel / 1000;
  const uv = (lon, lat) => [(lon - meta.west) / (meta.east - meta.west), (merc(meta.north) - merc(lat)) / (merc(meta.north) - merc(meta.south))];
  const at = (u, v) => m[clamp(Math.round(v * (h - 1)), 0, h - 1) * w + clamp(Math.round(u * (w - 1)), 0, w - 1)];
  return { w, h, m, kmW, kmH, uv, at };
}

const VERT = /* glsl */`
attribute float elev;
varying float vElev; varying vec3 vN; varying vec3 vW;
void main() {
  vElev = elev; vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const FRAG = /* glsl */`
uniform vec3 uSun; uniform vec2 uHalf;
varying float vElev; varying vec3 vN; varying vec3 vW;
float contour(float v, float step, float px) {
  float f = v / step, d = abs(fract(f - 0.5) - 0.5) / max(fwidth(f), 1e-4);
  return 1.0 - smoothstep(px * 0.5 - 0.5, px * 0.5 + 0.5, d);
}
void main() {
  vec3 paper = ${PAPER}, stone = vec3(0.975, 0.962, 0.938), shade = vec3(0.70, 0.66, 0.61);
  vec3 n = normalize(vN);
  float land = smoothstep(-2.0, 4.0, vElev);
  float lam = clamp(dot(n, uSun), 0.0, 1.0), ao = pow(clamp(n.y, 0.0, 1.0), 2.0);
  vec3 lc = mix(shade, stone, smoothstep(0.05, 0.85, lam * 0.85 + 0.15 * ao));
  lc -= contour(vElev, 250.0, 1.0) * 0.035 * land;
  float depth = -vElev;
  vec3 sc = paper - contour(depth, 200.0, 1.0) * vec3(0.06, 0.045, 0.02) * smoothstep(0.0, 60.0, depth)
                  - contour(depth, 1000.0, 1.2) * vec3(0.05, 0.035, 0.0);
  vec3 c = mix(sc, lc, land);
  float coast = 1.0 - smoothstep(0.6, 1.5, abs(vElev) / max(fwidth(vElev), 1e-3));
  c = mix(c, vec3(0.11, 0.16, 0.2), coast * 0.6);
  vec2 e = uHalf - abs(vW.xz);
  float a = smoothstep(0.0, 34.0, min(e.x, e.y));
  gl_FragColor = vec4(mix(paper, c, a), 1.0);
}`;

export async function island({ canvas, hero, loc, labels, onCity, onFrame }) {
  const phone = matchMedia('(max-width: 760px)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' }); }
  catch (e) { document.documentElement.classList.add('no-webgl'); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, phone ? 1.75 : 2));
  renderer.setClearColor(0xEDE7DC, 1);

  const T = await terrain(phone ? 3 : 2);
  const g = new THREE.PlaneGeometry(T.kmW, T.kmH, T.w - 1, T.h - 1);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, EXAG = 4.2;
  for (let i = 0; i < pos.count; i++) pos.setY(i, Math.max(0, T.m[i]) * EXAG / 1000);
  g.setAttribute('elev', new THREE.BufferAttribute(T.m, 1));
  g.computeVertexNormals();
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG,
    uniforms: { uSun: { value: new THREE.Vector3(-0.75, 0.55, -0.35).normalize() }, uHalf: { value: new THREE.Vector2(T.kmW / 2, T.kmH / 2) } } })));

  const world = ([lon, lat]) => { const [u, v] = T.uv(lon, lat); return new THREE.Vector3((u - 0.5) * T.kmW, Math.max(0, T.at(u, v)) * EXAG / 1000, (v - 0.5) * T.kmH); };
  const centre = world(CENTRE); centre.y = 0;
  const city = Object.fromEntries(Object.entries(CITIES).map(([k, ll]) => [k, world(ll)]));

  const camera = new THREE.PerspectiveCamera(phone ? 36 : 30, 1, 1, 4000);
  let W = 1, H = 1;
  const fit = () => {
    W = innerWidth; H = innerHeight;
    renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
  };
  fit(); addEventListener('resize', () => { fit(); wake(); });

  /* a view: what the camera looks at, from how far, how steeply, and where on screen that point sits */
  const distFor = frac => {
    const hf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
    return ISLAND_KM / frac / (2 * hf);
  };
  const views = () => phone ? {
    hero:  { c: centre, d: distFor(0.8), pitch: 58, yaw: -4, sx: 0.5, sy: 0.3 },
    heroOut: { c: centre, d: distFor(0.8) * 0.86, pitch: 46, yaw: -14, sx: 0.5, sy: 0.28 },
    all:   { c: centre, d: distFor(1.0), pitch: 56, yaw: 0, sx: 0.5, sy: 0.3 },
    paphos:   { c: city.paphos, d: 150, pitch: 52, yaw: -30, sx: 0.5, sy: 0.27 },
    paphosNear: { c: city.paphos, d: 104, pitch: 40, yaw: 6, sx: 0.5, sy: 0.27 },
  } : {
    hero:  { c: centre, d: distFor(0.46), pitch: 52, yaw: -3, sx: 0.71, sy: 0.53 },
    heroOut: { c: centre, d: distFor(0.46) * 0.86, pitch: 42, yaw: -14, sx: 0.7, sy: 0.52 },
    all:   { c: centre, d: distFor(0.52), pitch: 50, yaw: 0, sx: 0.66, sy: 0.54 },
    paphos:   { c: city.paphos, d: 128, pitch: 52, yaw: -30, sx: 0.68, sy: 0.5 },
    paphosNear: { c: city.paphos, d: 86, pitch: 40, yaw: 6, sx: 0.68, sy: 0.52 },
  };
  let V = views(); addEventListener('resize', () => { V = views(); });
  const blend = (a, b, t) => ({ c: a.c.clone().lerp(b.c, t), d: mix(a.d, b.d, t), pitch: mix(a.pitch, b.pitch, t),
    yaw: mix(a.yaw, b.yaw, t), sx: mix(a.sx, b.sx, t), sy: mix(a.sy, b.sy, t) });
  /* Locations, along its pinned scroll: the whole island, down to Paphos, then slowly around and closer */
  const ROUTE = [[0, 'all'], [0.36, 'paphos'], [0.52, 'paphosNear'], [1, 'paphosNear']];
  const along = p => {
    for (let i = 1; i < ROUTE.length; i++) if (p <= ROUTE[i][0]) {
      const [p0, a] = ROUTE[i - 1], [p1, b] = ROUTE[i];
      return blend(V[a], V[b], ease(clamp((p - p0) / (p1 - p0), 0, 1)));
    }
    return V[ROUTE[ROUTE.length - 1][1]];
  };
  const cityAt = p => p < 0.15 ? -1 : 0;

  /* the EU's twelve stars, round the whole island while the hero is on screen */
  const ringEl = document.querySelector('.eu-ring'), stars = [];
  if (ringEl) for (let k = 0; k < 12; k++) {
    const i = document.createElement('i'); i.style.setProperty('--k', k);
    i.innerHTML = '<svg viewBox="0 0 24 24"><use href="#i-star"/></svg>'; ringEl.append(i); stars.push(i);
  }
  const right = new THREE.Vector3(), edge = new THREE.Vector3(), ringC = world([33.45, 35.12]); ringC.y = 0;

  /* the town label (Paphos), placed over the canvas; shown in Locations only */
  const tags = Object.keys(CITIES).map((k, i) => {
    const el = document.createElement('div'); el.className = 'pin'; el.dataset.city = k;
    el.innerHTML = `<i></i><span>${k[0].toUpperCase() + k.slice(1)}</span>`; labels.append(el);
    return { el, p: city[k], i };
  });

  const pointer = { x: 0, y: 0 }, lean = { x: 0, y: 0 };
  if (!phone && !reduce) addEventListener('pointermove', e => { pointer.x = e.clientX / W - 0.5; pointer.y = e.clientY / H - 0.5; }, { passive: true });

  let on = { hero: true, loc: false }, current = null, lastCity = -2, t0 = performance.now();
  const v = new THREE.Vector3(), cam = new THREE.Vector3();
  const frame = now => {
    const t = (now - t0) / 1000;
    let view, active = -1, lp = 0;
    if (on.loc) {
      const r = loc.getBoundingClientRect(), p = clamp(-r.top / Math.max(1, r.height - H), 0, 1);
      view = along(p); active = cityAt(p); lp = p;
    } else {
      const r = hero.getBoundingClientRect(), p = clamp(-r.top / Math.max(1, r.height), 0, 1);
      view = blend(V.hero, V.heroOut, ease(p));
      if (ringEl) ringEl.style.opacity = (1 - ease(clamp(p * 1.3, 0, 1))).toFixed(3);
    }
    /* first frame jumps; after that the camera eases after the scroll, so jumps between anchors glide */
    current = !current || reduce ? view : blend(current, view, 0.12);
    lean.x += (pointer.x - lean.x) * 0.05; lean.y += (pointer.y - lean.y) * 0.05;
    const idle = reduce ? 0 : Math.sin(t * 0.12) * 1.2;
    const yaw = THREE.MathUtils.degToRad(current.yaw + idle + lean.x * 5), pitch = THREE.MathUtils.degToRad(current.pitch - lean.y * 3);
    cam.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(current.d).add(current.c);
    camera.position.copy(cam); camera.lookAt(current.c);
    camera.setViewOffset(W, H, (0.5 - current.sx) * W, (0.5 - current.sy) * H, W, H);
    renderer.render(scene, camera);
    for (const g of tags) {
      v.copy(g.p).project(camera);
      g.el.style.transform = `translate(${((v.x * 0.5 + 0.5) * W).toFixed(1)}px, ${((-v.y * 0.5 + 0.5) * H).toFixed(1)}px)`;
      g.el.classList.toggle('on', active === g.i);
      g.el.classList.toggle('dim', active >= 0 && active !== g.i);
    }
    labels.classList.toggle('in-loc', on.loc);
    if (onFrame) { v.copy(tags[0].p).project(camera); onFrame(on.loc, lp, (v.x * 0.5 + 0.5) * W, (-v.y * 0.5 + 0.5) * H); }
    if (ringEl && !on.loc) {
      v.copy(ringC).project(camera);
      const cx = (v.x * 0.5 + 0.5) * W, cy = (-v.y * 0.5 + 0.5) * H;
      right.setFromMatrixColumn(camera.matrixWorld, 0);
      edge.copy(ringC).addScaledVector(right, ISLAND_KM * 0.5).project(camera);
      const r = Math.min(Math.hypot((edge.x * 0.5 + 0.5) * W - cx, (-edge.y * 0.5 + 0.5) * H - cy), W * 0.46);
      stars.forEach((el, k) => { const a = -Math.PI / 2 + k * Math.PI / 6;
        el.style.transform = `translate(${(cx + r * Math.cos(a)).toFixed(1)}px, ${(cy + r * Math.sin(a)).toFixed(1)}px)`; });
      ringEl.classList.add('on');
    }
    if (ringEl && on.loc) ringEl.style.opacity = '0';
    if (!window.__ready && t > 0.3) window.__ready = true;   // tools/snap.js waits for this
    if (active !== lastCity) { lastCity = active; onCity && onCity(active); }
  };
  let running = false;
  function wake() {
    const want = on.hero || on.loc;
    if (want && !running) { renderer.setAnimationLoop(frame); running = true; }
    if (!want && running) { renderer.setAnimationLoop(null); running = false; }
    canvas.style.visibility = labels.style.visibility = want ? 'visible' : 'hidden';
    if (ringEl) ringEl.style.visibility = on.hero ? 'visible' : 'hidden';
  }
  new IntersectionObserver(es => { for (const e of es) on[e.target === hero ? 'hero' : 'loc'] = e.isIntersecting; wake(); },
    { rootMargin: '10% 0px' }).observe(hero);
  new IntersectionObserver(es => { for (const e of es) on[e.target === hero ? 'hero' : 'loc'] = e.isIntersecting; wake(); },
    { rootMargin: '10% 0px' }).observe(loc);
  wake();
  document.documentElement.classList.add('island-ready');
}
