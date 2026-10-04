# Life Reel — Pixel-Art Banner Above About

Date: 2026-10-03

## Goal

Add a full-bleed, animated pixel-art banner between the hero and `01 — About`. A chibi pixel version of Yimeng walks to the right through five chapters of life: Sheffield and Europe, New York, Michigan, California, and "to be continued". The scenery, palette and outfits change with each chapter. From the 2019 Columbia graduation on, Yimeng's dog walks along.

## Decisions

| Topic | Decision |
|---|---|
| Format | Rendered live on a `<canvas>` in the page. Not a GIF, not a video file. |
| Why not GIF/video | The scenery scrolls, so almost every pixel changes every frame. That is the worst case for GIF: 256 colours, no motion compensation, 10 MB+ at banner size. A video would need its own mobile cut and a full re-render whenever a chapter is added. Live rendering costs a few tens of KB. It stays crisp at any width, can pause offscreen, and a new chapter is new code rather than a new export. |
| Art style | Pixel art, "Q-version" (option A): the character is about 35 px tall at native resolution and is drawn at 3× on desktop. |
| On-screen text | English, to match the site. |
| Chapter caption | Place name only, with no number. |
| Sound | None. |

The approved pixel designs (character rig, walk cycle, all outfits, the dog and its outfits, the beach test scene) are in `.superpowers/pixel-mock/` as Python text grids (`art_a.py`, `art_wear.py`, `art_dog.py`, `scene.js`). The approved browser screens are in `.superpowers/brainstorm/81507-1791054236/content/`. Both folders are local and gitignored, so the implementation ports those grids to JS as its starting point.

## Characters

**Yimeng.** Seen in profile, facing right. Black hair with faded sides and volume on top, dark tortoiseshell rectangular glasses, and a 1 px silver earring on the visible ear. The walk cycle has 4 frames at about 6 fps. Steps are short, as suits a chibi figure. The legs are long enough to read clearly, the far leg is a darker shade than the near leg, the body bobs 1 px on contact frames, and the back foot lifts on passing frames.

**The dog.** A slender sighthound with a slate-grey coat, thin legs, a long muzzle and folded ears, matching the dog in the hero photo. It trots at about 9 fps. It joins at the 2019 graduation as a puppy and grows up during the Michigan time-lapse, asleep by the desk.

### Yimeng's wardrobe

| Chapter | Scene | Outfit |
|---|---|---|
| 1 | Sheffield, rain | Sheffield-purple hoodie, backpack, umbrella |
| 1 | Europe, travel (train, Lisbon, Nürburgring) | Denim jacket, white tee, khaki trousers, camera |
| 1 | Trolltunga | Red hiking shell, large trekking pack, hiking boots |
| 1 | Iceland | Navy puffer, mustard beanie |
| 2 | New York, day to day (Columbia, night walk, museums) | Camel long coat, scarf |
| 2 | Fine dining (four restaurants) | Burgundy blazer and black tee (the hero outfit) |
| 2 | Columbia graduation | Columbia-blue master's gown and mortarboard |
| 3 | Michigan winter | MSU-green puffer, white beanie with pompom |
| 3 | Research | Grey hoodie, headphones |
| 3 | Gym | Tank top and shorts. The build grows across the time-lapse (year 1 → year 5). |
| 3 | PhD graduation | MSU-green doctoral gown, black velvet tam, gold tassel |
| 4 | California, everyday and work | Purple sun-protection hoodie, black jeans, white sneakers |
| 4 | Ranch | Camo jacket, blaze-orange cap, khaki trousers |
| 4 | Forest hike and mushrooms | Olive fleece, rust beanie, mushroom basket |
| 4 | Fishing | Bucket hat, fishing vest, rod |
| 4 | Tide pools | Bib waders, rubber boots, bucket with a sea urchin |
| 4 | Scuba | Black wetsuit, tank, mask, fins |
| 4 | Freediving and spearfishing | Kelp-camo wetsuit, long fins, snorkel, speargun |
| 5 | To be continued | California everyday outfit |

The two dive outfits use swimming poses in the reel. The other outfits walk. Yimeng also sits (on the train, at Trolltunga and in the restaurants), types at the desk, curls dumbbells and does pull-ups in the home gym, and at the cap toss cheers bareheaded in the gown.

