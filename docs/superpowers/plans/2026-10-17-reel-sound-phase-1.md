# Reel Sound — Phase 1 (Engine, Sound Button, First Listen) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the life reel play music when the visitor turns sound on: the synth, the scheduler, the sound button, an offline WAV renderer, and a first score. The first score has one cue per chapter, so the user can hear the theme, its variations and the dog motif before the per-shot cues and effects are written in phases 2 and 3.

**Architecture:**

- **Pure modules** hold everything that can be tested without a browser:
  - `notation.js` turns compact text into lines of notes.
  - `score.js` holds the data.
  - `schedule.js` places the cues on the reel's timeline and returns the timed events.
- **Browser modules** hold the Web Audio code:
  - `synth.js` is the Web Audio graph.
  - `sound.js` bridges the synth to the reel's clock.
- **`reel.js`** gains the button and the calls into `sound.js`.
- **The offline renderer** reuses the same synth through an `OfflineAudioContext` in headless Chrome.

**Tech Stack:** Vanilla JS ES modules, Web Audio API, Node 25 `node:test`, headless Google Chrome over the DevTools protocol.

**Spec:** `docs/superpowers/specs/2026-10-17-reel-sound-design.md`

## Global Constraints

- No framework, no build step, no npm dependencies, and no audio files.
- Sound is off on every visit. Nothing may create an `AudioContext` before the visitor presses the sound button.
- Sound follows playback. It fades out over 0.3 s when the reel pauses, scrolls offscreen or the tab is hidden.
- Master gain is 0.25 and goes through a limiter. The rendered peak must stay under −1 dBFS.
- Every cue's derived tempo stays within 60–200 BPM, and together the cues cover the timeline once, in order.
- The sound button is a `<button class="reel-sound">` placed before the pause button. It is labelled `Sound`, uses `aria-pressed`, and is not added when Web Audio is missing.
- All existing tests (`node --test 'tests/reel/*.test.js'`, `tests/reel/page-check.sh`, `tests/reel/qa.mjs`) keep passing.
- Work happens on branch `reel-sound`. Do not merge, and do not push.

## File structure

| File | Responsibility |
|---|---|
| `reel/audio/notation.js` | Pure. Note names to MIDI. Text to lines. Joining, repeating, transposing, minor and broken-chord lines |
| `reel/audio/schedule.js` | Pure. `planScore`, `eventsBetween`, `toneAt`, `slip` |
| `reel/audio/synth.js` | Web Audio graph: the voices, the tone stage (filter and reverb), the master and the limiter. `play`, `setTone`, `reset` |
| `reel/audio/score.js` | Pure data: the theme, the dog motif, and the cues |
| `reel/audio/sound.js` | The bridge to the reel: lazy `AudioContext`, look-ahead scheduling, jump detection, fades |
| `reel/reel.js` | Modified: the sound button, and the calls to `sound.update` |
| `style.css` | Modified: the `.reel-sound` button |
| `tests/reel/notation.test.js`, `schedule.test.js`, `score.test.js` | Unit tests |
| `tests/reel/sound-offline.js` | Browser module. Renders a stretch of the score to WAV (a dev tool; the page never loads it) |
| `tests/reel/render-sound.mjs` | Node CLI. Drives headless Chrome, writes the WAV, checks the levels |
| `tests/reel/qa.mjs` | Modified: sound checks |

## How to run things

- Unit tests: `node --test 'tests/reel/*.test.js'`.
- Serve the site: `python3 -m http.server 8000 --bind 127.0.0.1` from the repo root.
- Render: `node tests/reel/render-sound.mjs http://127.0.0.1:8000/ /tmp/reel.wav [--cue <id> | --from <s> --to <s>]`, then listen with `afplay /tmp/reel.wav`.

---

### Task 1: Notation

**Files:**
- Create: `reel/audio/notation.js`
- Test: `tests/reel/notation.test.js`

**Interfaces:**
- Produces:
  - A line is `{ notes: [{ beat, len, pitch? , hit? }], beats }`.
  - `midi(name) → number`
  - `seq(text) → line`
  - `cat(...lines) → line`
  - `repeat(line, n) → line`
  - `rest(beats) → line`
  - `up(line, semitones) → line`
  - `minor(line) → line`
  - `arp(chords, { each = 4, step = 0.5, octave = 4 }) → line`

