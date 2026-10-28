import { defineConfig } from 'vite';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read SITE_URL from .env (no trailing slash). Falls back to example.com.
function readSiteUrl() {
  const envPath = resolve(__dirname, '.env');
  if (!existsSync(envPath)) return 'https://example.com';
  const match = readFileSync(envPath, 'utf-8').match(/^SITE_URL=(.+)$/m);
  return match ? match[1].trim().replace(/\/$/, '') : 'https://example.com';
}

// Read the manifest written by gen-images.js to know which widths were generated.
function readManifest() {
  const p = resolve(__dirname, 'public', 'img', 'webp', 'manifest.json');
  if (!existsSync(p)) return {};
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return {}; }
}

const SITE_URL = readSiteUrl();

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
          // Rewrite srcsets before Vite processes assets (post order sees __VITE_PUBLIC_ASSET__ hashes)
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
  plugins: [partialsPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        stone: resolve(__dirname, 'stone.html'),
      },
    },
  },
});
