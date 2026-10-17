// The reel's sound: off until the visitor turns it on, then kept in step with the reel's clock.
// The AudioContext is made on that first press, as browsers require. Each frame the reel reports its
// time; the music is scheduled a little ahead of it, and a jump (a chapter button, the loop seam in
// solo mode) cancels what was scheduled and starts again from the new place.
import { createSynth, VOLUME } from './synth.js';
import { planScore, eventsBetween, toneAt, slip } from './schedule.js';
import { SCORE } from './score.js';

const AHEAD = 0.15;                   // seconds of music scheduled ahead of the reel
const JUMP = 0.08;                    // the reel this far from where the music expects it: it jumped
const FADE = 0.3;                     // fade-out when the reel stops

export function createSound(tl) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const plan = planScore(SCORE, tl);
  let ctx = null, synth = null, on = false, active = false;
  let anchor = null, until = 0, live = [];

  function cancel(at) {
    for (const h of live) if (h.end > at) h.stop(at);
    live = [];
  }
  function anchorAt(t, now) {
    anchor = { u: t, c: now };
    until = t;
    const k = toneAt(plan, t);
    synth.reset(now);
    synth.setTone(k.from, now, 0.02);
    if (k.to !== k.from) synth.setTone(k.to, now + 0.02, k.remaining);
  }
  function start(t, now) {
    active = true;
    ctx.resume();
    anchorAt(t, now);
    const g = synth.master.gain;
    g.cancelScheduledValues(now);
    g.setTargetAtTime(VOLUME, now, 0.05);
  }
  function stop(now) {
    active = false;
    const g = synth.master.gain;
    g.cancelScheduledValues(now);
    g.setTargetAtTime(0, now, FADE / 3);
    cancel(now + FADE);
    setTimeout(() => { if (!active && ctx.state === 'running') ctx.suspend(); }, FADE * 1000 + 100);
  }

  return {
    supported: Boolean(Ctx),
    get on() { return on; },
    toggle() {
      on = !on;
      if (on && !ctx) { ctx = new Ctx(); synth = createSynth(ctx); }
      return on;
    },
    // t: the reel's place on the full timeline; playing: whether the reel is moving.
    update(t, playing) {
      if (!ctx) return;
      const now = ctx.currentTime;
      if (!(playing && on)) { if (active) stop(now); return; }
      if (!active) start(t, now);
      let u = anchor.u + (now - anchor.c);
      if (Math.abs(slip(t, u, plan.duration)) > JUMP) { cancel(now); anchorAt(t, now); u = t; }
      until = Math.max(until, u);
      if (until >= u + AHEAD) return;
      for (const ev of eventsBetween(plan, until, u + AHEAD)) {
        const when = Math.max(now, anchor.c + ev.time - anchor.u);
        if (ev.kind === 'tone') synth.setTone(ev.tone, when, ev.glide);
        else live.push(synth.play(ev, when));
      }
      until = u + AHEAD;
      live = live.filter(h => h.end > now);
    },
  };
}
