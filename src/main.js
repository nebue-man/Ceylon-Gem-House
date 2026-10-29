import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);

// Custom eases — also mirrored as CSS variables in main.css
CustomEase.create('revealOut',   '0.25, 1, 0.5, 1');
CustomEase.create('revealInOut', '0.75, 0, 0.25, 1');
CustomEase.create('revealIn',    '0.5, 0, 0.75, 0');
CustomEase.create('revealEase',  '0.25, 0.1, 0.25, 1');
CustomEase.create('diveIn',      '0.6, 0, 0, 1');

gsap.ticker.lagSmoothing(0);

// Progressive enhancement flag
document.documentElement.classList.add('js');

const mq = {
  motion: window.matchMedia('(prefers-reduced-motion: reduce)'),
  pointer: window.matchMedia('(hover: hover) and (pointer: fine)'),
};
const reduced = mq.motion.matches;

// ─── Header refs ────────────────────────────────────────────────────
const header = document.querySelector('.site-header');

// ─── Header scroll state ────────────────────────────────────────────
let updateOriginPin = null;

function onScroll(y) {
  header.classList.toggle('site-header--scrolled', y > 40);
  if (updateOriginPin) updateOriginPin(y);
}

// ─── Header dark-section detection (IntersectionObserver) ───────────
const darkSections = [...document.querySelectorAll('[data-theme="dark"]')];
if (darkSections.length) {
  const activeDark = new Set();
  const updateDark = () =>
    header.classList.toggle('site-header--dark', activeDark.size > 0);

  function makeDarkIO() {
    const h = header.offsetHeight;
    const margin = Math.max(0, window.innerHeight - h);
    return new IntersectionObserver(entries => {
      entries.forEach(e => {
        e.isIntersecting ? activeDark.add(e.target) : activeDark.delete(e.target);
      });
      updateDark();
    }, { rootMargin: `0px 0px -${margin}px 0px` });
  }

  let darkIO = makeDarkIO();
  darkSections.forEach(s => darkIO.observe(s));

  window.addEventListener('resize', () => {
    darkIO.disconnect();
    activeDark.clear();
    darkIO = makeDarkIO();
    darkSections.forEach(s => darkIO.observe(s));
    updateDark();
  }, { passive: true });
}

// ─── Smooth scroll — one loop: GSAP ticker drives Lenis ─────────────
let lenis = null;

if (!reduced && mq.pointer.matches) {
  lenis = new Lenis({ lerp: 0.1 });
  window.__lenis = lenis;

  lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  lenis.on('scroll', ScrollTrigger.update);

  // gsap.ticker time is seconds; lenis.raf expects ms
  gsap.ticker.add((time) => { lenis.raf(time * 1000); });
} else {
  window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });
  onScroll(window.scrollY);
}

// ─── Anchor links (via Lenis on desktop, smooth on native) ──────────
document.querySelectorAll('a[href*="#"]').forEach(a => {
  const href = a.getAttribute('href') || '';
  const hashIdx = href.lastIndexOf('#');
  if (hashIdx === -1) return;
  const hash = href.slice(hashIdx);
  if (hash === '#') return;

  a.addEventListener('click', e => {
    const target = document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    const offset = -(header?.offsetHeight ?? 70);
    if (lenis) {
      lenis.scrollTo(target, { offset });
    } else {
      const y = target.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  });
});

// ─── Mobile nav overlay ─────────────────────────────────────────────
const menuBtn = document.querySelector('.menu-btn');
const navOverlay = document.getElementById('nav-overlay');

if (menuBtn && navOverlay) {
  const closeBtn = navOverlay.querySelector('.nav-overlay__close');
  const FOCUSABLE = 'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"])';

  function getFocusables() {
    return [...navOverlay.querySelectorAll(FOCUSABLE)];
  }

  function openMenu() {
    navOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
    menuBtn.setAttribute('aria-expanded', 'true');
    const first = getFocusables()[0];
    if (first) first.focus();
  }

  function closeMenu() {
    navOverlay.hidden = true;
    document.body.style.overflow = '';
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.focus();
  }

  menuBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);

  navOverlay.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
    if (e.key === 'Tab') {
      const focusables = getFocusables();
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });

  navOverlay.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => closeMenu());
  });
}

// ─── Scroll reveals (SplitText library) ─────────────────────────────
// Line-split elements tracked for resize re-split
const _lineSplits = []; // { el, splitRef: { current }, state: { revealed } }

// Dispatch by data-split attribute — opt-in, no implicit tag detection.
// 'chars'  → serif display heads (rotateY flip)
// 'accent' → italic serif accents (rotateX + x-slide)
// 'lines'  → masked line reveal (blockquotes, long serif lines)
// 'hr'     → clip-path hairline wipe
// (none)   → simple fade-up
function _revealType(el) {
  const s = el.dataset.split;
  if (s === 'chars')  return 'chars';
  if (s === 'accent') return 'accent';
  if (s === 'lines')  return 'lines';
  if (s === 'hr')     return 'hr';
  return 'fade';
}

