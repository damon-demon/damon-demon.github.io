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