- [ ] **Step 1: Write the failing test** in `tests/reel/notation.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { midi, seq, cat, repeat, rest, up, minor, arp } from '../../reel/audio/notation.js';

test('midi reads note names', () => {
  assert.equal(midi('A4'), 69);
  assert.equal(midi('C4'), 60);
  assert.equal(midi('Eb4'), 63);
  assert.equal(midi('F#2'), 42);
  assert.throws(() => midi('H2'));
});

test('seq reads notes, rests, bar lines and hits', () => {
  const l = seq('C4:1 E4:.5 -:.5 | G4:2 hat');
  assert.equal(l.beats, 5);
  assert.deepEqual(l.notes, [
    { beat: 0, len: 1, pitch: 60 }, { beat: 1, len: 0.5, pitch: 64 },
    { beat: 2, len: 2, pitch: 67 }, { beat: 4, len: 1, hit: 'hat' },
  ]);
  assert.throws(() => seq('C4:0'));
});

test('cat, repeat and rest place lines one after another', () => {
  const l = cat(seq('C4:2'), rest(1), repeat(seq('D4'), 2));
  assert.equal(l.beats, 5);
  assert.deepEqual(l.notes.map(n => [n.beat, n.pitch]), [[0, 60], [3, 62], [4, 62]]);
});

test('up and minor move pitches and leave hits alone', () => {
  assert.deepEqual(up(seq('C4 hat'), 2).notes.map(n => n.pitch ?? n.hit), [62, 'hat']);
  assert.deepEqual(minor(seq('C4 D4 E4 F4 G4 A4 B4 E5')).notes.map(n => n.pitch), [60, 62, 63, 65, 67, 68, 70, 75]);
});

test('arp breaks chords into root, third, fifth, third', () => {
  const l = arp('C Am', { each: 2, step: 0.5 });
  assert.equal(l.beats, 4);
  assert.deepEqual(l.notes.map(n => n.pitch), [60, 64, 67, 64, 69, 72, 76, 72]);
  assert.equal(l.notes[5].beat, 2.5);
  assert.throws(() => arp('Q'));
});
```

- [ ] **Step 2: Run it to check it fails**

Run: `node --test tests/reel/notation.test.js`
Expected: FAIL, with `Cannot find module` for `notation.js`.

- [ ] **Step 3: Implement** `reel/audio/notation.js`:

```js
// Music notation for the score. A line is { notes, beats }: each note has a start beat, a length in
// beats and a MIDI pitch (or, on the noise voice, a hit name), and beats is the line's whole length.
const STEP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const NOTE = /^([A-G])(#|b)?(-?\d)$/;

// 'C4' -> 60, 'Eb4' -> 63, 'F#2' -> 42
export function midi(name) {
  const m = NOTE.exec(name);
  if (!m) throw new Error(`not a note: ${name}`);
  return 12 * (Number(m[3]) + 1) + STEP[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}

// 'C4:1 E4:.5 -:.5 | G4:2' -> a line. '-' is a rest and '|' a bar line (ignored). The length after
// ':' is in beats, 1 if left out. A name that is not a note ('hat', 'kick') is a hit.
export function seq(text) {
  const notes = [];
  let beat = 0;
  for (const tok of text.trim().split(/\s+/)) {
    if (tok === '|') continue;
    const [what, l = '1'] = tok.split(':');
    const len = Number(l);
    if (!(len > 0)) throw new Error(`bad length: ${tok}`);
    if (what !== '-') notes.push(NOTE.test(what) ? { beat, len, pitch: midi(what) } : { beat, len, hit: what });
    beat += len;
  }
  return { notes, beats: beat };
}

// Lines one after another.
export function cat(...lines) {
  const notes = [];
  let beats = 0;
  for (const l of lines) {
    for (const n of l.notes) notes.push({ ...n, beat: n.beat + beats });
    beats += l.beats;
  }
  return { notes, beats };
}

export function repeat(line, times) {
  return cat(...Array(times).fill(line));
}

// Silence, for a line that comes in late.
export function rest(beats) {
  return { notes: [], beats };
}

function mapPitch(line, f) {
  return { beats: line.beats, notes: line.notes.map(n => (n.pitch === undefined ? n : { ...n, pitch: f(n.pitch) })) };
}

export function up(line, semitones) {
  return mapPitch(line, p => p + semitones);
}

// A line written in C major, moved to C minor: every E, A and B comes down a semitone.
export function minor(line) {
  return mapPitch(line, p => ([4, 9, 11].includes(((p % 12) + 12) % 12) ? p - 1 : p));
}

// Broken chords: 'C Am F G' -> root, third, fifth, third, ... in steps of `step` beats, `each` beats
// to a chord, rooted in the given octave.
export function arp(chords, { each = 4, step = 0.5, octave = 4 } = {}) {
  const notes = [];
  let beat = 0;
  for (const name of chords.trim().split(/\s+/)) {
    const m = /^([A-G](?:#|b)?)(m?)$/.exec(name);
    if (!m) throw new Error(`not a chord: ${name}`);
    const root = midi(m[1] + octave), triad = [0, m[2] ? 3 : 4, 7];
    for (let k = 0; k < each / step; k++) notes.push({ beat: beat + k * step, len: step, pitch: root + triad[[0, 1, 2, 1][k % 4]] });
    beat += each;
  }
  return { notes, beats: beat };
}
```

