/* Momentum Capital Group, Cyprus. Smooth scroll (Lenis on the GSAP ticker), heading and block reveals (GSAP
   SplitText, React Bits' Split Text), a soft light on the cards (React Bits'
   Spotlight Card), the client stories slider (Swiper), the header, the mobile menu and the form.
   Every library is optional: without it the page is simply still. The island lives in island.js. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* LAUNCH: the WhatsApp number, digits only with the country code (e.g. 357XXXXXXXX). Until then the WhatsApp
   links lead to the contact form. */
const WHATSAPP = '';
if (WHATSAPP) $$('.wa-link').forEach(a => { a.href = 'https://wa.me/' + WHATSAPP; a.target = '_blank'; a.rel = 'noopener'; });

const G = window.gsap && window.ScrollTrigger ? window.gsap : null;
let lenis = null;
if (G) {
  G.registerPlugin(ScrollTrigger);
  if (window.SplitText) G.registerPlugin(SplitText);
}
if (window.Lenis) {
  lenis = new Lenis(G ? {} : { autoRaf: true });
  if (G) {
    lenis.on('scroll', ScrollTrigger.update);
    G.ticker.add(t => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
  }
}

/* ---------- in-page links: glide there, leaving room for the header where the target has none of its own ---------- */
const head = $('#head');
function go(hash) {
  const el = hash === '#top' ? 0 : $(hash);
  if (el === null) return;
  let y = 0;
  if (el) {
    const own = el.matches('.sec, .hero, .loc');
    y = el.getBoundingClientRect().top + scrollY - (own ? 0 : head.offsetHeight + 16);
  }
  if (lenis) lenis.scrollTo(y, { duration: 1.4 }); else scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute('href').length < 2) return;
  e.preventDefault();
  closeSheet();
  go(a.getAttribute('href'));
  history.replaceState(null, '', a.getAttribute('href') === '#top' ? location.pathname : a.getAttribute('href'));
});

/* ---------- header: solid once the page moves; the mobile menu ---------- */
/* the floating WhatsApp button rests while the contact section (which has its own) or the footer is on screen */
const wa = $('.wa-float');
let nearEnd = false;
new IntersectionObserver(es => { nearEnd = es.some(e => e.isIntersecting) || [...document.querySelectorAll('#contact, .foot')].some(el => el.getBoundingClientRect().top < innerHeight); onScroll(); })
  .observe($('#contact'));
const onScroll = () => {
  head.classList.toggle('solid', scrollY > 30);
  head.style.setProperty('--read', (scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)).toFixed(4));
  wa.classList.toggle('show', scrollY > innerHeight * 0.8 && !nearEnd);
};
addEventListener('scroll', onScroll, { passive: true }); onScroll();

const burger = $('.burger'), sheet = $('#sheet');
function closeSheet() {
  if (sheet.hidden) return;
  sheet.hidden = true; burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open menu');
  head.classList.remove('open'); lenis && lenis.start();
}
burger.addEventListener('click', () => {
  if (!sheet.hidden) return closeSheet();
  sheet.hidden = false; burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Close menu');
  head.classList.add('open'); lenis && lenis.stop();
});
addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

/* ---------- the menu marks the section you are in ---------- */
if (G) {
  const marks = [['#why-cyprus', ['why-cyprus']], ['#service', ['service']], ['#story', ['story']], ['#contact', ['contact']]];
  const links = $$('.menu a');
  for (const [sel, keys] of marks) ScrollTrigger.create({ trigger: sel, start: 'top 45%', end: 'bottom 45%',
    onToggle: s => links.forEach(a => { const k = a.hash.slice(1); if (keys.includes(k)) a.classList.toggle('on', s.isActive); }) });
}

/* ---------- reveals ---------- */
if (G && !reduce) {
  /* Split Text: each heading's lines rise out of their own mask */
  if (window.SplitText) $$('.split').forEach(el => {
    const hero = !!el.closest('.hero');
    SplitText.create(el, { type: 'lines', mask: 'lines', autoSplit: true, linesClass: 'ln',
      onSplit: s => G.from(s.lines, { yPercent: 108, duration: 1.15, ease: 'power3.out', stagger: 0.09, delay: hero ? 0.15 : 0,
        scrollTrigger: hero ? undefined : { trigger: el, start: 'top 88%', once: true } }) });
  });
  G.fromTo('.hero-copy > :not(h1)', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'power2.out', stagger: 0.1, delay: 0.45 });
  G.set('.hero-copy > h1', { autoAlpha: 1 });
  G.set('.rv', { autoAlpha: 0, y: 26 });
  ScrollTrigger.batch('.rv', { start: 'top 90%', once: true,
    onEnter: b => G.to(b, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.05, overwrite: true }) });

  /* the five steps: as you read down, the line runs from each circle to the next, and each circle fills with ink
     when the line reaches it */
  const stepEls = $$('.steps li');
  if (stepEls.length) {
    root.classList.add('anim-steps');
    const last = stepEls.length - 1, track = { p: 0 };
    const paint = () => stepEls.forEach((li, i) => {
      const at = track.p * last;
      li.style.setProperty('--f', Math.min(1, Math.max(0, at - i)).toFixed(3));
      li.classList.toggle('on', at >= i - 0.001 && track.p > 0);
    });
    paint();
    G.to(track, { p: 1, ease: 'none', onUpdate: paint, scrollTrigger: { trigger: '.steps', start: 'top 80%', end: 'bottom 45%', scrub: 0.8 } });
  }
}
root.classList.remove('anim');

