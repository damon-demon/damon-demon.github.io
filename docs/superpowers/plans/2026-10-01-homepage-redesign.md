# Homepage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the jemdoc `index.html` with a hand-written dark-cinematic homepage that keeps all existing content.

**Architecture:** A static site served by GitHub Pages. It consists of one semantic `index.html`, one `style.css`, and a small inline vanilla-JS block. The old page is archived as `school_index.html`. A Python check script acts as the test: it compares the links and the publication count between the old and new pages.

**Tech Stack:** HTML5, CSS (custom properties, grid, sticky positioning), vanilla JS (IntersectionObserver), Google Fonts (Inter Tight, JetBrains Mono), macOS `sips` for images, and Python 3 stdlib `html.parser` for checks.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-10-01-homepage-redesign-design.md`.
- Colors: bg `#0b0b0c`, surface `#131316`, border `#222226`, text `#e9e6df`, muted `#8d8a84`, accent `#d9a35b`. The accent is the only color.
- Do not edit: `school_index.html` (after the rename), `projects.html`, `jemdoc.css`, `jemdoc.py`, `SpanUQ.html`, `shop-r1.html`, `happy.jpg`, `red_2.JPG`, `links/`.
- There are 24 publication entries. Every resource link and its label is preserved. Use `/` path separators.
- All motion is disabled under `prefers-reduced-motion`. All content is visible without JS.

---

### Task 1: Archive the old page, add assets and the check script

**Files:**
- Rename: `index.html` → `school_index.html`
- Create: `images/hero.jpg`, `images/hero-mobile.jpg`
- Modify: `.gitignore` (create it; it does not exist yet)
- Create: `/private/tmp/check_homepage.py` (outside the repo)

- [ ] `git mv index.html school_index.html`
- [ ] Images: `mkdir -p images && sips -Z 2400 -s formatOptions 70 happy.jpg --out images/hero.jpg && sips -Z 1200 -s formatOptions 70 happy.jpg --out images/hero-mobile.jpg`. Expect `hero.jpg` ≤ 300KB. If it is larger, lower the quality.
- [ ] `printf '.superpowers/\n' > .gitignore`
- [ ] Write the check script. It parses `school_index.html` (old) and `index.html` (new) and asserts:
  1. The new page has exactly 24 `li.pub` elements.
  2. Every relative `href`/`src` in the new page exists on disk (after URL-decoding, ignoring `#` anchors and `mailto:`).
  3. Old hrefs (with `\` normalized to `/`) minus `projects.html` and `index.html` form a subset of the new hrefs.
  4. No `\` appears in any href in the new page.
- [ ] Run it now (expect a FAIL because `index.html` is missing), then commit the rename, images, and `.gitignore`.

### Task 2: New `index.html` markup

**Files:** Create `index.html`

Structure (class names are the contract with `style.css`):
- `<head>`: charset, viewport, title "Yimeng (Damon) Zhang", meta description, OG/Twitter tags with `images/hero.jpg`, the Google Fonts link, and `style.css`.
- `<nav class="nav">`: `.nav-name` link to `#top`, then `.nav-links` with the anchors `#about #research #service #publications`, plus CV and Activities (`target="_blank"`, ↗). Anchors carry the class `nav-anchor` so mobile can hide them.
- `<header id="top" class="hero">`: `.hero-inner` containing `h1`, `p.hero-role`, `p.hero-loc`, and `ul.hero-icons` (six links with inline SVG and `aria-label`).
- `<main>`: four `section.section` elements, each with `p.section-label` ("01 — About", etc.):
  - `#about`: the original paragraph.
  - `#research`: the original paragraph, plus `.cards` holding two `div.card`.
  - `#service`: `ul.service`, each `li` has a `span.role` and `span.chip` items.
  - `#publications`: `p.pub-meta` (Research Summary and Scholar links, plus the equal-contribution note), then one `div.year-group` per year containing `h3.year` and `ol.pubs`, with `li.pub` items.
- Each `li.pub` contains:
  - `div.pub-head`: `a.pub-title`, then `span.venue` (or `span.venue.arxiv`), plus an optional `span.badge`.
  - `p.pub-authors`: self-mentions wrapped in `<b class="me">`.
  - `div.pub-links`: an `a.pill` for every resource link.
- `<footer class="footer">`.
- An inline `<script>`:
  - Add `js` to `<html>`.
  - Toggle `.nav.scrolled` when `scrollY > innerHeight*0.6`.
  - Use an IntersectionObserver to add `.in` to each `.section`.
- [ ] Write the file, run the check script, and expect all assertions to PASS. Commit.

### Task 3: `style.css`

**Files:** Create `style.css`

- [ ] Write the following:
  - Variables, a reset, and the body type (Inter Tight 300/400).
  - The fixed nav and its `.scrolled` state (`rgba(11,11,12,.72)` with `backdrop-filter: blur(14px)`).
  - Hero: `100svh`; background is `linear-gradient(to bottom, transparent 45%, #0b0b0c)` over `url(images/hero.jpg)` with `cover` and position `60% center`.
  - Section label: mono, uppercase, amber.
  - Cards, service chips, and the publication grid (`grid-template-columns: 120px 1fr`; `.year` is sticky at `top: 90px`, large and faded at `#3a3a3f`).
  - Publication row hover, pills, venue and badge pills, `.me` highlight, and the body link underline.
  - The `.js .section` reveal and `.in` state.
  - Reduced-motion override.
  - `@media (max-width: 720px)`: one column, hide `.nav-anchor`, and switch to the mobile hero image.
- [ ] Open the page locally (`open index.html`). Take a headless Chrome screenshot at 1440×900 (full page) and 390×844, and inspect both. Commit.

### Task 4: Final verification

- [ ] Run the check script and expect PASS.
- [ ] Confirm `git status` shows only the intended files, and that `school_index.html` is byte-identical to the old `index.html` (`git diff HEAD~3 --stat -M`).
- [ ] Review the screenshots for overflow, contrast, and the hero crop.
