// usage: node stills.js outdir scale t1 t2 ...
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [out, scale, ...ts] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: +scale });
  p.on('console', m => console.log('console:', m.text()));
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.goto('file://' + path.resolve('scene.html'));
  await p.waitForFunction('window.ready === true', null, { timeout: 20000 });
  for (const t of ts) {
    await p.evaluate(t => renderAt(t), +t);
    await p.screenshot({ path: `${out}/t${(+t).toFixed(2).padStart(5, '0')}.png` });
  }
  await b.close();
})();
