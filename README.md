# Ceylon Gem House

Concept website for a Sri Lankan coloured-gemstone seller. Two pages: home (`index.html`) and single-stone (`stone.html`). Fully static — no backend, no build required to open in a browser.

## Quick start

```bash
npm install
npm run dev        # Vite dev server on http://localhost:5173
```

Or open `index.html` directly in a browser (fonts are self-hosted in `public/fonts/`).

## Build

```bash
npm run build      # generates WebP images, then Vite builds to dist/
npm run preview    # serve dist/ on http://localhost:4173
```

The build output in `dist/` is a drop-in for any static host (Netlify, Vercel, S3, GitHub Pages). See **Deploy** below.

## Swap images

Source images live in `public/img/` with fixed names:

| File | Used as |
|---|---|
| `sapphire.jpg` | hero (index), all five stone frames, featured stone |
| `paddy.jpg` | Ratnapura landscape band |
| `pit.jpg` | Origin step I |
| `river.jpg` | Origin step II |
| `find.jpg` | Origin step III |
| `dop.jpg` | Origin step IV |
| `box.jpg` | Origin step V |

To swap: drop new JPEG or PNG files with the same names into `public/img/`, then run `npm run images` (or `npm run build`). The script generates WebP variants only at widths ≤ the source width (800w, 1600w, 2400w). No upscaling — a 1600px source gets 800w and 1600w only; a ≥2400px source gets all three. Srcsets in the built HTML automatically match the generated widths.

## Site URL

Open `.env` and set `SITE_URL` to your deployed domain before building for production:

```
SITE_URL=https://yoursite.com
```

This is substituted into the built HTML for `og:image`, `og:url` and `<link rel="canonical">`. The default placeholder is `https://example.com`. No trailing slash.

## Motion

Smooth scroll (Lenis) and reveal animations (`[data-reveal]`) are disabled automatically when the visitor has `prefers-reduced-motion: reduce` set in their OS. No extra work needed.

CSS tokens in `src/styles/main.css`:
- `--dur-reveal` — reveal animation duration (default `0.7s`, set to `0s` under reduced-motion)
- `--stone-details-top` — sticky-column top offset, computed by JS from header height and column height

The sticky details column on `stone.html` is layout, not motion — it remains sticky under reduced-motion.

## Known placeholders

All values in `[BRACKETS]` in the HTML are placeholders for the client to fill before launch. See `CLAUDE.md` for the full list with locations.

Key ones:
- `[LAB]` / `[NO.]` / `[DATE]` — lab name, report number, certificate date (stone.html)
- `[X.XX] ct` — carat weight; `[L × W × D] mm` — dimensions
- `NGJA licence no. [NO.]` — NGJA licence in footer
- `[email]` / `[phone]` / `[Street address]` — contact details in footer
- `[24]` — reply-within hours on both pages

## Deploy

### Netlify

1. Push to a GitHub/GitLab repo.
2. In the Netlify UI: **Add new site → Import an existing project → pick your repo**.
3. Build settings are auto-detected from `netlify.toml` (build command: `npm run build`, publish directory: `dist`).
4. In **Site configuration → Environment variables** add `SITE_URL=https://your-actual-domain.com`.
5. Trigger a deploy. Netlify serves the `dist/` output with automatic gzip/brotli and CDN caching.

Or use the CLI:
```bash
npm install -g netlify-cli
netlify init        # connects to your Netlify account and repo
netlify deploy --prod
```

### Vercel

```bash
npm install -g vercel
vercel              # follow prompts; override build command to `npm run build`, output dir to `dist`
```

Or via the Vercel UI: **Add new project → import repo → override output directory to `dist`**.

Add `SITE_URL` as an environment variable in the project settings before the first production deploy.

### Any static host (S3, GitHub Pages, etc.)

Run `npm run build` locally (with `.env` set), then upload the `dist/` folder. No server-side processing is needed.

## QA artefacts (`qa/`)

| File | What it shows |
|---|---|
| `01-skip-link.png` | Skip link visible on first Tab |
| `05-mobile-menu-btn-focused.png` | Menu button focus ring, 390px |
| `06-mobile-menu-open.png` | Overlay open, close button focused |
| `09-stone-lighting-btn.png` | Lighting nav button focused, stone page |
| `chrome-index-1440.png` | Full-page Chrome 1440 |
| `chrome-index-1920.png` | Full-page Chrome 1920 |
| `chrome-index-390.png` | Full-page Chrome 390 (mobile) |
| `webkit-index-1440.png` | Full-page WebKit 1440 (Safari stand-in) |
| `webkit-index-390.png` | Full-page WebKit 390 |
| `reduced-motion-index.png` | Homepage with prefers-reduced-motion: reduce |
| `reduced-motion-stone.png` | Stone page with prefers-reduced-motion: reduce |
| `origin-scroll-1440.webm` | Scroll video through origin section at 1440px |

## Lighthouse scores (production build, 2026-10-28)

| Page | Viewport | P | A | BP | SEO |
|---|---|---|---|---|---|
| index.html | Desktop | 100 | 100 | 100 | 100 |
| index.html | Mobile | 99 | 100 | 100 | 100 |
| stone.html | Desktop | 100 | 100 | 100 | 100 |
| stone.html | Mobile | 100 | 100 | 100 | 100 |