// Setup: char flip for large serif display headings
function _setupChars(el) {
  const split = new SplitText(el, { type: 'chars,words' });
  gsap.set(el, { opacity: 1 });
  gsap.set(split.chars, {
    transformPerspective: 800,
    opacity: 0,
    yPercent: 50,
    rotateY: 90,
  });
  return { type: 'chars', split };
}

// Setup: italic accent chars from rotateX 90° + x offset, pivot bottom.
// aria:'none' — <em> (emphasis) and <p> (paragraph) roles prohibit aria-label;
// screen readers still read sequentially through the unsuppressed char spans.
function _setupAccent(el) {
  const split = new SplitText(el, { type: 'chars,words', aria: 'none' });
  gsap.set(el, { opacity: 1 });
  gsap.set(split.chars, {
    transformPerspective: 800,
    opacity: 0,
    rotateX: 90,
    x: '6rem',
    transformOrigin: '50% 100%',
  });
  return { type: 'accent', split };
}

// Setup: masked line slide for blockquotes / long serif lines
function _setupLines(el) {
  // aria:'none' prevents SplitText adding aria-label to <p> (ARIA prohibits on paragraph role).
  // For blockquote the default 'auto' would be fine, but 'none' is safe for both.
  const split = new SplitText(el, { type: 'lines', mask: 'lines', aria: 'none' });
  gsap.set(el, { opacity: 1 });
  gsap.set(split.lines, { yPercent: 110 });
  const splitRef = { current: split };
  const state = { revealed: false };
  _lineSplits.push({ el, splitRef, state });
  return { type: 'lines', splitRef, state };
}

function _animateChars(data, delay) {
  gsap.to(data.split.chars, {
    opacity: 1,
    yPercent: 0,
    rotateY: 0,
    duration: 1.2,
    stagger: 0.05,
    ease: 'revealOut',
    delay,
    clearProps: 'transform,opacity',
  });
}

function _animateAccent(data, delay) {
  gsap.to(data.split.chars, {
    opacity: 1,
    rotateX: 0,
    x: 0,
    duration: 1.2,
    stagger: 0.08,
    ease: 'revealOut',
    delay,
    clearProps: 'transform,opacity',
  });
}

function _animateLines(data, delay) {
  data.state.revealed = true;
  gsap.to(data.splitRef.current.lines, {
    yPercent: 0,
    duration: 1.2,
    stagger: 0.1,
    ease: 'revealOut',
    delay,
  });
}

function _animateFade(el, delay) {
  gsap.fromTo(el,
    { opacity: 0, y: 28 },
    { opacity: 1, y: 0, duration: 0.8, ease: 'revealOut', delay }
  );
}

function _animateHairline(el, delay) {
  gsap.fromTo(el,
    { clipPath: 'inset(0 100% 0 0)' },
    { clipPath: 'inset(0 0% 0 0)', duration: 0.8, ease: 'revealOut', delay }
  );
}

function initReveals() {
  // ── Standalone [data-reveal] (not inside a [data-rg]) ──────────────
  document.querySelectorAll('[data-reveal]').forEach(el => {
    if (el.closest('[data-rg]')) return;
    const type = _revealType(el);
    let data;
    if (type === 'chars')  data = _setupChars(el);
    else if (type === 'accent') data = _setupAccent(el);
    else if (type === 'lines')  data = _setupLines(el);

    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        if (type === 'chars')       _animateChars(data, 0);
        else if (type === 'accent') _animateAccent(data, 0);
        else if (type === 'lines')  _animateLines(data, 0);
        else                        _animateFade(el, 0);
      },
    });
  });

  // ── [data-rg] stagger groups ───────────────────────────────────────
  document.querySelectorAll('[data-rg]').forEach(groupEl => {
    const items = [...groupEl.querySelectorAll('[data-ri]')];
    if (!items.length) return;

    const itemData = items.map((item, i) => {
      const type = _revealType(item);
      const delay = i * 0.1;
      if (type === 'chars')  return { item, delay, ..._setupChars(item) };
      if (type === 'accent') return { item, delay, ..._setupAccent(item) };
      if (type === 'lines')  return { item, delay, ..._setupLines(item) };
      return { item, delay, type: 'fade' };
    });

    ScrollTrigger.create({
      trigger: groupEl,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        itemData.forEach(d => {
          if (d.type === 'chars')       _animateChars(d, d.delay);
          else if (d.type === 'accent') _animateAccent(d, d.delay);
          else if (d.type === 'lines')  _animateLines(d, d.delay);
          else                          _animateFade(d.item, d.delay);
        });
      },
    });
  });

  // ── Hairline wipes (independent triggers) ─────────────────────────
  document.querySelectorAll('[data-split="hr"]').forEach(el => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => _animateHairline(el, 0),
    });
  });

  // ── Resize re-split for line-split elements (debounced) ───────────
  let _resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => {
      _lineSplits.forEach(({ el, splitRef, state }) => {
        splitRef.current.revert();
        splitRef.current = new SplitText(el, { type: 'lines', mask: 'lines', aria: 'none' });
        if (!state.revealed) {
          gsap.set(splitRef.current.lines, { yPercent: 110 });
        }
      });
    }, 200);
  }, { passive: true });

  ScrollTrigger.refresh();
}

