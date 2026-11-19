// node render.cjs <projectDir> <startFrame> <endFrame(excl)> <subframes> <out.mkv>
// Each output frame = average of N sub-frames across a 180-degree shutter (motion blur). Lossless chunk.
const { spawn } = require('child_process');
const { openStage } = require('./_page.cjs');
(async () => {
  const [dir, f0, f1, sub, out] = [process.argv[2], +process.argv[3], +process.argv[4], +process.argv[5], process.argv[6]];
  const fps = 30, shutter = 0.5 / fps;
  const { browser, page } = await openStage(dir);
  const dur = await page.evaluate(() => window.DURATION);
  const vf = sub > 1 ? `tmix=frames=${sub},select='eq(mod(n\\,${sub})\\,${sub - 1})',setpts=N/(${fps}*TB)` : 'null';
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps * sub), '-i', '-',
    '-vf', vf, '-r', String(fps), '-c:v', 'libx264', '-qp', '0', '-preset', 'ultrafast', '-pix_fmt', 'yuv444p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = f0; f < f1; f++) {
    for (let k = 0; k < sub; k++) {
      const t = Math.max(0, Math.min(dur - 1e-4, f / fps + (sub > 1 ? (k / (sub - 1) - 0.5) * shutter : 0)));
      await page.evaluate(t => renderAt(t), t);
      const buf = await page.screenshot({ type: 'png' });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
