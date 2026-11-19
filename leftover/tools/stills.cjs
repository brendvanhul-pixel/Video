// node stills.cjs <projectDir> <outDir> <scale> t1 t2 ...   -> outDir/tNNN.NN.png  (key frames before motion)
const fs = require('fs');
const { openStage } = require('./_page.cjs');
(async () => {
  const [dir, out, scale, ...ts] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const { browser, page } = await openStage(dir, +scale);
  for (const t of ts) {
    await page.evaluate(t => renderAt(t), +t);
    await page.screenshot({ path: `${out}/t${(+t).toFixed(2).padStart(6, '0')}.png` });
  }
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
