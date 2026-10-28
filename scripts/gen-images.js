import sharp from 'sharp';
import { readdir, mkdir, writeFile } from 'fs/promises';
import { join, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT   = join(__dirname, '..');
const SRC    = join(ROOT, 'public', 'img');
const OUT    = join(ROOT, 'public', 'img', 'webp');
const WIDTHS = [800, 1600, 2400];

export async function generateImages() {
  await mkdir(OUT, { recursive: true });
  const files = (await readdir(SRC)).filter(f => /\.(jpe?g|png)$/i.test(f));

  const manifest = {};

  await Promise.all(files.map(async file => {
    const name    = basename(file, extname(file));
    const { width: srcW } = await sharp(join(SRC, file)).metadata();

    // Only generate widths that fit in the source — no upscaling
    const targets = WIDTHS.filter(w => w <= srcW);

    await Promise.all(targets.map(w =>
      sharp(join(SRC, file))
        .resize(w)
        .webp({ quality: 82 })
        .toFile(join(OUT, `${name}-${w}.webp`))
    ));

    manifest[name] = targets;
    console.log(`[images] ${name}: ${targets.map(w => `${w}w`).join(', ')} → WebP`);
  }));

  // Write manifest so vite.config can compute correct srcsets at build time
  await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('[images] manifest written');
}

// Direct execution: node scripts/gen-images.js
const isMain = process.argv[1] &&
  fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  generateImages().catch(err => { console.error(err); process.exit(1); });
}
