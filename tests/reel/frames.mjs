// Grab the reel canvas at native resolution for a list of times (dev review tool).
//   node tests/reel/frames.mjs <page-url> <out-dir> --width 1440 --times 0.5,1.5 [--mobile]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [base, outDir, ...rest] = process.argv.slice(2);
const opt = { width: 1440, height: 900, times: [0], mobile: false };
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === '--width') opt.width = Number(rest[++i]);
  else if (rest[i] === '--times') opt.times = rest[++i].split(',').map(Number);
  else if (rest[i] === '--mobile') opt.mobile = true;
}
mkdirSync(outDir, { recursive: true });
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9900 + Math.floor(Math.random() * 90);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'reel-frames-'))}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
try {
  let target;
  for (let i = 0; i < 50 && !target; i++) { await sleep(100); try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page'); } catch {} }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });
  let id = 0; const pending = new Map(), waiters = [];
  ws.onmessage = (m) => { const msg = JSON.parse(m.data); if (msg.id) pending.get(msg.id)?.(msg); if (msg.method) waiters.filter(w => w.method === msg.method).forEach(w => w.res(msg.params)); };
  const send = (method, params = {}) => new Promise(res => { const n = ++id; pending.set(n, m => res(m.result)); ws.send(JSON.stringify({ id: n, method, params })); });
  const once = (method) => new Promise(res => waiters.push({ method, res }));
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: opt.width, height: opt.height, deviceScaleFactor: 1, mobile: opt.mobile });
  for (const t of opt.times) {
    const loaded = once('Page.loadEventFired');
    await send('Page.navigate', { url: `${base}?reel=${t}` });
    await loaded; await sleep(250);
    const r = await send('Runtime.evaluate', { expression: "document.querySelector('.reel-canvas').toDataURL()", returnByValue: true });
    const png = r.result.value.split(',')[1];
    writeFileSync(join(outDir, `t${t.toFixed(2)}.png`), Buffer.from(png, 'base64'));
  }
  console.log(`wrote ${opt.times.length} frames to ${outDir}`);
  ws.close();
} finally { chrome.kill(); }
