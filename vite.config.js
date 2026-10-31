import { defineConfig } from 'vite';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function readSiteUrl() {
  const envPath = resolve(__dirname, '.env');
  if (!existsSync(envPath)) return 'https://example.com';
  const match = readFileSync(envPath, 'utf-8').match(/^SITE_URL=(.+)$/m);
  return match ? match[1].trim().replace(/\/$/, '') : 'https://example.com';
}

function readManifest() {
  const p = resolve(__dirname, 'public', 'img', 'webp', 'manifest.json');
  if (!existsSync(p)) return {};
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return {}; }
}

const SITE_URL = readSiteUrl();

function stonesGridPlugin() {
  return {
    name: 'stones-grid',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (!html.includes('<!-- STONES_GRID -->')) return html;

        const manifest = readManifest();
        const stonesPath = resolve(__dirname, 'src/data/stones.json');
        if (!existsSync(stonesPath)) return html;
        const stones = JSON.parse(readFileSync(stonesPath, 'utf-8'));

        function buildSrcset(imgPath) {
          const name = imgPath.replace('/img/', '').replace(/\.\w+$/, '');
          const widths = manifest[name] || [800, 1600];
          return widths.map(w => `/img/webp/${name}-${w}.webp ${w}w`).join(', ');
        }

        function cardHtml(stone, index) {
          const isFirstRow = index < 3;
          const caratStr = stone.pair ? `${stone.carat} ct total` : `${stone.carat} ct`;
          const cardLabel = `${stone.variety}, ${stone.shape.toLowerCase()}`;
          const treatmentShort =
            stone.treatment === 'No indications of heating' ? 'No heat' :
            stone.treatment === '[Pending]' ? 'Test pending' :
            stone.treatment;

          const slides = [
            { label: 'Daylight', img: stone.images.daylight },
            { label: 'Warm light', img: stone.images.warm },
            { label: 'LED', img: stone.images.led },
          ];

          const slidesHtml = slides.map((slide, i) => {
            const srcset = buildSrcset(slide.img);
            const loading = (isFirstRow && i === 0) ? 'eager' : 'lazy';
            const alt = `${stone.variety}, ${stone.shape.toLowerCase()}, ${caratStr}, ${slide.label.toLowerCase()}`;
            return (
              `<div class="sc__slide" data-slide="${i}" role="group" aria-roledescription="slide" aria-label="${slide.label} (${i + 1} of 3)">` +
              `<div class="sc__img-wrap"><picture>` +
              `<source type="image/webp" srcset="${srcset}" sizes="(min-width:1100px) 220px,(min-width:700px) 22vw,42vw">` +
              `<img src="${slide.img}" alt="${alt}" width="1600" height="900" loading="${loading}" class="sc__img">` +
              `</picture></div></div>`
            );
          }).join('');

          const chips = [
            stone.status === 'reserved' ? `<span class="sc-chip sc-chip--reserved">Reserved</span>` : '',
            stone.pair ? `<span class="sc-chip sc-chip--pair">Pair</span>` : '',
          ].filter(Boolean).join('');

          return (
            `<article class="stone-card" role="listitem"` +
            ` data-id="${stone.id}" data-variety="${stone.variety.toLowerCase()}"` +
            ` data-shape="${stone.shape.toLowerCase()}" data-carat="${stone.carat}"` +
            ` data-treatment="${stone.treatment}" data-lab="${stone.lab}"` +
            ` data-price-mode="${stone.priceMode}" data-status="${stone.status}" data-pair="${stone.pair}">` +
            `<a href="stone.html" class="sc__link" aria-label="${stone.variety}, ${stone.shape.toLowerCase()}, ${caratStr} — view record">` +
            `<div class="sc__tile" aria-roledescription="carousel">` +
            `<div class="sc__track" aria-live="off">${slidesHtml}</div>` +
            `<span class="sc__light-label" aria-live="polite">Daylight</span>` +
            `<div class="sc__progress" aria-hidden="true"><div class="sc__progress-fill"></div></div>` +
            `<div class="sc__pill" aria-hidden="true">` +
            `<span class="sc__pill-text"><span class="pill-stack">` +
            `<span class="pill-stack__t">View record</span>` +
            `<span class="pill-stack__t" aria-hidden="true">View record</span>` +
            `</span></span><span class="sc__pill-arrow">→</span></div>` +
            `<div class="sc__drag-chip" aria-hidden="true">↔ Drag for lighting</div>` +
            `</div></a>` +
            `<div class="sc__meta">` +
            `<div class="sc__meta-row"><span class="sc__name">${cardLabel}</span><span class="sc__carat">${caratStr}</span></div>` +
            `<div class="sc__meta-row sc__meta-row--sub"><span class="sc__report">[LAB] · ${treatmentShort} · Price on request</span>${chips}</div>` +
            `</div></article>`
          );
        }

        const availableCount = stones.filter(s => s.status === 'available').length;
        const gridHtml = stones.map((s, i) => cardHtml(s, i)).join('\n');

        return html
          .replace('<!-- STONES_GRID -->', gridHtml)
          .replace(/<!--STONES_COUNT-->/g, String(availableCount));
      },
    },
  };
}

function partialsPlugin() {
  return {
    name: 'partials',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const manifest = readManifest();

        const header      = readFileSync(resolve(__dirname, 'src/partials/header.html'), 'utf-8');
        const footer      = readFileSync(resolve(__dirname, 'src/partials/footer.html'), 'utf-8');
        const footerStone = readFileSync(resolve(__dirname, 'src/partials/footer-stone.html'), 'utf-8');

        function srcset(name) {
          const widths = manifest[name] || [800, 1600];
          return widths.map(w => `/img/webp/${name}-${w}.webp ${w}w`).join(', ');
        }

        return html
          .replace('<!--HEADER-->', header)
          .replace('<!--FOOTER-->', footer)
          .replace('<!--FOOTER_STONE-->', footerStone)
          .replace(/%%SITE_URL%%/g, SITE_URL)
          .replace(
            /srcset="\/img\/webp\/([a-z0-9-]+)-\d+\.webp[^"]*"/g,
            (_, name) => `srcset="${srcset(name)}"`
          )
          .replace(
            /imagesrcset="\/img\/webp\/([a-z0-9-]+)-\d+\.webp[^"]*"/g,
            (_, name) => `imagesrcset="${srcset(name)}"`
          );
      },
    },
  };
}

export default defineConfig({
  plugins: [stonesGridPlugin(), partialsPlugin()],
  build: {
    rollupOptions: {
      input: {
        main:   resolve(__dirname, 'index.html'),
        stone:  resolve(__dirname, 'stone.html'),
        stones: resolve(__dirname, 'stones.html'),
      },
    },
  },
});
