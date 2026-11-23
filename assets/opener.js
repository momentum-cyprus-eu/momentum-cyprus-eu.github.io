/* The opening film (user, 2026-11-23): Momentum's site-opener film plays full screen; when the visitor scrolls
   (wheel, swipe, keys) or presses Skip, the frame freezes and burns away like paper - a glowing ember edge, a charred
   band and scorched paper - and the site's own opening (logo drawing, Itay's arch) plays underneath, then the site.
   Once per visit (sessionStorage mm-opener), never with reduced motion; ?opener=1 forces it for checking.
   Muted autoplay (browsers block sound until a tap): "Sound on" turns the soundtrack on.
   main.js waits for window.__opener (resolved when the burn starts) before starting its own opening. */
(() => {
  const r = document.documentElement, op = document.querySelector('.opener');
  if (!op || !r.classList.contains('opener-on')) { if (op) op.remove(); window.__opener = null; return; }
  let resolveOpener;
  window.__opener = new Promise(res => (resolveOpener = res));
  try { sessionStorage.setItem('mm-opener', '1'); } catch (e) {}

  const v = op.querySelector('.op-video'), cv = op.querySelector('.op-burn'), soundBtn = op.querySelector('.op-sound');
  const small = matchMedia('(max-width: 760px)').matches;
  // ?q=2: the full-HD encode (2026-11-23); bump it whenever the film files are replaced, so cached old films aren't reused
  v.src = (small ? 'assets/video/opener-m.mp4' : 'assets/video/opener.mp4') + '?q=2';
  /* + "make it open straight with sound": try to start with sound; browsers only allow that if the visitor has
     interacted with the site before, so if it is refused the film starts muted and the sound comes on with the
     visitor's first click / tap / key anywhere (a scroll doesn't count as permission in any browser) */
  const setSound = on => {
    v.muted = !on;
    soundBtn.classList.toggle('on', on);
    soundBtn.querySelector('span').textContent = on ? 'Sound off' : 'Sound on';
  };
  v.muted = false;
  v.play().then(() => setSound(true)).catch(() => { setSound(false); v.play().catch(() => {}); });
  const unmuteOnce = e => {
    if (burning || !v.muted || (e.target && e.target.closest && e.target.closest('.op-sound, .op-skip'))) return;
    setSound(true); v.play().catch(() => {});
  };
  ['pointerdown', 'keydown'].forEach(t => addEventListener(t, unmuteOnce, {once: true, capture: true}));
  /* + "at the end of the film make the sheet burn by itself, so nobody has to scroll - there are older users too":
     the last frame (logo + line) holds for a moment, then burns away on its own */
  v.addEventListener('ended', () => { op.classList.add('ended'); setTimeout(burn, 1200); });
  setTimeout(() => op.classList.add('hinting'), 3500);
  // never stuck: if the film can't start, go straight to the site
  setTimeout(() => { if (v.readyState < 2) burn(); }, 8000);

  soundBtn.addEventListener('click', e => {
    e.stopPropagation();
    setSound(v.muted);
    if (!v.muted && v.paused && !burning) v.play().catch(() => {});
  });
  op.querySelector('.op-skip').addEventListener('click', e => { e.stopPropagation(); burn(); });

  /* scrolling in any form starts the burn */
  let touchY = null;
  const onWheel = e => { if (e.deltaY > 4) burn(); e.preventDefault(); };
  const onTouchStart = e => { touchY = e.touches[0].clientY; };
  const onTouchMove = e => { if (touchY !== null && touchY - e.touches[0].clientY > 24) burn(); e.preventDefault(); };
  const onKey = e => { if ([' ', 'ArrowDown', 'PageDown', 'End', 'Enter'].includes(e.key)) { e.preventDefault(); burn(); } };
  addEventListener('wheel', onWheel, {passive: false});
  addEventListener('touchstart', onTouchStart, {passive: true});
  addEventListener('touchmove', onTouchMove, {passive: false});
  addEventListener('keydown', onKey);

  let burning = false;
  function burn() {
    if (burning) return;
    burning = true;
    removeEventListener('wheel', onWheel); removeEventListener('touchmove', onTouchMove); removeEventListener('keydown', onKey);
    op.classList.add('burning');
    // the site starts underneath - a beat later, so the wheel/touch event that started the burn has passed and
    // doesn't scroll the page once Lenis is running again
    setTimeout(resolveOpener, 80);
    v.pause();
    const done = () => {
      op.remove();
      r.classList.remove('opener-on');
    };
    const fade = () => { op.style.transition = 'opacity .9s ease'; op.style.opacity = '0'; setTimeout(done, 950); };
    // fade out the sound with the burn
    const vol0 = v.volume, t0 = performance.now();
    (function sfade() { const k = Math.min(1, (performance.now() - t0) / 1400); v.volume = vol0 * (1 - k); if (k < 1) requestAnimationFrame(sfade); })();

    const gl = cv.getContext('webgl', {premultipliedAlpha: false, alpha: true});
    if (!gl || v.readyState < 2) return fade();
    const dpr = Math.min(1.5, devicePixelRatio || 1), W = Math.round(innerWidth * dpr), H = Math.round(innerHeight * dpr);
    cv.width = W; cv.height = H;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}'));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, `precision mediump float;
      varying vec2 vUv; uniform sampler2D uTex; uniform float uT; uniform vec2 uAspect; uniform vec2 uScale; uniform float uSeed;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}
      float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.03;a*=.5;}return v;}
      void main(){
        vec2 p=vUv*uAspect;
        float n=fbm(p*3.2+uSeed);
        float d=distance(p,vec2(.5,.45)*uAspect);
        float e=d*1.15+n*.6-uT*2.15;          /* distance to the burning front */
        if(e<0.) discard;                      /* burnt through: the site shows */
        vec2 tuv=(vUv-.5)*uScale+.5;
        vec3 col=(tuv.x<0.||tuv.x>1.||tuv.y<0.||tuv.y>1.)?vec3(0.):texture2D(uTex,tuv).rgb;
        col=mix(col,col*vec3(.58,.4,.24),smoothstep(.24,0.,e)*.85);   /* scorched paper */
        col=mix(col,vec3(.07,.035,.015),smoothstep(.07,.014,e));      /* charred band */
        float fl=.7+.3*noise(p*38.+uT*24.);
        col+=vec3(1.,.42,.07)*smoothstep(.026,0.,e)*1.7*fl;          /* ember */
        col+=vec3(1.,.86,.45)*smoothstep(.009,0.,e)*1.3;             /* white-hot line */
        gl_FragColor=vec4(col,1.);
      }`));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return fade();
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, v); } catch (e) { return fade(); }
    // the frame is placed exactly as the <video> shows it: cover on wide screens, contain on tall ones
    const S = W / H, A = (v.videoWidth || 16) / (v.videoHeight || 9), contain = S < 1;
    const scale = contain ? (S < A ? [1, A / S] : [S / A, 1]) : (S > A ? [1, A / S] : [S / A, 1]);
    gl.uniform2f(gl.getUniformLocation(prog, 'uAspect'), S, 1);
    gl.uniform2f(gl.getUniformLocation(prog, 'uScale'), scale[0], scale[1]);
    gl.uniform1f(gl.getUniformLocation(prog, 'uSeed'), Math.random() * 50);
    const uT = gl.getUniformLocation(prog, 'uT');
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0);
    op.classList.add('gl');
    const DUR = 2100, start = performance.now();
    (function frame(now) {
      const k = Math.min(1, (now - start) / DUR);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT, Math.pow(k, 1.35));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (k < 1) requestAnimationFrame(frame);
      else done();
    })(start);
  }
})();
