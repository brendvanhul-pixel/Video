// Builds a round-2b poster from COPY (text) and L (layout). All sizes in mm.
const HOOK2={w:130,h:300,ropes:[46,78],seat:[58,250]};
function placeHook2(el,ropeCx,top,w){
  const s=w/HOOK2.w, x=ropeCx-62*s;
  el.style.cssText+=`position:absolute;left:${x}mm;top:${top}mm;width:${w}mm;z-index:${L.hookZ||4}`;
  return {ropes:HOOK2.ropes.map(r=>x+r*s), ropeTop:top, throat:[x+HOOK2.seat[0]*s, top+HOOK2.seat[1]*s], s};
}
function grain(host){
  host.innerHTML=`<svg viewBox="0 0 303 426" preserveAspectRatio="none" style="width:100%;height:100%"><filter id="gr" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="2.6" numOctaves="2" seed="11"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .9 -.25"/></filter>
    <rect width="303" height="426" filter="url(#gr)"/></svg>`;
}
function build(){
  const P=document.querySelector('.poster');
  P.insertAdjacentHTML('afterbegin',`
    <div class="layer" id="sky"></div>
    <svg class="layer" id="ropes" viewBox="0 0 303 426" style="z-index:3"></svg>
    <div class="logo" data-copy="logo" style="z-index:7"></div>
    <h1 class="headline" data-copy="headline" style="z-index:5"></h1>
    <div class="payoff" data-copy="payoff"></div>
    <img id="hook" src="img/hook2.svg" alt="">
    <div class="phone" id="phone" style="z-index:${L.phoneZ||6}"></div>
    <svg class="layer" id="rig" viewBox="0 0 303 426" style="z-index:${(L.phoneZ||6)+1}"></svg>
    <div class="band ${L.band||''}"><div class="appname" data-copy="appname"></div><div class="scan" data-copy="scan"></div>
      <div class="specs" id="specs"></div><div class="qrs" id="qrs"></div></div>
    <div class="grain" id="grain"></div>`);
  // real sky photo wins if img/sky.jpg exists; otherwise the drawn sky
  if(L.skyImg){  // real sky photo: position, colour grade, then depth fades so it sits with the brand blue
    const k=L.skyImg, el=document.getElementById('sky');
    const extra=(k.extra||[]).map(c=>`<img src="${c.src}" style="position:absolute;left:${c.x}mm;top:${c.y}mm;width:${c.w}mm;opacity:${c.opacity??1};transform:${c.flip?'scaleX(-1) ':''}rotate(${c.rot||0}deg)">`).join('');
    el.innerHTML=`<div style="position:absolute;inset:0;background:url(${k.src}) ${k.pos}/${k.size} no-repeat;filter:${k.filter||'none'};transform:${k.flip?'scaleX(-1)':'none'}"></div>
      ${extra}<div style="position:absolute;inset:0;background:${k.fade||'none'}"></div>`;
  } else sky(document.getElementById('sky'),L.sky);
  Object.assign(document.querySelector('.headline').style,L.headStyle);
  Object.assign(document.querySelector('.payoff').style,L.payoffStyle);
  Object.assign(document.querySelector('.logo').style,L.logoStyle||{});
  specs(document.getElementById('specs'),COPY.specs);
  qrs(document.getElementById('qrs'),COPY.stores);
  grain(document.getElementById('grain'));
  window.afterFonts=()=>{
    const H=placeHook2(document.getElementById('hook'),L.rope.x,L.hook.top,L.hook.w);
    const ph={w:L.phone.w,h:L.phone.h,rot:L.phone.rot,y:H.throat[1]+(L.phone.drop||24)};
    ph.x=H.throat[0]-ph.w/2;
    buildPhone(document.getElementById('phone'),ph,'img/app-home.jpg');
    rig(document.getElementById('rig'),H,document.getElementById('phone'),
        Object.assign({tag:COPY.tag,ropeLayer:document.getElementById('ropes'),ropeW:L.ropeW||1.7,slingW:L.slingW||1.1},L.rigOpts||{}));
  };
}