- [ ] **Step 4: Run it to check it passes**

Run: `node --test tests/reel/notation.test.js`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add reel/audio/notation.js tests/reel/notation.test.js
git commit -m "feat(sound): Add a compact music notation for the score"
```

---

### Task 2: Schedule

**Files:**
- Create: `reel/audio/schedule.js`
- Test: `tests/reel/schedule.test.js`

**Interfaces:**
- Consumes: `buildTimeline(chapters)` from `reel/timeline.js`, which returns `{ duration, shots: [{ shot, chapter, start, end }] }`; lines from Task 1.
- Produces:
  - A score is `{ cues: [{ id, shots: [shotId], beats, tone, sweep?, duty?: { voice: number }, voices: [[voice, line]] }] }`.
  - `planScore(score, tl) → { duration, cues: [{ cue, start, end, spb }], events }`
  - An event is `{ kind: 'tone', time, tone, glide }` or `{ kind: 'note', voice, time, dur, pitch?, hit?, duty? }`.
  - `eventsBetween(plan, t0, t1) → events` with unwrapped times in `[t0, t1)`.
  - `toneAt(plan, u) → { from, to, remaining }`
  - `slip(t, u, D) → number` in `(−D/2, D/2]`.

- [ ] **Step 1: Write the failing test** in `tests/reel/schedule.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline } from '../../reel/timeline.js';
import { seq } from '../../reel/audio/notation.js';
import { planScore, eventsBetween, toneAt, slip } from '../../reel/audio/schedule.js';

const shot = (id, duration) => ({ id, duration, caption: id });
const TL = buildTimeline([{ name: 'A', shots: [shot('a', 2), shot('b', 2)] }, { name: 'B', shots: [shot('c', 4)] }]);
const SCORE = {
  cues: [
    { id: 'one', shots: ['a', 'b'], beats: 8, tone: 'soft', voices: [['p1', seq('C4:4 D4:4')]] },
    { id: 'two', shots: ['c'], beats: 4, tone: 'dark', sweep: 'soft', duty: { p1: 0.5 }, voices: [['p1', seq('E4 - G4:2')], ['noise', seq('hat')]] },
  ],
};

test('planScore places cues on their shots and derives the beat length', () => {
  const plan = planScore(SCORE, TL);
  assert.equal(plan.duration, 8);
  assert.deepEqual(plan.cues.map(c => [c.cue.id, c.start, c.end, c.spb]), [['one', 0, 4, 0.5], ['two', 4, 8, 1]]);
});

test('planScore turns notes and tones into sorted, timed events', () => {
  const plan = planScore(SCORE, TL);
  const notes = plan.events.filter(e => e.kind === 'note');
  assert.deepEqual(notes.map(e => [e.voice, e.time, e.dur, e.pitch ?? e.hit]), [['p1', 0, 2, 60], ['p1', 2, 2, 62], ['p1', 4, 1, 64], ['noise', 4, 1, 'hat'], ['p1', 6, 2, 67]]);
  assert.equal(notes[2].duty, 0.5);
  const tones = plan.events.filter(e => e.kind === 'tone');
  assert.deepEqual(tones.map(e => [e.time, e.tone]), [[0, 'soft'], [4, 'dark'], [4.2, 'soft']]);
  assert.ok(Math.abs(tones[2].glide - 3.8) < 1e-9);
  assert.ok(plan.events.every((e, i, a) => !i || a[i - 1].time <= e.time));
});

test('planScore rejects unknown or out-of-order shots', () => {
  assert.throws(() => planScore({ cues: [{ id: 'x', shots: ['zz'], beats: 4, tone: 'soft', voices: [] }] }, TL), /no shot zz/);
  assert.throws(() => planScore({ cues: [{ id: 'x', shots: ['a', 'c'], beats: 4, tone: 'soft', voices: [] }] }, TL), /not consecutive/);
});

