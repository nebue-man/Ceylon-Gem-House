# Ceylon Gem House — homepage + scrolling plan

Goal: add ERA Residence–style scrolling and layout ideas to the existing static design, **keeping the current look** (linen #F2EDE4, ink #1A1916, sapphire accent #1F3B70, Instrument Serif + Instrument Sans). Calm and architectural: motion supports the content, never shows off.

## Decisions (agreed)
- Built in this project, tested in a real browser.
- Keep the current fonts and colours.
- **Dark sections become deep sapphire navy `#0F1A33`** (featured stone section and footer). Text on navy: #EEE9DF, secondary #A9B1C4 (check 4.5:1).
- Add: pinned origin index, sticky stone column, smooth scroll + soft reveals, rotating badge logo + marquee.

## Tech
- Vite (vanilla, multi-page: `index.html`, `stone.html`), no framework.
- `lenis` from npm for smooth scroll. No GSAP needed; scroll progress comes from Lenis' scroll event plus element rects.
- CSS in `src/styles/` with custom properties for every colour, font, easing and duration. Move all inline styles out of the HTML.
- Shared header and footer (Vite HTML partial plugin or a tiny build-time include). Both pages must stay identical in look to today's export, apart from the changes below.
- Images in `public/img/` with fixed names (`paddy`, `pit`, `river`, `find`, `dop`, `sapphire`, `box`). New 2K images will replace them later, so nothing should depend on the current pixel sizes. Serve WebP plus `srcset` (800/1600/2400) and lazy-load everything below the hero.

## Motion tokens
- `--ease-out: cubic-bezier(0.25, 1, 0.5, 1)`; `--ease-inout: cubic-bezier(0.76, 0, 0.24, 1)`.
- Hover and colour changes 0.4 s; text reveals 0.8 s; image reveals 1.2–1.6 s (opacity, plus scale 1.04 → 1).
- Animate only `opacity` and `transform`. One animation loop (Lenis' requestAnimationFrame). No per-frame console logging.
- `prefers-reduced-motion: reduce` turns off smooth scroll, reveals, pinning, badge rotation and marquee, and shows everything in its final state.
- If JavaScript fails, all content must still be visible (reveal styles apply only when `html.js` is set).

## Features

### 1. Smooth scroll and soft reveals (both pages)
- Lenis on desktop pointers only (`lerp ≈ 0.1`), with native scrolling on touch devices.
- Anchor links (`#origin`, `#inquire`) scroll through Lenis, offset by the header height.
- Reveals use IntersectionObserver, which adds `.is-in` once; it never re-hides on the way back up. Headings, paragraphs, list rows and images reveal with a small stagger (60–80 ms) inside a group.

### 2. Header
- Fixed. On linen sections: transparent at the top, then linen with a hairline after 40 px of scroll.
- Over dark sections (`data-theme="dark"`: the pinned origin photo, the navy featured section and the footer) it switches to light text, with a 0.4 s colour transition. Use an IntersectionObserver on sections; don't measure on every frame.

### 3. Rotating badge logo
- A circular SVG with text on a path, "CEYLON GEM HOUSE · RATNAPURA · SRI LANKA ·", around the existing gem mark. About 64 px, top left, before the wordmark.
- Rotates once every 40 s, linear, using CSS only. Pauses on hover and stops under reduced motion. It links home and needs an accessible name.

### 4. Marquee strip
- Placed between the facts and the origin section. One line in Instrument Serif italic, about 40 px, looping slowly from right to left:
  "Formed ~550 million years ago · Raised from the illam · Washed by hand · Cut in Ratnapura · Examined by an independent laboratory · Sealed at export ·"
- No lab or brand names: they would imply partnerships. Uses CSS keyframes, duplicates the content for a seamless loop, pauses on hover, is static under reduced motion, and has `aria-hidden` on the duplicate.

### 5. Pinned origin index (homepage, replaces the 5-card grid on desktop)
- The section is about 5 × 100vh tall, containing one `position: sticky` stage of 100vh.
- **The stage:**
  - Five full-bleed photos are stacked: pit, river, find, dop and box.
  - The active photo fades in over 1.2 s and settles from scale 1.04 to 1.
  - Use a soft navy overlay where the text needs it, not a gradient wash.
- **Left side of the stage:**
  - The index list in large Instrument Serif: The pit, The river, The find, The cut, The seal. The active item is at full opacity and the others at 35%.
  - Clicking an item scrolls to that step.
- **Bottom right of the stage:**
  - A counter, "02 / 05".
  - The active step's two-line text, which crossfades.
  - A thin progress line.
  - A small caption: "AI concept image".
- **How the active step is chosen:** the step is `floor(progress × 5)`, where `progress` comes from the section's rect during Lenis' scroll event. Only toggle classes when the step changes. All transitions are CSS.
- **Keyboard:** the list items are real buttons or links in tab order, and the counter is announced politely (`aria-live="polite"` on the step text).
- **Below 900 px wide and under reduced motion:** no pinning. Fall back to today's stacked cards.

### 6. Sticky stone column (stone page)
- **Left column (about 58%):** large media scrolls past. Daylight, warm light and LED images, the unedited video (placeholder for now), and the colour-card shot, each labelled by its lighting.
- **Right column (about 42%), sticky (`top` = header height + 24 px):**
  - Lot number, the headline, and "Price on request".
  - Key facts, and the lab block with its verify link.
  - Provenance in a compact form, and the inquire buttons.
  - If it's taller than the viewport, it scrolls on its own.
- The lighting buttons scroll the left column to the matching image.
- **Below 900 px:** not sticky. The media comes first, then the details.

## Milestones (stop after each one for review)
1. **Foundation.** Vite set-up, CSS extracted to tokens, shared header and footer, no visual change except the navy dark sections. Compare before and after screenshots at 1440 and 390 px.
2. **Motion base.** Lenis, reveals, header theme switching, badge, marquee, reduced-motion handling.
3. **Pinned origin index**, with its mobile and reduced-motion fallback.
4. **Sticky stone column**, with the lighting buttons.
5. **QA:**
   - Real Chrome and Safari at 1440, 1920 and 390 px.
   - Keyboard-only pass and a reduced-motion pass.
   - Lighthouse: performance at least 90, accessibility at least 95.
   - Zero console errors.
   - A scroll recording of the origin index.

## Rules for the build
- Test every milestone in a real browser, not only headless. Don't call a milestone done while the console shows errors or warnings.
- Report what I'll see, with screenshots, and stop.
- Keep the copy rules in CLAUDE.md. All [PLACEHOLDERS] stay as they are.
- Commit after each approved milestone, not before.
