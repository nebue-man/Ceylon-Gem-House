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

// Set --header-h CSS variable from measured height
function measureHeader() {
  const h = header.offsetHeight;
  document.documentElement.style.setProperty('--header-h', h + 'px');
}
measureHeader();
window.addEventListener('resize', measureHeader, { passive: true });

// ─── Header scroll state ────────────────────────────────────────────
function onScroll(y) {
  header.classList.toggle('site-header--scrolled', y > 40);
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