test('eventsBetween takes a half-open window and wraps across the loop', () => {
  const plan = planScore(SCORE, TL);
  const at = (t0, t1) => eventsBetween(plan, t0, t1).filter(e => e.kind === 'note').map(e => e.time);
  assert.deepEqual(at(0, 2), [0]);
  assert.deepEqual(at(2, 4.5), [2, 4, 4]);
  assert.deepEqual(at(7, 10.5), [8, 10]);
  const whole = at(0, 16), pieces = [0, 1.3, 4, 7.9, 8, 12.25, 16].flatMap((t, i, a) => (i ? at(a[i - 1], t) : []));
  assert.deepEqual(pieces, whole);
  assert.equal(whole.length, 10);
});

test('toneAt reports the tone mid-cue, and where a sweep is headed', () => {
  const plan = planScore(SCORE, TL);
  assert.deepEqual(toneAt(plan, 1), { from: 'soft', to: 'soft', remaining: 3 });
  assert.deepEqual(toneAt(plan, 13), { from: 'dark', to: 'soft', remaining: 3 });
});

test('slip measures the short way round the loop', () => {
  assert.ok(Math.abs(slip(5, 4.9, 66) - 0.1) < 1e-9);
  assert.ok(Math.abs(slip(0.02, 65.98, 66) - 0.04) < 1e-9);
  assert.ok(Math.abs(slip(65.98, 0.02, 66) + 0.04) < 1e-9);
  assert.equal(slip(30, 10, 66), 20);
});
```

- [ ] **Step 2: Run it to check it fails**

Run: `node --test tests/reel/schedule.test.js`
Expected: FAIL, with `Cannot find module` for `schedule.js`.

- [ ] **Step 3: Implement** `reel/audio/schedule.js`:

```js
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
        events.push({ kind: 'note', voice, time: start + n.beat * spb, dur: n.len * spb, pitch: n.pitch, hit: n.hit, duty: cue.duty?.[voice] });
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
```

- [ ] **Step 4: Run it to check it passes**

Run: `node --test tests/reel/schedule.test.js`
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add reel/audio/schedule.js tests/reel/schedule.test.js
git commit -m "feat(sound): Place the score's cues on the reel's timeline"
```

---

### Task 3: Synth and the first score

**Files:**
- Create: `reel/audio/synth.js`, `reel/audio/score.js`
- Test: `tests/reel/score.test.js`

**Interfaces:**
- Consumes:
  - `rng(seed)` from `reel/pixels.js`, which returns `() => number` in `[0, 1)`.
  - Task 1 and Task 2.
  - `CHAPTERS` from `reel/story.js`.
- Produces:
  - `VOLUME`, `TONES`, `VOICES`, `HITS`.
  - `createSynth(ctx, destination?) → { master: GainNode, play(event, when) → { end, stop(at) }, setTone(name, when, glide), reset(at) }`
  - `SCORE`, `THEME`, `DOG`.

- [ ] **Step 1: Write the failing test** in `tests/reel/score.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline } from '../../reel/timeline.js';
import { CHAPTERS } from '../../reel/story.js';
import { planScore } from '../../reel/audio/schedule.js';
import { SCORE } from '../../reel/audio/score.js';
import { TONES, VOICES, HITS } from '../../reel/audio/synth.js';

const tl = buildTimeline(CHAPTERS);
const plan = planScore(SCORE, tl);

test('the cues cover the whole reel once, in order', () => {
  assert.equal(plan.cues[0].start, 0);
  plan.cues.forEach((c, i) => { if (i) assert.equal(c.start, plan.cues[i - 1].end, `${c.cue.id} starts where the last cue ends`); });
  assert.equal(plan.cues.at(-1).end, tl.duration);
});

test('every cue keeps a tempo between 60 and 200 BPM', () => {
  for (const c of plan.cues) {
    const bpm = 60 / c.spb;
    assert.ok(bpm >= 60 && bpm <= 200, `${c.cue.id} at ${bpm.toFixed(0)} BPM`);
  }
});

test('every event uses a voice, hit and tone the synth has, in a playable range', () => {
  for (const e of plan.events) {
    if (e.kind === 'tone') { assert.ok(TONES[e.tone], `tone ${e.tone}`); continue; }
    if (e.voice === 'noise') { assert.ok(HITS[e.hit], `hit ${e.hit}`); continue; }
    assert.ok(VOICES[e.voice], `voice ${e.voice}`);
    assert.ok(e.pitch >= 24 && e.pitch <= 108, `pitch ${e.pitch}`);
    assert.ok(e.dur > 0);
  }
});
```

