# Ceylon Gem House — intro + hero dive plan

Inspired by the ERA Residence homepage. See "ERA Residence homepage breakdown (reference)" for the source mechanics. We rebuild the **idea** with our own code, brand and content, and copy nothing.

## Agreed
- Scope: **intro (preloader) + hero dive + ERA-style text reveals.** The rest of the homepage stays as built (pinned origin index, featured stone, record, trade, inquiry).
- The reveal window is an **oval**, the face-up outline of an oval-cut sapphire, about 1.3 : 1 wide.
- You fly into the **paddy fields at dawn** (the `paddy` image). It becomes the full-screen hero, and the separate paddy band section is removed.
- The full intro plays on the **first visit per browser session**. Later visits get a short version of about 1.8 s. It can always be skipped.
- Keep our look: linen #F2EDE4, ink #1A1916, navy #0F1A33, sapphire #1F3B70, Instrument Serif + Instrument Sans (self-hosted). Instrument Serif *italic* plays the role ERA gives its script font.

## The experience, in order
1. **Navy screen (0–1.4 s).**
   - The background is navy, with a thin linen inset frame line about 24 px from the edges and a faint oval-brilliant facet drawing at about 5% opacity in the centre.
   - Our gem mark sits at the top.
   - The centre reads "Ratnapura" (small spaced caps, left), then "CEYLON GEM HOUSE" (large serif caps), then "Sri Lanka" (small spaced caps, right). The italic accent "Formed in Sri Lanka" sits just under the wordmark.
   - The bottom reads "Recorded at every step", with a thin vertical progress line beneath it.
   - The text reveals use the patterns below.
2. **Progress line (1.4–3.2 s).** The line fills with a slightly hesitant curve. It cannot finish until the hero image is **decoded** (`img.decode()`) and the fonts are ready, with a minimum of 1.8 s, so the reveal never shows a half-loaded photo.
3. **The oval rises (3.2–4.7 s).** The hero photo is the real hero element underneath. It is clipped by `clip-path: ellipse(var(--ox) var(--oy) at 50% var(--oc))`.
   - The oval starts below the screen (centre 125vh, about 11vw wide), then rises to the centre (55vh) and widens to about 17vw. This takes 1.5 s on InOut.
   - A thin linen rim line follows the oval edge, using the same CSS variables on an SVG or a box-shadow ring.
   - You now see dawn over the paddy inside a sapphire-shaped window.
4. **The dive (4.7–7.1 s).**
   - The oval grows past the screen (about 160vw) over 2.4 s on `diveIn` (0.6, 0, 0, 1).
   - At the same time the photo scales from 0.8 to 1 (origin centre top, 1.5 s, InOut).
   - The navy layer, its text and the rim fade out in the first 30% of the dive.
5. **Hand-off (about 7.1 s).**
   - The header fades in, light over the photo, and the hero text reveals.
   - Scroll unlocks and the preloader is removed from the page.
- **Short version** (repeat visits in the session): skip steps 1–2. The navy screen shows only the frame, then the oval rises and dives at 0.8× duration, about 1.8 s total.
- **Skip:** a "Skip intro" text button (focusable, bottom right), plus any key, click or wheel input, jumps the timeline to its end state within 0.4 s.
- **Reduced motion or no JavaScript:** no preloader. The hero shows immediately in its final state.

## Hero dive (scroll)
- `.hero` is about 300vh tall (200vh on phones), with a `position: sticky` 100vh stage. `data-theme="dark"` makes the header light.
- **On the stage:**
  - The full-bleed paddy photo (`object-fit: cover`), with thin navy columns at the left and right edges like ERA's frame, about 4vw each and 0 on phones.
  - Centred over the photo: "CEYLON GEM HOUSE" (serif caps), the italic accent "Ratnapura · Sri Lanka", and the line "Formed in Sri Lanka. *Recorded* at every step."
  - Pill buttons: "View the stones" and "Follow the origin".
  - A small "AI concept image" caption.
  - A slim "Scroll" cue at the bottom.
- **The scroll timeline** (GSAP ScrollTrigger, `scrub: true`, start "top top", end "bottom bottom"):
  1. The text moves up quickly (y to about −120vh). The photo moves up more slowly (y to about −20vh) for depth.
  2. Then the photo **scales from 1 to 2.2**, from a configurable focus point at the gem-pit shelter in the paddy image (`--dive-x`, `--dive-y`, default 50% 62%). It's tuned per image, so it can be retuned when the new 2K paddy image arrives.
  3. The navy side columns slide out.
- **The exit:** the next section (the facts, on linen) starts 20vh early and overlaps the zoomed photo. Its top edge is a **wide oval curve**, echoing the window, so the dive lands on linen.

## Text reveals (replace the current fade-up reveals site-wide)
SplitText (GSAP), run after `document.fonts.ready`, with each pattern triggered once when the element enters the viewport:
- **Serif headlines:** split into characters. Each goes from opacity 0, yPercent 50, rotateY 90° to its resting place, 1.2 s Out, 0.05 s stagger.
- **Italic accents:** characters go from opacity 0, rotateX 90°, x 6rem (pivot bottom) to rest, 1.2 s Out, 0.08 s stagger.
- **Paragraphs:** lines with a mask slide from yPercent 110 to 0, 1.2 s Out, 0.1 s stagger.
- **Buttons and cards:** fade up from 2rem. **Hairlines:** `clip-path` wipe.
- Keep the existing rule that content is visible without JavaScript and under reduced motion. Re-split on resize, debounced, and only for paragraphs.

## Tech
- Add `gsap` with ScrollTrigger, SplitText and CustomEase. All are free in GSAP 3.13+.
- **One animation loop:** `gsap.ticker` drives `lenis.raf()`, and `lenis.on('scroll', ScrollTrigger.update)`. Set `gsap.ticker.lagSmoothing(0)` and remove the old separate requestAnimationFrame loop.
- Create the custom eases once: Out (0.25,1,0.5,1), InOut (0.75,0,0.25,1), In (0.5,0,0.75,0), Ease (0.25,0.1,0.25,1), diveIn (0.6,0,0,1). Mirror them in the CSS variables.
- **Lock scrolling during the intro:** `lenis.stop()`, plus `overflow: hidden` on html. Force the scroll position to the top at the start.
- **Keep it fast:** animate only transform, opacity and clip-path, and add `will-change` only while animating. The hero image is preloaded with `fetchpriority="high"`.
- **Keep the existing pinned origin index working.** Re-check it after the switch to the GSAP ticker, and refresh ScrollTrigger after the intro.

## Milestones (stop after each one for review; commit only after approval)
- **I1, GSAP foundation:** add GSAP, run Lenis on the GSAP ticker, define the custom eases, and build the new SplitText reveal library across both pages. Visual change: only the reveal style.
- **I2, Hero dive:** the new full-screen paddy hero with its scroll timeline and the oval-capped linen hand-off. Remove the old split hero and the paddy band.
- **I3, Intro:** the navy screen, progress gated on image decode, the oval window, the dive and the hand-off, plus the short version, skip and reduced-motion handling.
- **I4, QA:**
  - Real Chrome and Safari at 1440, 1920, 1024×768 and 390. Slow 4G throttled first load: no half-loaded image inside the oval.
  - Keyboard, reduced motion, and Lighthouse (performance at least 90 on mobile, CLS 0).
  - A screen recording of the full intro and the hero dive.
