// Fills [data-copy] elements from the COPY object, then fits headlines.
// A headline keeps its designed size unless a line is wider than its box;
// then it shrinks, never below the 40 mm cap-height floor (warns instead).
(function(){
  if(window.__DE) Object.assign(COPY, window.__DE);
  const CAP = {"Barlow Condensed":0.70, "Barlow":0.70};  // cap height / em
  const MM = 96/25.4;
  document.querySelectorAll('[data-copy]').forEach(el=>{
    const v = COPY[el.dataset.copy]; if(v==null) return;
    if(el.classList.contains('headline')){
      el.innerHTML = v.split('\n').map(l=>`<span class="ln">${l}</span>`).join('');
    } else el.innerHTML = v;  // copy may carry <b> for the two-tone payoff line
  });
  document.querySelectorAll('[data-copy-list]').forEach(el=>{
    el.innerHTML = COPY[el.dataset.copyList].map(t=>`<li>${t}</li>`).join('');
  });
  // Load every face explicitly: fonts.ready can resolve before a face is first requested.
  const faces = ['900 10px "Barlow Condensed"','800 10px "Barlow Condensed"','700 10px "Barlow Condensed"','600 10px "Barlow Condensed"',
                 '300 10px Barlow','400 10px Barlow','500 10px Barlow','600 10px Barlow','700 10px Barlow'];
  Promise.all(faces.map(f=>document.fonts.load(f, 'AÄÉ?'))).then(()=>document.fonts.ready).then(()=>{
    document.querySelectorAll('.headline').forEach(h=>{
      const fam = getComputedStyle(h).fontFamily.replace(/"/g,'').split(',')[0].trim();
      const ratio = CAP[fam] || 0.7;
      let size = parseFloat(getComputedStyle(h).fontSize);
      const min = 40*MM/ratio;
      const box = h.clientWidth;
      const widest = () => Math.max(...[...h.querySelectorAll('.ln')].map(s=>s.scrollWidth));
      while(widest() > box && size > min){ size -= 1; h.style.fontSize = size+'px'; }
      if(widest() > box){ h.classList.add('fit-warn'); console.warn('Headline too long for 40 mm cap height:', h.textContent); }
      h.dataset.capMm = (size*ratio/MM).toFixed(1);
    });
    if(window.afterFonts) window.afterFonts();
    document.body.dataset.ready = '1';
  });
  if(location.search.includes('guides')){
    document.querySelector('.poster').classList.add('guides');
    document.querySelector('.poster').insertAdjacentHTML('beforeend','<div class="trim"></div><div class="safe"></div>');
  }
})();