- [ ] **Step 2: Run it to check it fails**

Run: `node --test tests/reel/score.test.js`
Expected: FAIL, with `Cannot find module` for `score.js`.

- [ ] **Step 3: Implement** `reel/audio/synth.js`:

```js
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
```

- [ ] **Step 4: Implement** `reel/audio/score.js`:

```js
// The reel's score: one theme for Yimeng, varied chapter by chapter, and a short call for the dog.
// It is written in C. Each cue lays lines on the voices (p1 melody, p2 harmony, tri bass, noise
// drums) over a run of shots. Phase 1 has one cue per chapter.
import { seq, cat, repeat, rest, minor, arp } from './notation.js';

// The theme is four bars, played twice: the first time it ends open, on the dominant, and the second
// time it comes home.
const OPEN = seq('G4 C5 D5 E5 | D5:1.5 C5:.5 A4:2 | A4 C5 F5 E5 | D5:2 B4 G4');
const HOME = seq('G4 C5 D5 E5 | D5:1.5 C5:.5 A4:2 | A4 C5 F5 E5 | D5:1.5 B4:.5 C5:2');
export const THEME = cat(OPEN, HOME);
const BASS_OPEN = seq('C3:2 G2:2 | A2:2 E2:2 | F2:2 C3:2 | G2:2 D3:2');
const BASS_HOME = seq('C3:2 G2:2 | A2:2 E2:2 | F2:2 C3:2 | G2:2 C3:2');
const BASS = cat(BASS_OPEN, BASS_HOME);
const CHORDS = 'C Am F G';
const HARMONY = repeat(arp(CHORDS), 2);

// The dog: a quick, rising call.
export const DOG = seq('G5:.25 C6:.25 E6:.25 G6:.75');

const hats = (beats) => repeat(seq('hat:.5'), beats * 2);
const kit = (bars) => repeat(seq('kick snare kick snare'), bars);

export const SCORE = {
  cues: [
    {
      // Sheffield's rain under the theme in the minor, then the major for the continent.
      id: 'europe', tone: 'soft', beats: 32,
      shots: ['ch1-sheffield', 'ch1-train', 'ch1-lisbon', 'ch1-ring', 'ch1-trolltunga', 'ch1-iceland', 'ch1-takeoff'],
      voices: [
        ['p1', cat(minor(OPEN), HOME)],
        ['p2', cat(minor(arp(CHORDS)), arp(CHORDS))],
        ['tri', cat(minor(BASS_OPEN), BASS_HOME)],
        ['noise', cat(seq('rain:16'), hats(16))],
        ['noise', cat(rest(16), kit(4))],
      ],
    },
    {
      // The theme in full, and the dog's call as the puppy arrives at the graduation.
      id: 'new-york', tone: 'soft', beats: 32,
      shots: ['ch2-columbia', 'ch2-night', 'ch2-dining', 'ch2-moma', 'ch2-met', 'ch2-guggenheim', 'ch2-kusama', 'ch2-graduation'],
      voices: [['p1', THEME], ['p2', HARMONY], ['tri', BASS], ['noise', hats(32)], ['noise', kit(8)], ['p1', cat(rest(30), DOG)]],
    },
    {
      // Grey and slow: the theme's homecoming half in the minor, with no drums.
      id: 'michigan', tone: 'dark', beats: 16,
      shots: ['ch3-snow', 'ch3-timelapse', 'ch3-hooding', 'ch3-roadtrip'],
      voices: [['p1', minor(HOME)], ['p2', minor(arp(CHORDS, { step: 1 }))], ['tri', minor(BASS_HOME)]],
    },
    {
      id: 'california', tone: 'soft', beats: 32,
      shots: ['ch4-arrive', 'ch4-office', 'ch4-ranch', 'ch4-forest', 'ch4-fishing', 'ch4-tide', 'ch4-scuba', 'ch4-freedive', 'ch4-sunset'],
      voices: [['p1', THEME], ['p2', HARMONY], ['tri', BASS], ['noise', hats(32)], ['noise', kit(8)], ['p1', cat(rest(30), DOG)]],
    },
    {
      // The theme's last phrase, left hanging on the second, so the loop runs on into Sheffield.
      id: 'to-be-continued', tone: 'soft', beats: 8,
      shots: ['ch5-sketch'],
      voices: [['p1', seq('A4 C5 F5 E5 | D5:4')], ['p2', arp('F G')], ['tri', seq('F2:2 C3:2 | G2:4')]],
    },
  ],
};
```

