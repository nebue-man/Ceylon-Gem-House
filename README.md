# Ceylon Gem House

Concept website for a Sri Lankan coloured-gemstone seller. Two pages: home (`index.html`) and single-stone (`stone.html`). Fully static — no backend, no build required to open in a browser.

## Quick start

```bash
npm install
npm run dev        # Vite dev server on http://localhost:5173
```

Or open `index.html` directly in a browser (fonts load from Google Fonts CDN).

## Build

```bash
npm run build      # generates WebP images, then Vite builds to dist/
npm run preview    # serve dist/ on http://localhost:4173
```

The build output in `dist/` is a drop-in for any static host (Netlify, Vercel, S3, GitHub Pages).

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

To swap: drop new JPEG or PNG files with the same names into `public/img/`, then run `npm run images` (or `npm run build`). The script always generates WebP variants at all three widths (800w, 1600w, 2400w). For sources smaller than a target width the variant is capped at source size — no upscaling. Drop in a ≥2400px source and the 2400w WebP will be a genuine high-res file. All `<picture>` srcsets reference all three widths automatically.

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
