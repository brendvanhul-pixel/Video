// node export_sfx.cjs <projectDir>  -> <projectDir>/build/sfx.json (sound cues registered by the film) + text QA
// QA: every text element at rest must sit inside the 96 px margin and be at least the label size on screen.
const fs = require('fs'); const path = require('path');
const { openStage } = require('./_page.cjs');
(async () => {
  const dir = process.argv[2];
  const { browser, page } = await openStage(dir);
  const data = await page.evaluate(() => ({ sfx: window.SFX, duration: window.DURATION, voice: SR.voice, floor: SR.style('label').size }));
  fs.mkdirSync(path.join(dir, 'build'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'build', 'sfx.json'), JSON.stringify(data, null, 1));
  const snap = () => page.evaluate(() => [...document.querySelectorAll('#root text')].map((t, i) => {
    let n = t, vis = true;
    while (n && n.id !== 'root') { const cs = getComputedStyle(n); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) { vis = false; break; } n = n.parentNode; }
    const r = t.getBoundingClientRect(); const m = t.getScreenCTM(); const scale = Math.hypot(m.a, m.b);
    return { i, vis: vis && r.width > 1, x0: r.left, y0: r.top, x1: r.right, y1: r.bottom, px: parseFloat(t.getAttribute('font-size')) * scale, s: t.textContent.slice(0, 40) };
  }));
  const issues = new Map();
  for (let t = 0; t < data.duration; t += 0.5) {
    await page.evaluate(t => renderAt(t), t); const a = await snap();
    await page.evaluate(t => renderAt(t), t + 0.2); const b = await snap();
    a.forEach((e, k) => {
      const f = b[k]; if (!e.vis || !f.vis) return;
      if (Math.abs(e.x0 - f.x0) > 0.5 || Math.abs(e.y0 - f.y0) > 0.5 || Math.abs(e.px - f.px) > 0.2) return; // moving: not at rest
      const why = [];
      if (e.x0 < 94 || e.y0 < 94 || e.x1 > 1826 || e.y1 > 986) why.push('outside 96px margin');
      if (e.px < data.floor - 0.5) why.push(`${e.px.toFixed(1)}px < label floor ${data.floor}px`);
      if (why.length && !issues.has(e.s + why)) issues.set(e.s + why, `t=${t.toFixed(1)}s "${e.s}": ${why.join(', ')}`);
    });
  }
  console.log(`sfx cues: ${data.sfx.length}, voice: ${data.voice}, duration: ${data.duration}s`);
  if (issues.size) { console.log('TEXT QA WARNINGS:'); [...issues.values()].slice(0, 40).forEach(s => console.log('  ' + s)); }
  else console.log('text QA: all resting text inside margins and above the size floor');
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