- [ ] **Step 5: Run the tests to check they pass**

Run: `node --test 'tests/reel/*.test.js'`
Expected: all tests pass, including the 3 in `score.test.js`. Importing `synth.js` in Node must not touch any browser global at load time.

- [ ] **Step 6: Commit**

```bash
git add reel/audio/synth.js reel/audio/score.js tests/reel/score.test.js
git commit -m "feat(sound): Add the NES-style synth and a first score, one cue per chapter"
```

---

### Task 4: Offline renderer and the first listen

**Files:**
- Create: `tests/reel/sound-offline.js`, `tests/reel/render-sound.mjs`

**Interfaces:**
- Consumes: Tasks 2 and 3; `buildTimeline` and `CHAPTERS`.
- Produces: `render(t0, t1, rate?) → Promise<{ wav: base64 string, peak, silence, seconds }>`, a browser module. The CLI is `node tests/reel/render-sound.mjs <site-url> <out.wav> [--cue id | --from s --to s]`. It exits 1 if the peak is above −1 dBFS or if there is more than 2 s of silence.

- [ ] **Step 1: Implement** `tests/reel/sound-offline.js`:

```js
// Render a stretch of the reel's sound offline, for listening and level checks. A dev tool: the
// page never loads it. Runs in the browser, through tests/reel/render-sound.mjs.
import { createSynth, VOLUME } from '../../reel/audio/synth.js';
import { planScore, eventsBetween, toneAt } from '../../reel/audio/schedule.js';
import { SCORE } from '../../reel/audio/score.js';
import { buildTimeline } from '../../reel/timeline.js';
import { CHAPTERS } from '../../reel/story.js';

const TAIL = 1.5;                     // seconds after t1 for the last notes and the reverb to ring out
const QUIET = 0.001;                  // −60 dBFS: anything under this counts as silence

export async function render(t0, t1, rate = 44100) {
  const plan = planScore(SCORE, buildTimeline(CHAPTERS));
  const seconds = t1 - t0;
  const ctx = new OfflineAudioContext(1, Math.ceil((seconds + TAIL) * rate), rate);
  const synth = createSynth(ctx);
  synth.master.gain.value = VOLUME;
  const k = toneAt(plan, t0);
  synth.setTone(k.from, 0, 0.01);
  if (k.to !== k.from) synth.setTone(k.to, 0.01, k.remaining);
  for (const ev of eventsBetween(plan, t0, t1)) {
    if (ev.kind === 'tone') synth.setTone(ev.tone, ev.time - t0, ev.glide);
    else synth.play(ev, ev.time - t0);
  }
  const x = (await ctx.startRendering()).getChannelData(0);
  let peak = 0, run = 0, silence = 0;
  const body = Math.round(seconds * rate);
  for (let i = 0; i < x.length; i++) {
    const a = Math.abs(x[i]);
    if (a > peak) peak = a;
    if (i >= body) continue;
    run = a < QUIET ? run + 1 : 0;
    if (run > silence) silence = run;
  }
  return { wav: base64(wavBytes(x, rate)), peak, silence: silence / rate, seconds };
}

// 16-bit mono PCM.
function wavBytes(x, rate) {
  const n = x.length, v = new DataView(new ArrayBuffer(44 + n * 2));
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, x[i])) * 32767), true);
  return new Uint8Array(v.buffer);
}

function base64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
```

- [ ] **Step 2: Implement** `tests/reel/render-sound.mjs`:

