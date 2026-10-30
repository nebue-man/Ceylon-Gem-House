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

### Hero focus point (`paddy.jpg`)

The hero scroll-dive zooms toward a specific point in `paddy.jpg`. The target is stored as **image coordinates** on the `<img class="hero__bg-img">` element:

```html
<img … data-focus-x="0.54" data-focus-y="0.70">
```

These are fractions of the image's natural width and height (0 = left/top, 1 = right/bottom). The JavaScript in `src/main.js` (`initHeroDive`) converts them to the correct `transform-origin` at runtime using the `object-fit: cover` crop geometry, so the zoom lands on the same spot at every viewport size. On mobile portrait it also sets `object-position` to keep the focus point near the centre.

**When you swap `paddy.jpg`:** open the new image, identify the feature you want to zoom toward, and measure its position as a fraction of the image dimensions. Update `data-focus-x` and `data-focus-y` accordingly. No CSS or JS changes needed.

## Site URL

Open `.env` and set `SITE_URL` to your deployed domain before building for production:

```
SITE_URL=https://yoursite.com
```

This is substituted into the built HTML for `og:image`, `og:url` and `<link rel="canonical">`. The default placeholder is `https://example.com`. No trailing slash.

## Intro animation

A full-screen intro plays on the **first visit** within a browser session; subsequent visits in the same session get a short version. Both versions can be skipped at any time.

### How it works

1. **No-flash inline script** (`<head>`) runs before CSS paints. It reads `sessionStorage` and adds either `intro-full` or `intro-short` to `<html>` — this makes the preloader visible and keeps the hero hidden until hand-off. Under `prefers-reduced-motion: reduce` or when JS is absent, neither class is added and the hero shows immediately.
2. **GSAP master timeline** (`initIntro` in `src/main.js`) drives five phases:
   - Text reveals on the navy cover (0–2.05 s)
   - Progress bar gating on image decode + fonts ready (2.05–3.10 s)
   - Oval window rises from below the screen (3.10–4.60 s)
   - Oval dives past the screen edges, revealing the hero (4.60–7.00 s)
   - Hand-off: preloader removed, scroll unlocked, hero text revealed
3. **Short version** (repeat visits): skips cover text and progress bar. Oval rises then dives at 0.8× speed — total ≈1.8 s.
4. **Skip**: "Skip intro" button (first Tab stop), any key, click or wheel event accelerates the timeline to its end state in 0.4 s.

### sessionStorage key

`cghVisited` — set to `'1'` by `handOff()` after the first full intro. Clear it (or open an incognito window) to re-trigger the full intro.

### Tuning timings

All durations are in `initIntro()` in `src/main.js`:

| Variable | Default | Effect |
|---|---|---|
| `textTl` stagger/durations | various | Speed of cover text reveals (step 1) |
| `bar` 0→85% duration | `0.75 s` | Length of progress bar fill |
| `bar` 85→100% duration | `0.30 s` | Final bar snap after gate |
| `ovalDur` | `1.5 s` full / `0.8 s` short | Oval-rise duration |
| `diveDur` | `2.4 s` full / `1.0 s` short | Oval-dive duration |

To shorten the full intro further, reduce `bar` fill time or `ovalDur`. Do not shorten `diveDur` — it is tied to the hero scale animation (first 62.5%) and the preloader fade (first 30%).

### Swapping the hero image

The intro oval reveals the hero (`paddy.jpg`). When you replace `public/img/paddy.jpg`, also update the dive focus point on `<img class="hero__bg-img">` in `index.html`:

```html
<img … data-focus-x="0.54" data-focus-y="0.70">
```

These are fractions of the image's natural width and height (0 = left/top, 1 = right/bottom). `initHeroDive()` in `src/main.js` converts them to the correct `transform-origin` for the scroll-dive zoom at every viewport size.

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

## Lighthouse scores (production build, 2026-10-30)

CLS = 0 on all pages/viewports. FCP desktop ≈0.4 s, mobile ≈1.7 s.

| Page | Viewport | Perf | A11y | BP | SEO |
|---|---|---|---|---|---|
| index.html | Desktop | 100 | 100 | 100 | 100 |
| index.html | Mobile  |  98 | 100 | 100 | 100 |
| stone.html | Desktop | 100 | 100 | 100 | 100 |
| stone.html | Mobile  |  99 | 100 | 100 | 100 |
