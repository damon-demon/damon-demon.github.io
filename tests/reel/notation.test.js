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
