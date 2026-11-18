// node render.js startFrame endFrame(excl) subframes out.mkv
// Renders frames as pure functions of t; motion blur = average of N subframes over a 180-degree shutter.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
(async () => {
  const [f0, f1, sub, out] = [+process.argv[2], +process.argv[3], +process.argv[4], process.argv[5]];
  const fps = 30, shutter = 0.5 / fps;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.goto('file://' + path.resolve('scene.html'));
  await p.waitForFunction('window.ready === true', null, { timeout: 20000 });
  const vf = sub > 1 ? `tmix=frames=${sub},select='eq(mod(n\\,${sub})\\,${sub - 1})',setpts=N/(${fps}*TB)` : 'null';
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps * sub), '-i', '-',
    '-vf', vf, '-r', String(fps), '-c:v', 'libx264', '-qp', '0', '-preset', 'ultrafast', '-pix_fmt', 'yuv444p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const dur = await p.evaluate(() => window.DURATION);
  for (let f = f0; f < f1; f++) {
    for (let k = 0; k < sub; k++) {
      let t = f / fps + (sub > 1 ? (k / (sub - 1) - 0.5) * shutter : 0);
      t = Math.max(0, Math.min(dur - 1e-4, t));
      await p.evaluate(t => renderAt(t), t);
      const buf = await p.screenshot({ type: 'png' });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await b.close();
})();
