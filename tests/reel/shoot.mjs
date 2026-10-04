// Screenshot a page through the Chrome DevTools Protocol, for reviewing the reel by eye.
// Unlike `chrome --screenshot`, it can emulate a 390px phone, scroll to an element first,
// and emulate prefers-reduced-motion.
//
//   node tests/reel/shoot.mjs <url> <out.png> [--width 1440] [--height 900] [--mobile]
//        [--scroll '#reel'] [--reduced-motion] [--no-js] [--wait 1500]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, out, ...rest] = process.argv.slice(2);
if (!url || !out) { console.error('usage: shoot.mjs <url> <out.png> [options]'); process.exit(2); }
const opt = { width: 1440, height: 900, mobile: false, scroll: null, reduced: false, noJs: false, wait: 1500 };
for (let i = 0; i < rest.length; i++) {
  const a = rest[i];
  if (a === '--width') opt.width = Number(rest[++i]);
  else if (a === '--height') opt.height = Number(rest[++i]);
  else if (a === '--mobile') opt.mobile = true;
  else if (a === '--scroll') opt.scroll = rest[++i];
  else if (a === '--reduced-motion') opt.reduced = true;
  else if (a === '--no-js') opt.noJs = true;
  else if (a === '--wait') opt.wait = Number(rest[++i]);
  else { console.error(`unknown option ${a}`); process.exit(2); }
}

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333 + Math.floor(Math.random() * 500);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'reel-shoot-'))}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

try {
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    await sleep(100);
    try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page'); } catch {}
  }
  if (!target) throw new Error('Chrome did not start');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pending = new Map(), waiters = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method) waiters.filter(w => w.method === msg.method).forEach(w => w.resolve(msg.params));
  };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const n = ++id;
    pending.set(n, (msg) => (msg.error ? rej(new Error(`${method}: ${msg.error.message}`)) : res(msg.result)));
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  const once = (method) => new Promise(resolve => waiters.push({ method, resolve }));

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: opt.width, height: opt.height, deviceScaleFactor: 1, mobile: opt.mobile });
  if (opt.reduced) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  if (opt.noJs) await send('Emulation.setScriptExecutionDisabled', { value: true });
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url });
  await loaded;
  if (opt.scroll) {
    await send('Runtime.evaluate', { expression: `document.querySelector(${JSON.stringify(opt.scroll)}).scrollIntoView({ block: 'center' })` });
  }
  await sleep(opt.wait);
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(out, Buffer.from(data, 'base64'));
  console.log(`wrote ${out}`);
  ws.close();
} finally {
  chrome.kill();
}
