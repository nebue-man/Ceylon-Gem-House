import Lenis from 'lenis';

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
let updateOriginPin = null; // set by origin-pin init below

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

  // Fire when a dark section enters the strip from y=0 to y=headerH
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

  // Rebuild IO on resize since viewport height changes
  window.addEventListener('resize', () => {
    darkIO.disconnect();
    activeDark.clear();
    darkIO = makeDarkIO();
    darkSections.forEach(s => darkIO.observe(s));
    updateDark();
  }, { passive: true });
}

// ─── Smooth scroll (desktop + no reduced-motion only) ───────────────
let lenis = null;

if (!reduced && mq.pointer.matches) {
  lenis = new Lenis({ lerp: 0.1 });
  window.__lenis = lenis;

  lenis.on('scroll', ({ scroll }) => onScroll(scroll));

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
} else {
  // Native scroll fallback: update header scroll state
  window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });
  // Initial call in case page is loaded mid-scroll
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

// ─── Scroll reveals ──────────────────────────────────────────────────
if (!reduced) {
  const STAGGER = 70; // ms between items

  // Single-element reveals
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      revealIO.unobserve(e.target);
    });
  }, { threshold: 0.12 });

  // Group reveals (stagger children [data-ri])
  const groupIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const items = e.target.querySelectorAll('[data-ri]');
      items.forEach((el, i) => {
        setTimeout(() => el.classList.add('is-in'), i * STAGGER);
      });
      groupIO.unobserve(e.target);
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('[data-reveal]').forEach(el => revealIO.observe(el));
  document.querySelectorAll('[data-rg]').forEach(el => groupIO.observe(el));
}

// ─── Stone page: details column sticky-top (fits-at-either-edge) ─────
(function () {
  const details = document.querySelector('.stone__details');
  if (!details) return;

  function update() {
    const headerH = header?.offsetHeight ?? 108;
    const viewH   = window.innerHeight;
    const colH    = details.offsetHeight;
    const topA    = headerH + 24;                 // short column: stick under header
    const topB    = viewH - colH - 24;            // tall column: stick bottom 24px above fold
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

  // Button click → immediate active feedback + scroll to that frame
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

  // IntersectionObserver: track which frame is topmost in the reading zone
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

  // Button clicks → scroll to that step's start
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

  // Preload all 5 images when section is ~2 viewports away
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

  // Initialise from current scroll (e.g. page loaded mid-section)
  updateOriginPin(window.scrollY);
}());
