// The score's clock maths. Pure: the score and the reel's timeline in, timed events out.
// A cue spans consecutive shots and is written in beats, so its tempo follows from its shots' length.
// Times are reel seconds, unwrapped: the second time round the loop runs from duration to 2 × duration.
const GLIDE = 0.2;                    // seconds for the filter to settle on a cue's tone

export function planScore(score, tl) {
  const at = new Map(tl.shots.map((e, i) => [e.shot.id, i]));
  const cues = score.cues.map(cue => {
    const idx = cue.shots.map(id => {
      if (!at.has(id)) throw new Error(`cue ${cue.id}: no shot ${id}`);
      return at.get(id);
    });
    if (idx.some((v, k) => k && v !== idx[k - 1] + 1)) throw new Error(`cue ${cue.id}: shots are not consecutive`);
    const start = tl.shots[idx[0]].start, end = tl.shots[idx.at(-1)].end;
    return { cue, start, end, spb: (end - start) / cue.beats };
  });
  const events = [];
  for (const { cue, start, end, spb } of cues) {
    events.push({ kind: 'tone', time: start, tone: cue.tone, glide: GLIDE });
    if (cue.sweep) events.push({ kind: 'tone', time: start + GLIDE, tone: cue.sweep, glide: end - start - GLIDE });
    for (const [voice, line] of cue.voices) {
      for (const n of line.notes) {
        events.push({ kind: 'note', voice, time: start + n.beat * spb, dur: n.len * spb, pitch: n.pitch, hit: n.hit, vel: n.vel });
      }
    }
  }
  events.sort((a, b) => a.time - b.time);
  return { duration: tl.duration, cues, events };
}

// Every event starting in [t0, t1), across as many loops as that takes.
export function eventsBetween(plan, t0, t1) {
  const D = plan.duration, out = [];
  for (let k = Math.floor(t0 / D); k * D < t1; k++) {
    for (const ev of plan.events) {
      const time = ev.time + k * D;
      if (time >= t0 && time < t1) out.push({ ...ev, time });
    }
  }
  return out;
}

// The tone stage at time u, for starting mid-cue: the cue's tone, and for a sweep, where it is headed
// and how long it has left.
export function toneAt(plan, u) {
  const D = plan.duration, tt = ((u % D) + D) % D;
  const c = plan.cues.find(c => tt >= c.start && tt < c.end) ?? plan.cues.at(-1);
  return { from: c.cue.tone, to: c.cue.sweep ?? c.cue.tone, remaining: c.end - tt };
}

// How far the reel's time t is ahead of u, taking the short way round a loop of length D.
export function slip(t, u, D) {
  let d = (((t - u) % D) + D) % D;
  if (d > D / 2) d -= D;
  return d;
}
