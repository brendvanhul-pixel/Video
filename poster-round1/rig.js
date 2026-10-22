// Draws the rigging between a hook point and a phone in mm.
// rigPhone({svg, hook:[x,y], phone:{x,y,w,h,rot}, ropes:[[x1,y1,x2,y2],...], tag:"LOAD 0.2 KG", tagline:true})
function rigPhone(o){
  const s=o.svg, NS='http://www.w3.org/2000/svg';
  const el=(n,a)=>{const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);s.appendChild(e);return e;};
  const wire=(x1,y1,x2,y2,w)=>{ el('line',{x1,y1,x2,y2,stroke:'#1f2327','stroke-width':w,'stroke-linecap':'round'});
                                 el('line',{x1:x1-w*.18,y1,x2:x2-w*.18,y2,stroke:'#7c858d','stroke-width':w*.22,'stroke-linecap':'round'}); };
  (o.ropes||[]).forEach(r=>wire(...r,o.ropeW||1.9));
  const p=o.phone, cx=p.x+p.w/2, rad=(p.rot||0)*Math.PI/180;
  const rotPt=(x,y)=>{const dx=x-cx,dy=y-p.y;return [cx+dx*Math.cos(rad)-dy*Math.sin(rad), p.y+dx*Math.sin(rad)+dy*Math.cos(rad)];};
  const lugs=[rotPt(p.x+p.w*.2,p.y-3.2), rotPt(p.x+p.w*.8,p.y-3.2)];
  const [hx,hy]=o.hook, ml=[hx,hy+3];
  // master link
  el('ellipse',{cx:hx,cy:hy+1.5,rx:3.2,ry:4.6,fill:'none',stroke:'#c0392b','stroke-width':1.6});
  // sling legs + shackles + lugs
  lugs.forEach(([lx,ly],i)=>{
    wire(ml[0],ml[1]+2,lx,ly-3,o.slingW||1.4);
    el('path',{d:`M${lx-2.2},${ly} v-2.2 a2.2,2.2 0 0 1 4.4,0 v2.2`,fill:'none',stroke:'#d9a400','stroke-width':1.2});
    el('line',{x1:lx-3,y1:ly,x2:lx+3,y2:ly,stroke:'#555','stroke-width':1.1,'stroke-linecap':'round'});
    el('rect',{x:lx-2.6,y:ly,width:5.2,height:3.6,rx:.8,fill:'#e8c21c',stroke:'#8a7310','stroke-width':.35,transform:`rotate(${p.rot||0} ${lx} ${ly})`});
  });
  if(o.tag){ // load tag clipped to the left leg
    const t=.45, tx=ml[0]+(lugs[0][0]-ml[0])*t, ty=ml[1]+(lugs[0][1]-ml[1])*t;
    const g=el('g',{transform:`translate(${tx-1} ${ty}) rotate(8)`});
    const sub=(n,a,txt)=>{const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);if(txt)e.textContent=txt;g.appendChild(e);};
    sub('line',{x1:0,y1:0,x2:-4,y2:4,stroke:'#333','stroke-width':.4});
    sub('rect',{x:-20,y:3.5,width:17,height:9,rx:1,fill:'#F3E72A',stroke:'#14263F','stroke-width':.4});
    sub('text',{x:-11.5,y:7.4,'text-anchor':'middle','font-family':'Barlow Condensed','font-weight':800,'font-size':3,fill:'#14263F'},o.tag[0]);
    sub('text',{x:-11.5,y:11,'text-anchor':'middle','font-family':'Barlow Condensed','font-weight':800,'font-size':3.4,fill:'#14263F'},o.tag[1]);
  }
  if(o.tagline){ // loose tag line from the bottom corner, like the cord in the Switch poster
    const [bx,by]=rotPt(p.x+p.w*.15,p.y+p.h-1);
    el('path',{d:o.tagline(bx,by),fill:'none',stroke:'#e4572e','stroke-width':1.4,'stroke-linecap':'round'});
  }
}
function buildPhone(host,p,src){
  host.style.cssText+=`left:${p.x}mm;top:${p.y}mm;width:${p.w}mm;height:${p.h}mm;transform:rotate(${p.rot||0}deg);transform-origin:50% 0`;
  host.innerHTML=`<span class="btn" style="left:-.9mm;top:22%;height:7%"></span><span class="btn" style="left:-.9mm;top:31%;height:7%"></span><span class="btn" style="right:-.9mm;top:26%;height:11%"></span>
    <div class="glass"><span class="island"></span><img src="${src}" alt=""><span class="glare"></span></div>`;
}
