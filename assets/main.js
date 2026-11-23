/* Momentum Cyprus, version B: smooth scroll, headline line reveals, photo reveals and parallax, the services band,
   the pinned steps, the UK/EU tabs, the video player, the stories slider and the form */
(() => {
  window.__mm = true;
  const root = document.documentElement, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let replayIntro = null; // set once the opening is ready; the header logo calls it
  const head = $('#head'), WHATSAPP = '972547709499'; // Itay's WhatsApp, digits only (set 2026-11-17)

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
  if (reduce) $$('.hero-bg video, .reel video').forEach(v => { v.removeAttribute('autoplay'); v.pause(); });

  /* the WhatsApp chat: every WhatsApp button opens a short chat with Itay. Four taps (what, budget, when, from where)
     and a name, then WhatsApp opens with a message that already tells Itay all of it. Without WHATSAPP set (before
     launch) WhatsApp opens with the message and lets you pick a contact. LAUNCH: also send `answers` to the CRM in go(). */
  const wc = $('.wachat');
  if (wc) {
    const body = wc.querySelector('.wc-body'), foot = wc.querySelector('.wc-foot'), bar = wc.querySelector('.wc-prog i');
    /* written the way Itay would text: short lines, and a small reaction to each answer before the next question */
    const steps = [
      { key: 'goal', q: ['What are you looking for in Cyprus?'], opts: ['A home to relocate to', 'A holiday home', 'A retirement home', 'An investment'],
        react: { 'A home to relocate to': 'Oh nice, that’s a big move 😊', 'A holiday home': 'Love that, you’ll get plenty of sunny days out of it ☀️', 'A retirement home': 'Lovely, Paphos is such a good place to slow down', 'An investment': 'Smart, I’ll show you what’s really worth a look' } },
      { key: 'budget', q: ['Roughly what budget are you thinking?'], opts: ['€200k–400k', '€400k–800k', '€800k–1.2M', '€1.2M+'],
        react: () => 'Perfect, that helps a lot 👍' },
      { key: 'when', q: ['And when would you like to buy?'], opts: ['As soon as possible', 'In 1–3 months', 'In 3–6 months', 'In 6+ months'],
        react: { 'As soon as possible': 'Great, let’s get moving then 🙌', 'In 6+ months': 'No rush at all, it’s a big decision' } },
      { key: 'from', q: ['Where are you buying from?'], opts: ['The UK', 'The EU', 'Elsewhere'] }
    ];
    let answers = {}, timers = [];
    const wait = ms => new Promise(r => timers.push(setTimeout(r, ms)));
    const scrollDown = () => body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
    const bubble = (html, cls = '') => { const m = document.createElement('div'); m.className = 'wm ' + cls; m.innerHTML = html; body.appendChild(m); scrollDown(); return m; };
    const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    /* Itay "types" for a moment, then the line appears */
    const say = async text => {
      const m = bubble('<span class="typing" aria-hidden="true"><i></i><i></i><i></i></span>');
      await wait(reduce ? 0 : 700 + Math.min(text.length * 18, 1100) + Math.random() * 300); // a human typing pace
      m.innerHTML = text; scrollDown();
    };
    const progress = n => { bar.style.width = (n / (steps.length + 1) * 100) + '%'; };
    const ask = async i => {
      foot.innerHTML = ''; progress(i);
      if (i === steps.length) return askName();
      const s = steps[i];
      for (const line of s.q) await say(line);
      s.opts.forEach(o => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'wc-opt'; b.textContent = o;
        b.addEventListener('click', async () => {
          answers[s.key] = o; foot.innerHTML = ''; bubble(esc(o), 'me');
          const r = typeof s.react === 'function' ? s.react(o) : s.react && s.react[o];
          await wait(reduce ? 0 : 350);
          if (r) await say(r);
          ask(i + 1);
        });
        foot.appendChild(b);
      });
    };
    const askName = async () => {
      await say('Great, and what’s your name?');
      foot.innerHTML = '<form class="wc-name"><input name="n" autocomplete="given-name" placeholder="Your first name" aria-label="Your first name" maxlength="40"><button class="wc-send" type="submit">Send</button></form><button class="wc-skip" type="button">Skip</button>';
      const f = foot.querySelector('form'), inp = f.n;
      if (matchMedia('(hover:hover)').matches) inp.focus();
      const done = name => { answers.name = name.trim(); foot.innerHTML = ''; if (answers.name) bubble(esc(answers.name), 'me'); finish(); };
      f.addEventListener('submit', e => { e.preventDefault(); done(inp.value); });
      foot.querySelector('.wc-skip').addEventListener('click', () => done(''));
    };
    const message = () => {
      const a = answers, goal = a.goal.charAt(0).toLowerCase() + a.goal.slice(1);
      const when = a.when === 'As soon as possible' ? 'I’d like to buy as soon as possible' : 'I’m planning to buy ' + a.when.charAt(0).toLowerCase() + a.when.slice(1);
      const from = { 'The UK': 'buying from the UK', 'The EU': 'buying from the EU', 'Elsewhere': 'buying from outside the UK and EU' }[a.from];
      return `Hi Itay${a.name ? `, I’m ${a.name}` : ''}! I’m looking for ${goal}, with a budget of ${a.budget}. ${when}, and I’m ${from}.`;
    };
    const finish = async () => {
      progress(steps.length + 1);
      await say(`Thanks${answers.name ? ' ' + esc(answers.name) : ''}! 🙏`);
      await say('Send me this on WhatsApp and I’ll get back to you personally');
      const text = message();
      bubble(esc(text), 'wa');
      foot.innerHTML = '<button class="wc-go" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#wa"/></svg>Open WhatsApp</button><button class="wc-again" type="button">Start over</button>';
      foot.querySelector('.wc-go').addEventListener('click', () => {
        window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      });
      foot.querySelector('.wc-again').addEventListener('click', start);
    };
    const start = async () => {
      timers.forEach(clearTimeout); timers = []; answers = {}; body.innerHTML = ''; foot.innerHTML = '';
      await say('Hi! Itay here 👋');
      await say('Happy to help you find the right place in Cyprus');
      ask(0);
    };
    const open = e => {
      e.preventDefault();
      if (wc.open) return;
      wc.showModal(); lenis && lenis.stop();
      if (!body.children.length) start();
    };
    const close = () => { wc.close(); };
    wc.addEventListener('close', () => { lenis && lenis.start(); });
    wc.querySelector('.wc-x').addEventListener('click', close);
    wc.addEventListener('click', e => { if (e.target === wc) close(); }); // a click on the dimmed page closes it
    $$('.wa-link').forEach(a => a.addEventListener('click', open));
  }

  /* boarding pass: the plane flies the dashed route; the departure code flips through cities like an airport board */
  const fly = panel => {
    const pl = panel.querySelector('.plane'), fl = panel.querySelector('.flight');
    if (!pl || !window.gsap || reduce) return;
    gsap.fromTo(pl, { x: 0, rotation: 90 }, { x: () => fl.offsetWidth - pl.getBoundingClientRect().width, rotation: 90, duration: 2.4, ease: 'power2.inOut', delay: 0.3, overwrite: true });
  };
  $$('.flap').forEach(f => {
    const codes = f.dataset.codes.split(','), names = f.dataset.names.split(','), nm = f.nextElementSibling;
    let k = 0;
    if (reduce || !window.gsap) return;
    setInterval(() => {
      if (f.closest('[hidden]') || document.hidden) return;
      k = (k + 1) % codes.length;
      gsap.timeline()
        .to([f, nm], { rotationX: -90, opacity: 0, duration: 0.22, ease: 'power2.in', transformOrigin: '50% 50%' })
        .add(() => { f.textContent = codes[k]; nm.textContent = names[k]; })
        .fromTo([f, nm], { rotationX: 90, opacity: 0 }, { rotationX: 0, opacity: 1, duration: 0.32, ease: 'back.out(2)' });
    }, 2600);
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) fly(e.target.closest('.pass')); }), { threshold: 1 });
    $$('.pass .flight').forEach(f => io.observe(f));
  }

  /* the chat card: Itay is "typing…" for a moment after it comes into view, then his message appears */
  const chat = $('.chat-card');
  if (chat) {
    if (reduce || !('IntersectionObserver' in window)) chat.classList.add('said');
    else {
      const co = new IntersectionObserver(es => { if (es[0].isIntersecting) { co.disconnect(); setTimeout(() => chat.classList.add('said'), 1800); } }, { threshold: 0.6 });
      co.observe(chat);
    }
  }

  /* UK / EU tabs, with a copper pill that slides to the chosen one */
  const tabs = $$('.tab'), pill = $('.tab-pill');
  const placePill = () => { const t = $('.tab.on'); if (t && pill) { pill.style.width = t.offsetWidth + 'px'; pill.style.transform = `translateX(${t.offsetLeft}px)`; } };
  const choose = t => {
    tabs.forEach(b => { const on = b === t; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; document.getElementById(b.getAttribute('aria-controls')).hidden = !on; });
    placePill();
    const panel = document.getElementById(t.getAttribute('aria-controls'));
    if (window.gsap && !reduce) {
      /* a new ticket slides out of the printer, then the plane takes off */
      gsap.fromTo(panel, { clipPath: 'inset(0 0 100% 0)', y: -24 }, { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 0.9, ease: 'expo.out', clearProps: 'clipPath' });
      gsap.fromTo(panel.querySelectorAll('.route, .panel-head > *, .ticks li, .pass-stub dl > div'), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out', stagger: 0.04, delay: 0.15 });
      fly(panel);
    }
    window.ScrollTrigger && ScrollTrigger.refresh();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => choose(t));
    t.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); choose(n); } });
  });
  placePill(); addEventListener('resize', placePill); document.fonts.ready.then(placePill);

  /* the video player: any [data-video] opens it; until the files arrive it says so */
  const modal = $('.vmodal'), vid = modal.querySelector('video'), soon = modal.querySelector('.vsoon');
  /* the surprise: a veiled card first lifts its veil (0.95s), and only then opens the film */
  $$('.film.veiled').forEach(b => b.addEventListener('click', e => {
    if (!b.classList.contains('veiled')) return;
    e.stopImmediatePropagation();
    b.classList.add('revealing');
    setTimeout(() => { b.classList.remove('veiled'); b.click(); setTimeout(() => b.classList.remove('revealing'), 1200); }, reduce ? 0 : 950);
  }));
  /* the sound comes in softly with the picture */
  const fadeInSound = () => {
    if (reduce) return;
    vid.volume = 0; const t0 = performance.now();
    const step = now => { const k = Math.min(1, (now - t0) / 1400); vid.volume = k * k; if (k < 1 && !vid.paused) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  $$('[data-video]').forEach(b => b.addEventListener('click', () => {
    const src = b.dataset.video;
    vid.hidden = !src; soon.hidden = !!src;
    if (src) { vid.src = src; if (b.dataset.poster) vid.poster = b.dataset.poster; else vid.removeAttribute('poster'); }
    // vertical films (Itay's main film is 9:16) get a tall, narrow player instead of the 16:9 one
    modal.classList.toggle('portrait', b.dataset.ratio === '9/16');
    modal.showModal(); lenis && lenis.stop();
    if (src) vid.play().then(fadeInSound).catch(() => {});
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

    /* the hero: the words rise in one after another */
    const heroIn = landed => {
      G.fromTo('.hero .up', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.1, delay: landed ? 0 : 0.15 });
    };

    /* the opening: the logo draws itself in copper, a line fills, then an arch opens onto Itay, fills the screen
       and dissolves into the hero's video; a click, a key or a second visit skips it. Clicking the Momentum logo in
       the header plays it again, from a fresh copy kept here. */
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
      const smallW = Math.min(240, vw * 0.5), smallH = smallW * 1.3;
      tl.to(intro.querySelector('.intro-bar i'), { scaleX: 1, duration: 1.3, ease: 'power2.inOut' }, 0.1)
        .to(intro.querySelector('.intro-mid'), { opacity: 0, y: -24, duration: 0.45, ease: 'power2.in' }, 1.45)
        .fromTo(arch, { left: vw / 2, top: vh / 2 + smallH / 2, width: 0, height: 0 },
          { left: vw / 2 - smallW / 2, top: vh / 2 - smallH / 2, width: smallW, height: smallH, duration: 0.7, ease: 'expo.out' }, 1.6)
        .fromTo(arch.querySelectorAll('img'), { scale: 1.4 }, { scale: 1.15, duration: 0.7, ease: 'expo.out' }, 1.6)
        .to(arch, { left: 0, top: 0, width: vw, height: vh, borderRadius: '0px 0px 0px 0px', duration: 0.75, ease: 'expo.inOut' }, 2.1)
        .to(arch.querySelectorAll('img'), { scale: 1, duration: 0.75, ease: 'expo.inOut' }, 2.1)
        /* Itay fills the screen for a beat, then the picture drifts closer and dissolves into the hero's video */
        .set(intro, { backgroundColor: 'transparent' }, 2.85)
        .to(arch.querySelectorAll('img'), { scale: 1.08, duration: 1.4, ease: 'power1.inOut' }, 2.85)
        .to(arch, { opacity: 0, duration: 0.85, ease: 'power2.inOut' }, 3.3);
      window.__intro = tl; // ?intro=hold keeps it still, for checking stills with tools/snap.js
      if (!/intro=hold/.test(location.search))
        Promise.race([draw, new Promise(r => setTimeout(r, 900))]).then(() => document.fonts.ready).then(() => tl.play());
    };
    /* + the opening film (opener.js): when it plays, the old opening is not used on entry ("without Itay's
       animation at the entrance, not needed"); the site comes in under the film's burn, hero words rising */
    /* + "remove Itay's picture at the entrance when the site loads": the old opening (logo + Itay's arch) never plays
       on entry any more, with or without the film, and the header logo no longer replays it */
    first && first.remove(); root.classList.add('no-intro');
    if (window.__opener) {
      lenis && lenis.stop();
      window.__opener.then(() => { scrollTo(0, 0); if (lenis) { lenis.scrollTo(0, { immediate: true, force: true }); lenis.start(); } heroIn(false); });
    } else heroIn(false);
    // playIntro / introCopy stay defined but unused, in case the old opening is wanted back
    void playIntro; void introCopy; void playing;
    replayIntro = null; // the header logo is a normal link to the top again

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
    /* why momentum: the four cards come out of a deep, blurred zoom into sharp focus one after another as you scroll,
       their big numbers settle behind them, then a copper glint sweeps across */
    const ecards = $$('.ecard');
    if (ecards.length) {
      G.timeline({ scrollTrigger: { trigger: '.edge', start: 'top 92%', end: 'top 30%', scrub: 0.9 } })
        .fromTo(ecards, { scale: innerWidth < 760 ? 1.15 : 1.45, opacity: 0, filter: 'blur(16px)', y: 60 }, { scale: 1, opacity: 1, filter: 'blur(0px)', y: 0, ease: 'power3.out', stagger: 0.22 })
        .fromTo('.ecard .big', { scale: 1.8, opacity: 0 }, { scale: 1, opacity: 1, ease: 'power2.out', stagger: 0.22 }, 0.15);
      ScrollTrigger.create({ trigger: '.edge', start: 'top 32%', once: true,
        onEnter: () => G.fromTo('.ecard .sheen', { x: '-160%', skewX: -12 }, { x: '360%', skewX: -12, duration: 1.5, ease: 'power2.inOut', stagger: 0.14 }) });
    }
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

  /* the form: checks the required fields, then opens WhatsApp to Itay with the details filled in (user's choice,
     2026-11-22). Nothing is sent until the visitor presses send in WhatsApp. LAUNCH: a CRM can be added here too. */
  const form = $('#form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    /* name, phone and country are required; the email is optional but must look like one if given */
    form.querySelectorAll('[required], [type=email]').forEach(f => { const bad = (f.required && !f.value.trim()) || (f.type === 'email' && f.value && !/^\S+@\S+\.\S+$/.test(f.value)); f.classList.toggle('bad', bad); if (bad && ok) { ok = false; f.focus(); } });
    if (!ok) return;
    const v = n => (form.elements[n].value || '').trim();
    const lines = ['Hi Itay, I’d like to book a consultation.', '', 'Name: ' + v('name'), 'Phone: ' + v('phone'), 'Country: ' + v('country')];
    if (v('email')) lines.push('Email: ' + v('email'));
    if (v('looking')) lines.push('Looking for: ' + v('looking'));
    if (v('budget')) lines.push('Budget: ' + v('budget'));
    if (v('message')) lines.push('', v('message'));
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
    form.querySelector('.sent').hidden = false;
  });
  document.fonts.ready.then(() => setTimeout(() => { window.__ready = true; }, 900)); // for tools/snap.js
})();
