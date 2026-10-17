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