```js
// Render the reel's sound to a WAV file through headless Chrome, and check its levels (dev tool).
//   node tests/reel/render-sound.mjs <site-url> <out.wav> [--cue <id> | --from <s> --to <s>]
// Serve the repo root first: python3 -m http.server 8000 --bind 127.0.0.1
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { planScore } from '../../reel/audio/schedule.js';
import { SCORE } from '../../reel/audio/score.js';
import { buildTimeline } from '../../reel/timeline.js';
import { CHAPTERS } from '../../reel/story.js';

const [base, out, ...rest] = process.argv.slice(2);
if (!base || !out) { console.error('usage: render-sound.mjs <site-url> <out.wav> [--cue id | --from s --to s]'); process.exit(2); }
const plan = planScore(SCORE, buildTimeline(CHAPTERS));
let from = 0, to = plan.duration;
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === '--from') from = Number(rest[++i]);
  else if (rest[i] === '--to') to = Number(rest[++i]);
  else if (rest[i] === '--cue') {
    const id = rest[++i], c = plan.cues.find(c => c.cue.id === id);
    if (!c) { console.error(`no cue ${id}; cues: ${plan.cues.map(c => c.cue.id).join(', ')}`); process.exit(2); }
    from = c.start; to = c.end;
  }
}

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9800 + Math.floor(Math.random() * 90);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'reel-sound-'))}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let code = 0;
try {
  let target;
  for (let i = 0; i < 50 && !target; i++) { await sleep(100); try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page'); } catch {} }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });
  let id = 0; const pending = new Map(), waiters = [];
  ws.onmessage = (m) => { const msg = JSON.parse(m.data); if (msg.id) pending.get(msg.id)?.(msg.result); if (msg.method) waiters.filter(w => w.method === msg.method).forEach(w => w.res()); };
  const send = (method, params = {}) => new Promise(res => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
  const once = (method) => new Promise(res => waiters.push({ method, res }));
  await send('Page.enable');
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url: new URL('tests/reel/', base).href });
  await loaded;
  const r = await send('Runtime.evaluate', { expression: `import('/tests/reel/sound-offline.js').then(m => m.render(${from}, ${to}))`, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  const { wav, peak, silence, seconds } = r.result.value;
  writeFileSync(out, Buffer.from(wav, 'base64'));
  const db = 20 * Math.log10(peak);
  console.log(`wrote ${out}: ${from.toFixed(2)}–${to.toFixed(2)} s (${seconds.toFixed(1)} s), peak ${db.toFixed(1)} dBFS, longest silence ${silence.toFixed(2)} s`);
  if (db > -1) { console.log('FAIL - peak above -1 dBFS'); code = 1; }
  if (silence > 2) { console.log('FAIL - more than 2 s of silence'); code = 1; }
  ws.close();
} finally { chrome.kill(); }
process.exit(code);
```

- [ ] **Step 3: Render the whole loop and check the levels**

Run:
```bash
python3 -m http.server 8000 --bind 127.0.0.1 >/dev/null 2>&1 &
node tests/reel/render-sound.mjs http://127.0.0.1:8000/ /tmp/reel-phase1.wav
```
Expected: a line like `wrote /tmp/reel-phase1.wav: 0.00–66.30 s …, peak −x dBFS`, with the peak below −1 and no FAIL lines. If the peak is too high, lower the voice gains in `VOICES` and `HITS`, not `VOLUME`.

- [ ] **Step 4: Commit**

```bash
git add tests/reel/sound-offline.js tests/reel/render-sound.mjs
git commit -m "test(sound): Render the reel's sound offline to WAV, with level checks"
```

- [ ] **Step 5: Listening checkpoint.** Give the user `/tmp/reel-phase1.wav` and the per-chapter renders (`--cue europe` and so on), to play with `afplay`. Adjust the theme, the timbres and the levels from their feedback before going on.

---

### Task 5: Sound in the reel

