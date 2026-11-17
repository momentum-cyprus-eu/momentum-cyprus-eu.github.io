/* Momentum Cyprus, version B: smooth scroll, headline line reveals, photo reveals and parallax, the services band,
   the pinned steps, the UK/EU tabs, the video player, the stories slider and the form */
(() => {
  window.__mm = true;
  const root = document.documentElement, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let replayIntro = null; // set once the opening is ready; the header logo calls it
  const head = $('#head'), WHATSAPP = ''; // LAUNCH: the WhatsApp number, digits only, e.g. 35799000000

  /* smooth scroll on the GSAP ticker */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.1 });
    if (window.gsap) { gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else requestAnimationFrame(function f(t) { lenis.raf(t); requestAnimationFrame(f); });
  }
  const go = el => { const y = el.getBoundingClientRect().top + scrollY - (el.id === 'top' ? 0 : 68); lenis ? lenis.scrollTo(y, { duration: 1.3 }) : scrollTo({ top: y, behavior: 'smooth' }); };
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    if (a.matches('.head .logo') && replayIntro) { e.preventDefault(); closeMenu(); replayIntro(); return; }
    const el = document.querySelector(a.getAttribute('href')); if (!el) return;
    e.preventDefault(); closeMenu(); go(el);
  });

  /* header: solid once you scroll; the WhatsApp button appears after the hero */
  const fab = $('.wa-float');
  const onScroll = () => {
    const y = scrollY;
    head.classList.toggle('solid', y > 40);
    fab.classList.toggle('show', y > innerHeight * 0.9);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* mobile menu */
  const burger = $('.burger'), sheet = $('#sheet');
  function closeMenu() { if (sheet.hidden) return; sheet.hidden = true; burger.setAttribute('aria-expanded', 'false'); root.classList.remove('menu-open'); lenis && lenis.start(); }
  burger.addEventListener('click', () => {
    if (!sheet.hidden) return closeMenu();
    sheet.hidden = false; burger.setAttribute('aria-expanded', 'true'); root.classList.add('menu-open'); lenis && lenis.stop();
  });
  addEventListener('keydown', e => e.key === 'Escape' && closeMenu());

  /* the hero's background film stays still for visitors who asked for less motion */
  const bgv = $('.hero-bg video'); if (bgv && reduce) { bgv.removeAttribute('autoplay'); bgv.pause(); }

  /* WhatsApp links */
  if (WHATSAPP) $$('.wa-link').forEach(a => { a.href = `https://wa.me/${WHATSAPP}`; a.target = '_blank'; a.rel = 'noopener'; });

  /* UK / EU tabs, with a copper pill that slides to the chosen one */
  const tabs = $$('.tab'), pill = $('.tab-pill');
  const placePill = () => { const t = $('.tab.on'); if (t && pill) { pill.style.width = t.offsetWidth + 'px'; pill.style.transform = `translateX(${t.offsetLeft}px)`; } };
  const choose = t => {
    tabs.forEach(b => { const on = b === t; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; document.getElementById(b.getAttribute('aria-controls')).hidden = !on; });
    placePill();
    const panel = document.getElementById(t.getAttribute('aria-controls'));
    if (window.gsap && !reduce) gsap.fromTo(panel.querySelectorAll('.panel-head > *, .ticks li'), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out', stagger: 0.05 });
    window.ScrollTrigger && ScrollTrigger.refresh();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => choose(t));
    t.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); choose(n); } });
  });
  placePill(); addEventListener('resize', placePill); document.fonts.ready.then(placePill);

  /* the video player: any [data-video] opens it; until the files arrive it says so */
  const modal = $('.vmodal'), vid = modal.querySelector('video'), soon = modal.querySelector('.vsoon');
  $$('[data-video]').forEach(b => b.addEventListener('click', () => {
    const src = b.dataset.video;
    vid.hidden = !src; soon.hidden = !!src;
    if (src) { vid.src = src; if (b.dataset.poster) vid.poster = b.dataset.poster; }
    modal.showModal(); lenis && lenis.stop();
    if (src) vid.play().catch(() => {});
  }));
  const shut = () => { vid.pause(); vid.removeAttribute('src'); vid.load(); modal.close(); };
  modal.querySelector('.vclose').addEventListener('click', shut);
  modal.addEventListener('click', e => { if (e.target === modal) shut(); });
  modal.addEventListener('close', () => { lenis && lenis.start(); });

  /* animation */
  const G = window.gsap;
  if (G && window.ScrollTrigger && !reduce) {
    G.registerPlugin(ScrollTrigger);
    if (window.SplitText) G.registerPlugin(SplitText);
    if (lenis) lenis.on('scroll', ScrollTrigger.update);
    G.set('.rv, .hero .up, .reveal, .split', { opacity: 0 });

    /* the hero: the arch opens upward (unless the opening has just landed it there), the words rise in one after another */
    const heroIn = landed => {
      if (landed) G.set('.hero-arch', { opacity: 1 });
      else {
        G.fromTo('.hero-arch', { y: 60, opacity: 0, clipPath: 'inset(100% 0 0 0 round 999px 999px 30px 30px)' }, { y: 0, opacity: 1, clipPath: 'inset(0% 0 0 0 round 0px)', duration: 1.6, ease: 'expo.out', delay: 0.2, clearProps: 'clipPath' });
        G.fromTo('.hero-media img', { scale: 1.2 }, { scale: 1, duration: 2.6, ease: 'expo.out', delay: 0.2 });
      }
      G.fromTo('.hero .up', { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.1, delay: landed ? 0 : 0.15 });
      if (!heroBound) { heroBound = true; G.to('.hero-media img', { yPercent: 9, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } }); }
    };
    let heroBound = false;
    G.set('.hero-arch', { opacity: 0 });

    /* the opening: the logo draws itself in copper, a line fills, then an arch opens onto Paphos, fills the screen
       and lands in the hero's frame; a click, a key or a second visit skips it. Clicking the Momentum logo in the
       header plays it again, from a fresh copy kept here. */
    const first = $('.intro'), introCopy = first && first.cloneNode(true);
    let playing = false;
    const playIntro = intro => {
      playing = true;
      lenis && lenis.stop(); scrollTo(0, 0);
      try { sessionStorage.setItem('mm-intro', '1'); } catch (e) {}
      const arch = intro.querySelector('.intro-arch'), logoBox = intro.querySelector('.intro-logo'), vw = innerWidth, vh = innerHeight;
      const tl = G.timeline({ paused: true, onComplete: () => finish(true) });
      let done = false;
      const finish = landed => {
        if (done) return; done = true; tl.kill(); removeEventListener('keydown', onKey);
        G.to(intro, { opacity: 0, duration: landed ? 0.35 : 0.5, ease: 'power2.out', onComplete: () => { root.classList.add('no-intro'); intro.remove(); playing = false; } });
        lenis && lenis.start(); heroIn(landed);
      };
      const onKey = () => finish(false);
      intro.querySelector('.intro-skip').addEventListener('click', () => finish(false));
      intro.addEventListener('click', () => finish(false));
      addEventListener('keydown', onKey);
      /* the logo, inlined so its outlines can be drawn */
      const draw = fetch(logoBox.querySelector('img').src).then(r => r.text()).then(svg => {
        logoBox.innerHTML = svg;
        const paths = [...logoBox.querySelectorAll('path')], s = logoBox.querySelector('svg');
        s.setAttribute('fill', 'transparent');
        paths.forEach(p => { const L = p.getTotalLength(); p.style.cssText = `fill:#FBF8F3;fill-opacity:0;stroke:#C8875A;stroke-width:3;stroke-dasharray:${L};stroke-dashoffset:${L}`; });
        tl.to(paths, { strokeDashoffset: 0, duration: 1.05, ease: 'power2.inOut', stagger: 0.012 }, 0)
          .to(paths, { fillOpacity: 1, strokeOpacity: 0, duration: 0.5, ease: 'power1.out' }, 0.85);
      }).catch(() => { tl.from(logoBox, { opacity: 0, y: 12, duration: 0.8, ease: 'expo.out' }, 0); });
      const target = () => $('.hero-media').getBoundingClientRect();
      const smallW = Math.min(240, vw * 0.5), smallH = smallW * 1.3;
      tl.to(intro.querySelector('.intro-bar i'), { scaleX: 1, duration: 1.3, ease: 'power2.inOut' }, 0.1)
        .to(intro.querySelector('.intro-mid'), { opacity: 0, y: -24, duration: 0.45, ease: 'power2.in' }, 1.45)
        .fromTo(arch, { left: vw / 2, top: vh / 2 + smallH / 2, width: 0, height: 0 },
          { left: vw / 2 - smallW / 2, top: vh / 2 - smallH / 2, width: smallW, height: smallH, duration: 0.7, ease: 'expo.out' }, 1.6)
        .fromTo(arch.querySelectorAll('img'), { scale: 1.4 }, { scale: 1.15, duration: 0.7, ease: 'expo.out' }, 1.6)
        .to(arch, { left: 0, top: 0, width: vw, height: vh, borderRadius: '0px 0px 0px 0px', duration: 0.75, ease: 'expo.inOut' }, 2.1)
        .to(arch.querySelectorAll('img'), { scale: 1, duration: 0.75, ease: 'expo.inOut' }, 2.1)
        /* Itay opens the window; as it lands in the hero the picture dissolves into Paphos, the hero's own photograph */
        .fromTo(arch.querySelector('.ia-paphos'), { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power2.inOut' }, 2.9)
        .set(intro, { backgroundColor: 'transparent' }, 2.85)
        .to(arch, { left: () => target().left, top: () => target().top, width: () => target().width, height: () => target().height,
          borderRadius: '9999px 9999px 30px 30px', duration: 0.95, ease: 'expo.inOut' }, 2.85);
      window.__intro = tl; // ?intro=hold keeps it still, for checking stills with tools/snap.js
      if (!/intro=hold/.test(location.search))
        Promise.race([draw, new Promise(r => setTimeout(r, 900))]).then(() => document.fonts.ready).then(() => tl.play());
    };
    if (first && !root.classList.contains('no-intro')) playIntro(first);
    else { first && first.remove(); heroIn(false); }
    replayIntro = () => {
      if (playing || !introCopy) return;
      lenis && lenis.scrollTo(0, { immediate: true }); scrollTo(0, 0);
      G.set('.hero .up, .hero-arch', { opacity: 0 });
      const el = introCopy.cloneNode(true);
      document.body.prepend(el); root.classList.remove('no-intro');
      playIntro(el);
    };

    /* headings rise line by line from behind a mask */
    document.fonts.ready.then(() => {
      $$('.split').forEach(h => {
        G.set(h, { opacity: 1 });
        if (!window.SplitText) return G.from(h, { y: 30, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
        const s = SplitText.create(h, { type: 'lines', mask: 'lines', linesClass: 'line' });
        G.from(s.lines, { yPercent: 110, duration: 1.15, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
      });
      ScrollTrigger.refresh();
    });

    /* everything else rises in as it reaches the screen */
    ScrollTrigger.batch('.rv', { start: 'top 88%', once: true,
      onEnter: els => G.fromTo(els, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.08, overwrite: true }) });
    /* tiles and the film open like a curtain lifting */
    ScrollTrigger.batch('.reveal', { start: 'top 90%', once: true,
      onEnter: els => G.fromTo(els, { opacity: 1, clipPath: 'inset(18% 0 0 0 round 26px)', y: 50 }, { clipPath: 'inset(0% 0 0 0 round 26px)', y: 0, duration: 1.3, ease: 'expo.out', stagger: 0.09, clearProps: 'clipPath' }) });
    /* photos drift inside their frames */
    $$('.t-photo img, .paphos-media img').forEach(img => G.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));

    /* the services band: always moving, a little faster while you scroll */
    const track = $('.marquee-track');
    if (track) {
      let x = 0, boost = 0; const half = () => track.scrollWidth / 2;
      if (lenis) lenis.on('scroll', e => { boost = Math.min(6, Math.abs(e.velocity) * 0.25); });
      G.ticker.add(() => { x -= 0.6 + boost; boost *= 0.92; if (-x >= half()) x += half(); track.style.transform = `translate3d(${x}px,0,0)`; });
    }

    /* the five steps: each one comes forward as it reaches the middle of the screen, and the meter fills */
    const ps = $$('.psteps li'), meter = $('.pin-meter'), count = $('.pin-count b');
    ps.forEach((li, i) => ScrollTrigger.create({ trigger: li, start: 'top 60%', end: 'bottom 40%',
      onToggle: self => { if (self.isActive) { ps.forEach(o => o.classList.toggle('on', o === li)); count.textContent = String(i + 1).padStart(2, '0'); } } }));
    if (ps.length) {
      ps[0].classList.add('on');
      ScrollTrigger.create({ trigger: '.psteps', start: 'top 60%', end: 'bottom 60%', onUpdate: s => meter.style.setProperty('--p', s.progress.toFixed(3)) });
    }
    /* the background colour flows from one section to the next as you scroll, instead of cutting at the edge */
    const tone = el => el.classList.contains('dark') ? '#0D2131' : el.classList.contains('grey') ? '#F2EBE1' : '#FBF8F3';
    const secs = $$('main > .sec');
    if (secs.length) {
      root.classList.add('flow');
      G.set(document.body, { backgroundColor: tone(secs[0]) });
      secs.forEach((s, i) => {
        if (!i) return;
        const from = tone(secs[i - 1]), to = tone(s);
        if (from === to) return;
        G.fromTo(document.body, { backgroundColor: from }, { backgroundColor: to, ease: 'none', immediateRender: false,
          scrollTrigger: { trigger: s, start: 'top 72%', end: 'top 42%', scrub: 0.6 } });
      });
    }
    $$('details').forEach(d => d.addEventListener('toggle', () => ScrollTrigger.refresh()));
  } else {
    root.classList.add('no-intro');
    $$('.psteps li').forEach(li => li.classList.add('on'));
  }
  root.classList.remove('anim');

  /* client stories */
  if (window.Swiper && document.querySelector('.stories')) new Swiper('.stories', { slidesPerView: 1.08, spaceBetween: 16, grabCursor: true,
    navigation: { prevEl: '.sw-prev', nextEl: '.sw-next' }, breakpoints: { 760: { slidesPerView: 2, spaceBetween: 18 }, 1100: { slidesPerView: 3, spaceBetween: 18 } } });

  /* the form: checks the required fields, then shows the thank-you line (LAUNCH: send to the CRM here) */
  const form = $('#form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll('[required]').forEach(f => { const bad = !f.value || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value)); f.classList.toggle('bad', bad); if (bad && ok) { ok = false; f.focus(); } });
    if (!ok) return;
    form.querySelector('.sent').hidden = false; form.querySelector('button').disabled = true;
  });
  document.fonts.ready.then(() => setTimeout(() => { window.__ready = true; }, 900)); // for tools/snap.js
})();
