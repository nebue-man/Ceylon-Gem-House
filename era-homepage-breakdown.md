# ERA Residence homepage: how the experience is built

Extracted on 28 Oct 2026 from www.era-residence.com, at a 1440×900 desktop viewport, using the live page's scroll triggers, its animation script and its DOM. This is a reference for the **mechanics** only. We rebuild the ideas with our own code, content and brand; we don't copy their code, images or text.

## Stack
- Webflow site, plus a custom script (`slater.app` bundle).
- **GSAP 3** with ScrollTrigger, SplitText and CustomEase. All GSAP plugins have been free since 2025.
- **Lenis** smooth scroll: `duration 1.2`, exponential easing, synced to ScrollTrigger through `gsap.ticker`.
- Barba for page transitions, and Lottie (one logo animation).
- Snap-to-section on desktop: after scrolling stops, the page settles onto the nearest `[data-snap]` section.

## Motion tokens they use everywhere
| Token | Value |
|---|---|
| durS / durM / durL | 0.4 s / 0.8 s / 1.2 s |
| stagger | 0.1 s |
| delayReveal | 0.3 s |
| Out | cubic-bezier(0.25, 1, 0.5, 1) |
| InOut | cubic-bezier(0.75, 0, 0.25, 1) |
| In | cubic-bezier(0.5, 0, 0.75, 0) |
| Ease | cubic-bezier(0.25, 0.1, 0.25, 1) |
| diveIn | cubic-bezier(0.6, 0, 0, 1). Slow start, then a fast rush: used for "flying into" the image. |
| horScroll | cubic-bezier(0.25, 0, 0.75, 1) |
| loaderEase | A custom curve with small pauses, so the progress line looks like real loading. |

## Four text reveal patterns (SplitText), reused on every heading and paragraph
1. **Script accent** (e.g. "Estepona"): the text is split into characters. Each character goes from opacity 0, rotateX 90° and 10 rem to the right, to its resting place. Pivot at the bottom, 1.2 s, Out, 0.1 s stagger.
2. **Serif headline** (e.g. "ERA RESIDENCE"): split into words and characters. Each character goes from opacity 0, yPercent 50 and rotateY 90° to its resting place, like cards flipping in. 1.2 s, stagger 0.05 s.
3. **Paragraphs:** split into lines with a mask. Each line slides up from yPercent 110 behind its mask, 1.2 s, stagger 0.1 s.
4. **Containers and buttons** fade up from 3.3 rem below. **Thin rules** wipe in with `clip-path` from top to bottom.
- Each reveal also has a fast "hide" version (0.4 s, In), used when content leaves.

## Flow, top to bottom

### 0. Preloader: the first impression (about 8 s; scroll is locked)
- **Repeat visits get a short version.** The full intro plays on the first visit of the browser session; `sessionStorage` then stores `hasVisited`.
- **The opening frame:**
  - A deep plum full-screen background with a giant faint script watermark at 5% opacity, and a thin inset frame line.
  - The logo symbol at the top.
  - In the centre, "Costa", then "ERA RESIDENCE" in big serif caps with "Estepona" in script overlapping it, then "del Sol".
  - At the bottom, the tagline "A place to return to", with a thin vertical progress line beneath it.
- **The order of events:**
  1. All the text reveals with the patterns above.
  2. The watermark and frame fade in over 1.2 s.
  3. The progress line fills over 4 s with the hesitating loader curve.
  4. **An arch-shaped window** set by CSS variables (`--arch-w` 24vw, `--arch-y` 104vh), which starts below the screen, rises to 15vh and widens to 36vw over 1.5 s (InOut). Inside the arch you see the hero photo.
  5. **The dive:** the arch grows enormous (`--arch-w` 125) and flies up off screen (−100vh) over 2.4 s with the diveIn curve. At the same time the hero photo scales from 0.75 to 1. It feels like flying through the arch into the photo.
  6. Scroll unlocks, and the preloader is removed from the page.

### 1. Hero (scroll area about 5.8 screens tall, with a sticky 100vh stage)
- **The stage:** a full-bleed photo framed by plum columns at the left and right edges.
- **Fixed interface:**
  - The rotating badge logo at the top left.
  - "Select an apartment" and small links at the top right.
  - A vertical scroll progress bar at the left.
  - A "scroll down" cue.
- **Over the photo:**
  - "ERA RESIDENCE / Estepona".
  - The line "A place [by day | by night] to return to". The two tabs swap between day and night renders of the same scene.
  - A "View available apartments" button.
- **On scroll** (scrubbed):
  1. The text moves up quickly.
  2. The photo moves up more slowly, for depth.
  3. The photo **scales ×2** from a point 75% down, so you dive into the courtyard.
- **The header colour** follows invisible theme marker layers. Their class `theme_on-color` / `-light` / `-dark` is applied to the header, so it is always readable.

### 2. Arch statement: "Three reasons to choose ERA"
- A pale sky-blue section with an arch-shaped top.
- The heading sits on a **circular SVG text path** around the arch. Its **word spacing scrubs from 0 to 10 rem** as you scroll, so the words drift apart around the circle.
- "COSTA ✣ DEL SOL" in the centre, a vertical rule, and "A place to live — to return year after year".

### 3. Three benefits
Numbered slides (1, 2, 3) on pale blue, using the same reveals.

### 4. Quote
A full-bleed image with scrubbed parallax (yPercent 0 → 20), and the header theme switching as you pass.

### 5. Location: horizontal journey (about 4 screens of scroll)
- A sticky stage. The giant words "NEW / GOLDEN / MILE" slide sideways line by line, while a track of images scrolls **horizontally** about 3,100 px (horScroll curve).
- Looping **bougainvillea flower videos** drift in the foreground at a different speed.
- A map path then **draws itself** with a left-to-right clip-path wipe over 2.4 s.
- A full plum location image settles from scale 1.15 to 1.

### 6. Apartment types
A pale-blue slider: bedrooms, areas, "Explore ground + basement" buttons.

### 7. Amenities
A sticky list. As you leave it, the list **scales ×2 and fades**: a second "dive".

### 8. Interior
Two columns moving in **opposite directions** (±10%) as you scroll.

### 9. Architecture: "doors opening"
- A sticky stage. Two linen panels open like doors using `clip-path` polygons.
- The stage then scales ×1.84 while flower decorations fly off to the left and right.
- The next section grows from 0.75 to full size, so you walk through into the architecture section.

### 10. Other apartments
Cards with small icon reveals, staggered.

### 11. Call to action and footer
- As the footer arrives, the page content **shrinks into a framed card** (clip-path inset 8% 22%).
- The footer fades and scales in from 0.75: a closing "zoom out" that mirrors the opening dive.

### Throughout
- **Parallax:** every image wrapper moves yPercent −15 → 15 against scroll (scrub 0.5).
- **Decorative flowers:** they drift ±10%.
- **No fake effects:** everything is transform, opacity or clip-path.

## The core idea
The page is one camera move. The visitor **enters through a window** (the arch), **dives into** the place, travels **sideways** through the location, goes **through doors** into the architecture, and finally **pulls back out** to a framed card. Repeated shapes (arch, frame), one ink colour, one dark colour and the same four text reveals tie it together.
