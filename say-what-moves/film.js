/* Say what moves, version 2: refresher that plays two weeks after the course (Group Talent learning piece -> Caslon, rule 4).
 * Hero: the harbour costing, a yellow tile on the week rail. Cold open with plain tiles; it is shoved off, becomes the title,
 * flies back up and the rail rebuilds with labels and owners. Office, freeze on "What do you say?", two wrong answers,
 * rewind, the controller's sentence, the owner says no, the clash, Nadia at a client, puzzle vs plan, callback.
 * Layers: scenes < under (wipe behind the rail) < rail < dim (freeze) < hero + white tile < hand < wipes < captions.
 */
window.FILM = async function (SR, tl, root, T, cues) {
  const { C, W, H, FR, el, place, anim, rect, circle, path, stroke } = SR;
  const k = SR.kit(tl);
  const stL = SR.style('label'), stB = SR.style('body'), stT = SR.style('title'), stD = SR.style('display');

  /* ---------- geometry of the week rail (same size in every scene) ---------- */
  const STEP = 234, X0 = 245, RY = 176, HY = 352;
  const sx = i => X0 + 110 + i * STEP;
  const FRI = sx(4), MONX = X0 + 4 * STEP + 220 + 40 + 110;

  const scenes = el('g', {}, root);
  const underL = el('g', {}, root);
  const hookTilt = el('g', {}, root);
  const zoomL = el('g', {}, hookTilt);
  const railL = anim(zoomL);
  const dimL = el('g', {}, zoomL);
  const heroL = anim(zoomL);
  const fxL = el('g', {}, root);
  const wipeL = el('g', {}, root);
  const capL = el('g', {}, root);

  function life(c, o) {
    const tmf = o.tm || (t => t), side = o.side || 1, offs = o.seed || 0;
    SR.onTick(t => {
      const u = tmf(t);
      const talk = SR.inWins(t, o.talk), listen = SR.inWins(t, o.listen), shake = SR.inWins(t, o.shake, 0.1);
      const ph = ((u + offs) % 2.9 + 2.9) % 2.9, bl = ph < 0.12 ? 1 - Math.sin(ph / 0.12 * Math.PI) * 0.9 : 1;
      const bob = Math.sin((u + offs) * Math.PI) * 3 + talk * Math.sin(u * 4 * Math.PI) * 4 + listen * Math.max(0, Math.sin(u * 2 * Math.PI * 0.8)) * 6;
      const tilt = talk * Math.sin(u * 2 * Math.PI) * 4 + listen * side * 6 + shake * Math.sin(t * 2 * Math.PI * 3.2) * 15;
      c.head.setAttribute('transform', `translate(0,${bob}) rotate(${tilt})`);
      c.eyes.setAttribute('transform', `translate(0,${4 * (1 - bl)}) scale(1,${bl})`);
      c.mouth.setAttribute('transform', `scale(1,${1 + talk * (0.5 + 0.5 * Math.sin(u * 2 * Math.PI * 4.2)) * 1.2})`);
      c.body.setAttribute('transform', `translate(0,${Math.sin((u + offs) * Math.PI) * 2})`);
      const g = talk * (0.6 + 0.4 * Math.sin(u * 2 * Math.PI * 1.1));
      SR.setArms(c, side > 0 ? g : 0, side > 0 ? 0 : g);
    });
  }
  // life time: frozen on "What do you say?", frozen at the end of take 2, then runs backwards through the rewind
  const F1 = T.freeze1, F1e = T.take1, FZ = T.freeze, RW = T.rewind, RWe = T.rewound, sh = F1e - F1;
  const warp = t => t < F1 ? t : t < F1e ? F1 : t < FZ ? t - sh : t < RW ? FZ - sh : t < RWe ? FZ - sh - (t - RW) * 2 : FZ - sh - (RWe - RW) * 2 + (t - RWe);
  const squashG = (g, at, amt = 0.2) => { tl.to(g, { scaleX: 1 + amt, scaleY: 1 - amt, duration: 0.05, ease: 'power2.out' }, at - 0.03); tl.to(g, { scaleX: 1, scaleY: 1, duration: 0.55, ease: 'elastic.out(1.1,0.3)' }, at + 0.02); };
  const antic = (g, at, lead = 0.12) => { tl.to(g, { scaleX: 1.12, scaleY: 0.86, duration: lead - 0.02, ease: 'power2.out' }, at - lead); tl.to(g, { scaleX: 0.92, scaleY: 1.1, duration: 0.1, ease: 'power2.out' }, at - 0.02); tl.to(g, { scaleX: 1, scaleY: 1, duration: 0.2 }, at + 0.1); };
  const arc = (pos, at, dur, x, y, apex) => {
    tl.to(pos, { x, duration: dur, ease: 'power1.inOut' }, at);
    tl.to(pos, { keyframes: [{ y: apex, duration: dur * 0.45, ease: 'power2.out' }, { y, duration: dur * 0.55, ease: 'power2.in' }] }, at);
  };
  const twoLines = (g, a, b, ink) => { SR.textEl(g, a, 0, -9, stL, ink, 'middle'); SR.textEl(g, b, 0, 29, stL, ink, 'middle'); };

  /* ================= RAIL ================= */
  const panel = rect(railL, 181, 92, 1558, 224, C.deep);
  const trackG = anim(railL); rect(trackG, X0 - 24, RY + 56, 4 * STEP + 220 + 48, 12, C.deepBand, 6);
  const dayL = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, i) => { const g = anim(place(railL, sx(i), RY + 108)); SR.textEl(g, d, 0, 0, stL, C.tint, 'middle'); gsap.set(g, { scale: 0 }); return g; });
  const monNext = anim(place(railL, MONX, RY));
  rect(monNext, -134, 56, 268, 12, C.deepBand, 6);
  el('rect', { x: -110, y: -48, width: 220, height: 96, rx: 14, fill: 'none', stroke: C.tint, 'stroke-width': 6, 'stroke-dasharray': '16 12' }, monNext);
  SR.textEl(monNext, 'Next Mon', 0, 108, stL, C.tint, 'middle');
  gsap.set(monNext, { scale: 0 });
  // four jobs: the monthly report spans Mon-Tue
  const jobs = [
    { x: sx(0), w: 220, fill: C.blue, lab: g => twoLines(g, 'Monthly', 'report', C.white) },
    { x: sx(1), w: 220, fill: C.blue, lab: g => twoLines(g, 'Monthly', 'report', C.white) },
    { x: sx(2), w: 220, fill: C.tint, lab: g => twoLines(g, 'Cost', 'update', C.deep) },
    { x: sx(3), w: 220, fill: C.grey, lab: g => SR.textEl(g, 'Admin', 0, 11, stL, C.deep, 'middle') }
  ];
  const tiles = jobs.map(j => {
    const g = anim(railL); rect(g, -j.w / 2, -48, j.w, 96, j.fill, 14);
    const lab = anim(g); j.lab(lab); gsap.set(lab, { scale: 0 });
    gsap.set(g, { x: j.x, y: RY, transformOrigin: '50% 100%' }); return { g, lab, x: j.x };
  });
  // owner figures and names (only while the rail is rebuilt mid-frame)
  const fig = (x, color, name) => {
    const g = anim(place(railL, x, RY - 48));
    circle(g, 0, -60, 15, color); path(g, 'M-22,-2 V-28 A14,14 0 0 1 -8,-42 H8 A14,14 0 0 1 22,-28 V-2 Z', color);
    SR.textEl(g, name, 0, -94, stL, C.white, 'middle');
    gsap.set(g, { scale: 0 }); return g;
  };
  const figs = [fig((sx(0) + sx(1)) / 2, C.blue, 'Bridge PM'), fig(sx(2), C.tint, 'Nadia \u00B7 your manager'), fig(sx(3), C.grey, 'You'), fig(FRI, C.yellow, 'Harbour PM')];

  /* ================= HERO (harbour costing) + WHITE TILE (the new request) ================= */
  const hero = { pos: anim(heroL) };
  hero.popg = anim(hero.pos); hero.tip = anim(hero.popg); hero.rot = anim(hero.tip);
  hero.bob = el('g', {}, hero.rot); hero.sq = anim(hero.bob); hero.jit = el('g', {}, hero.sq);
  hero.mainG = anim(hero.jit);
  path(hero.mainG, 'M-96,-48 H72 V48 H-96 A14,14 0 0 1 -110,34 V-34 A14,14 0 0 1 -96,-48 Z', C.yellow);
  hero.slice = anim(hero.sq);
  path(hero.slice, 'M70,-48 H96 A14,14 0 0 1 110,-34 V34 A14,14 0 0 1 96,48 H70 Z', C.yellow);
  const greyHalf = path(hero.jit, 'M0,-48 H96 A14,14 0 0 1 110,-34 V34 A14,14 0 0 1 96,48 H0 Z', C.grey); gsap.set(greyHalf, { autoAlpha: 0 });
  hero.lab = anim(hero.jit); twoLines(hero.lab, 'Harbour', 'costing', C.deep); gsap.set(hero.lab, { scale: 0 });
  hero.lab1 = anim(hero.jit); SR.textEl(hero.lab1, 'Harbour costing', 0, 11, stL, C.deep, 'middle'); gsap.set(hero.lab1, { autoAlpha: 0 });
  const crack = stroke(hero.jit, 'M-18,-48 L-4,-22 L-24,2 L-2,24 L-14,48', C.deep, 6);
  const CL = crack.getTotalLength(); crack.setAttribute('stroke-dasharray', CL); crack.setAttribute('stroke-dashoffset', CL);
  gsap.set(hero.tip, { transformOrigin: '0% 100%' }); gsap.set(hero.rot, { transformOrigin: '50% 50%' });
  gsap.set(hero.sq, { transformOrigin: '50% 100%' }); gsap.set(hero.mainG, { transformOrigin: '50% 50%' });
  gsap.set(hero.pos, { x: FRI, y: RY + HY });

  const wt = { pos: anim(heroL) };
  wt.popg = anim(wt.pos); wt.size = anim(wt.popg); wt.rot = anim(wt.size); wt.sq = anim(wt.rot); wt.jit = el('g', {}, wt.sq);
  wt.bodyG = anim(wt.jit); rect(wt.bodyG, -110, -48, 220, 96, C.white, 14);
  wt.lab = anim(wt.jit); SR.textEl(wt.lab, 'Tender', 0, 11, stL, C.deep, 'middle'); gsap.set(wt.lab, { scale: 0 });
  gsap.set([wt.size, wt.rot, wt.bodyG], { transformOrigin: '50% 50%' }); gsap.set(wt.sq, { transformOrigin: '50% 100%' });
  gsap.set(wt.pos, { x: -200, y: RY + HY });

  /* ================= SCENE 1: COLD OPEN (blue-deep), plain tiles ================= */
  const hookS = el('g', {}, scenes);
  rect(hookS, 0, 0, W, H, C.deep);
  const floor = anim(hookS); rect(floor, 0, 820, W, 260, C.deepRaised); gsap.set(floor, { y: 1080 });
  const tW = SR.words(hookS, 'Say what moves', 960, 600, stD, C.white, { align: 'center' });
  // the rail without its Next Mon slot spans 245..1401: centre it (x +137) for the cold open and the rebuild
  const CX = 137;
  gsap.set(railL, { x: CX, y: HY }); gsap.set(heroL, { x: CX });
  // frame 0: the white tile is already travelling at full speed; it hits the row on frame 10
  tl.fromTo(wt.pos, { x: -130 }, { x: sx(0) - STEP, duration: T.shove, ease: 'none', immediateRender: false }, 0);
  tl.to(wt.pos, { x: sx(0), duration: 0.25, ease: 'power2.out' }, T.shove);
  squashG(wt.sq, T.shove, -0.14);
  SR.sfx(0, 'whoosh', { dur: T.shove, rise: true, lo: 150, hi: 1400, gain: 0.4 });
  SR.sfx(T.shove, 'thunk', { gain: 0.55 });
  // the impact runs down the row, two frames a tile, each squashing wide
  tiles.forEach((o, i) => {
    const at = T.shove + i * 2 * FR;
    tl.to(o.g, { x: o.x + STEP, duration: 0.25, ease: 'power2.out' }, at);
    tl.to(o.g, { keyframes: [{ scaleX: 1.08, scaleY: 0.94, duration: 0.06 }, { scaleX: 1, scaleY: 1, duration: 0.45, ease: 'elastic.out(1,0.35)' }] }, at);
    SR.sfx(at, 'tick', { pitch: 900 + 120 * i, gain: 0.25, pan: -0.7 + 0.3 * i });
  });
  // the end tile overshoots the edge, hangs four frames, tips and drops
  const hAt = T.shove + 4 * 2 * FR;
  tl.to(hero.pos, { x: FRI + 165, duration: 0.2, ease: 'power3.out' }, hAt);
  tl.to(hero.sq, { keyframes: [{ scaleX: 1.08, scaleY: 0.94, duration: 0.06 }, { scaleX: 1, scaleY: 1, duration: 0.3 }] }, hAt);
  SR.sfx(hAt, 'tick', { pitch: 1500, gain: 0.3, pan: 0.6 });
  tl.to(hero.tip, { keyframes: [{ rotation: 6, duration: 4 * FR, ease: 'sine.inOut' }, { rotation: 88, duration: 0.3, ease: 'power2.in' }] }, T.tip);
  SR.sfx(T.tip + 4 * FR, 'tick', { pitch: 700, gain: 0.3, pan: 0.6 });
  tl.to(hero.pos, { y: 1320, x: '+=90', duration: T.fallOut - (T.tip + 0.3), ease: 'power2.in' }, T.tip + 0.3);
  SR.sfx(T.tip + 0.3, 'whoosh', { dur: 0.4, rise: false, lo: 2000, hi: 400, gain: 0.3, pan: 0.6 });
  SR.sfx(T.thud, 'thunk', { gain: 0.26, pan: 0.4 });
  tl.to(railL, { y: HY - 1080, duration: 0.8, ease: 'power2.inOut' }, T.tilt);
  tl.to(wt.pos, { y: RY + HY - 1080, duration: 0.8, ease: 'power2.inOut' }, T.tilt);
  tl.to(floor, { y: 0, duration: 0.8, ease: 'power2.inOut' }, T.tilt);
  SR.sfx(T.tilt, 'whoosh', { dur: 0.8, rise: false, lo: 300, hi: 1500, gain: 0.25 });
  tl.set(hero.tip, { rotation: 0 }, T.tilt - 0.05);
  tl.set(hero.rot, { rotation: 180 }, T.tilt - 0.05);
  tl.set(hero.pos, { x: 1480 - CX, y: 772 + 1080 }, T.tilt - 0.05);
  tl.to(hero.pos, { y: 772, duration: 0.8, ease: 'power2.inOut' }, T.tilt);
  // it lands with the floor and rocks once
  tl.to(hero.rot, { keyframes: [{ rotation: 186, duration: 0.18, ease: 'power2.out' }, { rotation: 180, duration: 0.6, ease: 'elastic.out(1,0.35)' }] }, T.tilt + 0.8);
  const hopAt = T.flip - 0.45;
  antic(hero.sq, hopAt);
  arc(hero.pos, hopAt, 0.45, 960 - CX, 690, 520);
  tl.to(hero.rot, { rotation: 360, duration: 0.45, ease: 'power2.inOut' }, hopAt);
  SR.sfx(hopAt - 0.02, 'whoosh', { dur: 0.4, rise: false, lo: 500, hi: 3500, gain: 0.3 });
  squashG(hero.sq, T.flip, 0.25); SR.sfx(T.flip, 'pop', { pitch: 360, gain: 0.4 });
  tl.set(hero.rot, { rotation: 0 }, T.flip + 0.7);
  k.popWords(tW.groups, T.titleIn, { stagger: 3 * FR, dur: 0.5 });
  tl.to(tW.groups[1], { keyframes: [{ y: 5, duration: 0.05 }, { y: 0, duration: 0.5, ease: 'elastic.out(1,0.3)' }] }, T.flip + 0.02);
  // the camera leans in on the floor and the title (the hero rides along in the same frame)
  SR.onTick(t => { const u = SR.smooth((t - T.tilt - 0.8) / (T.toRebuild + 0.9 - T.tilt - 0.8)) * (1 - SR.smooth((t - T.toRebuild - 0.1) / 0.8)); const sc = 1 + 0.05 * u; const tr = `translate(960,620) scale(${sc}) translate(-960,-620)`; hookS.setAttribute('transform', tr); hookTilt.setAttribute('transform', t > T.tilt + 0.7 && t < T.toRebuild + 0.95 ? tr : ''); });

  /* ================= 8.8-18.3: the tile flies back up, the rail rebuilds with labels and owners ================= */
  const RB = T.toRebuild;
  k.outWords(tW.groups, RB);
  // offscreen, the shoved row quietly returns to its slots and the white tile leaves
  tiles.forEach(o => tl.set(o.g, { x: o.x }, RB));
  tl.set(wt.pos, { x: -200, y: RY + HY }, RB);
  tl.to(railL, { y: HY, duration: 0.8, ease: 'power2.inOut' }, RB + 0.1);
  tl.to(floor, { y: 1080, duration: 0.8, ease: 'power2.inOut' }, RB + 0.1);
  SR.sfx(RB + 0.1, 'whoosh', { dur: 0.8, rise: true, lo: 300, hi: 2500, gain: 0.3 });
  antic(hero.sq, RB + 0.2);
  arc(hero.pos, RB + 0.2, T.rebuildLand - RB - 0.2, FRI, RY + HY, 300);
  tl.to(hero.rot, { rotation: -360, duration: T.rebuildLand - RB - 0.2, ease: 'power2.inOut' }, RB + 0.2);
  tl.set(hero.rot, { rotation: 0 }, T.rebuildLand + 0.6);
  squashG(hero.sq, T.rebuildLand, 0.25); SR.sfx(T.rebuildLand, 'pop', { pitch: 520, gain: 0.5, pan: 0.35 });
  dayL.forEach((g, i) => k.pop(g, T.rebuildLand + 0.2 + i * 2 * FR, { origin: '50% 100%', sfx: false }));
  // each tile gets its label and owner, one by one, with a light tick
  const labelTimes = [T.labels, T.labels + 0.75, T.labels + 1.5, T.labels + 2.25];
  [[tiles[0].lab, tiles[1].lab], tiles[2].lab, tiles[3].lab, hero.lab].forEach((lab, i) => {
    k.pop(lab, labelTimes[i], { ease: 'popBig', sfx: false });
    k.pop(figs[i], labelTimes[i] + 0.12, { origin: '50% 100%', ease: 'popBig', sfx: false });
    SR.sfx(labelTimes[i], 'tick', { pitch: 1700 + 150 * i, gain: 0.35, pan: -0.6 + 0.4 * i });
    SR.sfx(labelTimes[i] + 0.12, 'pop', { pitch: 500 + 80 * i, gain: 0.2, pan: -0.6 + 0.4 * i });
  });
  // a slow glide along the rail while the labels are read
  const G0 = T.labels - 0.4, TO_ = T.toOffice;
  SR.onTick(t => {
    const up = SR.smooth((t - G0) / 4.5), down = SR.smooth((t - TO_) / 0.6);
    const sc = 1 + 0.12 * up * (1 - down), pan = (-60 * up - 140 * SR.smooth((t - G0 - 4.5) / 3.5)) * (1 - down);
    zoomL.setAttribute('transform', `translate(${960 + pan},528) scale(${sc}) translate(-960,-528)`);
  });
  // into the office: figures fold, a blue block rises behind the rail while the rail rises to the top
  const TO = T.toOffice;
  figs.forEach((f, i) => k.unpop(f, TO - 0.3 + i * FR, { origin: '50% 100%', dur: 0.2 }));
  tl.to([railL, heroL], { x: 0, duration: 0.6, ease: 'power3.inOut' }, TO);
  tl.to(railL, { y: 0, duration: 0.6, ease: 'power3.inOut' }, TO);
  tl.to(hero.pos, { y: RY, duration: 0.6, ease: 'power3.inOut' }, TO);
  const mid1 = k.blockWipe(underL, TO, { dir: 'up', color: C.blue, dur: 0.6 });

  /* ================= SCENE 2: OFFICE (blue-301 wall) ================= */
  const offS = el('g', {}, scenes); gsap.set(offS, { autoAlpha: 0 });
  const cam = anim(offS);
  rect(cam, -400, -400, W + 800, H + 800, C.blue);
  const night = rect(cam, -400, -400, W + 800, H + 800, C.deepRaised); gsap.set(night, { autoAlpha: 0 });
  const clockA = anim(place(cam, 200, 440));
  circle(clockA, 0, 0, 58, C.white);
  [0, 90, 180, 270].forEach(a => rect(clockA, -4, -50, 8, 12, C.tint, 4).setAttribute('transform', `rotate(${a})`));
  const hHand = el('g', {}, clockA); rect(hHand, -5, -30, 10, 36, C.deep, 5);
  const mHand = el('g', {}, clockA); rect(mHand, -4, -44, 8, 50, C.deep, 4);
  const sHand = el('g', {}, clockA); rect(sHand, -2, -48, 4, 56, C.blue, 2);
  circle(clockA, 0, 0, 8, C.deep);
  const clockLab = anim(place(cam, 200, 568)); const clockTx = SR.textEl(clockLab, 'Thu 15:00', 0, 0, stB, C.white, 'middle');
  [clockA, clockLab].forEach(g => gsap.set(g, { scale: 0 }));
  const DAY = 1440, M15 = 900;
  const clockKeys = [[34.2, 34.8, M15, DAY + 1020], [T.take2, T.take2, M15, M15], [40.1, 40.1, 1320, 1320], [41.0, 41.0, DAY + 450, DAY + 450], [44.1, 45.5, DAY + 450, M15], [62.25, 62.25, 920, 920]];
  const clockMin = t => { let m = M15; for (const [a, b, m0, m1] of clockKeys) { if (t < a) break; m = t >= b ? m1 : SR.lerp(m0, m1, SR.smooth((t - a) / (b - a))); } return m; };
  SR.onTick(t => {
    const m = clockMin(t), mm = Math.floor(m) % 60, hh = Math.floor(m / 60) % 24;
    clockTx.textContent = `${m >= DAY ? 'Fri' : 'Thu'} ${hh}:${String(mm).padStart(2, '0')}`;
    mHand.setAttribute('transform', `rotate(${(m % 60) * 6})`);
    hHand.setAttribute('transform', `rotate(${((m / 60) % 12) * 30})`);
    const wv = warp(t), sec = Math.floor(wv), fr = SR.clamp((wv - sec) / 0.08, 0, 1);
    sHand.setAttribute('transform', `rotate(${(sec + fr) * 6})`);
  });
  [[34.2, 34.8], [44.1, 45.5]].forEach(([a, b]) => { for (let s = a; s < b; s += 0.08) SR.sfx(s, 'tick', { pitch: 1700, gain: 0.12, pan: -0.7 }); });
  [40.1, 41.0, 62.25].forEach(s => SR.sfx(s, 'tick', { pitch: 1400, gain: 0.25, pan: -0.7 }));
  // glass wall with the harbour project manager
  const winA = anim(cam);
  const win = SR.props.window(winA, 1380, 400, 360, 300, { sky: C.deep, frame: C.deepBand });
  const agenda = anim(place(win.inner, 70, 70)); rect(agenda, -40, -46, 80, 96, C.white, 4); [-26, -8, 10, 28].forEach(y => rect(agenda, -28, y, y === -26 ? 40 : 56, 7, C.tint, 3)); gsap.set(agenda, { scale: 0 });
  const pmG = place(win.inner, 180, 300, 'scale(0.45)');
  const pm = SR.character(pmG, 0, 0, { shirt: C.blue, sleeve: C.deepBand, skin: SR.SKIN[2], helmet: C.yellow });
  rect(win.inner, 30, 262, 300, 38, C.deepBand);
  const pmPhone = anim(place(win.inner, 224, 176)); rect(pmPhone, -10, -18, 20, 36, C.white, 4); gsap.set(pmPhone, { scale: 0 });
  const fallen = anim(place(win.inner, 270, 250)); rect(fallen, -30, -12, 60, 24, C.yellow, 5); gsap.set(fallen, { scale: 0, rotation: 12 });
  gsap.set(winA, { scale: 0 });
  const pmLab = SR.words(cam, 'Harbour PM', 1560, 776, stL, C.grey, { align: 'center' });
  // people
  const ctrl = SR.character(cam, 600, 860, { shirt: C.grey, sleeve: C.tint, skin: SR.SKIN[1], hair: 'side', hairColor: SR.HAIR[1] });
  const dirMove = anim(cam);
  const dir = SR.character(dirMove, 1010, 860, { shirt: C.white, sleeve: C.grey, skin: SR.SKIN[3], hair: 'short', collar: 'tie', tieColor: C.deep });
  gsap.set([ctrl.rise, dir.rise], { y: 320 });
  SR.props.table(cam, 280, 1200, 860, C.deepBand);
  SR.props.laptop(cam, 760, 860, C.deep);
  const deskPh = anim(place(cam, 960, 860)); rect(deskPh, -44, -30, 88, 30, C.deepBand, 8); rect(deskPh, -36, -46, 72, 18, C.tint, 9);
  const ctrlLab = SR.words(cam, 'You \u00B7 project controller', 600, 482, stL, C.grey, { align: 'center' });
  const dirLab = SR.words(cam, 'Sales director', 1010, 482, stL, C.grey, { align: 'center' });
  [...pmLab.groups, ...ctrlLab.groups, ...dirLab.groups].forEach(g => gsap.set(g, { scale: 0 }));
  const env = anim(cam); rect(env, -36, -24, 72, 48, C.white, 4); stroke(env, 'M-30,-18 L0,4 L30,-18', C.tint, 6); gsap.set(env, { x: 770, y: 790, scale: 0 });
  const excl = SR.bubble(cam, 1700, 352, { w: 110, h: 90, fill: C.white, tail: 'left', content: (g, ink) => { rect(g, -6, -30, 12, 38, ink, 6); circle(g, 0, 24, 7, ink); } });
  gsap.set(excl, { scale: 0 });
  const rw = anim(place(cam, 960, 540)); circle(rw, 0, 0, 100, C.deep); path(rw, 'M-4,-40 L-54,0 L-4,40 Z M56,-40 L6,0 L56,40 Z', C.white); gsap.set(rw, { scale: 0 });
  const say = (txt) => {
    const w = SR.measure(txt, stB) + 84, h = 96, g = anim(place(cam, 600, 392));
    path(g, `M-6,${h / 2 - 4} L36,${h / 2 + 40} L40,${h / 2 - 4} Z`, C.deep);
    rect(g, -w / 2, -h / 2, w, h, C.deep, h / 2);
    SR.textEl(g, txt, 0, 15, stB, C.white, 'middle');
    gsap.set(g, { scale: 0 }); return g;
  };
  const takeB = ['\u201CYes, I\u2019ll fit it in\u201D', '\u201CYes, I\u2019ll email him tonight\u201D'].map(say);
  // the controller's sentence
  const sb = anim(place(cam, 760, 416));
  const sp = SR.measure('a b', stB) - SR.measure('ab', stB), PAD = 14;
  const lines = [['I can do it if', { chip: 'the harbour costing' }, 'moves to', { chip: 'Monday' }, '.'], ['I\u2019ll check with', { chip: 'its project manager' }, '.']];
  const segW = s => typeof s === 'string' ? SR.measure(s, stB) : SR.measure(s.chip, stB) + 2 * PAD;
  const lineW = segs => segs.reduce((a, s, i) => a + segW(s) + (i && s !== '.' ? sp : 0), 0);
  const bw = Math.max(...lines.map(lineW)) + 100;
  rect(sb, -bw / 2, -95, bw, 190, C.deep, 40);
  path(sb, 'M-196,90 L-150,122 L-128,90 Z', C.deep);
  const sWords = [], chips = [];
  lines.forEach((segs, li) => {
    let x = -lineW(segs) / 2; const y = -15 + li * 60;
    segs.forEach((s, i) => {
      if (i && s !== '.') x += sp;
      const w = segW(s);
      if (typeof s === 'string') { const r = SR.words(sb, s, x, y, stB, C.white); sWords.push(...r.groups); }
      else {
        const og = anim(place(sb, x + w / 2, y - 13));
        el('rect', { x: -w / 2, y: -27, width: w, height: 54, rx: 10, fill: 'none', stroke: C.tint, 'stroke-width': 6, 'stroke-dasharray': '12 9' }, og);
        const fg = anim(place(sb, x + w / 2, y - 13)); rect(fg, -w / 2, -27, w, 54, C.blue, 10);
        const r = SR.words(sb, s.chip, x + PAD, y, stB, C.white);
        sWords.push(og); chips.push({ fg, words: r.groups });
      }
      x += w;
    });
  });
  gsap.set(sb, { scale: 0 });
  [...sWords, ...chips.flatMap(c => [c.fg, ...c.words])].forEach(g => gsap.set(g, { scale: 0 }));
  const dots = []; for (let i = 0; i < 16; i++) { const p = SR.bez([770, 846], [1120, 740], [1366, 640], i / 15); const d = anim(place(cam, p.x, p.y)); circle(d, 0, 0, 7, C.white); gsap.set(d, { scale: 0 }); dots.push(d); }
  // split screen
  const split = anim(cam);
  rect(split, 880, 316, 1040, 764, C.deep);
  const pmBig = SR.character(split, 1440, 900, { shirt: C.blue, sleeve: C.deepBand, skin: SR.SKIN[2], helmet: C.yellow });
  rect(split, 1520, 588, 28, 58, C.white, 6);
  rect(split, 1080, 900, 760, 180, C.deepBand);
  const quote = anim(place(split, 1440, 450));
  { const w = Math.max(SR.measure('Transport can wait.', stB), SR.measure('The rest, Friday.', stB)) + 90;
    path(quote, 'M-20,70 L-60,112 L20,70 Z', C.blue); rect(quote, -w / 2, -75, w, 150, C.blue, 40);
    SR.textEl(quote, 'Transport can wait.', 0, -15, stB, C.white, 'middle'); SR.textEl(quote, 'The rest, Friday.', 0, 45, stB, C.white, 'middle'); }
  gsap.set(quote, { scale: 0 }); gsap.set(split, { x: 1100 });

  // freeze overlay: the office dims, only the two tiles stay lit
  const dim = rect(dimL, 0, 0, W, H, C.deep); gsap.set(dim, { autoAlpha: 0 });
  const ask = SR.words(dimL, 'What do you say?', 960, 590, stD, C.white, { align: 'center' });
  ask.groups.forEach(g => gsap.set(g, { scale: 0 }));

  // ---- office reveal ----
  k.show(offS, mid1); k.hide(hookS, mid1 + 0.02);
  tl.set(wt.pos, { x: 1010, y: 740 }, mid1); tl.set(wt.popg, { scale: 0 }, mid1); tl.set(wt.lab, { scale: 1 }, mid1);
  tl.fromTo(ctrl.rise, { y: 320 }, { y: 0, duration: 0.5, ease: 'popBig' }, 19.2); SR.sfx(19.2, 'boing', { pitch: 260, gain: 0.4, pan: -0.3 });
  k.pop(clockA, T.clock1, { ease: 'popBig', pitch: 900, gain: 0.3, pan: -0.7 }); k.pop(clockLab, T.clock1 + 0.12, { sfx: false });
  k.popWords(ctrlLab.groups, 20.4);
  tl.fromTo(dir.rise, { y: 320 }, { y: 0, duration: 0.5, ease: 'popBig' }, T.director); SR.sfx(T.director, 'boing', { pitch: 320, gain: 0.45, pan: 0.15 });
  tl.fromTo(wt.popg, { scale: 0, rotation: -12 }, { scale: 1, rotation: 0, duration: 0.4, ease: 'popBig', immediateRender: false }, T.director + 0.35); SR.sfx(T.director + 0.35, 'pop', { pitch: 800, gain: 0.35 });
  k.popWords(dirLab.groups, T.director + 0.6);
  k.pop(winA, T.pm, { origin: '50% 50%', ease: 'popBig', pitch: 380, gain: 0.35, pan: 0.6 });
  k.popWords(pmLab.groups, T.pm + 0.4);
  tl.to(hero.sq, { keyframes: [{ scaleX: 0.9, scaleY: 1.12, duration: 0.08 }, { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'elastic.out(1.1,0.3)' }] }, 26.3);
  SR.sfx(26.3, 'pop', { pitch: 640, gain: 0.3, pan: 0.35 });
  k.outWords([...ctrlLab.groups, ...dirLab.groups], 28.6);

  k.push(cam, 19.3, 9.6, 1, 1.035, '760 600');
  tl.set(cam, { scale: 1, svgOrigin: '760 600' }, T.take1);
  k.push(cam, RWe, 4.6, 1, 1.03, '960 560');
  tl.to(cam, { scale: 1, svgOrigin: '960 560', duration: 0.8, ease: 'power2.inOut' }, 50.6);
  // ---- 29-32: freeze, "What do you say?" ----
  tl.fromTo(dim, { autoAlpha: 0 }, { autoAlpha: 0.72, duration: 0.15, ease: 'power1.out', immediateRender: false }, F1);
  k.popWords(ask.groups, T.ask, { stagger: 3 * FR, dur: 0.5, sfx: false });
  k.outWords(ask.groups, F1e - 0.45);
  tl.set(ask.groups, { autoAlpha: 0 }, F1e - 0.05);
  tl.to(dim, { autoAlpha: 0, duration: 0.15 }, F1e - 0.25);

  // ---- 32-44: two answers, wiped by a white block ----
  const takes = [T.take1, T.take2];
  takes.forEach(ts => k.blockWipe(wipeL, ts - 0.25, { dir: 'right', color: C.white, dur: 0.5 }));
  const reset = ts => {
    tl.set(wt.pos, { x: 1010, y: 740 }, ts); tl.set(wt.size, { scale: 1 }, ts); tl.set(wt.rot, { rotation: 0 }, ts);
    tl.set(hero.pos, { x: FRI, y: RY }, ts); tl.set(hero.rot, { rotation: 0 }, ts); tl.set(hero.tip, { rotation: 0 }, ts);
    tl.set(crack, { attr: { 'stroke-dashoffset': CL } }, ts); tl.set(greyHalf, { autoAlpha: 0 }, ts);
    tl.set(dirMove, { x: 0, y: 0 }, ts); tl.set([pmPhone, fallen, excl, agenda], { scale: 0 }, ts);
  };
  takes.forEach((ts, i) => { reset(ts); k.pop(takeB[i], ts + 0.35, { origin: '50% 100%', ease: 'popBig', pitch: 600 + 80 * i, gain: 0.35, pan: -0.3 }); });
  tl.set(takeB[0], { scale: 0 }, T.take2);
  // take 1: squeeze it in; the costing cracks and loses half its day
  const a1 = T.take1;
  arc(wt.pos, a1 + 1.2, 0.4, FRI - 24, RY + 6, 110);
  tl.to(wt.rot, { rotation: -6, duration: 0.4 }, a1 + 1.2);
  SR.sfx(a1 + 1.18, 'whoosh', { dur: 0.4, rise: false, lo: 500, hi: 3500, gain: 0.3 });
  squashG(wt.sq, a1 + 1.6, 0.2);
  SR.sfx(a1 + 1.6, 'impact', { gain: 0.45, pan: 0.35 });
  k.draw(crack, a1 + 1.6, 0.1);
  tl.to(hero.rot, { rotation: 9, duration: 0.5, ease: 'elastic.out(1,0.35)' }, a1 + 1.6);
  tl.to(hero.pos, { y: RY + 16, duration: 0.3, ease: 'power2.out' }, a1 + 1.6);
  tl.fromTo(greyHalf, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, immediateRender: false }, 34.8);
  SR.sfx(34.8, 'thunk', { gain: 0.25, pan: 0.35 });
  // take 2: email at night; at 7:30 he finds his tile already on the floor, client agenda behind him
  const a2 = T.take2;
  arc(wt.pos, a2 + 1.0, 0.4, FRI, RY, 110);
  SR.sfx(a2 + 0.98, 'whoosh', { dur: 0.4, rise: false, lo: 500, hi: 3500, gain: 0.3 });
  squashG(wt.sq, a2 + 1.4, 0.2); SR.sfx(a2 + 1.4, 'thunk', { gain: 0.4, pan: 0.35 });
  tl.to(hero.pos, { x: FRI + 150, duration: 0.2, ease: 'power2.out' }, a2 + 1.4);
  tl.to(hero.tip, { rotation: 85, duration: 0.3, ease: 'power2.in' }, a2 + 1.55);
  tl.to(hero.pos, { y: 1320, x: '+=80', duration: 0.45, ease: 'power2.in' }, a2 + 1.7);
  // the director goes home, it gets dark, the email goes out
  tl.to(dirMove, { x: 1150, duration: 0.4, ease: 'power2.in' }, a2 + 1.6);
  tl.to(dirMove, { keyframes: [{ y: -40, duration: 0.15, ease: 'power2.out' }, { y: 0, duration: 0.25, ease: 'power2.in' }] }, a2 + 1.6);
  SR.sfx(a2 + 1.58, 'whoosh', { dur: 0.4, rise: true, lo: 300, hi: 2500, gain: 0.25, pan: 0.6 });
  tl.set(night, { autoAlpha: 1 }, 40.1); tl.set(night, { autoAlpha: 0 }, 41.0);
  k.pop(env, 40.3, { ease: 'popBig', pitch: 900, gain: 0.3 });
  arc(env, 40.4, 0.45, 1560, 560, 520);
  k.unpop(env, 40.85);
  SR.sfx(40.4, 'whoosh', { dur: 0.45, rise: false, lo: 800, hi: 4000, gain: 0.25, pan: 0.4 });
  k.pop(agenda, 41.05, { sfx: false }); k.pop(pmPhone, 41.15, { sfx: false }); k.pop(fallen, 41.15, { sfx: false });
  SR.sfx(41.2, 'rumble', { dur: 0.7, gain: 0.5, pan: 0.6 }); SR.sfx(41.2, 'zip', { dur: 0.15, gain: 0.2, pan: 0.6 }); SR.sfx(41.6, 'zip', { dur: 0.15, gain: 0.2, pan: 0.6 });
  SR.onTick(t => { const a = SR.win(t, 41.15, 42.1, 0.05); pmPhone.parentNode.setAttribute('transform', `translate(${224 + a * 3 * Math.sin(t * 2 * Math.PI * 22)},176)`); });
  k.pop(excl, 41.55, { origin: '20% 100%', ease: 'popBig', pitch: 1100, gain: 0.35, pan: 0.6 });
  // freeze, rewind: tiles fly back, the clock runs back to 15:00
  SR.sfx(FZ, 'tick', { pitch: 900, gain: 0.35 });
  k.pop(rw, RW - 0.05, { ease: 'popBig', pitch: 500, gain: 0.4 });
  SR.sfx(RW, 'whoosh', { dur: RWe - RW, rise: false, lo: 4000, hi: 250, gain: 0.5 });
  [excl, pmPhone, agenda, fallen].forEach((g, i) => k.unpop(g, RW + 0.1 + i * 2 * FR));
  k.unpop(takeB[1], RW + 0.2, { origin: '50% 100%' });
  tl.to(hero.tip, { rotation: 0, duration: 0.6, ease: 'power2.out' }, RW + 0.3);
  tl.to(hero.pos, { x: FRI, y: RY, duration: 0.7, ease: 'power2.out' }, RW + 0.3);
  squashG(hero.sq, RW + 1.0, 0.18); SR.sfx(RW + 1.0, 'pop', { pitch: 520, gain: 0.35, pan: 0.35 });
  arc(wt.pos, RW + 0.2, 0.7, 1010, 740, 300);
  tl.to(dirMove, { x: 0, duration: 0.7, ease: 'power2.inOut' }, RW + 0.2);
  k.unpop(rw, RWe - 0.15);
  tl.to(hero.rot, { keyframes: [{ rotation: 7, duration: 0.08 }, { rotation: -5, duration: 0.12 }, { rotation: 0, duration: 0.5, ease: 'elastic.out(1,0.3)' }] }, 46.0);
  SR.sfx(46.0, 'pop', { pitch: 700, gain: 0.25, pan: 0.35 });
  tl.to(winA, { keyframes: [{ scale: 1.05, duration: 0.08, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.5, ease: 'elastic.out(1,0.3)' }] }, T.whoHears);
  SR.sfx(T.whoHears, 'pop', { pitch: 420, gain: 0.25, pan: 0.6 });

  // ---- 50.5-61: the sentence ----
  k.unpop([clockA, clockLab], T.toLine);
  k.pop(sb, 51.9, { origin: '20% 100%', ease: 'popBig', pitch: 520, gain: 0.35, pan: -0.3 });
  k.popWords(sWords, 52.05, { sfx: false });
  chips.forEach((c, i) => {
    const at = [T.chip1, T.chip2, T.chip3][i];
    k.pop(c.fg, at, { ease: 'popBig', sfx: false, dur: 0.35 });
    k.popWords(c.words, at + 0.03, { sfx: false });
    SR.sfx(at, 'tick', { pitch: 1500, gain: 0.45 }); SR.sfx(at, 'pop', { pitch: 600, gain: 0.2 });
  });
  k.pop(monNext, T.chip1 - 0.25, { ease: 'popBig', pitch: 400, gain: 0.3, pan: 0.6 });
  antic(hero.sq, T.chip1 + 0.05);
  arc(hero.pos, T.chip1 + 0.05, 0.5, MONX, RY, 40);
  SR.sfx(T.chip1 + 0.03, 'whoosh', { dur: 0.45, rise: false, lo: 500, hi: 3500, gain: 0.3, pan: 0.6 });
  SR.onTick(t => { const a = SR.win(t, T.chip1 + 0.55, T.tileBack, 0.25); hero.bob.setAttribute('transform', `translate(0,${a * (-10 + 6 * Math.sin((t - T.chip1) * 2 * Math.PI * 0.6))})${t > T.endCard + 0.6 ? ` rotate(${Math.sin((t - T.endCard) * 2 * Math.PI * 0.4) * 2.5})` : ''}`); });
  dots.forEach((d, i) => { k.pop(d, T.lineDraw + i * 2 * FR, { sfx: false, dur: 0.3 }); if (i % 3 === 0) SR.sfx(T.lineDraw + i * 2 * FR, 'tick', { pitch: 1800 + i * 40, gain: 0.12, pan: -0.2 + i * 0.05 }); });
  k.unpop(sb, 61.0, { origin: '20% 100%' });

  // ---- 61.6-70: the phone call ----
  SR.onTick(t => { const a = SR.win(t, T.ring, T.ring + 0.75, 0.05); deskPh.setAttribute('transform', `translate(${a * 4 * Math.sin(t * 2 * Math.PI * 25)},${-a * 3})`); });
  [T.ring, T.ring + 0.4].forEach(s => { for (let i = 0; i < 7; i++) SR.sfx(s + i * 0.045, 'tick', { pitch: i % 2 ? 1900 : 2400, gain: 0.22, pan: 0.1 }); });
  k.pop(clockA, 62.15, { ease: 'popBig', pitch: 900, gain: 0.25, pan: -0.7 }); k.pop(clockLab, 62.25, { sfx: false });
  dots.forEach((d, i) => k.unpop(d, T.split + i * FR * 0.5, { dur: 0.15 }));
  k.unpop(wt.popg, T.split - 0.05); tl.fromTo(wt.popg, { scale: 0 }, { scale: 1, duration: 0.4, ease: 'popBig', immediateRender: false }, 70.1); SR.sfx(70.1, 'pop', { pitch: 800, gain: 0.3 });
  tl.to(split, { x: 0, duration: 0.45, ease: 'power3.out' }, T.split);
  SR.sfx(T.split, 'whoosh', { dur: 0.45, rise: false, lo: 300, hi: 4000, gain: 0.35, pan: 0.5 });
  k.pop(quote, 64.0, { origin: '35% 100%', ease: 'popBig', pitch: 700, gain: 0.35, pan: 0.5 });
  antic(hero.sq, T.tileBack);
  arc(hero.pos, T.tileBack, 0.35, FRI, RY, 60);
  squashG(hero.sq, T.tileBack + 0.35, 0.22); SR.sfx(T.tileBack + 0.35, 'thunk', { gain: 0.4, pan: 0.35 });
  tl.to(hero.slice, { x: MONX - 90 - FRI - 90 + 20, duration: 0.55, ease: 'power1.inOut' }, T.slice);
  tl.to(hero.slice, { keyframes: [{ y: -80, duration: 0.25, ease: 'power2.out' }, { y: 0, duration: 0.3, ease: 'power2.in' }] }, T.slice);
  SR.sfx(T.slice, 'sparkle', { gain: 0.3, pan: 0.5 }); SR.sfx(T.slice + 0.55, 'pop', { pitch: 900, gain: 0.3, pan: 0.6 });
  k.unpop(quote, 69.4, { origin: '35% 100%' });
  tl.to(split, { x: 1100, duration: 0.4, ease: 'power3.in' }, 69.6);
  SR.sfx(69.6, 'whoosh', { dur: 0.4, rise: true, lo: 300, hi: 3000, gain: 0.25, pan: 0.5 });

  // ---- 70.4-75.5: the clash, pushed in ----
  const CA = T.clash;
  arc(wt.pos, CA, 0.4, FRI - 26, RY + 4, 100);
  tl.to(wt.rot, { rotation: -5, duration: 0.4 }, CA); tl.to(hero.rot, { rotation: 4, duration: 0.3 }, CA + 0.35);
  squashG(wt.sq, CA + 0.4, 0.15); SR.sfx(CA + 0.4, 'thunk', { gain: 0.55, pan: 0.2 });
  const PS = 2.2, push = { scale: PS, x: 960 - FRI * PS, y: 470 - RY * PS };
  const P2 = 2.4;
  tl.set([cam, railL, heroL], { scale: 1, x: 0, y: 0, svgOrigin: '0 0' }, CA + 0.29);
  tl.to([cam, railL, heroL], { keyframes: [Object.assign({ duration: 1.0, ease: 'power3.inOut' }, push), { scale: P2, x: 960 - FRI * P2, y: 470 - RY * P2, duration: 3.6, ease: 'sine.inOut' }] }, CA + 0.3);
  SR.sfx(CA + 0.45, 'rumble', { dur: 4.8, gain: 0.45 });
  SR.onTick(t => {
    const a = SR.win(t, CA + 0.45, T.slam, 0.2);
    wt.jit.setAttribute('transform', `translate(${a * 3 * Math.sin(t * 2 * Math.PI * 11)},${a * 1.5 * Math.sin(t * 2 * Math.PI * 7)}) rotate(${a * 2.2 * Math.sin(t * 2 * Math.PI * 7)})`);
    hero.jit.setAttribute('transform', `translate(${-a * 3 * Math.sin(t * 2 * Math.PI * 10)},0) rotate(${-a * 2 * Math.sin(t * 2 * Math.PI * 8)})`);
  });
  const qb = SR.bubble(wipeL, 960, 560, { w: 320, h: 180, fill: C.deep, tail: 'left', content: 'question' });
  gsap.set(qb, { scale: 0 });
  const QW = T.phone - 0.46;
  k.pop(qb, QW - 0.5, { ease: 'popBig', pitch: 650, gain: 0.4 });
  k.unpop(qb.inner, QW - 0.18, { dur: 0.15 });
  k.shapeWipe(qb, QW, { scale: 16, dur: 0.45, anticipate: 0.2 });
  const mid3 = T.phone;

  /* ================= SCENE 3: NADIA WITH A CLIENT (blue-deep) ================= */
  const phS = el('g', {}, scenes); gsap.set(phS, { autoAlpha: 0 });
  rect(phS, 0, 0, W, H, C.deep);
  const sceneA = anim(phS);
  const nad = SR.character(sceneA, 330, 880, { shirt: C.tint, sleeve: C.blue, skin: SR.SKIN[0], hair: 'bun', hairColor: SR.HAIR[2] });
  const cli = SR.character(sceneA, 830, 880, { shirt: C.grey, sleeve: C.blue, skin: SR.SKIN[2], hair: 'short', hairColor: SR.HAIR[1], collar: 'tie', tieColor: C.blue, glasses: true });
  SR.props.table(sceneA, 120, 1040, 880, C.deepBand);
  SR.props.mug(sceneA, 640, 880, C.tint);
  const docs = place(sceneA, 760, 880); rect(docs, -60, -14, 120, 14, C.white, 3); rect(docs, -50, -24, 100, 12, C.grey, 3);
  const nPh = anim(place(sceneA, 440, 880)); rect(nPh, -18, -64, 36, 64, C.white, 8); rect(nPh, -12, -56, 24, 44, C.deep, 4);
  gsap.set([nad.rise, cli.rise], { y: 320 });
  const nadLab = SR.words(phS, 'Nadia \u00B7 your manager \u00B7 with a client all day', 560, 484, stL, C.tint, { align: 'center' });
  nadLab.groups.forEach(g => gsap.set(g, { scale: 0 }));
  const phA = anim(place(phS, 1460, 615));
  rect(phA, -240, -285, 480, 570, C.blue, 44);
  rect(phA, -220, -245, 440, 500, C.deepRaised, 24);
  rect(phA, -40, -268, 80, 10, C.deep, 5);
  const cp = el('clipPath', { id: 'scr' }, document.querySelector('#stage defs')); rect(cp, -220, -245, 440, 500, '#000', 24);
  const msgs = el('g', { 'clip-path': 'url(#scr)' }, phA);
  const set1 = anim(msgs), set2 = anim(msgs);
  const msg = (parent, txt, side, y, fill, ink) => {
    const w = SR.measure(txt, stB) + 60, g = anim(place(parent, side === 'right' ? 200 : -200, y));
    rect(g, side === 'right' ? -w : 0, -40, w, 80, fill, 26);
    SR.textEl(g, txt, side === 'right' ? -w / 2 : w / 2, 15, stB, ink, 'middle');
    gsap.set(g, { scale: 0 }); return g;
  };
  const stamp = (parent, txt, y) => { const g = anim(place(parent, -200, y)); SR.textEl(g, txt, 0, 0, stL, C.tint, 'start'); gsap.set(g, { scale: 0 }); return g; };
  const m1 = msg(set1, 'Which one first?', 'right', -170, C.blue, C.white);
  const ts1 = stamp(set1, '18:00', -60);
  const r1 = msg(set1, 'Do both.', 'left', -5, C.white, C.deep);
  const m2 = anim(place(set2, 200, 10));
  rect(m2, -400, -230, 400, 230, C.blue, 26);
  rect(m2, -340, -200, 130, 28, C.white, 6); rect(m2, -340, -168, 130, 28, C.yellow, 6);
  el('rect', { x: -160, y: -203, width: 120, height: 66, rx: 8, fill: 'none', stroke: C.tint, 'stroke-width': 6, 'stroke-dasharray': '10 8' }, m2);
  rect(m2, -154, -197, 26, 54, C.yellow, 6);
  SR.textEl(m2, 'Fri', -275, -100, stL, C.white, 'middle'); SR.textEl(m2, 'Mon', -100, -100, stL, C.white, 'middle');
  SR.textEl(m2, 'Here\u2019s the plan.', -200, -34, stB, C.white, 'middle');
  gsap.set(m2, { scale: 0 });
  const ts2 = stamp(set2, '16:10', 82);
  const r2 = msg(set2, 'OK, go.', 'left', 142, C.white, C.deep);
  gsap.set(phA, { scale: 0 });

  k.show(phS, mid3); k.hide(offS, mid3 + 0.02); tl.set(qb, { autoAlpha: 0 }, mid3 + 0.04);
  tl.set([cam, railL, heroL], { scale: 1, x: 0, y: 0, svgOrigin: '0 0' }, mid3);
  tl.fromTo(nad.rise, { y: 320 }, { y: 0, duration: 0.5, ease: 'popBig' }, mid3 + 0.3); SR.sfx(mid3 + 0.3, 'boing', { pitch: 300, gain: 0.4, pan: -0.5 });
  tl.fromTo(cli.rise, { y: 320 }, { y: 0, duration: 0.5, ease: 'popBig' }, mid3 + 0.45); SR.sfx(mid3 + 0.45, 'boing', { pitch: 240, gain: 0.35, pan: -0.1 });
  k.popWords(nadLab.groups, 76.1);
  k.pop(phA, T.msg1 - 0.5, { origin: '50% 100%', ease: 'popBig', pitch: 420, gain: 0.35, pan: 0.5 });
  tl.fromTo(sceneA, { scale: 1 }, { scale: 1.05, svgOrigin: '580 880', duration: T.callback - mid3 - 0.4, ease: 'sine.inOut', immediateRender: false }, mid3 + 0.4);
  SR.onTick(t => { const a = SR.win(t, T.msg1, T.msg1 + 0.5, 0.05) + SR.win(t, T.msg2, T.msg2 + 0.5, 0.05); nPh.setAttribute('transform', `translate(${a * 3 * Math.sin(t * 2 * Math.PI * 20)},0)`); });
  k.pop(m1, T.msg1, { origin: '100% 100%', ease: 'popBig', sfx: false });
  k.pop(ts1, T.reply1 - 0.1, { origin: '0% 100%', sfx: false });
  k.pop(r1, T.reply1, { origin: '0% 100%', ease: 'popBig', sfx: false });
  [wt, hero].forEach((o, i) => {
    tl.to(o.pos, { keyframes: [{ y: RY - 36, duration: 0.1, ease: 'power2.out' }, { y: RY, duration: 0.1, ease: 'power2.in' }] }, T.slam - 0.2 + i * FR);
    squashG(o.sq, T.slam + i * FR, 0.3);
  });
  SR.sfx(T.slam, 'thunk', { gain: 0.7, pan: 0.3 }); SR.sfx(T.slam + 0.02, 'impact', { gain: 0.2, pan: 0.3 });
  tl.to(set1, { x: -460, duration: 0.45, ease: 'power3.inOut' }, T.msg2 - 0.1);
  tl.fromTo(set2, { x: 460 }, { x: 0, duration: 0.45, ease: 'power3.inOut' }, T.msg2 - 0.1);
  tl.set(m2, { scale: 1 }, T.msg2 - 0.1);
  SR.sfx(T.msg2 - 0.1, 'whoosh', { dur: 0.45, rise: false, lo: 600, hi: 4000, gain: 0.3, pan: 0.5 });
  k.pop(ts2, T.reply2 - 0.1, { origin: '0% 100%', sfx: false });
  k.pop(r2, T.reply2, { origin: '0% 100%', ease: 'popBig', sfx: false });
  // the real rail rearranges to match the plan: tender then costing on Friday, transport on Monday
  const RA = T.rearrange;
  tl.to(wt.pos, { x: FRI, y: RY - 25, duration: 0.5, ease: 'power3.inOut' }, RA);
  tl.to(wt.rot, { rotation: 0, duration: 0.5, ease: 'power3.inOut' }, RA);
  tl.to(wt.bodyG, { scaleY: 46 / 96, duration: 0.5, ease: 'power3.inOut' }, RA);
  tl.to(hero.rot, { rotation: 0, duration: 0.5, ease: 'power3.inOut' }, RA);
  tl.to(hero.pos, { x: FRI, y: RY + 25, duration: 0.5, ease: 'power3.inOut' }, RA + 0.06);
  tl.to(hero.slice, { y: -25, duration: 0.5, ease: 'power3.inOut' }, RA + 0.06);
  tl.to(hero.mainG, { x: 19, scaleX: 220 / 182, scaleY: 46 / 96, duration: 0.5, ease: 'power3.inOut' }, RA + 0.06);
  tl.to(hero.lab, { scale: 0, duration: 0.15, ease: 'power2.in' }, RA);
  tl.fromTo(hero.lab1, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'pop', immediateRender: false }, RA + 0.35);
  SR.sfx(RA + 0.5, 'pop', { pitch: 700, gain: 0.3, pan: 0.1 }); SR.sfx(RA + 0.56, 'pop', { pitch: 900, gain: 0.3, pan: 0.4 });
  life(nad, { seed: 0.7, side: 1, talk: [[83.3, 83.9], [89.4, 89.95]], listen: [[76.2, 77.5], [81.7, 83.0], [87.1, 89.2]] });
  life(cli, { seed: 1.9, side: -1, talk: [[76.3, 77.6], [84.6, 85.6]], listen: [[78.0, 80.6], [87.2, 88.6]] });

  /* ================= CALLBACK + END (blue-deep) ================= */
  const CB = T.callback;
  k.unpop(phA, CB, { origin: '50% 100%' }); k.outWords(nadLab.groups, CB);
  tl.to([nad.rise, cli.rise], { y: 340, duration: 0.35, ease: 'power2.in' }, CB + 0.05);
  tl.to(sceneA, { y: 400, duration: 0.4, ease: 'power2.in' }, CB + 0.1); tl.set(sceneA, { autoAlpha: 0 }, CB + 0.5);
  k.unpop(monNext, CB);
  SR.sfx(CB, 'whoosh', { dur: 0.5, rise: false, lo: 3000, hi: 300, gain: 0.35 });
  const RD = CB + 0.2;
  tl.to(railL, { y: HY, duration: 0.6, ease: 'power3.inOut' }, RD);
  tl.to(hero.pos, { y: RY + HY, duration: 0.6, ease: 'power3.inOut' }, RD);
  tl.to(hero.slice, { x: 0, y: 0, duration: 0.5, ease: 'power3.inOut' }, RD);
  tl.to(hero.mainG, { x: 0, scaleX: 1, scaleY: 1, duration: 0.5, ease: 'power3.inOut' }, RD);
  tl.to(hero.lab1, { scale: 0, duration: 0.15, ease: 'power2.in' }, RD);
  tl.to(hero.lab, { scale: 1, duration: 0.35, ease: 'pop' }, RD + 0.35);
  tl.to(wt.pos, { x: -200, y: RY + HY, duration: 0.55, ease: 'power2.in' }, RD);
  tl.to(wt.bodyG, { scaleY: 1, duration: 0.4 }, RD);
  // same first frame, now labelled: the white tile comes in fast, and this time stops before it hits
  tl.to(wt.pos, { x: 128, duration: T.shove2 - T.white2, ease: 'power3.out' }, T.white2);
  squashG(wt.sq, T.shove2 - 0.1, -0.12);
  SR.sfx(T.white2, 'whoosh', { dur: 0.35, rise: true, lo: 150, hi: 1400, gain: 0.4 });
  tiles.forEach((o, i) => tl.to(o.g, { keyframes: [{ scaleX: 0.97, duration: 0.08 }, { scaleX: 1, duration: 0.4, ease: 'elastic.out(1,0.4)' }] }, T.shove2 - 0.1 + i * 2 * FR));
  // the owner's hand comes in from the right, pinches the transport slice and carries it to next Monday
  const hand = anim(fxL);
  rect(hand, 30, -36, 1200, 72, C.blue);
  rect(hand, 40, -40, 22, 80, C.deepBand, 6);
  circle(hand, 0, 0, 34, SR.SKIN[2]);
  [-22, -7, 8, 23].forEach(y => rect(hand, -30, y - 6, 26, 12, SR.SKIN[2], 6));
  const HYc = RY + HY, sliceX = FRI + 90;
  gsap.set(hand, { x: 2100, y: HYc });
  const H0 = T.hand;
  k.pop(monNext, H0 - 0.2, { ease: 'popBig', pitch: 420, gain: 0.3, pan: 0.6 });
  tl.to(hand, { x: sliceX + 34, duration: 8 * FR, ease: 'power3.out' }, H0);
  SR.sfx(H0, 'whoosh', { dur: 8 * FR, rise: false, lo: 400, hi: 2500, gain: 0.3, pan: 0.6 });
  tl.to(hero.slice, { keyframes: [{ scaleY: 0.92, transformOrigin: '50% 50%', duration: 2 * FR }, { scaleY: 1, duration: 3 * FR }] }, H0 + 8 * FR);
  SR.sfx(H0 + 8 * FR, 'tick', { pitch: 1100, gain: 0.35, pan: 0.5 });
  const C0 = H0 + 13 * FR, CD = 12 * FR;
  const dxSlice = MONX - 90 - FRI - 90 + 20;
  tl.to(hero.slice, { x: dxSlice, duration: CD, ease: 'power1.inOut' }, C0);
  tl.to(hero.slice, { keyframes: [{ y: -90, duration: CD * 0.45, ease: 'power2.out' }, { y: 0, duration: CD * 0.55, ease: 'power2.in' }] }, C0);
  tl.to(hand, { x: sliceX + dxSlice + 34, duration: CD, ease: 'power1.inOut' }, C0);
  tl.to(hand, { keyframes: [{ y: HYc - 90, duration: CD * 0.45, ease: 'power2.out' }, { y: HYc, duration: CD * 0.55, ease: 'power2.in' }] }, C0);
  SR.sfx(C0 + CD, 'tick', { pitch: 1300, gain: 0.5, pan: 0.6 }); SR.sfx(C0 + CD, 'pop', { pitch: 520, gain: 0.25, pan: 0.6 });
  tl.to(hand, { x: 2100, duration: 0.35, ease: 'power2.in' }, C0 + CD + 0.25);
  // Friday makes room: the costing drops to the lower half, the tender lands on top
  const FR0 = C0 + CD + 0.15;
  tl.to(hero.pos, { y: RY + HY + 25, duration: 0.35, ease: 'power3.inOut' }, FR0);
  tl.to(hero.slice, { y: -25, duration: 0.35, ease: 'power3.inOut' }, FR0);
  tl.to(hero.mainG, { x: 19, scaleX: 220 / 182, scaleY: 46 / 96, duration: 0.35, ease: 'power3.inOut' }, FR0);
  tl.to(hero.lab, { scale: 0, duration: 0.12, ease: 'power2.in' }, FR0);
  tl.fromTo(hero.lab1, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'pop', immediateRender: false }, FR0 + 0.2);
  antic(wt.sq, FR0 + 0.2);
  arc(wt.pos, FR0 + 0.2, 0.55, FRI, RY + HY - 25, RY + HY - 230);
  tl.to(wt.bodyG, { scaleY: 46 / 96, duration: 0.3, ease: 'power2.inOut' }, FR0 + 0.45);
  SR.sfx(FR0 + 0.18, 'whoosh', { dur: 0.5, rise: false, lo: 500, hi: 3500, gain: 0.3 });
  squashG(wt.sq, FR0 + 0.75, 0.15);
  SR.sfx(FR0 + 0.75, 'tick', { pitch: 1300, gain: 0.5, pan: 0.5 }); SR.sfx(FR0 + 0.75, 'pop', { pitch: 420, gain: 0.3, pan: 0.5 });
  const endLine = SR.words(phS, 'Ask the owner before it moves.', 960, 820, stT, C.white, { align: 'center' });
  endLine.groups.forEach(g => gsap.set(g, { scale: 0 }));
  k.popWords(endLine.groups, T.endLine, { sfx: 'tick' });
  const EC = T.endCard;
  [...tiles.map(o => o.g), wt.popg, monNext].forEach((g, i) => k.unpop(g, EC - 0.35 + i * 2 * FR, { dur: 0.2 }));
  tl.set(hero.slice, { autoAlpha: 0 }, EC - 0.2); tl.set(hero.slice, { x: 0, y: 0 }, EC - 0.1); tl.set(hero.slice, { autoAlpha: 1 }, EC + 0.3);
  dayL.forEach((g, i) => k.unpop(g, EC - 0.3 + i * FR, { origin: '50% 100%', dur: 0.18 }));
  tl.to(trackG, { scaleX: 0, transformOrigin: '100% 50%', duration: 0.3, ease: 'power3.in' }, EC - 0.3);
  tl.set(panel, { autoAlpha: 0 }, EC);
  const eT = SR.words(phS, 'Say what moves', 960, 520, stD, C.white, { align: 'center' });
  eT.groups.forEach(g => gsap.set(g, { scale: 0 }));
  antic(hero.sq, EC + 0.05);
  arc(hero.pos, EC + 0.05, 0.42, 960, 640, 420);
  tl.to(hero.mainG, { x: 0, scaleX: 1, scaleY: 1, duration: 0.3, ease: 'power2.out' }, EC + 0.05);
  tl.to(hero.lab1, { scale: 0, duration: 0.12 }, EC + 0.05); tl.to(hero.lab, { scale: 1, duration: 0.3, ease: 'pop' }, EC + 0.3);
  SR.sfx(EC + 0.03, 'whoosh', { dur: 0.4, rise: false, lo: 500, hi: 3500, gain: 0.3 });
  squashG(hero.sq, EC + 0.47, 0.25); SR.sfx(EC + 0.47, 'boing', { pitch: 330, dur: 0.5, gain: 0.5 });
  k.popWords(eT.groups, EC + 0.2, { stagger: 3 * FR, dur: 0.5, sfx: false });
  tl.to(endLine.groups, { y: 40, duration: 0.5, ease: 'power3.inOut' }, EC);

  /* ================= people, alive ================= */
  life(ctrl, { seed: 0.3, side: 1, tm: warp, talk: [[52.75, 60.2]], listen: [[32.7, 33.3], [38.6, 39.1], [63.0, 63.7], [67.4, 68.2]] });
  life(dir, { seed: 1.4, side: -1, tm: warp, talk: [[22.6, 25.0]], listen: [[52.9, 60.0]] });
  life(pm, { seed: 2.2, side: -1, listen: [[25.6, 27.4], [T.whoHears, T.whoHears + 1.4], [58.4, 60.4]] });
  life(pmBig, { seed: 0.9, side: -1, talk: [[62.9, 63.7]], shake: [[63.8, 64.5]] });

  /* ================= captions ================= */
  const CAPS = [
    [10.1, 13.9, 'A full week. Every tile on it belongs to someone.'],
    [20.1, 21.8, 'Thursday, three o\u2019clock.'],
    [21.9, 25.4, 'The sales director needs figures for a tender by Friday noon.'],
    [25.5, 28.4, 'Friday belongs to the harbour costing.'],
    [33.45, 35.3, 'Both answers sound helpful.'],
    [35.35, 40.2, 'In both, the project manager finds out after his costing has moved.'],
    [44.7, 46.5, 'Something was going to move anyway.'],
    [46.6, 50.3, 'The question is who hears in time to say no.'],
    [63.7, 65.6, 'He says no. Good.'],
    [65.65, 68.0, 'That is what the question was for.'],
    [71.9, 75.9, 'Now it is a real clash, and no rule says who wins.'],
    [76.0, 78.2, 'That is your manager\u2019s call.'],
    [81.1, 84.3, 'Send Nadia a puzzle and she answers both.'],
    [86.5, 90.1, 'Send her a plan, and she can approve it in one word.']
  ];
  // one line when it fits, otherwise two balanced lines, so no line is ever a lone word
  const stC = SR.style('caption');
  CAPS.forEach(([t0, t1, text]) => {
    const g = el('g', {}, capL); gsap.set(g, { autoAlpha: 0 });
    let lines = [text];
    if (SR.measure(text, stC) > 1100) {
      const ws = text.split(' '); let best = null;
      for (let i = 2; i <= ws.length - 2; i++) { const a = ws.slice(0, i).join(' '), b = ws.slice(i).join(' '); const d = Math.abs(SR.measure(a, stC) - SR.measure(b, stC)); if (!best || d < best[0]) best = [d, [a, b]]; }
      lines = best[1];
    }
    const wMax = Math.max(...lines.map(l => SR.measure(l, stC)));
    const bh = lines.length * stC.lh + 28, by = H - 96 - bh;
    rect(g, (W - wMax) / 2 - 32, by, wMax + 64, bh, C.deep);
    lines.forEach((l, i) => SR.textEl(g, l, W / 2, by + 14 + stC.size * 0.86 + i * stC.lh, stC, C.white, 'middle'));
    k.show(g, t0); k.hide(g, t1);
  });
  window.CAPTIONS = CAPS.concat([[52.7, 57.2, 'I can have the figures by Friday noon if the harbour costing moves to Monday.'], [57.3, 60.7, 'I\u2019ll check that with its project manager and tell you by four.']]).sort((a, b) => a[0] - b[0]);
};
