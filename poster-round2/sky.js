// Sky: vertical gradient + hand-placed cumulus clouds (mm units).
// sky(host, {top, mid, bottom, clouds:[[x,y,width,seed],...]})
function sky(host,o){
  o=Object.assign({top:'#2a6aa6',mid:'#5b93c6',bottom:'#a8c8e2',clouds:[],cloud:['#ffffff','#f3f7fa','#b9cde0'],cloudOpacity:1},o);
  const id='s'+Math.random().toString(36).slice(2,7);
  let rnd=s=>()=>((s=Math.imul(s^s>>>15,2246822507)^Math.imul(s^s>>>13,3266489909),(s>>>0)/4294967296));
  const cloud=([cx,cy,w,seed])=>{
    const r=rnd(seed*7919+1); let c='';
    const n=Math.round(9+w/12);
    for(let i=0;i<n;i++){
      const t=i/(n-1), x=cx-w/2+w*t+(r()-.5)*w*.08;
      const hump=Math.sin(Math.PI*t);                 // taller in the middle
      const rad=w*(.07+.13*hump)*(.75+r()*.5);
      const y=cy-rad*.55-hump*w*.07*(r()+.4);
      c+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(1)}"/>`;
    }
    const top=cy-w*.42;
    return `<linearGradient id="${id}cg${seed}" gradientUnits="userSpaceOnUse" x1="0" y1="${top}" x2="0" y2="${cy}">
        <stop offset="0" stop-color="${o.cloud[0]}"/><stop offset=".55" stop-color="${o.cloud[1]}"/><stop offset="1" stop-color="${o.cloud[2]}"/></linearGradient>
      <clipPath id="${id}cl${seed}"><rect x="${cx-w}" y="${cy-w}" width="${2*w}" height="${w}"/></clipPath>
      <g filter="url(#${id}b)" opacity="${o.cloudOpacity}"><g clip-path="url(#${id}cl${seed})"><g fill="url(#${id}cg${seed})" filter="url(#${id}f)">${c}</g></g></g>`;
  };
  host.innerHTML=`<svg viewBox="0 0 303 426" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%">
  <defs>
    <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1">${(o.stops||[[0,o.top],[.55,o.mid],[1,o.bottom]]).map(([t,c])=>`<stop offset="${t}" stop-color="${c}"/>`).join('')}</linearGradient>
    <linearGradient id="${id}cg" gradientUnits="objectBoundingBox" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#f4f8fb"/><stop offset="1" stop-color="#bfd1e2"/></linearGradient>
    <filter id="${id}f" x="-20%" y="-30%" width="140%" height="160%">
      <feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="4" seed="4" result="t"/>
      <feDisplacementMap in="SourceGraphic" in2="t" scale="5" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feGaussianBlur in="d" stdDeviation=".6"/>
    </filter>
    <filter id="${id}b" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation=".7 1.1"/></filter>
  </defs>
  <rect width="303" height="426" fill="url(#${id}g)"/>
  ${o.clouds.map(cloud).join('')}
  </svg>`;
}
