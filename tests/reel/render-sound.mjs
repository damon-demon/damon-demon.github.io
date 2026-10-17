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
  for (let i = 0; i < 150 && !target; i++) { await sleep(100); try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page'); } catch {} }
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
