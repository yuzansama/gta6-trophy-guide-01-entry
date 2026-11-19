// Takes the screenshots in screenshots/ from the real app: serves app/, drives headless Chrome over the
// DevTools protocol (Node's built-in WebSocket, no dependency) and saves each view named in shots.json.
// The pictures are the browser's own renders, saved as it encodes them and never edited.
// Usage: node tools/capture-screenshots.mjs "<path to chrome>"

import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serveApp } from '../serve.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const plan = JSON.parse(readFileSync(join(root, 'shots.json'), 'utf8'));
const chromePath = process.argv[2] || process.env.CHROME_PATH;
const APP_PORT = 8098;
// A new port each run, so a Chrome left over from an earlier run is never the one that answers.
const DEBUG_PORT = 9500 + (process.pid % 400);
// Never hang: if Chrome stops answering, give up after a minute.
const giveUpAfterMs = 150000;
setTimeout(() => {
  console.error('capture timed out after a minute');
  stopChrome();
  process.exit(1);
}, giveUpAfterMs).unref();
const pause = (ms) => new Promise((done) => setTimeout(done, ms));

async function openDevToolsPage() {
  // A cold Chrome can take half a minute to open the port.
  for (let attempt = 0; attempt < 300; attempt++) {
    try {
      const pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
      const page = pages.find((candidate) => candidate.type === 'page');
      if (page) return connect(page.webSocketDebuggerUrl);
    } catch {}
    await pause(200);
  }
  throw new Error('Chrome did not open its DevTools port');
}

function connect(url) {
  const socket = new WebSocket(url);
  const waiting = new Map();
  let nextId = 1;
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (!waiting.has(message.id)) return;
    const { resolve, reject } = waiting.get(message.id);
    waiting.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    waiting.set(id, { resolve, reject });
    setTimeout(() => waiting.delete(id) && reject(new Error('no answer to ' + method)), 15000).unref();
    socket.send(JSON.stringify({ id, method, params }));
  });
  return new Promise((ready) => socket.addEventListener('open', () => ready({ send, close: () => socket.close() })));
}

async function inPage(page, expression) {
  const { result, exceptionDetails } = await page.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (exceptionDetails) throw new Error(exceptionDetails.text + ' in ' + expression);
  return result.value;
}

async function captureAll(page) {
  // Chrome was started on the app's address with a new, empty profile, so there is no saved progress yet.
  await page.send('Emulation.setDeviceMetricsOverride', { ...plan.viewport, deviceScaleFactor: 1, mobile: false });
  for (let attempt = 0; attempt < 30 && !(await inPage(page, `!!document.querySelector('.trophy-row')`)); attempt++) await pause(200);
  // Tick a few trophies the way a player would: by clicking their boxes. The app saves them to localStorage.
  for (const id of plan.earnFirst) await inPage(page, `document.querySelector('[data-trophy-id="${id}"] .earned-tick').click()`);

  mkdirSync(join(root, 'screenshots'), { recursive: true });
  for (const shot of plan.shots) {
    // A deep link: the app reads the view, filter and open trophy from the address.
    await inPage(page, `location.hash = ${JSON.stringify(shot.hash)}`);
    await pause(500);
    if (shot.spoilerShield) await inPage(page, `document.getElementById('spoiler-shield-toggle').click()`);
    if (shot.scrollToTrophy) await inPage(page, `document.querySelector('[data-trophy-id="${shot.scrollToTrophy}"]').scrollIntoView({ block: 'start' })`);
    await pause(400);
    const { data } = await page.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
    writeFileSync(join(root, 'screenshots', shot.file), Buffer.from(data, 'base64'));
    console.log('captured', shot.file);
  }
}

// On Windows chrome.kill() leaves Chrome's helper processes running, so end the whole tree there.
function stopChrome() {
  if (process.platform === 'win32') spawnSync('taskkill', ['/F', '/T', '/PID', String(chrome.pid)]);
  else chrome.kill();
}

if (!chromePath) throw new Error('Pass the path to Chrome as the first argument');
const profile = mkdtempSync(join(tmpdir(), 'leonida-shots-'));
const server = await serveApp(APP_PORT);
const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', `http://127.0.0.1:${APP_PORT}/`]);
try {
  const page = await openDevToolsPage();
  console.log('connected to Chrome');
  await captureAll(page);
  page.close();
} catch (error) {
  console.error('capture failed:', error.message);
  process.exitCode = 1;
} finally {
  stopChrome();
  server.close();
  await pause(500);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
// Chrome's helper processes can keep handles open on Windows; everything is written, so leave now.
process.exit();