### The dog's wardrobe

| When | Outfit |
|---|---|
| 2019, New York (puppy) | Columbia-blue bandana |
| Michigan, spring and autumn | Columbia-blue bandana |
| Michigan, winter | MSU-green knit sweater (it pairs with Yimeng's green puffer) |
| Michigan, summer | Nothing |
| California, everyday | Houndstooth turtleneck, like the hero photo |
| California, hike and mushrooms | Small dog backpack |
| California, ranch | Blaze-orange safety vest |
| California, sea | Life vest |
| To be continued | Houndstooth turtleneck |

## Storyboard

The full loop runs about 66 s, and the timings below are targets. The caption is the place name and fades in at the top left whenever it changes.

### 1 · Sheffield → Europe (~17.5 s). Caption: `Sheffield`, switching to `Europe` when the train leaves

1. Sheffield: red-brick terraces and Firth Court in grey drizzle, walking with the umbrella.
2. Inside a train carriage: Yimeng sits by the window while Paris, Rome, Barcelona and the Alps stream past, about 1 s each, with a tunnel between cities. Passport stamps pile up on the carriage wall, faster and faster.
3. Lisbon: riding the yellow tram up a steep street of tiled façades, above a limestone retaining wall with an iron railing, azulejo panels and bougainvillea. The Tagus and the 25 de Abril bridge lie far below.
4. Nürburgring, from a chase camera: Yimeng's white modified VW Golf GTI attacks a narrow stretch of the "Green Hell", bend after bend through the forest, climbing and plunging, and briefly airborne over a crest like Flugplatz. On desktop the Golf is a detailed 120 × 64 sprite, about two thirds of the banner's height; it carries the driver behind the rear glass, LED tail lights, a VW roundel, red GTI letters and an `AW GT7` plate (AW is the Ring's district). On phones, where the road is narrower, it is 60 × 32 and fills the lower third. A sign in the top corner names the track, `NÜRBURGRING` over `NORDSCHLEIFE` in green, above a fast-running lap timer.
5. Trolltunga at golden hour: a long fjord runs away to a low sun between sheer, back-lit walls with waterfalls and red boathouses far below. Yimeng walks out along the stratified rock tongue and sits at the tip, legs dangling, while the camera drifts slowly. This is the stillest moment in the film, and it comes straight after the fastest one.
6. Iceland: Vestrahorn ("Batman Mountain"), black sand and dune grass, with an aurora rising at night.
7. A plane climbs out under the same aurora, bound for New York.

### 2 · New York (~16 s). Caption: `New York`. The chapter opens and closes at Columbia.

1. Arriving at Low Library on an autumn day: the dome, ten Ionic columns and the Low Steps, with Alma Mater on her pedestal. Leaves drift down over College Walk, whose lamp posts fly Columbia-blue banners. Yimeng walks in and stops to look up.
2. Night in Manhattan, in black and gold with Art Deco styling. The shot opens on the lit crowns of the Chrysler and Empire State buildings, with a gold sunburst behind the skyline and searchlights sweeping. Then it tilts down to the street, where Yimeng walks up to a black-and-gold restaurant with a gilt fan over its door, and steps into its light.
3. Fine dining, eaten from left to right: one long shot through four restaurants side by side, each in its own style. Yimeng sits down at each, eats its signature dish, and dashes on to the next, leaving an empty plate behind. On a desktop all four are in view at once; on a phone the camera follows Yimeng.
   - French, in gold and burgundy under a crystal chandelier: the waiter lifts a silver cloche on one tiny bite in the middle of a huge plate.
   - Japanese omakase, at a hinoki counter under a paper lantern, with a noren and a round window: the itamae lays three nigiri on the board one by one.
   - Italian, among warm plaster and a wine rack: the waiter shaves white truffle over a nest of tagliolini.
   - Chinese, in red lacquer under red lanterns: the chef carves Peking duck while the lazy susan turns.
   - After the last course the bill unrolls down to the floor and runs back under all four restaurants.
4. Four exhibitions, one short shot each:
   - MoMA: past Warhol's soup cans, Yimeng stops in front of *The Starry Night*, whose sky slowly turns. On wide screens Monet's *Water Lilies* hang further along.
   - The Met: the Temple of Dendur and its gateway on their platform in the Sackler Wing, mirrored in the pool, with Central Park through the glass wall behind.
   - The Guggenheim, looking up the rotunda: the white turns of the ramp ring the skylight, with paintings and visitors on every level, while Yimeng walks up the lowest turn.
   - Yayoi Kusama's Infinity Mirror Room: in the dark, lamps come on at every depth and slowly change colour, doubled in the black pool on the floor.
5. Back on the Low Library steps in spring, in the Columbia-blue gown. Everyone hops and throws their caps. A puppy trots along College Walk, Yimeng's cap comes down on its head, and a heart pops up. From here on the dog walks along.
6. Transition: the caps falling from the sky turn into snowflakes, and the snow thickens towards white.

### 3 · Michigan (~13.5 s). Caption: `Michigan`, then `Graduation Road Trip` for the drive. Grey, low-saturation palette: the sets are painted in muted colours, and Yimeng and the dog are drawn in a muted version of their palettes.

1. Snow, flat land and Beaumont Tower. The white of the cap toss clears off a snowfield under a low grey sky, with bare trees and Michigan State's brick carillon tower, snow on its ledges. Yimeng walks on in the green puffer, the puppy trotting ahead, leaving footprints.
2. A time-lapse of five years, 2021 to 2025, each a little quicker than the last, in one living room seen from a camera that never moves. The home gym is on the left: a pull-up stand, a bench, dumbbells and floor mats. The computer desk is on the right, with the dog's bed between them and a sofa beyond where the screen is wide enough. As in a time-lapse film, Yimeng appears at the desk and then in the gym each year, leaving a faint ghost for a moment.
   - At the desk, the window runs through winter, spring, summer and autumn, and the calendar turns over the year. Coffee cups pile up, and the paper count on the whiteboard climbs from 0 to 16, the papers of those years.
   - The dog sleeps on its bed: a puppy the first year, then grown, in the green knit in winter, the bandana in spring and autumn, nothing in summer.
   - In the gym, Yimeng alternates dumbbell curls and pull-ups on the stand. The dumbbells get bigger every year, and from the third year on Yimeng is visibly bigger too.
3. PhD graduation: under a spotlight on the commencement stage, the advisor lifts the doctoral hood, green and white satin with a velvet collar, over Yimeng's head and lays it on Yimeng's shoulders (the hooding ceremony). The audience claps and cameras flash. This is deliberately different from the cap toss at Columbia.
4. Transition: the Graduation Road Trip, on a map of the United States, captioned `Graduation Road Trip` the whole way. The map comes up in Michigan's grey. As a small silver car leaves East Lansing, the colour floods out from there, as through the door in *The Wizard of Oz*, and the map is all colour before the car reaches the coast. The car loops round the East first: through Ontario to Niagara Falls, across New York State to Vermont and the Maine coast, down by Boston, New York City and Washington to the Carolinas, and home through Tennessee, Kentucky and Ohio. Then it turns west, by Chicago, Kansas City, Denver and the Rockies, Utah and Las Vegas, to Santa Clara.
   - Places are labelled as the car reaches them, and landmarks pop up: the Maine lighthouse, the Manhattan skyline, the Capitol, the Chicago skyline, a Utah arch, the Las Vegas sign and the Golden Gate Bridge.
   - On a desktop the route's whole width is in view, and the camera only follows the car up and down. On a phone, it follows the car both ways.

### 4 · California (~16 s). Caption: `California`. Full colour, morning to sunset.

1. Yimeng's silver-grey Mercedes-AMG GLC 63 rolls along a palm-lined street of white stucco and red tile, golden hills behind, and stops. Through the window, the dog stands at the steering wheel in its houndstooth turtleneck, as in the hero photo above, with Yimeng in the passenger seat.
2. The office: a bright open-plan floor with California through the glass wall. Yimeng, in the purple hoodie, works at a desk with two monitors and a phone in hand. A bubble blows up the phone's screen, where a candlestick chart climbs candle by candle, and the second monitor shows it too. The dog naps under the desk.
3. Ranch: golden hills, oaks and fences. An ATV kicks up dust on the ranch track in the foreground, the dog in its blaze vest on the rear rack, while a herd of deer, a buck leading the does, runs along the hills in the background. Parallax makes it read as a chase, but the ATV never leaves the track. Yimeng stops, gets off and raises the rifle. Cut to the scope view: the doe in the crosshairs turns its head and looks straight back, and the scene hard-cuts away. No shot is fired. (Yimeng never aims from the vehicle: California forbids shooting from vehicles and herding game with them.)
4. Forest under oaks, picking mushrooms. The dog wears its backpack.
5. Fishing from the rocks.
6. Low tide: picking up sea urchins and digging for fat innkeeper worms (海肠).
7. Into the sea: scuba, then freediving, then spearfishing in a kelp forest.
8. Surfacing at sunset. The dog is waiting on the rocks in its life vest.

### 5 · To be continued (~3 s). Caption: `To be continued…`

The world ahead turns into an unfinished pencil sketch, and Yimeng (California outfit) and the dog (houndstooth) walk into it. The reel then loops back to Sheffield.

## Page integration

- **Placement:** a new `<section class="reel">` between `</header>` and `<main>` in `index.html`. It is full-bleed and outside the 1040 px content column.
- **Size:** the native canvas height is fixed at 96 px. The scale is 2× when the viewport is ≤600 px wide, 3× up to 1800 px, and 4× above that. That gives a banner about 192 / 288 / 384 px tall. The native width is `ceil(stage width / scale)`, so wider screens show more of the world while the characters stay the same size. The canvas is centred and CSS-scaled with `image-rendering: pixelated`. CSS reserves the stage height, so the page does not shift when the script loads.
- **Look:** the top 34% and bottom 12% fade into `--bg` (`#0b0b0c`). The same film-grain overlay as the hero (opacity ~0.07) sits on top.
- **Controls:** an overlay row aligned to the content column.
  - Left: the chapter caption, styled like `.section-label` (mono 11 px, letter-spacing .28em, uppercase, amber).
  - Right: chapter buttons `01`–`05` (mono 11 px, muted; the current one in amber with `aria-current="true"`) and a 28 px round pause/play button styled like the hero icons.
  - Clicking a chapter button jumps to the start of that chapter.
- **Timeline sync:** while chapter *n* (1–4) is on screen, the `n`-th `.step` in the About path gets the `is-live` class. That reveals the logo colour (the hover filter) and turns `.step-deg` amber. Chapter 5 keeps step 4 live. The path's existing links to institutions do not change, which is why the jump controls live on the banner and not on the timeline.

## Playback

- Playback starts only when at least a quarter of the banner is in view (IntersectionObserver). The first time, it starts at chapter 1. Leaving the viewport pauses it, and coming back resumes where it stopped. Hidden tabs stop naturally because the loop runs on `requestAnimationFrame`.
- The reel loops. Animation is driven by time, not frame count. The canvas redraws on `requestAnimationFrame`, capped at 30 fps.
- The pause button satisfies WCAG 2.2.2 (moving content longer than 5 s must be pausable).
- Under `prefers-reduced-motion: reduce` there is no autoplay. The reel shows a still poster frame, and the play button starts it. The poster is the approved beach test scene: a boardwalk at sunset, Yimeng in the California outfit and the dog in houndstooth.
- Without JS, the section is hidden: its styles apply only under `html.js`, which the site already sets.

## Technical design

- **Stack:** no framework and no build step, as with the rest of the site. ES modules load with `<script type="module" src="reel/reel.js">`, which defers automatically. GitHub Pages serves the files as they are.
- **Files:**
  - `reel/reel.js` is the engine. It mounts the reel, sizes it, runs the clock, renders, and handles the controls, IntersectionObserver, reduced motion, chapter navigation and timeline sync.
  - `reel/pixels.js` holds the pure pixel helpers: grids with generated outlines, Bresenham lines, recolouring, the seeded PRNG, an RGBA `Painter`, banded gradients, and (from chapter 2) a 3×5 pixel font.
  - `reel/hero.js` and `reel/dog.js` hold the cast: Yimeng's rig with every outfit, and the dog with its outfits. Sprites are composed from parts at runtime.
  - `reel/timeline.js` holds the pure clock maths: chapters of shots become absolute times, plus `locate`, chapter starts and `?reel=` parsing.
  - `reel/sprites.js` turns grids and Painters into canvases.
  - `reel/story.js` holds the running order and imports one folder per chapter (`reel/ch1/` … `reel/ch5/`) as each is built: an `index.js` with the chapter's shots, and one module per location.
  - `reel/beach.js` holds the approved beach scene, which is also the reduced-motion poster.
  - `style.css` gets a new `/* ---------- Reel ---------- */` block, plus `.step.is-live` rules.
- **Sprite data:** palette-indexed text grids live in the JS (one character per pixel, `.` for transparent). Fill-only parts get their outlines generated. Outfits are palette remaps, part swaps and overlays on the same rig. This is the system validated in the mockups.
- **Shots:** each chapter exports a list of shots. A shot has a duration and the layers it uses, each with a parallax factor. It has a camera speed, which can be 0 for staged moments, and actor tracks for Yimeng and the dog: outfit, action (walk, sit, ride, eat, swim and so on), screen position and props. It can also have timed events (counters, stamps, cuts) and a transition into the next shot (cut, crossfade, or a special one: caps → snow, the road trip's spreading colour, the pencil sketch). The engine concatenates all shots into one timeline and derives chapter boundaries from it for the caption, the buttons and the sync.
- **Rendering:** layers are pre-rendered once into offscreen canvases that tile seamlessly. They are built lazily just before a shot starts and released after it ends. Each frame composes the layers and actors onto one canvas at native resolution, about 480×96 on desktop, which the browser scales. The grey Michigan palette uses palette-derived muted variants of the cast (`env.hero(key, pose, 'muted')`), and the road trip draws a pre-greyed copy of the map under the coloured one, clipped to a circle that grows from East Lansing. Neither uses `ctx.filter`, which Safari lacks. All layouts use a seeded PRNG, so every play looks the same.
- **Debug hooks:** the URL parameter `?reel=` takes either a number or a shot id. A number such as `?reel=42.5` renders that moment paused. A shot id such as `?reel=ch2-dining` loops that one shot. Headless screenshots for review rely on these. They have no effect on normal visits.
- **Accessibility:** the canvas has `role="img"` and an English `aria-label` summarising the journey. The chapter buttons are real `<button>`s labelled "Chapter n: Place". The pause button toggles its `aria-label` between "Pause" and "Play". Focus styles reuse the site's `:focus-visible` outline.

## Delivery

Work happens on the `life-reel` branch. A push to `main` deploys to GitHub Pages, so the branch merges only after everything is done and approved. Each phase gets its own implementation plan, written once the previous phase has been approved, and ends with a review on the real page.

1. **Engine and cast:** mounting, sizing, clock, controls, chapter buttons, timeline sync, reduced motion, debug hooks, and the full cast ported to JS (rig, all outfits, the dog, props). Verified with one test shot: the approved California beach scene.
2. **Chapter 1:** Sheffield → Europe.
3. **Chapter 2:** New York.
4. **Chapter 3:** Michigan.
5. **Chapter 4:** California.
6. **Chapter 5 and polish:** the sketch ending, the loop seam, transition timing, the reduced-motion poster frame, and final QA. Then merge to `main`.

## Verification

- **Screenshots:** headless Chrome captures, taken with the debug hook at each shot's key moments, at 1440 px and 390 px wide. They are reviewed visually after every phase.
- **Playback:** pauses offscreen and resumes when it comes back. The pause button works. Chapter buttons jump to the right chapter and update the caption and the timeline sync.
- **Reduced motion:** with Chrome's `--force-prefers-reduced-motion` flag, there is no autoplay and the poster frame shows.
- **No JS:** with JavaScript off, the section is hidden and no empty band remains.
- **Links and console:** a script compares every `href` in `index.html` before and after, and all of them must be unchanged. The console shows no errors.
- **Layout:** the page height and positions do not shift when the reel script loads.

## Out of scope

- Sound.
- Exporting a video for social media. This can be done later by recording the canvas.
- A GIF or video fallback.
- Any change to the About timeline other than the `is-live` highlight.
