// The life reel: mounts on <section class="reel">, plays the story on a pixel canvas,
// and keeps the caption, chapter buttons and About timeline in step with it.
import { buildTimeline, locate, chapterStart, liveStep, parseDebug } from './timeline.js';
import { heroSprite } from './hero.js';
import { dogSprite } from './dog.js';
import { painterCanvas, spriteCanvases } from './sprites.js';
import { CHAPTERS, POSTER } from './story.js';

const H = 96;                         // native height; the width follows the stage
const FRAME_MS = 1000 / 30;           // redraw cap
const ICON = {
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
};

function memo(fn) {
  const m = new Map();
  return (k) => { if (!m.has(k)) m.set(k, fn(k)); return m.get(k); };
}

export function mountReel(section, chapters, poster) {
  const stage = section.querySelector('.reel-stage');
  const canvas = section.querySelector('.reel-canvas');
  const ctx = canvas.getContext('2d');
  const caption = section.querySelector('.reel-caption');
  const nav = section.querySelector('.reel-nav');
  const pauseBtn = section.querySelector('.reel-pause');
  const steps = [...document.querySelectorAll('#about .path .step')];
  const debug = parseDebug(location.search);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const full = buildTimeline(chapters);
  let tl = full;
  let soloChapter = null;             // ?reel=<shot-id>: loop one shot, report its real chapter
  if (debug && debug.shot) {
    const hit = full.shots.find(e => e.shot.id === debug.shot);
    if (hit) { tl = buildTimeline([{ name: chapters[hit.chapter].name, shots: [hit.shot] }]); soloChapter = hit.chapter; }
  }

  let t = debug && debug.time !== undefined ? debug.time : 0;
  let userPaused = reduced || Boolean(debug && debug.time !== undefined);
  let showingPoster = reduced && !debug;
  let inView = Boolean(debug && debug.shot);
  let W = 0, scale = 0, raf = 0, last = null, lastDraw = -Infinity;
  let shownCaption = null, shownChapter = -1;

  const env = {
    hero: memo(key => spriteCanvases(heroSprite(key))),
    dog: memo(key => spriteCanvases(dogSprite(key))),
  };
  const scenes = new Map();           // scene definition -> built scene at the current width
  function sceneFor(def) {
    if (!scenes.has(def)) {
      const s = def.build(W, H);
      s.canvases = Object.fromEntries(Object.entries(s.layers).map(([k, p]) => [k, painterCanvas(p)]));
      scenes.set(def, s);
    }
    return scenes.get(def);
  }

  function setCaption(text) {
    if (text === shownCaption) return;
    shownCaption = text;
    caption.textContent = text;
    caption.classList.remove('swap');
    void caption.offsetWidth;         // restart the fade
    caption.classList.add('swap');
  }

  function setChapter(n) {
    if (n === shownChapter) return;
    shownChapter = n;
    section.dataset.chapter = String(n);
    nav.querySelectorAll('.reel-ch').forEach((b, i) => b.setAttribute('aria-current', String(i === n)));
    const live = liveStep(n, steps.length);
    steps.forEach((s, i) => s.classList.toggle('is-live', i === live));
  }

  function draw() {
    if (!W) return;
    let shot, local, chapter;
    if (showingPoster) {
      shot = poster; local = 0; chapter = poster.chapter;
    } else {
      const at = locate(tl, t);
      shot = at.entry.shot; local = at.local; chapter = soloChapter ?? at.chapter;
    }
    ctx.imageSmoothingEnabled = false;
    shot.scene.render(ctx, local, sceneFor(shot.scene), env);
    setCaption(shot.caption);
    setChapter(chapter);
    section.dataset.t = (showingPoster ? 0 : t).toFixed(2);
  }

  function layout() {
    const s = parseInt(getComputedStyle(stage).getPropertyValue('--reel-scale'), 10) || 3;
    const w = Math.ceil(stage.clientWidth / s);
    if (w === W && s === scale) return;
    W = w; scale = s;
    canvas.width = W;                 // also clears the canvas
    canvas.height = H;
    canvas.style.width = W * scale + 'px';
    canvas.style.height = H * scale + 'px';
    canvas.style.left = Math.floor((stage.clientWidth - W * scale) / 2) + 'px';
    scenes.clear();
    draw();
  }

  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (last !== null) t = (t + (now - last) / 1000) % tl.duration;
    last = now;
    if (now - lastDraw >= FRAME_MS - 1) { lastDraw = now; draw(); }
  }

  function sync() {
    const playing = !userPaused && inView && !document.hidden;
    section.dataset.state = playing ? 'playing' : 'paused';
    if (playing && !raf) { last = null; raf = requestAnimationFrame(tick); }
    if (!playing && raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  function setPaused(p) {
    userPaused = p;
    pauseBtn.setAttribute('aria-label', p ? 'Play' : 'Pause');
    pauseBtn.innerHTML = p ? ICON.play : ICON.pause;
    sync();
  }

  function jump(n) {
    tl = full; soloChapter = null; showingPoster = false;
    t = chapterStart(full, n);
    draw();
  }

  chapters.forEach((ch, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'reel-ch';
    b.textContent = String(i + 1).padStart(2, '0');
    b.setAttribute('aria-label', `Chapter ${i + 1}: ${ch.name}`);
    b.addEventListener('click', () => jump(i));
    nav.insertBefore(b, pauseBtn);
  });
  pauseBtn.addEventListener('click', () => {
    if (userPaused && showingPoster) { showingPoster = false; t = 0; draw(); }
    setPaused(!userPaused);
  });
  document.addEventListener('visibilitychange', sync);
  if (!(debug && debug.shot)) {
    new IntersectionObserver(([e]) => { inView = e.intersectionRatio >= 0.25; sync(); }, { threshold: [0, 0.25, 0.5, 1] }).observe(section);
  }
  new ResizeObserver(layout).observe(stage);
  layout();
  setPaused(userPaused);
}

const section = document.querySelector('.reel');
if (section) mountReel(section, CHAPTERS, POSTER);
