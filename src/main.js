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

// Setup: char flip for large serif display headings.
// <em> children inside the heading use the accent pattern (rotateX+x) while
// the heading element keeps its full accessible name via aria:'auto'.
function _setupChars(el) {
  const emEls = [...el.querySelectorAll('em')];
  const split = new SplitText(el, { type: 'chars,words' });

  // Partition chars: those inside <em> get the accent treatment
  const accentChars = emEls.length
    ? split.chars.filter(c => emEls.some(em => em.contains(c)))
    : [];
  const mainChars = accentChars.length
    ? split.chars.filter(c => !accentChars.includes(c))
    : split.chars;

  gsap.set(el, { opacity: 1 });
  gsap.set(mainChars, { transformPerspective: 800, opacity: 0, yPercent: 50, rotateY: 90 });
  if (accentChars.length) {
    gsap.set(accentChars, {
      transformPerspective: 800, opacity: 0,
      rotateX: 90, x: '6rem', transformOrigin: '50% 100%',
    });
  }
  return { type: 'chars', split, mainChars, accentChars };
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
  if (data.mainChars.length) {
    gsap.to(data.mainChars, {
      opacity: 1, yPercent: 0, rotateY: 0,
      duration: 1.2, stagger: 0.05, ease: 'revealOut',
      delay, clearProps: 'transform,opacity',
    });
  }
  if (data.accentChars.length) {
    // Accent starts 0.3s after the first main char so they cascade together
    gsap.to(data.accentChars, {
      opacity: 1, rotateX: 0, x: 0,
      duration: 1.2, stagger: 0.08, ease: 'revealOut',
      delay: delay + 0.3, clearProps: 'transform,opacity',
    });
  }
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
    if (el.closest('[data-facts-gate]')) return; // gated until cap turns linen
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
    if (groupEl.closest('[data-facts-gate]')) return; // gated until cap turns linen
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

// ─── Facts reveals — fired once the cap has scrubbed to ≥90% linen ──
function initFactsReveals() {
  const gate = document.querySelector('[data-facts-gate]');
  if (!gate) return;

  gate.querySelectorAll('[data-reveal]').forEach(el => {
    if (el.closest('[data-rg]')) return;
    const type = _revealType(el);
    let data;
    if (type === 'chars')       data = _setupChars(el);
    else if (type === 'accent') data = _setupAccent(el);
    else if (type === 'lines')  data = _setupLines(el);
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => {
        if (type === 'chars')       _animateChars(data, 0);
        else if (type === 'accent') _animateAccent(data, 0);
        else if (type === 'lines')  _animateLines(data, 0);
        else                        _animateFade(el, 0);
      },
    });
  });

  gate.querySelectorAll('[data-rg]').forEach(groupEl => {
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
      trigger: groupEl, start: 'top 85%', once: true,
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

  ScrollTrigger.refresh();
}

// ─── Init ────────────────────────────────────────────────────────────
const heroBgImg  = document.querySelector('.hero__bg-img');
const imageReady = heroBgImg ? heroBgImg.decode().catch(() => {}) : Promise.resolve();

if (!reduced) {
  const hasIntro =
    document.documentElement.classList.contains('intro-full') ||
    document.documentElement.classList.contains('intro-short');

  if (hasIntro) {
    initIntro(imageReady);
  } else {
    Promise.all([document.fonts.ready, imageReady]).then(() => {
      initReveals();
      initHeroDive();
      initFactsHandoff();
    });
  }
}

// ─── Intro animation (I3) ────────────────────────────────────────────
function initIntro(imageReady) {
  const preloader  = document.getElementById('preloader');
  if (!preloader) return;

  const isShort    = document.documentElement.classList.contains('intro-short');
  const bgEl       = preloader.querySelector('.preloader__bg');
  const content    = preloader.querySelector('.preloader__content');
  const rimSvg     = document.getElementById('preloader-rim-svg');
  const rimEl      = document.getElementById('preloader-rim-el');
  const skipBtn    = preloader.querySelector('.preloader__skip');
  const revealWrap = document.querySelector('.hero__reveal-wrap');

  const W      = window.innerWidth;
  const H      = window.innerHeight;
  const mobile = W < 600;

  let skipApplied = false;
  let handOffDone = false;

  // Oval dimensions in px (derived from vw/vh at this viewport)
  const INIT_OX = W * (mobile ? 0.35 : 0.11);
  const INIT_OC = H * 1.25;
  const RISE_OX = W * (mobile ? 0.45 : 0.17);
  const RISE_OC = H * 0.55;
  const DIVE_OX = W * 1.7; // exceeds viewport width → covers screen

  const ovalDur = isShort ? 0.8  : 1.5;
  const diveDur = isShort ? 1.0  : 2.4;

  // ── Lock scroll ────────────────────────────────────────────────
  if (lenis) lenis.stop();
  document.documentElement.style.overflow = 'hidden';

  // ── Hide header until hand-off ─────────────────────────────────
  gsap.set(header, { opacity: 0 });

  // ── Hero reveal-wrap: scale 0.8 → 1 during dive ───────────────
  if (revealWrap) gsap.set(revealWrap, { scale: 0.8, transformOrigin: '50% 50%' });

  // ── Oval state — plain object animated by GSAP ─────────────────
  const ov = { ox: INIT_OX, oy: INIT_OX / 1.3, oc: INIT_OC };

  function applyOval() {
    if (!bgEl) return;
    bgEl.style.setProperty('--ox', ov.ox.toFixed(2) + 'px');
    bgEl.style.setProperty('--oy', ov.oy.toFixed(2) + 'px');
    bgEl.style.setProperty('--oc', ov.oc.toFixed(2) + 'px');
    if (rimEl && rimSvg) {
      rimEl.setAttribute('rx', ov.ox.toFixed(1));
      rimEl.setAttribute('ry', ov.oy.toFixed(1));
      rimEl.setAttribute('cx', ((rimSvg.clientWidth || W) / 2).toFixed(1));
      rimEl.setAttribute('cy', ov.oc.toFixed(1));
    }
  }
  applyOval(); // set initial below-screen position

  const master = gsap.timeline({ paused: true });

  // ──────────────────────────────────────────────────────────────
  // Full intro sequence
  // ──────────────────────────────────────────────────────────────
  if (!isShort) {
    const mark = preloader.querySelector('.preloader__mark');
    const subL = preloader.querySelector('.preloader__sub--l');
    const subR = preloader.querySelector('.preloader__sub--r');
    const wm   = preloader.querySelector('.preloader__wordmark');
    const acc  = preloader.querySelector('.preloader__accent');
    const foot = preloader.querySelector('.preloader__foot');
    const bar  = preloader.querySelector('.preloader__bar');

    // Step 1 — Text reveals
    const textTl = gsap.timeline();
    if (mark) textTl.to(mark, { opacity: 1, duration: 0.5, ease: 'revealOut' }, 0);
    if (subL) textTl.to(subL, { opacity: 1, duration: 0.6, ease: 'revealOut' }, 0.1);
    if (subR) textTl.to(subR, { opacity: 1, duration: 0.6, ease: 'revealOut' }, 0.2);

    if (wm) {
      const wSplit = new SplitText(wm, { type: 'chars,words' });
      gsap.set(wm, { opacity: 1 });
      gsap.set(wSplit.chars, {
        transformPerspective: 800, opacity: 0, yPercent: 50, rotateY: 90,
      });
      textTl.to(wSplit.chars, {
        opacity: 1, yPercent: 0, rotateY: 0,
        duration: 1.0, stagger: 0.04, ease: 'revealOut',
        clearProps: 'transform,opacity',
      }, 0.15);
    }

    if (acc) {
      const aSplit = new SplitText(acc, { type: 'chars,words', aria: 'none' });
      gsap.set(acc, { opacity: 1 });
      gsap.set(aSplit.chars, {
        transformPerspective: 800, opacity: 0, rotateX: 90, x: '3rem', transformOrigin: '50% 100%',
      });
      textTl.to(aSplit.chars, {
        opacity: 1, rotateX: 0, x: 0,
        duration: 0.9, stagger: 0.05, ease: 'revealOut',
        clearProps: 'transform,opacity',
      }, 0.4);
    }

    if (foot) textTl.to(foot, { opacity: 1, duration: 0.5, ease: 'revealOut' }, 0.5);
    master.add(textTl, 0);

    // Step 2 — Progress bar (gates on image + fonts)
    if (bar) {
      gsap.set(bar, { scaleY: 0, transformOrigin: 'top center' });
      master.to(bar, { scaleY: 0.85, duration: 0.75, ease: 'power3.out' }, '>');

      master.call(() => {
        master.pause();
        const assetsReady = Promise.all([imageReady, document.fonts.ready]);
        assetsReady.then(() => {
          if (!skipApplied && !handOffDone) master.resume();
        });
        // Hard cap: 8s after gate fires
        setTimeout(() => {
          if (!skipApplied && !handOffDone) master.resume();
        }, 8000);
      });

      master.to(bar, { scaleY: 1, duration: 0.3, ease: 'power2.in' });
    }
  }

  // ── Step 3: Oval rises ─────────────────────────────────────────
  master.to(ov, {
    ox: RISE_OX, oy: RISE_OX / 1.3, oc: RISE_OC,
    duration: ovalDur, ease: 'revealInOut', onUpdate: applyOval,
  }, isShort ? 0 : '>');

  // ── Step 4: Dive ───────────────────────────────────────────────
  master.to(ov, {
    ox: DIVE_OX, oy: DIVE_OX / 1.3,
    duration: diveDur, ease: 'diveIn', onUpdate: applyOval,
  }, '>');

  // Hero scale 0.8 → 1 (first 62.5% of dive)
  if (revealWrap) {
    master.to(revealWrap, {
      scale: 1, duration: diveDur * 0.625, ease: 'revealInOut',
    }, '<');
  }

  // Fade out preloader content + rim (first 30% of dive)
  const fadeTs = [content, rimSvg].filter(Boolean);
  if (fadeTs.length) {
    master.to(fadeTs, { opacity: 0, duration: diveDur * 0.3, ease: 'none' }, '<');
  }

  // ── Step 5: Hand-off call ──────────────────────────────────────
  master.call(handOff);

  // ── Skip ───────────────────────────────────────────────────────
  function doSkip() {
    if (skipApplied || handOffDone) return;
    skipApplied = true;
    gsap.to(master, {
      progress: 1, duration: 0.4, ease: 'power2.inOut', overwrite: true,
      onComplete: handOff,
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', e => { e.stopPropagation(); doSkip(); });
  }
  ['wheel', 'touchstart', 'keydown'].forEach(ev =>
    document.addEventListener(ev, doSkip, { once: true, passive: true })
  );

  // ── Hand-off ───────────────────────────────────────────────────
  function handOff() {
    if (handOffDone) return;
    handOffDone = true;

    // Remove intro class → CSS rules for preloader drop away
    document.documentElement.classList.remove('intro-full', 'intro-short');

    // Restore reveal-wrap scale
    if (revealWrap) gsap.set(revealWrap, { clearProps: 'scale,transformOrigin' });

    // Unlock scroll
    document.documentElement.style.overflow = '';
    if (lenis) lenis.start();

    // Reveal header
    gsap.to(header, { opacity: 1, duration: 0.6, ease: 'revealOut', delay: 0.05 });

    // Remove preloader from DOM
    preloader.remove();

    // Flag session so next visit gets short version
    try { sessionStorage.setItem('cghVisited', '1'); } catch(e) {}

    // Start page animations
    Promise.all([document.fonts.ready, imageReady]).then(() => {
      initReveals();
      initHeroDive();
      initFactsHandoff();
      ScrollTrigger.refresh();
    });
  }

  master.play();
}

// ─── Hero dive (I2) ─────────────────────────────────────────────────
// CSS makes .hero__stage sticky; GSAP drives parallax+scale on scroll.
// Focus point is defined in image coordinates via data-focus-x / data-focus-y
// on the <img>. The transform-origin and mobile object-position are computed
// at runtime from the object-fit:cover crop geometry so the zoom lands on
// the pit at every aspect ratio. See README for how to retune on image swap.
function initHeroDive() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const stage   = hero.querySelector('.hero__stage');
  const bgWrap  = hero.querySelector('.hero__bg-wrap');
  const bgImg   = hero.querySelector('.hero__bg-img');
  const overlay = hero.querySelector('.hero__overlay');
  const colL      = hero.querySelector('.hero__col--l');
  const colR      = hero.querySelector('.hero__col--r');
  const heroDarken = hero.querySelector('.hero__darken');
  if (!stage || !bgWrap || !bgImg || !overlay) return;

  const focusX = parseFloat(bgImg.dataset.focusX) || 0.54;
  const focusY = parseFloat(bgImg.dataset.focusY) || 0.70;

  // Convert image-space focus point (focusX, focusY) to stage-space percentages,
  // accounting for object-fit:cover crop. On mobile also returns the
  // object-position value that centres the pit within the viewport.
  function computeFocus() {
    const iW = bgImg.naturalWidth;
    const iH = bgImg.naturalHeight;
    const sW = stage.offsetWidth;
    const sH = stage.offsetHeight;
    if (!iW || !iH || !sW || !sH) return null;

    const s = Math.max(sW / iW, sH / iH);       // cover scale factor
    const renderedW = iW * s;
    const renderedH = iH * s;
    const overflowX = renderedW - sW;
    const overflowY = renderedH - sH;

    // On mobile portrait the image is wider than the stage.
    // Shift object-position so the pit lands near centre.
    let objPx = 50, objPy = 50;
    const isMobile = sW < 900;
    if (isMobile) {
      if (overflowX > 1)
        objPx = Math.max(0, Math.min(100,
          (focusX * renderedW - sW * 0.5) / overflowX * 100));
      if (overflowY > 1)
        objPy = Math.max(0, Math.min(100,
          (focusY * renderedH - sH * 0.5) / overflowY * 100));
    }

    // Crop offset driven by the object-position percentages above
    const cropLeft = overflowX * (objPx / 100);
    const cropTop  = overflowY * (objPy / 100);

    // Pit position in stage coordinates → transform-origin percentages
    const pitSX = focusX * renderedW - cropLeft;
    const pitSY = focusY * renderedH - cropTop;

    return {
      origin: `${(pitSX / sW * 100).toFixed(2)}% ${(pitSY / sH * 100).toFixed(2)}%`,
      objPos: isMobile ? `${objPx.toFixed(1)}% ${objPy.toFixed(1)}%` : null,
    };
  }

  let heroDiveST = null;

  function buildDive() {
    if (heroDiveST) { heroDiveST.kill(); heroDiveST = null; }
    gsap.set([bgWrap, overlay], { clearProps: 'all' });
    if (colL) gsap.set([colL, colR], { clearProps: 'all' });
    if (heroDarken) gsap.set(heroDarken, { clearProps: 'opacity' });

    const focus  = computeFocus();
    const origin = focus ? focus.origin : `${focusX * 100}% ${focusY * 100}%`;

    bgImg.style.objectPosition = focus?.objPos || '';

    // Total timeline = 10 arbitrary units over the full scroll distance
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: hero, start: 'top top', end: 'bottom bottom', scrub: 1,
      },
    });

    tl.to(overlay, { y: '-120vh', ease: 'none', duration: 4 }, 0);
    tl.to(bgWrap,  { y: '-20vh',  ease: 'none', duration: 10 }, 0);
    tl.to(bgWrap,  { scale: 2.2, transformOrigin: origin, ease: 'none', duration: 8 }, 2);
    if (colL) {
      tl.to(colL, { xPercent: -100, ease: 'none', duration: 5 }, 3);
      tl.to(colR, { xPercent:  100, ease: 'none', duration: 5 }, 3);
    }

    // Darken last 25% of dive (units 7.5–10) so green cap blends in
    if (heroDarken) {
      tl.to(heroDarken, { opacity: 0.55, ease: 'none', duration: 2.5 }, 7.5);
    }

    heroDiveST = tl.scrollTrigger;
  }

  buildDive();

  let _diveResizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(_diveResizeTimer);
    _diveResizeTimer = setTimeout(() => {
      buildDive();
      ScrollTrigger.refresh();
    }, 200);
  }, { passive: true });
}

// ─── Facts handoff: reveal init ──────────────────────────────────────
// Facts is navy (dark-section); header stays white via data-theme="dark"
// IO. Reveals register immediately; ScrollTrigger gates them until in view.
function initFactsHandoff() {
  const factsEl = document.querySelector('[data-facts-gate]');
  if (!factsEl) return;
  initFactsReveals();
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
  const LABELS  = ['1 of 5', '2 of 5', '3 of 5', '4 of 5', '5 of 5'];
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

  // Prefetch origin images when the section is ~1 viewport away.
  // new Image() + decode() avoids the "preloaded but not used" warning
  // that <link rel="preload"> triggers when the JPEG hint is unused
  // because the browser served a WebP from the <picture> source.
  const prefetchIO = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    imgs.forEach(img => {
      const source = img.closest('picture')?.querySelector('source[type="image/webp"]');
      const hint = new Image();
      if (source) { hint.srcset = source.srcset; hint.sizes = source.sizes || '100vw'; }
      hint.src = img.src;
      hint.decode().catch(() => {});
    });
    prefetchIO.disconnect();
  }, { rootMargin: '100% 0px' });
  prefetchIO.observe(pin);

  updateOriginPin(window.scrollY);
}());
