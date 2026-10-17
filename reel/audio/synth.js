// The reel's instrument: NES-style voices (two pulse waves, a triangle and noise) through one tone
// stage (a low-pass filter and a short reverb), then a master gain and a limiter. It runs the same
// on a live AudioContext and on an OfflineAudioContext.
import { rng } from '../pixels.js';

export const VOLUME = 0.25;

// The tone stage: soft is the lo-fi default, bright the open NES sound for big moments, dark
// Michigan's grey, water the sea.
export const TONES = {
  soft: { cutoff: 2500, wet: 0.18 },
  bright: { cutoff: 12000, wet: 0.04 },
  dark: { cutoff: 900, wet: 0.22 },
  water: { cutoff: 500, wet: 0.4 },
};

// Pitched voices: peak level, envelope (attack, decay and release in seconds, sustain as a share of
// the peak), and the pulse duty cycle.
export const VOICES = {
  p1: { gain: 0.2, a: 0.005, d: 0.12, s: 0.55, r: 0.09, duty: 0.25 },
  p2: { gain: 0.11, a: 0.005, d: 0.1, s: 0.5, r: 0.08, duty: 0.125 },
  tri: { gain: 0.32, a: 0.004, d: 0.05, s: 0.85, r: 0.05 },
};

// Hits on the noise voice: filtered noise that dies away over `decay` seconds or, with `hold`, a
// texture that lasts the note's length. The kick is a falling triangle, as on the NES.
export const HITS = {
  kick: { gain: 0.42, decay: 0.16 },
  snare: { type: 'bandpass', freq: 1800, q: 0.8, gain: 0.16, decay: 0.12 },
  hat: { type: 'highpass', freq: 7000, q: 0.7, gain: 0.07, decay: 0.035 },
  rain: { type: 'bandpass', freq: 3200, q: 0.4, gain: 0.05, hold: true },
};
const HOLD = { a: 0.3, d: 0.1, s: 1, r: 0.5 };

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
  verb.buffer = noiseBuffer(ctx, 1.6, (i, n) => (1 - i / n) ** 3);
  filter.connect(master);
  filter.connect(wet).connect(verb).connect(master);

  const noise = noiseBuffer(ctx, 1, () => 1);
  const waves = new Map();
  const wave = (duty) => {
    if (!waves.has(duty)) waves.set(duty, pulseWave(ctx, duty));
    return waves.get(duty);
  };

  // One sounding note: src (through `out`) into its own envelope, then into the tone stage.
  function sound(src, out, peak, when, dur, env) {
    const g = ctx.createGain();
    g.gain.value = 0;
    out.connect(g).connect(filter);
    const end = envelope(g.gain, when, dur, peak, env);
    src.start(when);
    src.stop(end);
    return {
      end,
      stop(at) {
        g.gain.cancelScheduledValues(at);
        g.gain.setTargetAtTime(0, at, 0.01);
        src.stop(at + 0.05);
      },
    };
  }

  function play(ev, when) {
    if (ev.voice === 'noise') {
      const h = HITS[ev.hit];
      if (!h) throw new Error(`no hit ${ev.hit}`);
      const env = h.hold ? HOLD : { a: 0.001, d: h.decay, s: 0, r: 0.02 };
      const dur = h.hold ? ev.dur : Math.min(ev.dur, h.decay * 3);
      if (ev.hit === 'kick') {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, when);
        osc.frequency.exponentialRampToValueAtTime(45, when + 0.12);
        return sound(osc, osc, h.gain, when, dur, env);
      }
      const src = ctx.createBufferSource();
      src.buffer = noise;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = h.type;
      f.frequency.value = h.freq;
      f.Q.value = h.q;
      src.connect(f);
      return sound(src, f, h.gain, when, dur, env);
    }
    const v = VOICES[ev.voice];
    if (!v) throw new Error(`no voice ${ev.voice}`);
    const osc = ctx.createOscillator();
    if (ev.voice === 'tri') osc.type = 'triangle';
    else osc.setPeriodicWave(wave(ev.duty ?? v.duty));
    osc.frequency.value = 440 * 2 ** ((ev.pitch - 69) / 12);
    return sound(osc, osc, v.gain, when, ev.dur, v);
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

// Attack to the peak, decay to the sustain level, release at the end. Returns when it is silent.
function envelope(param, when, dur, peak, { a, d, s, r }) {
  param.setValueAtTime(0, when);
  param.linearRampToValueAtTime(peak, when + a);
  param.setTargetAtTime(peak * s, when + a, d / 3);
  const end = Math.max(when + dur, when + a);
  param.setTargetAtTime(0, end, r / 3);
  return end + r * 3;
}

// A pulse wave with the given duty cycle (0.125, 0.25 or 0.5, as on the NES), from its Fourier series.
function pulseWave(ctx, duty) {
  const n = 40, real = new Float32Array(n), imag = new Float32Array(n);
  for (let k = 1; k < n; k++) real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
  return ctx.createPeriodicWave(real, imag);
}

// Seeded white noise, shaped over its length by shape(i, n): flat for the noise voice, a decay for
// the reverb.
function noiseBuffer(ctx, seconds, shape) {
  const n = Math.round(seconds * ctx.sampleRate), buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const x = buf.getChannelData(0), r = rng(7);
  for (let i = 0; i < n; i++) x[i] = (r() * 2 - 1) * shape(i, n);
  return buf;
}
