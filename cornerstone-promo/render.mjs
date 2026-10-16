// Renders index.html frame by frame and encodes an MP4 with ffmpeg.
// Usage: node render.mjs                -> out/cornerstone-learn-anywhere-9x16.mp4 + poster still
//        node render.mjs --still 26      -> out/still-26.png only
import { createRequire } from 'node:module';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'))); }

const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(dir, 'out');
fs.mkdirSync(out, { recursive: true });
const args = process.argv.slice(2);
const stillAt = args.includes('--still') ? +args[args.indexOf('--still') + 1] : null;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(dir, 'index.html')).href + '?render=1');
await page.evaluate(async () => { await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
const { FPS, DURATION } = await page.evaluate(() => ({ FPS: window.FPS, DURATION: window.DURATION }));

async function frameAt(t, type = 'png') {
  await page.evaluate(t => window.render(t), t);
  return page.screenshot({ type, ...(type === 'jpeg' ? { quality: 96 } : {}) });
}

if (stillAt !== null) {
  fs.writeFileSync(path.join(out, `still-${stillAt}.png`), await frameAt(stillAt));
} else {
  const file = path.join(out, 'cornerstone-learn-anywhere-9x16.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = Math.round(FPS * DURATION);
  for (let i = 0; i < total; i++) {
    const buf = await frameAt(i / FPS, 'jpeg');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) process.stdout.write(`frame ${i}/${total}\n`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  fs.writeFileSync(path.join(out, 'poster-end-card.png'), await frameAt(DURATION - 0.5));
  console.log('wrote', file);
}
await browser.close();