if (!reduced) {
  document.fonts.ready.then(initReveals);
}

// ─── Stone page: details column sticky-top (fits-at-either-edge) ─────
(function () {
  const details = document.querySelector('.stone__details');
  if (!details) return;

  function update() {
    const headerH = header?.offsetHeight ?? 108;
    const viewH   = window.innerHeight;
    const colH    = details.offsetHeight;
    const topA    = headerH + 24;
    const topB    = viewH - colH - 24;
    details.style.setProperty('--stone-details-top', Math.min(topA, topB) + 'px');
  }

  const ro = new ResizeObserver(update);
  ro.observe(details);
  ro.observe(document.documentElement);
  window.addEventListener('resize', update, { passive: true });
  document.fonts.ready.then(update);
  update();
}());

// ─── Stone page: lighting nav (sticky-aware index) ───────────────────
(function () {
  const lightingNav = document.querySelector('.stone__lighting-nav');
  if (!lightingNav) return;

  const btns   = [...lightingNav.querySelectorAll('.lighting-btn')];
  const frames = [...document.querySelectorAll('.stone__frame')];
  if (!btns.length || !frames.length) return;

  function setActive(idx) {
    btns.forEach((btn, i) => {
      const on = i === idx;
      btn.classList.toggle('lighting-btn--active', on);
      btn.setAttribute('aria-current', on ? 'true' : 'false');
    });
  }

  btns.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      setActive(i);
      const frame = frames[i];
      if (!frame) return;
      const headerH = header?.offsetHeight ?? 108;
      const navH    = lightingNav.offsetHeight;
      const offset  = -(headerH + 24 + navH + 8);
      if (lenis) {
        lenis.scrollTo(frame, { offset });
      } else {
        const y = frame.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    });
  });

  const headerH = header?.offsetHeight ?? 108;
  const navH    = lightingNav.offsetHeight;
  const topCrop = headerH + 16 + navH;

  const visible = new Set();
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) visible.add(e.target);
      else visible.delete(e.target);
    });
    const topmost = frames.find(f => visible.has(f));
    if (topmost !== undefined) setActive(frames.indexOf(topmost));
  }, {
    rootMargin: `-${topCrop}px 0px -15% 0px`,
    threshold: 0,
  });

  frames.forEach(f => io.observe(f));
  setActive(0);
}());

// ─── Origin pinned experience ────────────────────────────────────────
(function () {
  const pin = document.querySelector('.origin-pin');
  if (!pin || reduced) return;

  const imgs    = [...pin.querySelectorAll('.origin-img')];
  const btns    = [...pin.querySelectorAll('.origin-index__btn')];
  const panels  = [...pin.querySelectorAll('.origin-panel')];
  const counter = pin.querySelector('.origin-counter');
  const bar     = pin.querySelector('.origin-progress-bar');
  const STEPS   = 5;
  const LABELS  = ['01 / 05', '02 / 05', '03 / 05', '04 / 05', '05 / 05'];
  let currentStep = -1;

  function applyStep(step, intra) {
    if (step !== currentStep) {
      imgs.forEach((el, i)   => el.classList.toggle('is-active', i === step));
      btns.forEach((el, i)   => el.classList.toggle('is-active', i === step));
      panels.forEach((el, i) => el.classList.toggle('is-active', i === step));
      if (counter) counter.textContent = LABELS[step];
      currentStep = step;
    }
    if (bar) bar.style.transform = `scaleX(${intra})`;
  }

  updateOriginPin = function (scrollY) {
    if (window.innerWidth < 900) return;
    const viewH    = window.innerHeight;
    const pinTop   = pin.offsetTop;
    const pinH     = pin.offsetHeight;
    const scrollable = pinH - viewH;
    if (scrollable <= 0) return;

    const raw      = Math.max(0, Math.min(1, (scrollY - pinTop) / scrollable));
    const rawStep  = raw * STEPS;
    const step     = Math.min(STEPS - 1, Math.floor(rawStep));
    const intra    = Math.min(1, rawStep - step);
    applyStep(step, intra);
  };

  btns.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      const viewH    = window.innerHeight;
      const pinTop   = pin.offsetTop;
      const scrollable = pin.offsetHeight - viewH;
      const targetY  = pinTop + scrollable * ((i + 0.05) / STEPS);
      if (lenis) { lenis.scrollTo(targetY, { duration: 1.2 }); }
      else { window.scrollTo({ top: targetY, behavior: 'smooth' }); }
    });
  });

  const preloadIO = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    imgs.forEach(img => {
      const link = Object.assign(document.createElement('link'), {
        rel: 'preload', as: 'image', href: img.src,
      });
      document.head.appendChild(link);
    });
    preloadIO.disconnect();
  }, { rootMargin: '200% 0px' });
  preloadIO.observe(pin);

  updateOriginPin(window.scrollY);
}());
