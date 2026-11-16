/* The sunrise between "Who we help" and "Why Cyprus".
   1. A filmed-looking sunrise over the sea (81 frames) stays in place while the scroll plays it: the sun rises out of
      the water and its light spreads across the waves.
   2. When the film ends and the page moves on, a living sun (a small WebGL shader) appears exactly over the filmed sun,
      lifts out of the picture and flies down to the sun icon of "Over 300 days of sunshine", shrinking as it goes,
      while that photograph warms from dawn into full daylight.
   Without the scripts, WebGL or motion, the last frame stands still and the icon is simply there. */
(() => {
  const film = document.querySelector('.sunfilm'), dock = document.querySelector('.sun-dock'), tile = document.querySelector('.t-a');
  const G = window.gsap, root = document.documentElement;
  if (!film || !G || matchMedia('(prefers-reduced-motion: reduce)').matches) { root.classList.add('no-film'); return; }

  /* ---- 1. the film ---- */
  const pin = film.querySelector('.sunfilm-pin'), copy = film.querySelector('.sunfilm-copy'), fc = film.querySelector('.sun-frames'), fx = fc.getContext('2d');
  const phone = innerWidth < 700, N = 81, dir = phone ? 'assets/sunrise-m/' : 'assets/sunrise/';
  /* where the sun sits in the last frame, as a share of the frame, and its radius as a share of the frame's width */
  const SUN = phone ? { x: 0.505, y: 0.564, r: 0.037 } : { x: 0.502, y: 0.564, r: 0.0156 };
  const frames = new Array(N);
  const cover = document.createElement('span'); cover.className = 'sun-cover'; cover.setAttribute('aria-hidden', 'true'); pin.insertBefore(cover, copy);
  let want = 0, drawn = -1;
  const load = i => { if (frames[i]) return; const im = new Image(); im.decoding = 'async'; im.src = `${dir}f${String(i + 1).padStart(3, '0')}.webp`; frames[i] = im; im.onload = () => { drawn = -1; }; };
  load(0); load(N - 1);
  const rest = () => { for (let i = 1; i < N - 1; i++) load(i); };
  ('IntersectionObserver' in window) ? new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { rest(); o.disconnect(); } }, { rootMargin: '150% 0px' }).observe(film) : rest();

  let fit = { x: 0, y: 0, w: 1, h: 1, dpr: 1 };
  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2), w = pin.clientWidth, h = pin.clientHeight;
    fc.width = Math.round(w * dpr); fc.height = Math.round(h * dpr);
    const im = frames[N - 1], iw = (im && im.naturalWidth) || (phone ? 720 : 1600), ih = (im && im.naturalHeight) || (phone ? 960 : 900);
    const s = Math.max(w / iw, h / ih);
    fit = { w: iw * s, h: ih * s, x: (w - iw * s) / 2, y: (h - ih * s) / 2, dpr };
    drawn = -1;
  };
  const paint = () => {
    if (want === drawn) return;
    let i = want; while (i > 0 && !(frames[i] && frames[i].complete && frames[i].naturalWidth)) i--;
    const im = frames[i]; if (!im || !im.complete || !im.naturalWidth) return;
    fx.setTransform(fit.dpr, 0, 0, fit.dpr, 0, 0);
    fx.drawImage(im, fit.x, fit.y, fit.w, fit.h);
    drawn = i === want ? want : -1;
  };
  frames[N - 1].addEventListener('load', size);
  size(); addEventListener('resize', size);

  /* ---- 2. the flying sun ---- */
  const cv = document.createElement('canvas');
  const gl = dock ? cv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true }) : null;
  const R0 = 60, C = Math.round(R0 / 0.36 * 2);
  let U = null;
  if (gl) {
    cv.className = 'sun-gl'; cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv);
    const vs = 'attribute vec2 p;varying vec2 uv;void main(){uv=p;gl_Position=vec4(p,0.,1.);}';
    const fs = `precision highp float;varying vec2 uv;uniform float t,glow;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      void main(){
        float r=length(uv), a=atan(uv.y,uv.x);
        vec3 white=vec3(1.,.985,.94), gold=vec3(1.,.86,.62), amber=vec3(.99,.68,.4);
        float R=.36+.0015*sin(a*7.+t*1.1)+.0012*(n(vec2(a*5.,t*.7))-.5);
        float core=smoothstep(R+.004,R-.006,r), k=r/R;
        vec3 cc=mix(white,gold,smoothstep(.35,1.,k)); cc=mix(cc,amber,smoothstep(.8,1.,k)*.5);
        float fall=smoothstep(1.,.62,r);
        float g=exp(-max(r-R,0.)*6.)*(1.-core)*fall;
        float w1=pow(.5+.5*sin(a*12.+t*.12+n(vec2(a*3.,t*.2))*1.4),12.);
        float w2=pow(.5+.5*sin(a*7.-t*.08+1.3),16.);
        float rays=(w1*.55+w2*.45)*smoothstep(.98,R,r)*(1.-core)*fall*.3;
        float halo=(g*.9+rays)*glow;
        gl_FragColor=vec4(core*cc+mix(amber,gold,.6)*halo,clamp(core+halo,0.,1.));   /* premultiplied */
      }`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prg = gl.createProgram(); gl.attachShader(prg, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prg, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prg);
    if (gl.getProgramParameter(prg, gl.LINK_STATUS)) {
      root.classList.add('sun-live');
      gl.useProgram(prg);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prg, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      U = { t: gl.getUniformLocation(prg, 't'), glow: gl.getUniformLocation(prg, 'glow') };
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      const dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = cv.height = Math.round(C * dpr); cv.style.width = cv.style.height = C + 'px';
      gl.viewport(0, 0, cv.width, cv.height);
    } else cv.remove();
  }

  /* ---- the scroll ---- */
  const clamp = v => Math.min(1, Math.max(0, v)), sm = v => v * v * (3 - 2 * v), lerp = (a, b, k) => a + (b - a) * k;
  let visible = false;
  G.ticker.add(time => {
    const vh = innerHeight, y = scrollY;
    const top = film.getBoundingClientRect().top + y, run = film.offsetHeight - pin.offsetHeight;
    const p = clamp((y - top) / run);                                  /* 0 → 1 while the frame stays in place */
    want = Math.round(p * (N - 1)); paint();
    if (!U) { copy.style.setProperty('--copy', sm(clamp((p - 0.45) / 0.35)).toFixed(3)); return; }

    /* the filmed sun, where it is on the screen right now */
    const pr = pin.getBoundingClientRect();
    const sx = pr.left + fit.x + SUN.x * fit.w, sy = pr.top + fit.y + SUN.y * fit.h, sr = SUN.r * fit.w;
    const d = dock.getBoundingClientRect(), dx = d.left + d.width / 2, dy = d.top + d.height / 2;
    const S1 = top + run, S2 = Math.max(S1 + vh * 0.45, d.top + y + d.height / 2 - vh * 0.6);
    const q = clamp((y - S1) / (S2 - S1));                             /* 0 → 1 while the sun flies */
    /* the words fade as the sun lifts off, and the sky closes over the place where the sun was */
    copy.style.setProperty('--copy', (sm(clamp((p - 0.45) / 0.35)) * (1 - sm(clamp(q / 0.3)))).toFixed(3));
    if (q > 0 && !cover.dataset.c) {
      const px = fx.getImageData(Math.round((fit.x + SUN.x * fit.w + sr * 5) * fit.dpr), Math.round((fit.y + SUN.y * fit.h) * fit.dpr), 1, 1).data;
      cover.dataset.c = `${px[0]},${px[1]},${px[2]}`;
      cover.style.background = `radial-gradient(circle,rgb(${cover.dataset.c}) 0,rgba(${cover.dataset.c},.85) 30%,rgba(${cover.dataset.c},0) 70%)`;
    }
    cover.style.left = (fit.x + SUN.x * fit.w - sr * 6) + 'px'; cover.style.top = (fit.y + SUN.y * fit.h - sr * 6) + 'px';
    cover.style.width = cover.style.height = (sr * 12) + 'px';
    cover.style.opacity = sm(clamp(q / 0.12)).toFixed(3);
    tile.style.setProperty('--lit', sm(clamp((q - 0.55) / 0.45)).toFixed(3));
    dock.style.opacity = q >= 1 ? 1 : 0;
    const show = y > S1 + 1 && q < 1;
    if (show !== visible) { visible = show; cv.style.visibility = show ? 'visible' : 'hidden'; }
    if (!show) return;
    const e = sm(q), ey = q * q;
    const cx = lerp(sx, dx, e), cy = lerp(sy, dy, ey);
    const s = lerp(sr / (R0 * 1.0), (d.width * 0.5) / R0, e) * (1 + Math.sin(q * Math.PI) * 0.9);   /* it swells a little as it lifts off */
    cv.style.transform = `translate3d(${(cx - C / 2 + scrollX).toFixed(1)}px,${(cy - C / 2 + y).toFixed(1)}px,0) scale(${s.toFixed(4)})`;
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(U.t, time);
    gl.uniform1f(U.glow, 0.85 * (1 - Math.pow(q, 1.3)));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  });
})();
