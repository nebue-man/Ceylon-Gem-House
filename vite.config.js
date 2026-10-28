import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function partialsPlugin() {
  return {
    name: 'partials',
    transformIndexHtml(html) {
      const header = readFileSync(resolve(__dirname, 'src/partials/header.html'), 'utf-8');
      const footer = readFileSync(resolve(__dirname, 'src/partials/footer.html'), 'utf-8');
      const footerStone = readFileSync(resolve(__dirname, 'src/partials/footer-stone.html'), 'utf-8');
      return html
        .replace('<!--HEADER-->', header)
        .replace('<!--FOOTER-->', footer)
        .replace('<!--FOOTER_STONE-->', footerStone);
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
