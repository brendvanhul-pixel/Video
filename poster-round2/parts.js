const MMPX=96/25.4;
const ICONS={
  language:'<path d="M3 5h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3v-3H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="M5.5 13l2-5 2 5M6.2 11.4h2.6"/><path d="M19 9h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1v2.5L17 19h-4"/>',
  helmet:'<path d="M12 22s7-6.6 7-12.2a7 7 0 0 0-14 0C5 15.4 12 22 12 22z"/><path d="M9 9.8l2.1 2.1L15.2 8"/>',
  record:'<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V2.5h6V4"/><path d="M8.5 10l1.5 1.5 3-3M8.5 16l1.5 1.5 3-3M15 10.5h0M15 16.5h0"/>',
  pace:'<circle cx="12" cy="13" r="8.5"/><path d="M12 8.5V13l3 2"/><path d="M9.5 2.5h5"/>',
  show:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M9.5 12l2 2 3.5-4"/>'
};
function specs(host,items){host.innerHTML=items.map(([ic,t])=>`<div class="spec"><svg viewBox="0 0 24 24">${ICONS[ic]}</svg><span>${t}</span></div>`).join('');}
function qrs(host,labels){host.innerHTML=`<figure><img src="qr/android.svg"><figcaption>${labels[0]}</figcaption></figure><figure><img src="qr/ios.svg"><figcaption>${labels[1]}</figcaption></figure>`;}

function buildPhone(host,p,src){
  host.style.cssText+=`left:${p.x}mm;top:${p.y}mm;width:${p.w}mm;height:${p.h}mm;transform:rotate(${p.rot||0}deg)`;
  host.innerHTML=`<i class="lug" style="left:22%"></i><i class="lug" style="left:78%"></i>
    <span class="btn" style="left:-.8mm;top:19%;height:6%"></span><span class="btn" style="left:-.8mm;top:27%;height:9%"></span><span class="btn" style="left:-.8mm;top:38%;height:9%"></span><span class="btn" style="right:-.8mm;top:27%;height:13%"></span>
    <div class="glass"><span class="island"></span><img src="${src}" alt=""><span class="glare"></span></div>`;
}
// Drawn hook (img/hook.svg, viewBox 120x300). Returns rope tops and throat in mm.
function placeHook(el,x,y,w){
  el.style.cssText+=`position:absolute;left:${x}mm;top:${y}mm;width:${w}mm`;
  const s=w/120; return {ropes:[x+44*s,x+76*s], ropeTop:y, throat:[x+40*s,y+241*s], s};
}
function centerMM(el){const r=el.getBoundingClientRect(), o=el.closest('.poster').getBoundingClientRect();return [(r.left+r.width/2-o.left)/MMPX,(r.top+r.height/2-o.top)/MMPX];}
// Hoist ropes from the top edge, then master link, sling legs and shackles to the phone's lugs.
function rig(svg,hook,phoneEl,o={}){
  const NS='http://www.w3.org/2000/svg';
  const el=(n,a,p=svg)=>{const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);p.appendChild(e);return e;};
  const wire=(x1,y1,x2,y2,w,p)=>{el('line',{x1,y1,x2,y2,stroke:'#1d2125','stroke-width':w,'stroke-linecap':'round'},p);
    el('line',{x1:x1-w*.2,y1,x2:x2-w*.2,y2,stroke:'#8a939b','stroke-width':w*.22,'stroke-linecap':'round',opacity:.9},p);};
  const s=hook.s, top=o.ropeFrom??-5;
  hook.ropes.forEach(x=>wire(x,top,x,hook.ropeTop+20*s,o.ropeW||1.5,o.ropeLayer||svg));
  const [hx,hy]=hook.throat;
  const lugs=[...phoneEl.querySelectorAll('.lug')].map(centerMM);
  // master link seated in the hook bowl
  el('ellipse',{cx:hx,cy:hy+9*s,rx:8*s,ry:13*s,fill:'none',stroke:'#2d3238','stroke-width':3.4*s});
  el('ellipse',{cx:hx-.6*s,cy:hy+9*s,rx:8*s,ry:13*s,fill:'none',stroke:'#9aa2aa','stroke-width':.9*s});
  const ml=[hx,hy+21*s];
  lugs.forEach(([lx,ly])=>{
    wire(ml[0],ml[1],lx,ly-3,o.slingW||1.1);
    el('path',{d:`M${lx-1.9},${ly-.4} v-1.6 a1.9,1.9 0 0 1 3.8,0 v1.6`,fill:'none',stroke:'#c0392b','stroke-width':.9});
    el('line',{x1:lx-2.5,y1:ly-.3,x2:lx+2.5,y2:ly-.3,stroke:'#40464c','stroke-width':.8,'stroke-linecap':'round'});
  });
  if(o.tag){
    const t=.42,[lx,ly]=lugs[0], tx=ml[0]+(lx-ml[0])*t, ty=ml[1]+(ly-ml[1])*t;
    const g=el('g',{transform:`translate(${tx} ${ty}) rotate(${o.tagRot??10})`});
    el('line',{x1:0,y1:0,x2:-3,y2:3.5,stroke:'#333','stroke-width':.35},g);
    el('rect',{x:-17,y:3,width:15,height:8.4,rx:1,fill:'#F3E72A',stroke:'#14263F','stroke-width':.35},g);
    const tx1=el('text',{x:-9.5,y:6.6,'text-anchor':'middle','font-family':'Barlow Condensed','font-weight':800,'font-size':2.7,fill:'#14263F'},g);tx1.textContent=o.tag[0];
    const tx2=el('text',{x:-9.5,y:10,'text-anchor':'middle','font-family':'Barlow Condensed','font-weight':800,'font-size':3.1,fill:'#14263F'},g);tx2.textContent=o.tag[1];
  }
}
