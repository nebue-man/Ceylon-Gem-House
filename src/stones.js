import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import Lenis from 'lenis';

gsap.registerPlugin(Flip, ScrollTrigger, CustomEase);
CustomEase.create('revOut', '0.16, 1, 0.3, 1');

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── Dark mode ──────────────────────────────────────────────
const dmBtn = document.querySelector('.dark-toggle');
dmBtn?.addEventListener('click', () => {
  const isDark = document.documentElement.classList.toggle('dark');
  try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch (_) {}
});

// ─── Smooth scroll + header state ───────────────────────────
const siteHeader = document.querySelector('.site-header');
let lenis = null;

if (!reduced) {
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  lenis.on('scroll', ({ scroll }) => {
    siteHeader?.classList.toggle('site-header--scrolled', scroll > 40);
  });
} else {
  window.addEventListener('scroll', () => {
    siteHeader?.classList.toggle('site-header--scrolled', window.scrollY > 40);
  }, { passive: true });
}

// ─── Headline reveal (load-time) ────────────────────────────
function initHeadlineReveal() {
  if (reduced) return;

  const eyebrow = document.querySelector('.stones-eyebrow');
  const lines = document.querySelectorAll('.sh-line');
  const sub = document.querySelector('.stones-sub');

  if (eyebrow) gsap.from(eyebrow, { opacity: 0, y: 6, duration: 0.5, ease: 'revOut', delay: 0.05 });

  lines.forEach((line, i) => {
    gsap.from(line, { yPercent: 110, duration: 0.85, ease: 'revOut', delay: 0.12 + i * 0.11 });
  });

  if (sub) gsap.from(sub, { opacity: 0, y: 10, duration: 0.6, ease: 'revOut', delay: 0.42 });
}

// ─── Card reveals ───────────────────────────────────────────
function initCardReveals() {
  if (reduced) return;

  const grid = document.querySelector('.stones-grid');
  if (!grid) return;

  const cols = getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length;
  const cards = [...grid.querySelectorAll('.stone-card')];

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      io.unobserve(entry.target);
      const col = cards.indexOf(entry.target) % cols;
      gsap.fromTo(entry.target,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.6, delay: col * 0.08, ease: 'revOut' }
      );
    }
  }, { rootMargin: '0px 0px -4% 0px', threshold: 0.06 });

  cards.forEach(c => { gsap.set(c, { opacity: 0, y: 18 }); io.observe(c); });
}

// ─── Card lighting drag ──────────────────────────────────────
function initCardLighting() {
  document.querySelectorAll('.stone-card').forEach((card) => {
    const link  = card.querySelector('.sc__link');
    const tile  = card.querySelector('.sc__tile');
    const track = card.querySelector('.sc__track');
    const lbl   = card.querySelector('.sc__light-label');
    const pFill = card.querySelector('.sc__progress-fill');
    const SLIDES = 3;
    const LABELS = ['Daylight', 'Warm light', 'LED'];

    let cur = 0;
    let startX = null, startY = null;
    let dragging = false, didDrag = false;
    let baseX = 0;

    function setSlide(idx, animate = true) {
      cur = Math.max(0, Math.min(SLIDES - 1, idx));
      const tileW = tile.offsetWidth;
      const tx = -cur * tileW;

      if (animate && !reduced) {
        gsap.to(track, { x: tx, duration: 0.38, ease: 'revOut', overwrite: true });
      } else {
        gsap.set(track, { x: tx });
      }

      if (lbl) lbl.textContent = LABELS[cur];

      if (pFill) {
        gsap.to(pFill, {
          xPercent: cur * 100,
          duration: animate && !reduced ? 0.32 : 0,
          ease: 'revOut',
          overwrite: true,
        });
      }
    }

    tile.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      startX = e.clientX;
      startY = e.clientY;
      baseX  = -cur * tile.offsetWidth;
      dragging = false;
      didDrag  = false;
    }, { passive: true });

    tile.addEventListener('pointermove', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!dragging) {
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        if (e.pointerType === 'mouse' && Math.abs(dy) > Math.abs(dx) * 1.4) {
          startX = null; return;
        }
        dragging = true;
        tile.setPointerCapture(e.pointerId);
      }

      if (Math.abs(dx) > 6) didDrag = true;

      const tileW = tile.offsetWidth;
      const raw = baseX + dx;
      const minX = -(SLIDES - 1) * tileW;
      const overscroll = tileW * 0.1;
      const clamped = Math.max(minX - overscroll, Math.min(overscroll, raw));
      gsap.set(track, { x: clamped });
    }, { passive: true });

    tile.addEventListener('pointerup', (e) => {
      const wasDragging = dragging;
      dragging = false;

      if (wasDragging) {
        const dx = e.clientX - startX;
        const tileW = tile.offsetWidth;
        let next = cur;
        if (dx < -tileW * 0.18) next = Math.min(SLIDES - 1, cur + 1);
        else if (dx > tileW * 0.18) next = Math.max(0, cur - 1);
        setSlide(next);
      }
      startX = null;
    });

    tile.addEventListener('pointercancel', () => {
      if (dragging) setSlide(cur);
      dragging = false; startX = null;
    });

    link.addEventListener('click', (e) => {
      if (didDrag) { e.preventDefault(); didDrag = false; }
    });

    link.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); setSlide(cur - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setSlide(cur + 1); }
    });

    setSlide(0, false);
  });
}

