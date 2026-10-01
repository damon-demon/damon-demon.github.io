# Homepage Redesign — Dark Cinematic

Date: 2026-10-01

## Goal

Replace the jemdoc-generated `index.html` with a hand-written, art-directed homepage in a dark cinematic style. Keep **all** existing content. Only the homepage changes; `SpanUQ.html` and `shop-r1.html` stay untouched.

## File changes

| Action | File |
|---|---|
| Rename (content unchanged) | `index.html` → `school_index.html` |
| Create | `index.html` (new homepage) |
| Create | `style.css` |
| Create | `images/hero.jpg` (~2400px wide, ≤300KB), `images/hero-mobile.jpg` (~1200px wide), both from `happy.jpg` |
| Delete | `projects.html` |
| Keep | `jemdoc.css` (still used by `school_index.html`), `jemdoc.py`, `happy.jpg`, `red_2.JPG`, `links/` |
| Edit | `.gitignore`: add `.superpowers/` |

`school_index.html` is an archived copy. Its only edit is removing the "Projects" menu item, because `projects.html` will no longer exist.

## Page structure (top to bottom)

1. **Nav**: fixed. Transparent over the hero, then translucent black with backdrop blur once the page scrolls past it. Items: About · Research · Service · Publications (in-page anchors), CV ↗ (`links/YimengZhang_CV.pdf`), Activities ↗ (`https://damon19950223.github.io`).
2. **Hero**: full viewport height. `images/hero.jpg` as a cover background, with a gradient fading to `#0b0b0c` at the bottom. Bottom-left:
   - Name "Yimeng (Damon) Zhang".
   - Mono uppercase amber line: "Applied Scientist · Amazon · Multimodal AI Agents".
   - "Santa Clara, CA" in muted text.
   - Icon row: Email (`mailto:damonzym@amazon.com`), CV, Google Scholar, GitHub (`github.com/damon-demon`), Hugging Face (`huggingface.co/DamonDemon`), Instagram (`instagram.com/damondemon88888`). Icons are inline SVGs with `aria-label`s.
3. **01 — About**: the current About paragraph, verbatim with all of its links.
4. **02 — Research**: the current Research Focuses paragraph verbatim, plus two side-by-side cards (Deep Learning / Optimization) holding the existing bullet text.
5. **03 — Service**: three rows (Area Chair: NeurIPS · Journal Reviewer: TPAMI · Conference Reviewer: NeurIPS, ICLR, ICML, CVPR, ECCV, ICASSP). Venue names render as chips.
6. **04 — Publications**:
   - Header links: [Research Summary], [Google Scholar]. Note: "* equal contribution".
   - All 24 papers, grouped by year (within a year, keep the current relative order). The year comes from the venue year; preprints without a venue use their arXiv ID year:
     - **2026**: SpanUQ, SENTINEL (arXiv 2606), Firefly, Trajectory2Task, Shop-R1, Unlearning Isn't Invisible
     - **2025**: Customer-R1 (arXiv 2510), See Think Act (arXiv 2510), Dual Power (arXiv 2504), ID-Patch
     - **2024**: AdvUnlearn, UnlearnDiffAtk, UnlearnCanvas, SOUL, ZO-Bench, DeepZero, Coreset reweighting (ICASSP)
     - **2023**: DP4TL, 2D-TVP, Tri-Design (ASP-DAC)
     - **2022**: Black-Box Defense (Spotlight), Reverse Engineering
     - **2020**: Video Synthesis (ACM MM), Tensor FISTA-Net (AAAI)
   - Each entry shows:
     - the title, linked to the same target as today
     - the venue tag (amber outline pill), or a muted `arXiv` pill when there is no venue
     - the full author list, with every self-mention ("Y. Zhang" in bold in the source) highlighted
     - every existing resource link as a small pill, keeping its current label (Paper, Code, Model, HF Model, Dataset, Poster, Slide, Demo, Benchmark, Unlearned DM Benchmark)
     - the ICLR'22 entry also gets a `Spotlight · top 5%` badge
   - Desktop: a two-column grid. The year sits on the left as a large faded numeral (`position: sticky`) and the entries sit on the right.
7. **Footer**: "© 2026 Yimeng Zhang · Last updated Oct 2026".

## Visual system

- Colors: background `#0b0b0c`, surface `#131316`, border `#222226`, text `#e9e6df`, muted `#8d8a84`, accent `#d9a35b`. The accent is the only color.
- Type: Inter Tight (300/400/500) for headings and body; JetBrains Mono for labels, pills, and section numbers. Both load from Google Fonts with `display=swap`.
- The hero name is large and light (300 weight) with tight tracking. Section labels use the form `01 — ABOUT` in mono uppercase amber.
- Content max width is ~1040px.
- Motion: sections fade and rise 12px when they scroll into view (IntersectionObserver). On hover, a publication row's background lifts and its title turns amber. All motion is disabled under `prefers-reduced-motion`.
- Links: body links are underlined with an amber underline that thickens on hover.

## Responsive (≤720px)

- The year moves above its group instead of sitting in a sticky left column.
- The hero switches to `hero-mobile.jpg` with `background-position` tuned so both the person and the dog stay in frame.
- The nav collapses to the name plus the CV link. Section anchors stay reachable by scrolling, so there is no hamburger menu.
- The research cards stack vertically.

## Implementation

- Semantic HTML5 (`header`, `nav`, `section`, `ol`/`li`, `footer`), one `style.css`, and about 20 lines of inline vanilla JS (nav state plus reveal animation). No framework and no build step. Deployed by GitHub Pages as-is.
- Fixes carried over:
  - Backslash paths `links\X` become `links/X`.
  - Stray spaces inside `<b>` around the author name are normalized.
- `<head>`: viewport meta, meta description, and Open Graph/Twitter tags (title, description, `images/hero.jpg`).
- If JS is unavailable, all content stays visible: the reveal class is only added by JS.

## Verification

- Open `index.html` locally in a browser at desktop width (~1440px) and mobile width (~390px), and check the layout visually.
- A script extracts every `href` from the new `index.html`. It checks that relative paths exist on disk, and that the set of external URLs equals the set in `school_index.html`, plus the new icon links and minus `projects.html`.
- Count check: the new page contains exactly 24 publication entries.
- `school_index.html` still renders with `jemdoc.css`.
