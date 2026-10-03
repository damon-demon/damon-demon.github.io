// The reel's clock maths. Pure: chapters of shots in, absolute times out.
// A chapter is { name, shots }; a shot is { id, duration, caption, scene }.

export function buildTimeline(chapters) {
  const shots = [], spans = [];
  let t = 0;
  chapters.forEach((ch, chapter) => {
    const start = t;
    for (const shot of ch.shots) {
      shots.push({ shot, chapter, start: t, end: t + shot.duration });
      t += shot.duration;
    }
    spans.push({ name: ch.name, start, end: t });
  });
  return { duration: t, shots, chapters: spans };
}

// Which shot is on screen at time t (wrapped into one loop), and how far into it.
export function locate(tl, t) {
  const d = tl.duration;
  const tt = ((t % d) + d) % d;
  let index = tl.shots.findIndex(e => tt < e.end);
  if (index < 0) index = tl.shots.length - 1;
  const entry = tl.shots[index];
  return { index, entry, local: tt - entry.start, chapter: entry.chapter, t: tt };
}

// How much of the page background covers a shot at local time t: 1 = fully dark, 0 = clear.
// Shots opt in with fadeIn / fadeOut (seconds).
export function fadeAlpha(shot, t) {
  const fin = shot.fadeIn || 0, fout = shot.fadeOut || 0;
  let a = 0;
  if (fin > 0 && t < fin) a = 1 - t / fin;
  if (fout > 0 && t > shot.duration - fout) a = Math.max(a, 1 - (shot.duration - t) / fout);
  return Math.min(1, Math.max(0, a));
}

export function chapterStart(tl, n) {
  return tl.chapters[n].start;
}

// The About path has one step per institution; chapter 5 ("to be continued") keeps the last lit.
export function liveStep(chapter, stepCount) {
  return Math.min(chapter, stepCount - 1);
}

// ?reel=42.5 -> { time: 42.5 } (render that moment, paused); ?reel=ch2-michelin -> { shot } (loop it).
export function parseDebug(search) {
  const v = new URLSearchParams(search).get('reel');
  if (v === null || v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? { time: n } : { shot: v };
}