**Files:**
- Create: `reel/audio/sound.js`
- Modify: `reel/reel.js`, `style.css`, `tests/reel/qa.mjs`, `docs/superpowers/specs/2026-10-17-reel-sound-design.md` (the button's label)

**Interfaces:**
- Consumes: Tasks 2 and 3.
- Produces: `createSound(tl) → { supported, on, toggle() → boolean, update(t, playing) }`, where `t` is the position on the full timeline.

- [ ] **Step 1: Implement** `reel/audio/sound.js`:

```js
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
```

- [ ] **Step 2: Wire it into** `reel/reel.js`.

  1. After the other imports, add:
     ```js
     import { createSound } from './audio/sound.js';
     ```
  2. Add two icons to `ICON`:
     ```js
       sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
       muted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
     ```
  3. After `const full = buildTimeline(chapters);`, add:
     ```js
       const sound = createSound(full);
     ```
  4. Replace `let soloChapter = null;` and its comment line with:
     ```js
       let soloChapter = null, soloStart = 0; // ?reel=<shot-id>: loop one shot, report its real chapter and place
     ```
     Inside the solo `if`, after `soloChapter = hit.chapter;`, add `soloStart = hit.start;`.
  5. After `let shownCaption = null, shownChapter = -1;`, add:
     ```js
       let playingNow = false;
     ```
  6. In `tick`, after the line that advances `t`, add:
     ```js
         sound.update(soloStart + t, true);
     ```
  7. In `sync`, after `const playing = …;`, add:
     ```js
         playingNow = playing;
         sound.update(soloStart + t, playing);
     ```
  8. In `jump`, change `tl = full; soloChapter = null;` to `tl = full; soloChapter = null; soloStart = 0;`.
  9. After the `chapters.forEach(...)` that builds the chapter buttons, add:
     ```js
       if (sound.supported) {
         const soundBtn = document.createElement('button');
         soundBtn.type = 'button';
         soundBtn.className = 'reel-sound';
         soundBtn.setAttribute('aria-label', 'Sound');
         const showSound = () => { soundBtn.setAttribute('aria-pressed', String(sound.on)); soundBtn.innerHTML = sound.on ? ICON.sound : ICON.muted; };
         soundBtn.addEventListener('click', () => { sound.toggle(); showSound(); sound.update(soloStart + t, playingNow); });
         showSound();
         nav.insertBefore(soundBtn, pauseBtn);
       }
     ```

- [ ] **Step 3: Style the button** in `style.css`. Replace the three `.reel-pause` rules in the Reel block with:

```css
.reel-nav .reel-pause, .reel-nav .reel-sound {
  display: grid; place-items: center; width: 28px; height: 28px; padding: 0; margin-left: 8px;
  border: 1px solid rgba(233, 230, 223, .22); border-radius: 50%; color: var(--text);
}
.reel-nav .reel-pause:hover, .reel-nav .reel-sound:hover, .reel-nav .reel-sound[aria-pressed="true"] { border-color: var(--accent); color: var(--accent); }
.reel-pause svg, .reel-sound svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
```

In the mobile block, replace `.reel-nav .reel-pause { width: 24px; height: 24px; margin-left: 4px; }` with:

```css
  .reel-nav .reel-pause, .reel-nav .reel-sound { width: 24px; height: 24px; margin-left: 4px; }
```

- [ ] **Step 4: Add the sound checks** to `tests/reel/qa.mjs`.

  1. Add `'--autoplay-policy=no-user-gesture-required'` to the Chrome arguments.
  2. Before the final `ws.close();`, add:

```js
  // sound: no AudioContext until the visitor asks for one; then every chapter plays without an error
  await send('Page.addScriptToEvaluateOnNewDocument', { source: "window.__audio = 0; { const A = window.AudioContext; window.AudioContext = class extends A { constructor(...a) { super(...a); window.__audio++; } }; }" });
  await open(`${BASE}?qa=sound#reel`, 1440); await sleep(1500);   // a new URL: a bare #reel would not reload
  const silent = await value("({ button: Boolean(document.querySelector('.reel-sound')), audio: window.__audio })");
  report(silent.button && silent.audio === 0, 'the sound button is there, and no AudioContext exists before it is pressed', JSON.stringify(silent));
  const quiet = errors.length;
  await value("document.querySelector('.reel-sound').click()");
  for (let n = 0; n < 5; n++) { await value(`document.querySelectorAll('.reel-ch')[${n}].click()`); await sleep(1200); }
  const loud = await value("({ audio: window.__audio, pressed: document.querySelector('.reel-sound').getAttribute('aria-pressed') })");
  report(loud.audio === 1 && loud.pressed === 'true' && errors.length === quiet, 'with sound on, every chapter plays without a console error', JSON.stringify(loud) + ' ' + errors.slice(quiet).join(' | '));
```

- [ ] **Step 5: Update the spec's button line** in `docs/superpowers/specs/2026-10-17-reel-sound-design.md`. Change the "Sound button" bullet to say that its `aria-label` is always `Sound`, and that its on/off state is given by `aria-pressed`. (A toggle button that also changes its label would be announced twice.)

- [ ] **Step 6: Run every check**

Run:
```bash
node --test 'tests/reel/*.test.js'
tests/reel/page-check.sh
python3 -m http.server 8000 --bind 127.0.0.1 >/dev/null 2>&1 &
node tests/reel/qa.mjs http://127.0.0.1:8000/
```
Expected: all unit tests pass. `page-check.sh` prints only `ok` lines. `qa.mjs` prints `ok` for its three old checks and its two new ones.

- [ ] **Step 7: Commit**

```bash
git add reel/audio/sound.js reel/reel.js style.css tests/reel/qa.mjs docs/superpowers/specs/2026-10-17-reel-sound-design.md
git commit -m "feat(sound): Add the sound button, and keep the music in step with the reel"
```

- [ ] **Step 8: Listening checkpoint on the real page.** The user opens `http://127.0.0.1:8000/#reel`, presses the sound button, and checks four things: chapter jumps, pausing, scrolling away and back, and the loop seam.
