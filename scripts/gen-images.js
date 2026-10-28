import sharp from 'sharp';
import { readdir, mkdir } from 'fs/promises';
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

  await Promise.all(files.map(async file => {
    const name    = basename(file, extname(file));
    const { width: srcW } = await sharp(join(SRC, file)).metadata();

    // Always generate all widths. Cap resize at source width (no upscaling) so
    // the file always exists for srcset references. When the client drops in a
    // ≥2400 px source, the 2400w variant is a genuine high-res file.
    await Promise.all(WIDTHS.map(w =>
      sharp(join(SRC, file))
        .resize(Math.min(w, srcW))
        .webp({ quality: 82 })
        .toFile(join(OUT, `${name}-${w}.webp`))
    ));

    const generated = WIDTHS.map(w => w <= srcW ? `${w}w` : `${w}w(→${srcW}w)`);
    console.log(`[images] ${name}: ${generated.join(', ')} → WebP`);
  }));
}

// Direct execution: node scripts/gen-images.js
const isMain = process.argv[1] &&
  fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  generateImages().catch(err => { console.error(err); process.exit(1); });
}
