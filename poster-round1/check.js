// Safe-area check + 30% copy-growth stress test (German-length strings).
// Run: NODE_PATH=$(npm root -g) node check.js
const { chromium } = require('playwright');
const DE = {
  'A1-language-photo': {headline:"Lerne in\ndeiner\nSprache.", support:["Jeder Kurs. Du wählst die Sprache selbst.","Auf deinem Handy, wo immer du arbeitest.","Auch Baustellen-Unterweisungen."], cta:"Scannen. App holen."},
  'B1-proof-photo': {headline:"Nachweis\nin der\nTasche.", support:["Mach deine Unterweisung, bevor du ankommst.","Alle deine Schulungen an einem Ort.","Der Vorarbeiter fragt? Zeig dein Handy."], cta:"Scannen. App holen."},
  'A2-language-marking': {headline:"Jeder\nKurs.\nDeine\nSprache.", support:["Wähle deine Sprache in der App.","Auf deinem Handy, wo immer du arbeitest.","Auch Baustellen-Unterweisungen."], cta:"Scannen. App holen."},
  'B2-proof-marking': {question:"Unterwiesen?", answer:"Steht auf\nmeinem Handy.", support:[["Unterweisung","Erledigt, bevor du ankommst"],["Alle Schulungen","An einem Ort"],["Vorarbeiter fragt","In Sekunden zeigen"]], cta:"Scannen. App holen.", record:"Mein Schulungsnachweis"}
};

const CHECK = () => {
  const MM=96/25.4, s=15*MM, W=303*MM, H=426*MM, bad=[];
  document.querySelectorAll('.headline .ln, .kicker, .support li, .record li, .cta, .qr-block, .langs, .logo-slot, .app').forEach(e=>{
    const q=e.getBoundingClientRect();
    const right = Math.max(q.right, q.left + (e.classList.contains('ln') ? e.scrollWidth : 0));
    if(q.left<s-0.5||q.top<s-0.5||right>W-s+0.5||q.bottom>H-s+0.5) bad.push(e.className+': '+e.textContent.slice(0,25));
  });
  const blocks=[...document.querySelectorAll('.headline,.record,.langs,.bottom')];
  const ov=[];
  for(let i=0;i<blocks.length;i++)for(let j=i+1;j<blocks.length;j++){
    const a=blocks[i].getBoundingClientRect(), c=blocks[j].getBoundingClientRect();
    if(a.left<c.right&&c.left<a.right&&a.top<c.bottom-1&&c.top<a.bottom-1) ov.push(blocks[i].className+' x '+blocks[j].className);
  }
  return {outsideSafe:bad, overlaps:ov, capMm:[...document.querySelectorAll('.headline')].map(h=>h.dataset.capMm), tooLong:document.querySelectorAll('.fit-warn').length};
};
(async()=>{
  const b = await chromium.launch();
  for (const n of Object.keys(DE)) for (const mode of ['en','de']) {
    const page = await b.newPage({viewport:{width:1146,height:1611}});
    await page.addInitScript(o=>{ window.__DE=o; }, mode==='de'?DE[n]:null);
    await page.goto('file://'+process.cwd()+'/'+n+'.html');
    await page.waitForSelector('body[data-ready="1"]');
    console.log(n, mode, JSON.stringify(await page.evaluate(CHECK)));
    if (mode==='de') await page.screenshot({path:`out/test-de-${n}.png`});
    await page.close();
  }
  await b.close();
})();
