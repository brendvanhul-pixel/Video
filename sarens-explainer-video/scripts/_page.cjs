// shared: open a project's stage.html in headless Chromium and wait until the film is built
const { chromium } = require('playwright');
const path = require('path');
async function openStage(projectDir, scale = 1) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.resolve(projectDir, 'stage.html'));
  try { await page.waitForFunction('window.ready === true', null, { timeout: 30000 }); }
  catch (e) { throw new Error('stage did not become ready:\n' + errors.join('\n')); }
  if (errors.length) throw new Error('page errors:\n' + errors.join('\n'));
  const fontsOK = await page.evaluate(() => document.fonts.check('40px "Adobe Caslon Pro"') && document.fonts.check('500 40px Gotham'));
  if (!fontsOK) throw new Error('Sarens fonts did not load: a fallback face would render. Check the fonts/ folder.');
  return { browser, page };
}
module.exports = { openStage };
