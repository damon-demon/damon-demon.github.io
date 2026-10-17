// The reel's instrument: a small lo-fi band, all synthesised: an electric piano and a music box (both
// FM), a pad, a bass and soft drums, with vinyl crackle and a little tape wobble. Everything goes
// through one tone stage (a low-pass filter and a reverb), then a master gain and a limiter. It runs
// the same on a live AudioContext and an OfflineAudioContext.
import { rng } from '../pixels.js';

export const VOLUME = 0.3;

// The tone stage: soft is the lo-fi default, bright opens up for big moments, dark is Michigan's
// grey, water the sea.
export const TONES = {
  soft: { cutoff: 5200, wet: 0.22 },
  bright: { cutoff: 14000, wet: 0.14 },
  dark: { cutoff: 1600, wet: 0.3 },
  water: { cutoff: 700, wet: 0.45 },
};

// Pitched voices and their peak levels, scaled by each note's velocity.
export const VOICES = { keys: { gain: 0.2 }, box: { gain: 0.18 }, pad: { gain: 0.045 }, bass: { gain: 0.2 } };
const VEL = 0.8;                      // a note's velocity when the score gives none

// Hits on the noise voice: filtered noise with an attack and a decay (seconds) or, with `hold`, a
// texture that lasts the note's length. The kick is a falling sine instead.
export const HITS = {
  kick: { gain: 0.3 },
  snare: { type: 'bandpass', freq: 2400, q: 0.6, gain: 0.1, attack: 0.008, decay: 0.16 },
  shaker: { type: 'highpass', freq: 6500, q: 0.7, gain: 0.045, attack: 0.012, decay: 0.05 },
  rain: { type: 'bandpass', freq: 3000, q: 0.4, gain: 0.035, hold: true },
  vinyl: { type: 'highpass', freq: 900, q: 0.5, gain: 0.5, hold: true, crackle: true },
};

const WOBBLE = { rate: 0.55, cents: 6 };  // the tape's slow drift in pitch

