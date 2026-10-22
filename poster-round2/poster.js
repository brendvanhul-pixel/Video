// Builds a round-2b poster from COPY (text) and L (layout). All sizes in mm.
const HOOK2={src:'img/hook3.svg',w:145,h:300,rc:74,ropes:[54,94],seat:[70,263],ropeEnd:30};
function placeHook2(el,ropeCx,top,w){
  const s=w/HOOK2.w, x=ropeCx-HOOK2.rc*s;
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
    <img id="hook" src="${HOOK2.src}" alt="">
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
    // hoist rope from the top edge into the block, drawn with the same strand lay as the hook drawing
    const R=document.getElementById('ropes'), rw=5*H.s;
    R.innerHTML=`<defs><pattern id="lay" width="${3*H.s}" height="${3*H.s}" patternUnits="userSpaceOnUse" patternTransform="rotate(-62)">
      <rect width="${3*H.s}" height="${3*H.s}" fill="#30353a"/><rect width="${1.3*H.s}" height="${3*H.s}" fill="#8e979f"/><rect x="${.2*H.s}" width="${.45*H.s}" height="${3*H.s}" fill="#d2d8dd"/></pattern>
      <linearGradient id="rsh" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".35" stop-color="#fff" stop-opacity=".12"/><stop offset=".7" stop-color="#000" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient></defs>`+
      H.ropes.map(x=>`<rect x="${x-rw/2}" y="-5" width="${rw}" height="${H.ropeTop+HOOK2.ropeEnd*H.s+5}" fill="url(#lay)"/><rect x="${x-rw/2}" y="-5" width="${rw}" height="${H.ropeTop+HOOK2.ropeEnd*H.s+5}" fill="url(#rsh)"/>`).join('');
    rig(document.getElementById('rig'),Object.assign({},H,{ropes:[]}),document.getElementById('phone'),
        Object.assign({tag:COPY.tag,slingW:L.slingW||1.1},L.rigOpts||{}));
  };
}
