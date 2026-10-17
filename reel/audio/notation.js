// Music notation for the score. A line is { notes, beats }: each note has a start beat, a length in
// beats, a MIDI pitch (or, on the noise voice, a hit name) and maybe a velocity, and beats is the
// line's whole length.
import { rng } from '../pixels.js';

const STEP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const NOTE = /^([A-G])(#|b)?(-?\d)$/;

// 'C4' -> 60, 'Eb4' -> 63, 'F#2' -> 42
export function midi(name) {
  const m = NOTE.exec(name);
  if (!m) throw new Error(`not a note: ${name}`);
  return 12 * (Number(m[3]) + 1) + STEP[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}

// 'C4:1 E4:.5@.6 -:.5 | G4+B4:2' -> a line. '-' is a rest and '|' a bar line (ignored). The length
// after ':' is in beats, 1 if left out; a velocity (0–1) can follow '@'; '+' joins notes struck
// together. A name that is not a note ('kick', 'x') is a hit.
export function seq(text) {
  const notes = [];
  let beat = 0;
  for (const tok of text.trim().split(/\s+/)) {
    if (tok === '|') continue;
    const [body, v] = tok.split('@');
    const [what, l = '1'] = body.split(':');
    const len = Number(l);
    if (!(len > 0)) throw new Error(`bad length: ${tok}`);
    const vel = v === undefined ? {} : { vel: Number(v) };
    if (what !== '-') {
      for (const w of what.split('+')) notes.push(NOTE.test(w) ? { beat, len, pitch: midi(w), ...vel } : { beat, len, hit: w, ...vel });
    }
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

// Chord qualities as semitones above the root.
const QUALITY = {
  '': [0, 4, 7], m: [0, 3, 7], 6: [0, 4, 7, 9], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10],
  m9: [0, 3, 7, 10, 14], add9: [0, 4, 7, 14], '7sus4': [0, 5, 7, 10],
};

// 'Dm9' -> { root: the root's pitch in the given octave, tones: semitones above it }
export function chord(name, octave = 4) {
  const m = /^([A-G](?:#|b)?)(.*)$/.exec(name);
  if (!m || !QUALITY[m[2]]) throw new Error(`not a chord: ${name}`);
  return { root: midi(m[1] + octave), tones: QUALITY[m[2]] };
}

// A close voicing for the keys, leaving the root to the bass when there are three other notes:
// every tone folded into the octave from `lo` up, low to high.
export function voicing(name, lo = 53) {
  const { root, tones } = chord(name, 0);
  const ts = tones.length > 3 ? tones.filter(t => t !== 0) : tones;
  return ts.map(t => lo + ((((root + t - lo) % 12) + 12) % 12)).sort((a, b) => a - b);
}

// Broken chords: 'C Am F G' -> root, third, fifth, third, ... in steps of `step` beats, `each` beats
// to a chord, rooted in the given octave.
export function arp(chords, { each = 4, step = 0.5, octave = 4 } = {}) {
  const notes = [];
  let beat = 0;
  for (const name of chords.trim().split(/\s+/)) {
    const { root, tones } = chord(name, octave);
    for (let k = 0; k < each / step; k++) notes.push({ beat: beat + k * step, len: step, pitch: root + tones[[0, 1, 2, 1][k % 4]] });
    beat += each;
  }
  return { notes, beats: beat };
}

// Chords struck to a rhythm: each chord in turn plays one bar of `rhythm`, whose hits ('x:1.5@.7')
// give the times, lengths and velocities.
export function comp(chords, rhythm, { lo = 53 } = {}) {
  const r = seq(rhythm);
  return cat(...chords.trim().split(/\s+/).map(name => {
    const ps = voicing(name, lo);
    return { beats: r.beats, notes: r.notes.flatMap(n => ps.map(pitch => ({ beat: n.beat, len: n.len, pitch, ...(n.vel !== undefined && { vel: n.vel }) }))) };
  }));
}

// A break: notes starting in [from, to) are dropped, and notes still sounding at `from` stop there,
// marked `cut` so they stop dead rather than ring on.
export function hole(line, from, to) {
  return {
    beats: line.beats,
    notes: line.notes
      .filter(n => n.beat < from || n.beat >= to)
      .map(n => (n.beat < from && n.beat + n.len >= from - 1e-9 ? { ...n, len: from - n.beat, cut: true } : n)),
  };
}

// A player's touch: every note a little early or late (up to `time` beats) and a little softer or
// harder (up to `vel`), the same way on every play.
export function human(line, { time = 0.03, vel = 0.12, seed = 1 } = {}) {
  const r = rng(seed);
  return {
    beats: line.beats,
    notes: line.notes.map(n => ({
      ...n,
      beat: Math.max(0, n.beat + (r() * 2 - 1) * time),
      vel: Math.min(1, Math.max(0.2, (n.vel ?? 0.8) + (r() * 2 - 1) * vel)),
    })),
  };
}