export function createSynth(ctx, destination = ctx.destination) {
  const master = ctx.createGain();
  master.gain.value = 0;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -6;
  limiter.knee.value = 6;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.2;
  master.connect(limiter).connect(destination);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.5;
  filter.frequency.value = TONES.soft.cutoff;
  const wet = ctx.createGain();
  wet.gain.value = TONES.soft.wet;
  const verb = ctx.createConvolver();
  verb.buffer = noiseBuffer(ctx, 2.4, (i, n) => (1 - i / n) ** 4);
  const verbTone = ctx.createBiquadFilter();
  verbTone.type = 'lowpass';
  verbTone.frequency.value = 4500;
  filter.connect(master);
  filter.connect(wet).connect(verb).connect(verbTone).connect(master);

  const lfo = ctx.createOscillator();
  lfo.frequency.value = WOBBLE.rate;
  const wobble = ctx.createGain();
  wobble.gain.value = WOBBLE.cents;
  lfo.connect(wobble);
  lfo.start(0);

  const noise = noiseBuffer(ctx, 1, () => 1);
  const crackle = crackleBuffer(ctx, 5);

  const osc = (type, f, wobbles = true) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    if (wobbles) wobble.connect(o.detune);
    return o;
  };
  // FM: a sine modulating `car`'s frequency at `ratio` × f, its depth falling from `from` to `to`
  // (× f) with time constant `tc`.
  const fm = (car, f, ratio, from, to, when, tc) => {
    const mod = osc('sine', f * ratio, false);
    const depth = ctx.createGain();
    depth.gain.setValueAtTime(f * from, when);
    depth.gain.setTargetAtTime(f * to, when, tc);
    mod.connect(depth).connect(car.frequency);
    return mod;
  };

  // How each pitched voice is built: its sources, all feeding `g`, and its envelope.
  const BUILD = {
    // Electric piano: a bright, bell-like strike that mellows as it rings, held a little like a pedal.
    keys(f, when, dur, vel, g) {
      const car = osc('sine', f);
      const srcs = [car, fm(car, f, 1, 0.8 + 1.6 * vel, 0.15, when, 0.3), fm(car, f, 14, 0.6 * vel, 0, when, 0.015)];
      car.connect(g);
      return { srcs, end: env(g.gain, when, when + dur + 0.25, VOICES.keys.gain * vel, { a: 0.004, tc: 1.1, r: 0.35 }) };
    },
    // Music box: a glassy ping that settles into a near-pure tone and dies away.
    box(f, when, dur, vel, g) {
      const car = osc('sine', f);
      const srcs = [car, fm(car, f, 3.5, 1.2 * vel, 0.05, when, 0.08)];
      car.connect(g);
      return { srcs, end: env(g.gain, when, when + dur + 0.4, VOICES.box.gain * vel, { a: 0.002, tc: 0.55, r: 0.3 }) };
    },
    // Pad: two detuned saws, darkened, swelling in slowly.
    pad(f, when, dur, vel, g) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1100;
      lp.Q.value = 0.3;
      lp.connect(g);
      const srcs = [-8, 8].map(c => { const o = osc('sawtooth', f); o.detune.value = c; o.connect(lp); return o; });
      return { srcs, end: env(g.gain, when, when + dur, VOICES.pad.gain * vel, { a: 0.7, tc: 0.6, s: 0.8, r: 1 }) };
    },
    // Bass: a round sine with a touch of its octave.
    bass(f, when, dur, vel, g) {
      const a = osc('sine', f), b = osc('sine', f * 2), bg = ctx.createGain();
      bg.gain.value = 0.25;
      a.connect(g);
      b.connect(bg).connect(g);
      return { srcs: [a, b], end: env(g.gain, when, when + dur, VOICES.bass.gain * vel, { a: 0.012, tc: 0.5, s: 0.45, r: 0.12 }) };
    },
  };

  function hit(name, when, dur, vel, g) {
    const h = HITS[name];
    if (!h) throw new Error(`no hit ${name}`);
    if (name === 'kick') {
      const o = osc('sine', 125, false);
      o.frequency.setValueAtTime(125, when);
      o.frequency.exponentialRampToValueAtTime(48, when + 0.09);
      o.connect(g);
      return { srcs: [o], end: env(g.gain, when, when + 0.3, h.gain * vel, { a: 0.002, tc: 0.12, r: 0.05 }) };
    }
    const src = ctx.createBufferSource();
    src.buffer = h.crackle ? crackle : noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = h.type;
    f.frequency.value = h.freq;
    f.Q.value = h.q;
    src.connect(f).connect(g);
    const shape = h.hold ? { a: 0.4, tc: 0.1, s: 1, r: 0.6 } : { a: h.attack, tc: h.decay / 3, r: 0.03 };
    const end = h.hold ? when + dur : when + h.attack + h.decay;
    return { srcs: [src], end: env(g.gain, when, end, h.gain * vel, shape) };
  }

  function play(ev, when) {
    const vel = ev.vel ?? VEL;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(filter);
    let note;
    if (ev.voice === 'noise') note = hit(ev.hit, when, ev.dur, vel, g);
    else {
      const build = BUILD[ev.voice];
      if (!build) throw new Error(`no voice ${ev.voice}`);
      note = build(440 * 2 ** ((ev.pitch - 69) / 12), when, ev.dur, vel, g);
    }
    for (const s of note.srcs) { s.start(when); s.stop(note.end); }
    return {
      end: note.end,
      stop(at) {
        g.gain.cancelScheduledValues(at);
        g.gain.setTargetAtTime(0, at, 0.01);
        for (const s of note.srcs) s.stop(at + 0.05);
      },
    };
  }

  function setTone(name, when, glide) {
    const t = TONES[name];
    if (!t) throw new Error(`no tone ${name}`);
    const k = Math.max(glide, 0.01) / 3;
    filter.frequency.setTargetAtTime(t.cutoff, when, k);
    wet.gain.setTargetAtTime(t.wet, when, k);
  }

  // Forget the tone changes still to come, after a jump.
  function reset(at) {
    filter.frequency.cancelScheduledValues(at);
    wet.gain.cancelScheduledValues(at);
  }

  return { master, play, setTone, reset };
}

// Attack to the peak, fall towards `s` × peak with time constant `tc` (0 for a strike that dies
// away), and release from `end`. Returns when the note is silent.
function env(param, when, end, peak, { a, tc, s = 0, r }) {
  param.setValueAtTime(0, when);
  param.linearRampToValueAtTime(peak, when + a);
  param.setTargetAtTime(peak * s, when + a, tc);
  const off = Math.max(end, when + a);
  param.setTargetAtTime(0, off, r / 3);
  return off + r * 2;
}

// Seeded white noise, shaped over its length by shape(i, n): flat for the noise voice, a decay for
// the reverb.
function noiseBuffer(ctx, seconds, shape) {
  const n = Math.round(seconds * ctx.sampleRate), buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const x = buf.getChannelData(0), r = rng(7);
  for (let i = 0; i < n; i++) x[i] = (r() * 2 - 1) * shape(i, n);
  return buf;
}

// Vinyl: a faint hiss, with sparse clicks of random size that die away in a few samples.
function crackleBuffer(ctx, seconds) {
  const n = Math.round(seconds * ctx.sampleRate), buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const x = buf.getChannelData(0), r = rng(11);
  for (let i = 0; i < n; i++) x[i] += (r() * 2 - 1) * 0.004;
  for (let i = 0; i < n; i++) {
    if (r() >= 0.0004) continue;
    const a = (0.15 + r() * 0.6) * (r() < 0.5 ? -1 : 1);
    for (let k = 0; k < 24 && i + k < n; k++) x[i + k] += a * Math.exp(-k / 4);
  }
  return buf;
}