// ─── Filter + sort ───────────────────────────────────────────
function initFilterSort() {
  const panel     = document.getElementById('stones-panel');
  const openBtns  = document.querySelectorAll('[aria-controls="stones-panel"]');
  const closeBtn  = panel?.querySelector('.sp-close');
  const backdrop  = panel?.querySelector('.sp-backdrop');
  const inner     = panel?.querySelector('.stones-panel__inner');
  const applyBtn  = panel?.querySelector('.sp-apply');
  const resetBtn  = panel?.querySelector('.sp-reset');
  const spCount   = panel?.querySelector('.sp-count');
  const pageCount = document.getElementById('stones-count');
  const emptyEl   = document.querySelector('.stones-empty');
  const emptyRst  = emptyEl?.querySelector('.stones-empty__reset');

  if (!panel || !inner) return;

  let activeFilters = parseUrlFilters();
  let activeSort    = parseUrlSort();

  // --- Panel open/close ---
  function openPanel() {
    // Make visible first so GSAP can read real pixel dimensions
    panel.hidden = false;
    document.body.style.overflow = 'hidden';
    openBtns.forEach(b => b.setAttribute('aria-expanded', 'true'));

    if (!reduced) {
      const isWide = window.innerWidth >= 700;
      const offW = inner.offsetWidth;
      const offH = inner.offsetHeight;
      gsap.fromTo(inner,
        isWide ? { x: offW, y: 0 } : { x: 0, y: offH },
        { x: 0, y: 0, duration: 0.4, ease: 'revOut', immediateRender: true }
      );
      gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    }
    requestAnimationFrame(() => closeBtn?.focus());
  }

  function closePanel() {
    const isWide = window.innerWidth >= 700;
    const offW = inner.offsetWidth;
    const offH = inner.offsetHeight;

    const finish = () => {
      panel.hidden = true;
      document.body.style.overflow = '';
      openBtns.forEach(b => b.setAttribute('aria-expanded', 'false'));
      gsap.set(inner, { clearProps: 'all' });
      gsap.set(backdrop, { clearProps: 'opacity' });
    };

    if (reduced) { finish(); return; }

    gsap.to(inner, { x: isWide ? offW : 0, y: isWide ? 0 : offH, duration: 0.28, ease: 'power2.in', onComplete: finish });
    gsap.to(backdrop, { opacity: 0, duration: 0.22 });
  }

  openBtns.forEach(btn => btn.addEventListener('click', () => {
    panel.hidden ? openPanel() : closePanel();
  }));
  closeBtn?.addEventListener('click', closePanel);
  backdrop?.addEventListener('click', closePanel);
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

  // --- Filter logic ---
  function readForm() {
    const chks = (name) => [...panel.querySelectorAll(`[name="${name}"]:checked`)].map(el => el.value);
    return {
      varieties:     chks('variety'),
      shapes:        chks('shape'),
      treatments:    [...panel.querySelectorAll('[name="treatment"]:checked')].map(el => el.value),
      caratMin:      parseFloat(panel.querySelector('[name="carat-min"]')?.value) || 0,
      caratMax:      parseFloat(panel.querySelector('[name="carat-max"]')?.value) || Infinity,
      availableOnly: panel.querySelector('[name="available-only"]')?.checked ?? true,
      pairsOnly:     panel.querySelector('[name="pairs-only"]')?.checked ?? false,
    };
  }

  function readFormSort() {
    return panel.querySelector('[name="sort"]:checked')?.value || 'newest';
  }

  function matchCard(card, f) {
    if (f.varieties.length && !f.varieties.includes(card.dataset.variety)) return false;
    if (f.shapes.length && !f.shapes.includes(card.dataset.shape)) return false;
    if (f.treatments.length && !f.treatments.includes(card.dataset.treatment)) return false;
    const ct = parseFloat(card.dataset.carat);
    if (ct < f.caratMin || ct > f.caratMax) return false;
    if (f.availableOnly && card.dataset.status !== 'available') return false;
    if (f.pairsOnly && card.dataset.pair !== 'true') return false;
    return true;
  }

  function sortedBy(cards, sort) {
    return [...cards].sort((a, b) => {
      if (sort === 'carat-high') return parseFloat(b.dataset.carat) - parseFloat(a.dataset.carat);
      if (sort === 'carat-low')  return parseFloat(a.dataset.carat) - parseFloat(b.dataset.carat);
      return a.dataset.id < b.dataset.id ? -1 : 1;
    });
  }

  function applyFiltersAndSort(filters, sort, animate = true) {
    const grid     = document.querySelector('.stones-grid');
    const allCards = [...grid.querySelectorAll('.stone-card')];
    const visible  = allCards.filter(c => c.style.display !== 'none');

    const flipState = (animate && !reduced && visible.length) ? Flip.getState(visible) : null;

    const matching    = allCards.filter(c => matchCard(c, filters));
    const notMatching = allCards.filter(c => !matchCard(c, filters));
    const ordered     = sortedBy(matching, sort);

    ordered.forEach(c => { c.style.display = ''; grid.appendChild(c); });
    notMatching.forEach(c => { c.style.display = 'none'; grid.appendChild(c); });

    if (emptyEl) emptyEl.hidden = ordered.length > 0;

    const count = ordered.length;
    if (spCount) spCount.textContent = count;
    if (pageCount) pageCount.textContent = count;

    if (flipState) {
      Flip.from(flipState, {
        duration:  0.48,
        ease:      'power2.out',
        stagger:   0.025,
        onEnter:  (els) => gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 0.22 }),
        onLeave:  (els) => gsap.to(els, { opacity: 0, duration: 0.18 }),
      });
    }

    saveUrlState(filters, sort);
  }

  function updateLiveCount() {
    if (!spCount) return;
    const f = readForm();
    const n = [...document.querySelectorAll('.stone-card')].filter(c => matchCard(c, f)).length;
    spCount.textContent = n;
  }

  panel.addEventListener('change', updateLiveCount);
  panel.addEventListener('input',  updateLiveCount);

  applyBtn?.addEventListener('click', () => {
    activeFilters = readForm();
    activeSort    = readFormSort();
    applyFiltersAndSort(activeFilters, activeSort);
    closePanel();
  });

  function resetForm() {
    panel.querySelectorAll('[name="variety"],[name="shape"],[name="treatment"]').forEach(el => el.checked = false);
    panel.querySelectorAll('[name="carat-min"],[name="carat-max"]').forEach(el => el.value = '');
    const ao = panel.querySelector('[name="available-only"]'); if (ao) ao.checked = true;
    const po = panel.querySelector('[name="pairs-only"]');     if (po) po.checked = false;
    const sn = panel.querySelector('[name="sort"][value="newest"]'); if (sn) sn.checked = true;
    updateLiveCount();
  }

  resetBtn?.addEventListener('click', resetForm);
  emptyRst?.addEventListener('click', () => {
    resetForm();
    activeFilters = readForm();
    activeSort    = readFormSort();
    applyFiltersAndSort(activeFilters, activeSort);
  });

  // --- URL state ---
  function parseUrlFilters() {
    const p = new URLSearchParams(location.search);
    return {
      varieties:     p.getAll('variety'),
      shapes:        p.getAll('shape'),
      treatments:    p.getAll('treatment'),
      caratMin:      parseFloat(p.get('carat-min')) || 0,
      caratMax:      parseFloat(p.get('carat-max')) || Infinity,
      availableOnly: p.get('available-only') !== 'false',
      pairsOnly:     p.get('pairs-only') === 'true',
    };
  }

  function parseUrlSort() {
    return new URLSearchParams(location.search).get('sort') || 'newest';
  }

  function saveUrlState(filters, sort) {
    const p = new URLSearchParams();
    filters.varieties.forEach(v => p.append('variety', v));
    filters.shapes.forEach(s => p.append('shape', s));
    filters.treatments.forEach(t => p.append('treatment', t));
    if (filters.caratMin > 0)     p.set('carat-min', filters.caratMin);
    if (filters.caratMax < Infinity) p.set('carat-max', filters.caratMax);
    if (!filters.availableOnly)   p.set('available-only', 'false');
    if (filters.pairsOnly)        p.set('pairs-only', 'true');
    if (sort !== 'newest')        p.set('sort', sort);
    const qs = p.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }

  function syncFormToState(filters, sort) {
    panel.querySelectorAll('[name="variety"]').forEach(el => { el.checked = filters.varieties.includes(el.value); });
    panel.querySelectorAll('[name="shape"]').forEach(el => { el.checked = filters.shapes.includes(el.value); });
    panel.querySelectorAll('[name="treatment"]').forEach(el => { el.checked = filters.treatments.includes(el.value); });
    const cmn = panel.querySelector('[name="carat-min"]'); if (cmn) cmn.value = filters.caratMin > 0 ? filters.caratMin : '';
    const cmx = panel.querySelector('[name="carat-max"]'); if (cmx) cmx.value = filters.caratMax < Infinity ? filters.caratMax : '';
    const ao  = panel.querySelector('[name="available-only"]'); if (ao) ao.checked = filters.availableOnly;
    const po  = panel.querySelector('[name="pairs-only"]');     if (po) po.checked = filters.pairsOnly;
    panel.querySelectorAll('[name="sort"]').forEach(el => { el.checked = el.value === sort; });
  }

  syncFormToState(activeFilters, activeSort);
  applyFiltersAndSort(activeFilters, activeSort, false);
}

// ─── Floating bar visibility ─────────────────────────────────
function initFloatingBar() {
  const bar    = document.querySelector('.stones-bar');
  const footer = document.querySelector('.site-footer');
  if (!bar || !footer) return;

  const io = new IntersectionObserver(([entry]) => {
    bar.classList.toggle('is-hidden', entry.isIntersecting);
  }, { threshold: 0.01 });

  io.observe(footer);
}

// ─── Generic [data-reveal] elements ─────────────────────────
function initReveal() {
  if (reduced) return;
  const els = document.querySelectorAll('[data-reveal]');
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      gsap.fromTo(e.target, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.65, ease: 'revOut' });
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach(el => { gsap.set(el, { opacity: 0 }); io.observe(el); });
}

// ─── Init ────────────────────────────────────────────────────
document.fonts.ready.then(() => {
  initHeadlineReveal();
  initCardLighting();
  initCardReveals();
  initFilterSort();
  initFloatingBar();
  initReveal();
  if (lenis) ScrollTrigger.refresh();
});
