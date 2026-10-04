// Final checks on the real page, through headless Chrome: every shot plays without a console error,
// the page without JavaScript has no reel and no gap, and the page does not shift when the reel mounts.
// Usage: node tests/reel/qa.mjs http://127.0.0.1:8000/
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CHAPTERS } from '../../reel/story.js';
import { buildTimeline } from '../../reel/timeline.js';

const BASE = process.argv[2] || 'http://127.0.0.1:8000/';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9600 + Math.floor(Math.random() * 90);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'reel-qa-'))}`, 'about:blank'], { stdio: 'ignore' });
let failed = 0;
const report = (ok, name, detail = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} - ${name}${ok || !detail ? '' : ': ' + detail}`); if (!ok) failed = 1; };

try {
  let target;
  for (let i = 0; i < 50 && !target; i++) { await sleep(100); try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page'); } catch {} }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });
  let id = 0;
  const pending = new Map(), errors = [], waiters = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id) pending.get(msg.id)?.(msg.result);
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a => a.value ?? a.description).join(' '));
    if (msg.method) waiters.filter(w => w.method === msg.method).forEach(w => w.res());
  };
  const send = (method, params = {}) => new Promise(res => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
  const once = (method) => new Promise(res => waiters.push({ method, res }));
  const open = async (url, width) => {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 1100, deviceScaleFactor: 1, mobile: width < 600 });
    const loaded = once('Page.loadEventFired');
    await send('Page.navigate', { url });
    await loaded;
  };
  const value = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true })).result.value;
  await send('Page.enable'); await send('Runtime.enable');

  // every shot, looping on its own, at desktop and phone widths in turn; then the reel from the top
  const shots = buildTimeline(CHAPTERS).shots.map(e => e.shot.id);
  for (const [i, shot] of shots.entries()) { await open(`${BASE}?reel=${shot}`, i % 2 ? 390 : 1440); await sleep(600); }
  await open(`${BASE}#reel`, 1440); await sleep(3000);
  report(errors.length === 0, `all ${shots.length} shots play without a console error`, errors.join(' | '));

  // without JavaScript: no reel, and About straight under the hero
  await send('Emulation.setScriptExecutionDisabled', { value: true });
  await open(BASE, 1440); await sleep(300);
  const noJs = await value("({ reel: getComputedStyle(document.querySelector('#reel')).display, gap: Math.round(document.querySelector('#about').getBoundingClientRect().top - document.querySelector('header').getBoundingClientRect().bottom) })");
  report(noJs.reel === 'none' && noJs.gap <= 0, 'without JavaScript the reel is hidden and leaves no gap', JSON.stringify(noJs));
  await send('Emulation.setScriptExecutionDisabled', { value: false });

  // with JavaScript: About is where it was while the page was still loading
  await send('Page.addScriptToEvaluateOnNewDocument', { source: "document.addEventListener('DOMContentLoaded', () => { window.__aboutAt = document.querySelector('#about').getBoundingClientRect().top; });" });
  await open(BASE, 1440); await sleep(1500);
  const shift = await value("({ before: Math.round(window.__aboutAt), after: Math.round(document.querySelector('#about').getBoundingClientRect().top), buttons: document.querySelectorAll('.reel-ch').length })");
  report(shift.before === shift.after && shift.buttons === 5, 'the page does not shift when the reel mounts', JSON.stringify(shift));
  ws.close();
} finally {
  chrome.kill();
}
process.exit(failed);