/* ---------- Spotlight Card: a soft light follows the pointer across the card (React Bits, ported) ---------- */
function spotlight(card, o) {
  const s = { color: '#ffffff', intensity: 0.15, size: 240, softness: 0.7, borderGlow: 0.6, proximity: 80, smoothing: 0.3, ...o };
  const falloff = (color, softness) => {
    const core = (1 - softness) ** 1.5 * 0.85;
    const stop = (alpha, at) => `color-mix(in srgb, ${color} ${(alpha * 100).toFixed(2)}%, transparent) ${(at * 100).toFixed(2)}%`;
    const list = [stop(1, 0)];
    for (let i = 0; i <= 14; i++) {
      const t = core + (1 - core) * i / 14, g = (t - core) / (1 - core);
      const sm = 1 - g * g * (3 - 2 * g), glow = Math.exp(-4.6 * g * g) * (1 - g ** 6);
      list.push(stop(sm + (glow - sm) * softness, t));
    }
    return list.join(', ');
  };
  const fill = falloff(s.color, s.softness), rim = falloff(s.color, 1);
  if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
  card.style.isolation = 'isolate';
  const light = document.createElement('span'), edge = document.createElement('span');
  light.className = 'sl-light'; edge.className = 'sl-edge'; light.setAttribute('aria-hidden', 'true'); edge.setAttribute('aria-hidden', 'true');
  card.prepend(light); card.append(edge);
  const state = { x: 0, y: 0, presence: 0 }, pointer = { x: 0, y: 0, active: false };
  let raf = 0, last = 0;
  const tick = now => {
    raf = 0;
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000)); last = now;
    const r = card.getBoundingClientRect();
    let tx = state.x, ty = state.y, target = 0;
    if (pointer.active) {
      tx = pointer.x - r.left; ty = pointer.y - r.top;
      const gap = Math.hypot(Math.max(0, -tx, tx - r.width), Math.max(0, -ty, ty - r.height));
      target = gap === 0 ? 1 : s.proximity > 0 ? Math.max(0, 1 - gap / s.proximity) ** 2 : 0;
    }
    if (state.presence < 0.02 && target > 0) { state.x = tx; state.y = ty; }
    const follow = 1 - Math.exp(-dt / (0.015 + s.smoothing * 0.22));
    state.x += (tx - state.x) * follow; state.y += (ty - state.y) * follow;
    state.presence += (target - state.presence) * (1 - Math.exp(-dt / (target > state.presence ? 0.1 : 0.32)));
    if (Math.abs(target - state.presence) < 0.002) state.presence = target;
    light.style.background = `radial-gradient(circle ${s.size}px at ${state.x.toFixed(1)}px ${state.y.toFixed(1)}px, ${fill})`;
    edge.style.background = `radial-gradient(circle ${(s.size * 0.6).toFixed(1)}px at ${state.x.toFixed(1)}px ${state.y.toFixed(1)}px, ${rim})`;
    light.style.opacity = String(Math.min(1, state.presence * s.intensity));
    edge.style.opacity = String(Math.min(1, state.presence * s.borderGlow));
    const moving = Math.abs(tx - state.x) > 0.1 || Math.abs(ty - state.y) > 0.1;
    if (moving || state.presence !== target) raf = requestAnimationFrame(tick);
  };
  const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
  addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true; wake(); }, { passive: true });
  addEventListener('scroll', () => { if (pointer.active || state.presence > 0) wake(); }, { passive: true, capture: true });
  document.addEventListener('pointerout', e => { if (!e.relatedTarget) { pointer.active = false; wake(); } });
}
if (fine && !reduce) {
  $$('.card, .panel, .story-q').forEach(c => spotlight(c, { color: '#ffffff', intensity: 0.9, size: 280, borderGlow: 0.5 }));
  spotlight($('.form'), { color: '#EDE7DC', intensity: 0.07, size: 320, borderGlow: 0.35 });
}

/* ---------- client stories ---------- */
if (window.Swiper) {
  const count = $('.sw-count'), pad = n => String(n).padStart(2, '0');
  new Swiper('.stories', {
    slidesPerView: 1.08, spaceBetween: 16, speed: 700, grabCursor: true,
    breakpoints: { 760: { slidesPerView: 1.6, spaceBetween: 20 }, 1100: { slidesPerView: 2, spaceBetween: 24 } },
    navigation: { nextEl: '.sw-next', prevEl: '.sw-prev' },
    keyboard: { enabled: true, onlyInViewport: true },
    a11y: { prevSlideMessage: 'Previous story', nextSlideMessage: 'Next story' },
    on: { init: s => { count.textContent = `${pad(s.activeIndex + 1)} / ${pad(s.slides.length)}`; },
      slideChange: s => { count.textContent = `${pad(s.activeIndex + 1)} / ${pad(s.slides.length)}`; } }
  });
}

/* ---------- the consultation form ---------- */
/* LAUNCH: send the details to the CRM here (fetch to its endpoint) before showing the thank-you. Until then
   nothing leaves the page. */
const form = $('#form');
form.addEventListener('submit', e => {
  e.preventDefault();
  let ok = true;
  for (const f of form.querySelectorAll('[required]')) {
    const bad = !f.value.trim() || (f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value));
    f.classList.toggle('bad', bad); if (bad && ok) { f.focus(); ok = false; }
  }
  if (!ok) return;
  form.classList.add('done'); $('.sent', form).hidden = false;
});
form.addEventListener('input', e => e.target.classList.remove('bad'));

addEventListener('load', () => G && ScrollTrigger.refresh());
/* the founder's full story opens in place; everything below it moves, so re-measure */
$$('details').forEach(d => d.addEventListener('toggle', () => G && ScrollTrigger.refresh()));
})();
