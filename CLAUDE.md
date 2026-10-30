# Ceylon Gem House — static site design

Concept website for an online store selling certified Ceylon (Sri Lankan) coloured gemstones, mainly blue sapphires, to private buyers, collectors and jewellers worldwide. "Ceylon Gem House" is a placeholder brand.

## Pages
- `index.html` — home: hero, Ratnapura landscape band, sourced facts, five-step origin (pit, river, find, cut, seal), Marco Polo quote, dark featured-stone section, "The record", trade section, inquiry form, footer.
- `stone.html` — single stone page: lighting-nav → media column (5 frames) + sticky details column (key facts, lab block, provenance, selector's note, inquire CTAs).

## Stack
- Vite (`npm run dev` / `npm run build` → `dist/`)
- Plain HTML + CSS (`src/styles/main.css`) + JS (`src/main.js`)
- GSAP 3 with ScrollTrigger, SplitText, CustomEase — one animation loop via `gsap.ticker`
- Lenis for smooth scroll, driven by `gsap.ticker.add((t) => lenis.raf(t * 1000))`; disabled under `prefers-reduced-motion: reduce`
- Image pipeline: `scripts/gen-images.js` generates WebP variants via sharp

## Intro animation (I3)

The intro plays on first visit per session (`sessionStorage` key `cghVisited`). A no-flash inline `<head>` script adds `intro-full` or `intro-short` to `<html>` before CSS paints; under `prefers-reduced-motion` neither class is added.

**Full intro** (≤7 s on a fast connection): navy cover text reveals → progress bar gates on `img.decode()` + `document.fonts.ready` → oval window (`mask-image` ellipse via CSS vars `--ox`, `--oy`, `--oc`) rises from below screen → oval dives past screen edge revealing hero → hand-off (preloader removed, scroll unlocked).

**Short intro** (≈1.8 s, repeat visits): oval rise + dive only at 0.8× / 1.0× durations.

**Skip**: "Skip intro" button (first Tab stop), any key, click or wheel, drives `master.progress` to 1 in 0.4 s.

**Tuning**: all durations are in `initIntro()` in `src/main.js`. To shorten the full intro trim the bar fill duration (`0.75 s`) or `ovalDur` (`1.5 s`). Never shorten `diveDur` (`2.4 s`) — the hero scale and preloader fade are derived from it.

**Hero focus point**: `data-focus-x` / `data-focus-y` on `<img class="hero__bg-img">` are image-coordinate fractions (0–1). Update them when swapping `paddy.jpg`. See README for details.

## Design system
- Background linen `#F2EDE4`; light panel `#FAF7F1`; trade band `#E7DFD2`; dark sections `--navy: #0F1A33` and `#1A1916`.
- Text `#1A1916`; secondary `#3F3C36`; labels `#5E5A52` (passes 4.5:1 on linen); hairlines `#D9D1C3`.
- One accent: sapphire `--accent: #1F3B70` (italic words, numbers, primary button).
- Type: Instrument Serif (display) + Instrument Sans (body/labels). Google Fonts.
- Max content width 1280px. Never stark white.

## Motion tokens (CSS custom properties in `main.css`)
| Token | Default | Reduced-motion override |
|---|---|---|
| `--dur-reveal` | `0.7s` | `0s` |
| `--ease-reveal` | `cubic-bezier(0.16,1,0.3,1)` | unchanged |
| `--lenis-scroll` | smooth (JS) | instant (Lenis disabled) |

`[data-reveal]` elements animate opacity 0→1 + translateY 24px→0 on IntersectionObserver entry. Under `prefers-reduced-motion: reduce`, they start at opacity 1, transform none — no observer needed.

The sticky details column (`--stone-details-top`) is **not** motion; it stays sticky under reduced-motion. Only smooth scroll and reveal animations turn off.

## Source images
Images live in `public/img/` with fixed names: `paddy`, `pit`, `river`, `find`, `dop`, `sapphire`, `box` (`.jpg`). Drop in new files at any resolution and run `npm run images` or `npm run build` to regenerate WebP variants at 800w, 1600w (and 2400w if the source is ≥ 2400px wide).

Generated WebP files go to `public/img/webp/` and are served as `<picture>` source sets with all three widths (800w, 1600w, 2400w). For sources smaller than 2400px the 2400w file is capped at source width — no upscaling. JPEG originals remain as fallbacks.

## Copy rules
- Voice: the quiet expert who shows the papers. Calm, exact, documented.
- Origin and treatment are always credited to a named lab report, never stated in the brand's own voice. Disclose heating plainly.
- Avoid: finest, premier, legendary, exquisite, AAA, semi-precious, "certified" without a lab name, investment-grade, ethical/conflict-free without evidence.
- Every statistic carries its source and year.
- All AI imagery stays labelled as concept images.

## Known placeholders (replace before launch)
All values in `[BRACKETS]` throughout the HTML:

| Placeholder | Appears in | Notes |
|---|---|---|
| `[CGH-0001]` | stone.html lot number | Sequential lot ID |
| `[X.XX] ct` | stone.html headline + key facts | Carat weight |
| `[L × W × D] mm` | stone.html key facts | Dimensions |
| `[Medium-dark, …]` | stone.html colour | Certificate wording |
| `[Eye-clean at …]` | stone.html clarity | Certificate wording |
| `[LAB]` | both pages | Lab name (e.g. GIA, Gübelin) |
| `[NO.]` | both pages | Certificate report number |
| `[DATE]` | stone.html lab block | Certificate date |
| `[Heated / No indications of heating]` | stone.html treatment | Certificate wording |
| `[District]` | stone.html provenance | e.g. Ratnapura, Elahera |
| `[Year]` | stone.html provenance | Year found |
| `[source]` | stone.html provenance | Rough source name |
| `[Month Year]` | stone.html provenance | Acquisition date |
| `[cutter's name]` | stone.html provenance | Cutter |
| `[One sentence …]` | stone.html selector's note | Dealer's note |
| `[Return terms]` | stone.html inquire | e.g. "7-day returns" |
| `[24]` | both pages | Reply-within hours |
| `[email]` | footer | Contact email |
| `[phone]` | footer | Contact phone |
| `[Street address]` | footer | Registered address |
| `NGJA licence no. [NO.]` | footer | NGJA licence number |
