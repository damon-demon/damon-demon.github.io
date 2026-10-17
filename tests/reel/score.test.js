import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline } from '../../reel/timeline.js';
import { CHAPTERS } from '../../reel/story.js';
import { planScore } from '../../reel/audio/schedule.js';
import { SCORE, ROAD_PINGS } from '../../reel/audio/score.js';
import { landmarkTimes } from '../../reel/ch3/roadtrip.js';
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

test('on the road trip, the music box pings as each landmark pops up', () => {
  const c = plan.cues.find(c => c.cue.id === 'road-trip');
  const shot = tl.shots.find(e => e.shot.id === 'ch3-roadtrip');
  assert.equal(c.start, shot.start);
  const at = Object.fromEntries(landmarkTimes().map(l => [l.key, l.t]));
  for (const [beat, key] of ROAD_PINGS) assert.ok(Math.abs(beat * c.spb - at[key]) <= c.spb / 8, `${key} at ${at[key].toFixed(2)} s`);
});
