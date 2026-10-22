(async()=>{
// node render.js [names...]  -> out/<name>.png (with bleed), out/<name>-trim.png, out/<name>-15.png
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const names = process.argv.slice(2).length ? process.argv.slice(2)
  : fs.readdirSync('.').filter(f=>/^D\d.*\.html$/.test(f)).map(f=>f.replace('.html',''));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport:{ width:1146, height:1611 }, deviceScaleFactor:2.5 });
page.on('console', m => console.log('  console:', m.text()));
for (const n of names){
  await page.goto('file://'+process.cwd()+'/'+n+'.html');
  await page.waitForSelector('body[data-ready="1"]');
  const caps = await page.$$eval('.headline', hs=>hs.map(h=>h.dataset.capMm));
  await page.screenshot({ path:`out/${n}.png`, clip:{x:0,y:0,width:1145.2,height:1610.1} });
  console.log(n, 'headline cap mm:', caps.join(', '));
}
await browser.close();
execFileSync('python3', ['post.py', ...names], { stdio:'inherit' });
})();
