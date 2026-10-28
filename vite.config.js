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

const SITE_URL = readSiteUrl();

function partialsPlugin() {
  return {
    name: 'partials',
    transformIndexHtml(html) {
      const header     = readFileSync(resolve(__dirname, 'src/partials/header.html'), 'utf-8');
      const footer     = readFileSync(resolve(__dirname, 'src/partials/footer.html'), 'utf-8');
      const footerStone = readFileSync(resolve(__dirname, 'src/partials/footer-stone.html'), 'utf-8');
      return html
        .replace('<!--HEADER-->', header)
        .replace('<!--FOOTER-->', footer)
        .replace('<!--FOOTER_STONE-->', footerStone)
        .replace(/%%SITE_URL%%/g, SITE_URL);
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
