# Ceylon Gem House — static site design

Concept website for an online store selling certified Ceylon (Sri Lankan) coloured gemstones, mainly blue sapphires, to private buyers, collectors and jewellers worldwide. "Ceylon Gem House" is a placeholder brand. No scroll animations: a calm, static, editorial design.

## Files
- `index.html` — home: hero, Ratnapura landscape band, sourced facts, five-step origin (pit, river, find, cut, seal), Marco Polo quote, dark featured-stone section with an auction-style list, "The record", trade section, inquiry form, footer.
- `stone.html` — single stone page in this order: headline (variety, shape, carat) → key facts (mm, colour in words, clarity with viewing conditions) → lab block (lab, report no., date, origin, treatment, verify link) → provenance record → selector's note → media labelled by lighting → inquiry.
- `assets/img/` — AI concept frames (paddy, pit, river, find, dop, sapphire, box). Replace with the client's real photography before launch.
- Exported from a design canvas: styles are inline on elements. A good first refactor is to move them into a stylesheet with CSS variables, keeping the look identical.

## Design system
- Background linen #F2EDE4; light panel #FAF7F1; trade band #E7DFD2; dark sections #11141B and #1A1916.
- Text #1A1916; secondary #3F3C36; labels #5E5A52 (passes 4.5:1 on linen); hairlines #D9D1C3.
- One accent: sapphire #1F3B70 (italic words, numbers, the primary inquiry button).
- Type: Instrument Serif (display, upright + italic) and Instrument Sans (body, labels in spaced caps). Google Fonts.
- Pill buttons, thin rules, generous whitespace, max content width 1280px. Never stark white (the client found it hard on the eyes).
- Layout is flex/grid with wrap so it works at phone width.

## Copy rules (from the project's brand research)
- Voice: the quiet expert who shows the papers. Calm, exact, documented.
- Origin and treatment are always credited to a named lab report ("Origin: Sri Lanka, per [LAB] report no. X"), never stated in the brand's own voice. Disclose heating plainly.
- Avoid: finest, premier, legendary, exquisite, AAA, semi-precious, "certified" without a lab name, investment-grade, ethical/conflict-free without evidence, "90% of the island", "3,000 years".
- Every statistic carries its source and year.
- Values in [BRACKETS] are placeholders for the client: carat, dimensions, lab and report numbers, NGJA licence, address, contact, reply time, return terms.
- All AI imagery must stay labelled as concept images.

## Run
Open `index.html` directly, or `npx serve .`
