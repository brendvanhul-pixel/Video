// Exports poster.html as a print PDF (A3, scales to any A-size) and a 300 dpi A3 PNG.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'))); }
const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(dir, 'out'); fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1123, height: 1587 }, deviceScaleFactor: 3.125 });
await page.goto(pathToFileURL(path.join(dir, 'poster.html')).href);
await page.evaluate(async () => { await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
await page.locator('#poster').screenshot({ path: path.join(out, 'learn-anywhere-poster-A3.png') });
await page.pdf({ path: path.join(out, 'learn-anywhere-poster-A3.pdf'), width: '297mm', height: '420mm', printBackground: true, pageRanges: '1' });
await browser.close();
console.log('done');
