/* Say what moves: recap film for the e-learning (Group Talent learning piece -> Caslon, rule 4).
 * Hero: the harbour costing, a yellow tile on the week rail. It is shoved off a full rail in the first
 * seconds, becomes the title, sits in Friday through the four wrong answers, hovers over next Monday while
 * the owner is asked, loses its transport slice, and at the end is lifted to Monday by its owner's hand.
 * Layers: scenes (hook / office / phone) < rail < hero + white tile < hand < wipes < captions.
 */
window.FILM = async function (SR, tl, root, T, cues) {
  const { C, W, H, FR, el, place, anim, rect, circle, path, stroke } = SR;
  const k = SR.kit(tl);
  const stL = SR.style('label'), stB = SR.style('body'), stT = SR.style('title'), stD = SR.style('display');

  /* ---------- geometry of the week rail (same size in every scene) ---------- */
  const STEP = 234, X0 = 245, RY = 176, HY = 352;          // HY: rail offset when it sits mid-frame (hook, ending)
  const sx = i => X0 + 110 + i * STEP;
  const FRI = sx(4), MONX = X0 + 4 * STEP + 220 + 40 + 110;

  const scenes = el('g', {}, root);
  const railL = anim(root);
  const heroL = anim(root);
  const fxL = el('g', {}, root);
  const wipeL = el('g', {}, root);
  const capL = el('g', {}, root);

  /* ---------- custom character life: closed form, with an optional time warp (freeze + rewind) ---------- */
  function life(c, o) {
    const tmf = o.tm || (t => t), side = o.side || 1, offs = o.seed || 0;
    SR.onTick(t => {
      const u = tmf(t);
      const talk = SR.inWins(t, o.talk), listen = SR.inWins(t, o.listen), shake = SR.inWins(t, o.shake, 0.1);
      const ph = ((u + offs) % 2.9 + 2.9) % 2.9, bl = ph < 0.12 ? 1 - Math.sin(ph / 0.12 * Math.PI) * 0.9 : 1;
      const bob = Math.sin((u + offs) * Math.PI) * 3 + talk * Math.sin(u * 4 * Math.PI) * 4 + listen * Math.max(0, Math.sin(u * 2 * Math.PI * 0.8)) * 6;
      const tilt = talk * Math.sin(u * 2 * Math.PI) * 4 + listen * side * 6 + shake * Math.sin((t - 0.0) * 2 * Math.PI * 3.2) * 15;
      c.head.setAttribute('transform', `translate(0,${bob}) rotate(${tilt})`);
      c.eyes.setAttribute('transform', `translate(0,${4 * (1 - bl)}) scale(1,${bl})`);
      c.mouth.setAttribute('transform', `scale(1,${1 + talk * (0.5 + 0.5 * Math.sin(u * 2 * Math.PI * 4.2)) * 1.2})`);
      c.body.setAttribute('transform', `translate(0,${Math.sin((u + offs) * Math.PI) * 2})`);
      const g = talk * (0.6 + 0.4 * Math.sin(u * 2 * Math.PI * 1.1));
      const arms = o.arms ? o.arms(t, g) : null;
      if (arms) SR.setArms(c, arms[0], arms[1]); else SR.setArms(c, side > 0 ? g : 0, side > 0 ? 0 : g);
    });
  }
  // freeze at 35.7, rewind 36.1-37.9 (life runs backwards), then carry on
  const warp = t => t < T.freeze ? t : t < T.rewind ? T.freeze : t < T.rewound ? T.freeze - (t - T.rewind) * 2 : T.freeze - (T.rewound - T.rewind) * 2 + (t - T.rewound);
  const ramp = (t, a, b) => SR.smooth((t - a) / (b - a));

  /* ================= RAIL ================= */
  const panel = rect(railL, 181, 92, 1558, 224, C.deep);
  const trackG = anim(railL); rect(trackG, X0 - 24, RY + 56, 4 * STEP + 220 + 48, 12, C.deepBand, 6);
  const dayL = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, i) => { const g = anim(place(railL, sx(i), RY + 108)); SR.textEl(g, d, 0, 0, stL, C.tint, 'middle'); return g; });
  const monNext = anim(place(railL, MONX, RY));
  rect(monNext, -134, 56, 268, 12, C.deepBand, 6);
  el('rect', { x: -110, y: -48, width: 220, height: 96, rx: 14, fill: 'none', stroke: C.tint, 'stroke-width': 6, 'stroke-dasharray': '16 12' }, monNext);
  SR.textEl(monNext, 'Next Mon', 0, 108, stL, C.tint, 'middle');
  gsap.set(monNext, { scale: 0 });
  const owners = [[C.tint, 'Nadia', C.deep], [C.blue, 'Bridge', C.white], [C.grey, 'Admin', C.deep], [C.blue, 'Bridge', C.white]];
  const tiles = owners.map(([fill, label, ink], i) => {
    const g = anim(railL); rect(g, -110, -48, 220, 96, fill, 14); SR.textEl(g, label, 0, 11, stL, ink, 'middle');
    gsap.set(g, { x: sx(i), y: RY }); return g;
  });

  /* ================= HERO (harbour costing) + WHITE TILE (the new request) ================= */
  const hero = { pos: anim(heroL) };
  hero.popg = anim(hero.pos); hero.tip = anim(hero.popg); hero.rot = anim(hero.tip);
  hero.bob = el('g', {}, hero.rot); hero.sq = anim(hero.bob); hero.jit = el('g', {}, hero.sq);
  hero.mainG = anim(hero.jit);
  path(hero.mainG, 'M-96,-48 H72 V48 H-96 A14,14 0 0 1 -110,34 V-34 A14,14 0 0 1 -96,-48 Z', C.yellow);
  hero.slice = anim(hero.sq);
  path(hero.slice, 'M70,-48 H96 A14,14 0 0 1 110,-34 V34 A14,14 0 0 1 96,48 H70 Z', C.yellow);
  hero.lab = anim(hero.jit); SR.textEl(hero.lab, 'Harbour', 0, 11, stL, C.deep, 'middle');
  const crack = stroke(hero.jit, 'M-18,-48 L-4,-22 L-24,2 L-2,24 L-14,48', C.deep, 6);
  const CL = crack.getTotalLength(); crack.setAttribute('stroke-dasharray', CL); crack.setAttribute('stroke-dashoffset', CL);
  gsap.set(hero.tip, { transformOrigin: '0% 100%' }); gsap.set(hero.rot, { transformOrigin: '50% 50%' });
  gsap.set(hero.sq, { transformOrigin: '50% 100%' }); gsap.set(hero.mainG, { transformOrigin: '50% 50%' });
  gsap.set(hero.pos, { x: FRI, y: RY + HY });

  const wt = { pos: anim(heroL) };
  wt.popg = anim(wt.pos); wt.size = anim(wt.popg); wt.rot = anim(wt.size); wt.sq = anim(wt.rot); wt.jit = el('g', {}, wt.sq);
  wt.bodyG = anim(wt.jit); rect(wt.bodyG, -110, -48, 220, 96, C.white, 14);
  wt.lab = anim(wt.jit); SR.textEl(wt.lab, 'Tender', 0, 11, stL, C.deep, 'middle');
  gsap.set([wt.size, wt.rot, wt.bodyG], { transformOrigin: '50% 50%' }); gsap.set(wt.sq, { transformOrigin: '50% 100%' });
  gsap.set(wt.pos, { x: -200, y: RY + HY });

  const squashG = (g, at, amt = 0.2) => { tl.to(g, { scaleX: 1 + amt, scaleY: 1 - amt, duration: 0.05, ease: 'power2.out' }, at - 0.03); tl.to(g, { scaleX: 1, scaleY: 1, duration: 0.55, ease: 'elastic.out(1.1,0.3)' }, at + 0.02); };
  const antic = (g, at, lead = 0.12) => { tl.to(g, { scaleX: 1.12, scaleY: 0.86, duration: lead - 0.02, ease: 'power2.out' }, at - lead); tl.to(g, { scaleX: 0.92, scaleY: 1.1, duration: 0.1, ease: 'power2.out' }, at - 0.02); tl.to(g, { scaleX: 1, scaleY: 1, duration: 0.2 }, at + 0.1); };
  // arc move for any pos group
  const arc = (pos, at, dur, x, y, apex) => {
    tl.to(pos, { x, duration: dur, ease: 'power1.inOut' }, at);
    tl.to(pos, { keyframes: [{ y: apex, duration: dur * 0.45, ease: 'power2.out' }, { y, duration: dur * 0.55, ease: 'power2.in' }] }, at);
  };

  /* ================= SCENE 1: HOOK (blue-deep) ================= */
  const hookS = el('g', {}, scenes);
  rect(hookS, 0, 0, W, H, C.deep);
  const floor = anim(hookS); rect(floor, 0, 820, W, 260, C.deepRaised); gsap.set(floor, { y: 1080 });
  const tW = SR.words(hookS, 'Say what moves', 960, 600, stD, C.white, { align: 'center' });
  gsap.set(railL, { y: HY });
  tl.fromTo(trackG, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 0.45, ease: 'power3.out' }, 0.1);
  tiles.forEach((g, i) => k.pop(g, T.tilesIn + i * 3 * FR, { dur: 0.4, ease: 'popBig', pitch: 420 + 60 * i, gain: 0.3, pan: -0.6 + 0.3 * i }));
  k.pop(hero.popg, T.tilesIn + 4 * 3 * FR, { dur: 0.4, ease: 'popBig', pitch: 700, gain: 0.35, pan: 0.6 });
  dayL.forEach((g, i) => k.pop(g, T.tilesIn + 0.3 + i * 2 * FR, { origin: '50% 100%', sfx: false }));
  // the shove
  SR.sfx(T.whiteIn, 'whoosh', { dur: 0.6, lo: 150, hi: 1200, gain: 0.35 });
  tl.to(wt.pos, { x: sx(0) - STEP, duration: T.shove - T.whiteIn, ease: 'power2.in' }, T.whiteIn);
  tl.to(wt.pos, { x: sx(0), duration: 0.25, ease: 'power2.out' }, T.shove);
  squashG(wt.sq, T.shove, -0.12);
  SR.sfx(T.shove, 'thunk', { gain: 0.5 }); SR.sfx(T.shove, 'tick', { pitch: 1100, gain: 0.4 });
  tiles.forEach((g, i) => tl.to(g, { x: sx(i + 1), duration: 0.25, ease: 'power2.out' }, T.shove + i * FR * 0.5));
  tl.to(hero.pos, { x: FRI + 150, duration: 0.25, ease: 'power2.out' }, T.shove + 0.02);
  tl.to(hero.tip, { rotation: 85, duration: 0.35, ease: 'power2.in' }, T.tip);
  SR.sfx(T.tip, 'tick', { pitch: 700, gain: 0.3, pan: 0.6 });
  tl.to(hero.pos, { y: 1320, x: `+=90`, duration: T.fallOut - 2.35, ease: 'power2.in' }, 2.35);
  SR.sfx(2.35, 'whoosh', { dur: 0.5, rise: false, lo: 2000, hi: 400, gain: 0.3, pan: 0.6 });
  SR.sfx(T.thud, 'thunk', { gain: 0.26, pan: 0.4 });
  // tilt down to the floor
  tl.to(railL, { y: HY - 1080, duration: 0.9, ease: 'power2.inOut' }, T.tilt);
  tl.to(wt.pos, { y: RY + HY - 1080, duration: 0.9, ease: 'power2.inOut' }, T.tilt);
  tl.to(floor, { y: 0, duration: 0.9, ease: 'power2.inOut' }, T.tilt);
  SR.sfx(T.tilt, 'whoosh', { dur: 0.9, rise: false, lo: 300, hi: 1500, gain: 0.25 });
  tl.set(hero.tip, { rotation: 0 }, T.tilt - 0.05);
  tl.set(hero.rot, { rotation: 180 }, T.tilt - 0.05);
  tl.set(hero.pos, { x: 1480, y: 772 + 1080 }, T.tilt - 0.05);
  tl.to(hero.pos, { y: 772, duration: 0.9, ease: 'power2.inOut' }, T.tilt);
  // flip upright and become the title
  const hopAt = T.flip - 0.45;
  antic(hero.sq, hopAt);
  arc(hero.pos, hopAt, 0.45, 960, 690, 520);
  tl.to(hero.rot, { rotation: 360, duration: 0.45, ease: 'power2.inOut' }, hopAt);
  SR.sfx(hopAt - 0.02, 'whoosh', { dur: 0.4, rise: false, lo: 500, hi: 3500, gain: 0.3 });
  squashG(hero.sq, T.flip, 0.25); SR.sfx(T.flip, 'pop', { pitch: 360, gain: 0.4 });
  tl.set(hero.rot, { rotation: 0 }, T.flip + 0.7);
  k.popWords(tW.groups, T.titleIn, { stagger: 3 * FR, dur: 0.5 });
  tl.to(tW.groups[1], { keyframes: [{ y: 5, duration: 0.05 }, { y: 0, duration: 0.5, ease: 'elastic.out(1,0.3)' }] }, T.flip + 0.02);
  // out: words fold, the tile leaps up, a blue block rises into the office
  k.outWords(tW.groups, T.toOffice);
  antic(hero.sq, T.toOffice + 0.1);
  tl.to(hero.pos, { y: -220, duration: 0.35, ease: 'power2.in' }, T.toOffice + 0.1);
  SR.sfx(T.toOffice + 0.08, 'whoosh', { dur: 0.35, lo: 600, hi: 5000, gain: 0.35 });
  const mid1 = k.blockWipe(wipeL, T.officeWipe, { dir: 'up', color: C.blue, dur: 0.5 });

  /* ================= SCENE 2: OFFICE (blue-301 wall) ================= */
  const offS = el('g', {}, scenes); gsap.set(offS, { autoAlpha: 0 });
  const cam = anim(offS);
  rect(cam, -400, -400, W + 800, H + 800, C.blue);
  const night = rect(cam, -400, -400, W + 800, H + 800, C.deep); gsap.set(night, { autoAlpha: 0 });
  // clock
  const clockA = anim(place(cam, 200, 440));
  circle(clockA, 0, 0, 58, C.white);
  [0, 90, 180, 270].forEach(a => rect(clockA, -4, -50, 8, 12, C.tint, 4).setAttribute('transform', `rotate(${a})`));
  const hHand = el('g', {}, clockA); rect(hHand, -5, -30, 10, 36, C.deep, 5);
  const mHand = el('g', {}, clockA); rect(mHand, -4, -44, 8, 50, C.deep, 4);
  circle(clockA, 0, 0, 8, C.deep);
  const clockLab = anim(place(cam, 200, 568)); const clockTx = SR.textEl(clockLab, 'Thu 15:00', 0, 0, stB, C.white, 'middle');
  [clockA, clockLab].forEach(g => gsap.set(g, { scale: 0 }));
  const DAY = 1440, M15 = 900;
  const clockKeys = [[23.9, 24.4, M15, 1020], [T.take2, T.take2, 1320, 1320], [27.45, 27.45, DAY + 450, DAY + 450], [T.take3, T.take3, M15, M15],
    [34.0, 34.8, M15, DAY + 540], [36.2, 37.6, DAY + 540, M15], [56.2, 56.2, 920, 920]];
  const clockMin = t => { let m = M15; for (const [a, b, m0, m1] of clockKeys) { if (t < a) break; m = t >= b ? m1 : SR.lerp(m0, m1, SR.smooth((t - a) / (b - a))); } return m; };
  SR.onTick(t => {
    const m = clockMin(t), mm = Math.floor(m) % 60, hh = Math.floor(m / 60) % 24;
    clockTx.textContent = `${m >= DAY ? 'Fri' : 'Thu'} ${hh}:${String(mm).padStart(2, '0')}`;
    mHand.setAttribute('transform', `rotate(${(m % 60) * 6})`);
    hHand.setAttribute('transform', `rotate(${((m / 60) % 12) * 30})`);
  });
  [[23.9, 24.4], [34.0, 34.8], [36.2, 37.6]].forEach(([a, b]) => { for (let s = a; s < b; s += 0.08) SR.sfx(s, 'tick', { pitch: 1700, gain: 0.12, pan: -0.7 }); });
  [T.take2 + 0.02, 27.45, 56.2].forEach(s => SR.sfx(s, 'tick', { pitch: 1400, gain: 0.25, pan: -0.7 }));

  // glass wall with the harbour project manager
  const winA = anim(cam);
  const win = SR.props.window(winA, 1380, 400, 360, 300, { sky: C.deep, frame: C.deepBand });
  const pmG = place(win.inner, 180, 300, 'scale(0.45)');
  const pm = SR.character(pmG, 0, 0, { shirt: C.blue, sleeve: C.deepBand, skin: SR.SKIN[2], helmet: C.yellow });
  rect(win.inner, 30, 262, 300, 38, C.deepBand);
  const pmPhone = anim(place(win.inner, 224, 176)); rect(pmPhone, -10, -18, 20, 36, C.white, 4); gsap.set(pmPhone, { scale: 0 });
  const fallen = anim(place(win.inner, 270, 250)); rect(fallen, -30, -12, 60, 24, C.yellow, 5); gsap.set(fallen, { scale: 0, rotation: 12 });
  gsap.set(winA, { scale: 0 });
  const pmLab = SR.words(cam, 'Harbour project manager', 1560, 776, stL, C.grey, { align: 'center' });
  // Nadia's door (take 4)
  const door = anim(place(cam, 1230, 860));
  rect(door, -62, -390, 124, 390, C.deep); circle(door, -38, -190, 9, C.grey);
  rect(door, -112, -312, 224, 60, C.white); SR.textEl(door, 'Client meeting', 0, -271, stL, C.deep, 'middle');
  gsap.set(door, { scale: 0 });
  // people
  const ctrl = SR.character(cam, 600, 860, { shirt: C.grey, sleeve: C.tint, skin: SR.SKIN[1], hair: 'side', hairColor: SR.HAIR[1] });
  const dirMove = anim(cam);
  const dir = SR.character(dirMove, 1010, 860, { shirt: C.white, sleeve: C.grey, skin: SR.SKIN[3], hair: 'short', collar: 'tie', tieColor: C.deep });
  gsap.set([ctrl.rise, dir.rise], { y: 320 });
  SR.props.table(cam, 280, 1200, 860, C.deep);
  SR.props.laptop(cam, 760, 860, C.deepBand);
  const deskPh = anim(place(cam, 960, 860)); rect(deskPh, -44, -30, 88, 30, C.deepBand, 8); rect(deskPh, -36, -46, 72, 18, C.tint, 9);
  const ctrlLab = SR.words(cam, 'Project controller', 600, 482, stL, C.grey, { align: 'center' });
  const dirLab = SR.words(cam, 'Sales director', 1010, 482, stL, C.grey, { align: 'center' });
  [...pmLab.groups, ...ctrlLab.groups, ...dirLab.groups].forEach(g => gsap.set(g, { scale: 0 }));
  // envelope, exclamation bubble, rewind icon
  const env = anim(cam); rect(env, -36, -24, 72, 48, C.white, 4); stroke(env, 'M-30,-18 L0,4 L30,-18', C.tint, 6); gsap.set(env, { x: 770, y: 790, scale: 0 });
  const excl = SR.bubble(cam, 1700, 352, { w: 110, h: 90, fill: C.white, tail: 'left', content: (g, ink) => { rect(g, -6, -30, 12, 38, ink, 6); circle(g, 0, 24, 7, ink); } });
  gsap.set(excl, { scale: 0 });
  const rw = anim(place(cam, 960, 540)); circle(rw, 0, 0, 100, C.deep); path(rw, 'M-4,-40 L-54,0 L-4,40 Z M56,-40 L6,0 L56,40 Z', C.white); gsap.set(rw, { scale: 0 });
  // take bubbles: the controller's answer, said out loud
  const say = (txt) => {
    const w = SR.measure(txt, stB) + 84, h = 96, g = anim(place(cam, 600, 392));
    path(g, `M-6,${h / 2 - 4} L36,${h / 2 + 40} L40,${h / 2 - 4} Z`, C.deep);
    rect(g, -w / 2, -h / 2, w, h, C.deep, h / 2);
    SR.textEl(g, txt, 0, 15, stB, C.white, 'middle');
    gsap.set(g, { scale: 0 }); return g;
  };
  const takeB = ['“Yes, I’ll fit it in”', '“Yes, I’ll email him tonight”', '“No”', '“Ask Nadia”'].map(say);

  // the controller's sentence, with three slots that click in on the read
  const sb = anim(place(cam, 760, 416));
  const sp = SR.measure('a b', stB) - SR.measure('ab', stB), PAD = 14;
  const lines = [['I can do it if', { chip: 'the harbour costing' }, 'moves to', { chip: 'Monday' }, '.'], ['I’ll check with', { chip: 'its project manager' }, '.']];
  const segW = s => typeof s === 'string' ? SR.measure(s, stB) : SR.measure(s.chip, stB) + 2 * PAD;
  const lineW = segs => segs.reduce((a, s, i) => a + segW(s) + (i && s !== '.' ? sp : 0), 0);
  const bw = Math.max(...lines.map(lineW)) + 100;
  rect(sb, -bw / 2, -95, bw, 190, C.deep, 40);
  path(sb, 'M-196,90 L-150,122 L-128,90 Z', C.deep);
  const sWords = [], chips = [];
  const bubbleInner = el('g', {}, sb);
  lines.forEach((segs, li) => {
    let x = -lineW(segs) / 2; const y = -15 + li * 60;
    segs.forEach((s, i) => {
      if (i && s !== '.') x += sp;
      const w = segW(s);
      if (typeof s === 'string') { const r = SR.words(bubbleInner, s, x, y, stB, C.white); sWords.push(...r.groups); }
      else {
        const og = anim(place(bubbleInner, x + w / 2, y - 13));
        el('rect', { x: -w / 2, y: -27, width: w, height: 54, rx: 10, fill: 'none', stroke: C.tint, 'stroke-width': 6, 'stroke-dasharray': '12 9' }, og);
        const fg = anim(place(bubbleInner, x + w / 2, y - 13)); rect(fg, -w / 2, -27, w, 54, C.blue, 10);
        const r = SR.words(bubbleInner, s.chip, x + PAD, y, stB, C.white);
        sWords.push(og); chips.push({ fg, words: r.groups });
      }
      x += w;
    });
  });
  gsap.set(sb, { scale: 0 });
  [...sWords, ...chips.flatMap(c => [c.fg, ...c.words])].forEach(g => gsap.set(g, { scale: 0 }));
  // line from the desk to the owner
  const dots = []; for (let i = 0; i < 16; i++) { const p = SR.bez([770, 846], [1120, 740], [1366, 640], i / 15); const d = anim(place(cam, p.x, p.y)); circle(d, 0, 0, 7, C.white); gsap.set(d, { scale: 0 }); dots.push(d); }
  // split screen: the project manager on the phone
  const split = anim(cam);
  rect(split, 880, 316, 1040, 764, C.deep);
  const pmBig = SR.character(split, 1440, 900, { shirt: C.blue, sleeve: C.deepBand, skin: SR.SKIN[2], helmet: C.yellow });
  rect(split, 1520, 588, 28, 58, C.white, 6);
  rect(split, 1080, 900, 760, 180, C.deepBand);
  const quote = anim(place(split, 1440, 450));
  { const w = Math.max(SR.measure('Transport can wait.', stB), SR.measure('The rest, Friday.', stB)) + 90;
    path(quote, 'M-20,70 L-60,112 L20,70 Z', C.blue); rect(quote, -w / 2, -75, w, 150, C.blue, 40);
    SR.textEl(quote, 'Transport can wait.', 0, -15, stB, C.white, 'middle'); SR.textEl(quote, 'The rest, Friday.', 0, 45, stB, C.white, 'middle'); }
  gsap.set(quote, { scale: 0 }); gsap.set(split, { x: 980 });

  // ---- 9.95: reveal the office, the tile lands in Friday ----
  k.show(offS, mid1); k.hide(hookS, mid1 + 0.02);
  tl.set(railL, { y: 0 }, mid1);
  tiles.forEach((g, i) => tl.set(g, { x: sx(i), y: RY }, mid1));
  tl.set(wt.pos, { x: 1010, y: 740 }, mid1); tl.set(wt.popg, { scale: 0 }, mid1);
  tl.set(hero.pos, { x: FRI, y: -160 }, mid1);
  tl.to(hero.pos, { y: RY, duration: T.tileLand - 10.0, ease: 'power2.in' }, 10.0);
  squashG(hero.sq, T.tileLand, 0.25); SR.sfx(T.tileLand, 'pop', { pitch: 520, gain: 0.5, pan: 0.35 });
  tl.fromTo(ctrl.rise, { y: 320 }, { y: 0, duration: 0.5, ease: 'popBig' }, 10.45); SR.sfx(10.45, 'boing', { pitch: 260, gain: 0.4, pan: -0.3 });
  k.pop(clockA, T.clock1, { ease: 'popBig', pitch: 900, gain: 0.3, pan: -0.7 }); k.pop(clockLab, T.clock1 + 0.12, { sfx: false });
  k.popWords(ctrlLab.groups, 11.0);
  tl.fromTo(dir.rise, { y: 320 }, { y: 0, duration: 0.5, ease: 'popBig' }, T.director); SR.sfx(T.director, 'boing', { pitch: 320, gain: 0.45, pan: 0.15 });
  k.pop(wt.popg, T.director + 0.35, { ease: 'popBig', rot: -12, pitch: 800, gain: 0.35 });
  k.popWords(dirLab.groups, 12.7);
  k.pop(winA, T.pm, { origin: '50% 50%', ease: 'popBig', pitch: 380, gain: 0.35, pan: 0.6 });
  k.popWords(pmLab.groups, 17.0);
  tl.to(hero.sq, { keyframes: [{ scaleX: 0.9, scaleY: 1.12, duration: 0.08 }, { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'elastic.out(1.1,0.3)' }] }, 17.1);
  SR.sfx(17.1, 'pop', { pitch: 640, gain: 0.3, pan: 0.35 });
  k.outWords([...ctrlLab.groups, ...dirLab.groups], 21.2);

  // ---- 22-36: four answers, each wiped by a white block (the new request crossing the frame) ----
  const takes = [T.take1, T.take2, T.take3, T.take4];
  takes.forEach(ts => k.blockWipe(wipeL, ts - 0.25, { dir: 'right', color: C.white, dur: 0.5 }));
  const reset = ts => {
    tl.set(wt.pos, { x: 1010, y: 740 }, ts); tl.set(wt.size, { scale: 1 }, ts); tl.set(wt.rot, { rotation: 0 }, ts);
    tl.set(hero.pos, { x: FRI, y: RY }, ts); tl.set(hero.rot, { rotation: 0 }, ts); tl.set(hero.tip, { rotation: 0 }, ts);
    tl.set(crack, { attr: { 'stroke-dashoffset': CL } }, ts);
    tl.set(dirMove, { x: 0, y: 0 }, ts); tl.set([pmPhone, fallen, excl], { scale: 0 }, ts);
  };
  takes.forEach((ts, i) => { reset(ts); k.pop(takeB[i], ts + 0.35, { origin: '50% 100%', ease: 'popBig', pitch: 600 + 80 * i, gain: 0.35, pan: -0.3 }); if (i < 3) tl.set(takeB[i], { scale: 0 }, takes[i + 1]); });
  tl.set(night, { autoAlpha: 1 }, T.take2); tl.set(night, { autoAlpha: 0 }, 27.45);
  // take 1: squeeze it in, the harbour tile cracks, the day runs to 17:00
  arc(wt.pos, 23.0, 0.4, FRI - 24, RY + 6, 110);
  tl.to(wt.rot, { rotation: -6, duration: 0.4 }, 23.0);
  SR.sfx(22.98, 'whoosh', { dur: 0.4, rise: false, lo: 500, hi: 3500, gain: 0.3 });
  squashG(wt.sq, 23.4, 0.2);
  SR.sfx(23.4, 'impact', { gain: 0.45, pan: 0.35 });
  k.draw(crack, 23.4, 0.1);
  tl.to(hero.rot, { rotation: 9, duration: 0.5, ease: 'elastic.out(1,0.35)' }, 23.4);
  tl.to(hero.pos, { y: RY + 16, duration: 0.3, ease: 'power2.out' }, 23.4);
  // take 2: email at night, the owner finds out at 7:30 with his tile already gone
  arc(wt.pos, 26.3, 0.4, FRI, RY, 110);
  SR.sfx(26.28, 'whoosh', { dur: 0.4, rise: false, lo: 500, hi: 3500, gain: 0.3 });
  squashG(wt.sq, 26.7, 0.2); SR.sfx(26.7, 'thunk', { gain: 0.4, pan: 0.35 });
  tl.to(hero.pos, { x: FRI + 150, duration: 0.2, ease: 'power2.out' }, 26.7);
  tl.to(hero.tip, { rotation: 85, duration: 0.3, ease: 'power2.in' }, 26.85);
  tl.to(hero.pos, { y: 1320, x: `+=80`, duration: 0.45, ease: 'power2.in' }, 27.0);
  k.pop(env, 26.95, { ease: 'popBig', pitch: 900, gain: 0.3 });
  arc(env, 27.05, 0.4, 1560, 560, 520);
  k.unpop(env, 27.45);
  SR.sfx(27.05, 'whoosh', { dur: 0.4, rise: false, lo: 800, hi: 4000, gain: 0.25, pan: 0.4 });
  k.pop(pmPhone, 27.5, { sfx: false }); k.pop(fallen, 27.5, { sfx: false });
  SR.sfx(27.55, 'rumble', { dur: 0.6, gain: 0.5, pan: 0.6 }); SR.sfx(27.55, 'zip', { dur: 0.15, gain: 0.2, pan: 0.6 }); SR.sfx(27.9, 'zip', { dur: 0.15, gain: 0.2, pan: 0.6 });
  SR.onTick(t => { const a = SR.win(t, 27.5, 28.4, 0.05); pmPhone.parentNode.setAttribute('transform', `translate(${224 + a * 3 * Math.sin(t * 2 * Math.PI * 22)},176)`); });
  k.pop(excl, 27.85, { origin: '20% 100%', ease: 'popBig', pitch: 1100, gain: 0.35, pan: 0.6 });
  // take 3: no, so the director goes to Nadia and comes back with twice the work
  tl.to(dirMove, { x: 950, duration: 0.4, ease: 'power2.in' }, 30.45);
  tl.to(dirMove, { keyframes: [{ y: -40, duration: 0.15, ease: 'power2.out' }, { y: 0, duration: 0.25, ease: 'power2.in' }] }, 30.45);
  tl.to(wt.pos, { x: 1010 + 950, duration: 0.4, ease: 'power2.in' }, 30.45);
  SR.sfx(30.43, 'whoosh', { dur: 0.4, rise: true, lo: 300, hi: 2500, gain: 0.3, pan: 0.6 });
  SR.sfx(30.95, 'tick', { pitch: 520, gain: 0.5, pan: 0.9 }); SR.sfx(30.97, 'thunk', { gain: 0.15, pan: 0.9 });
  tl.set(wt.size, { scale: 2 }, 31.2); tl.set(wt.pos, { y: 770 }, 31.2);
  tl.to(dirMove, { x: 0, duration: 0.45, ease: 'power2.out' }, 31.3);
  tl.to(wt.pos, { x: 1010, duration: 0.45, ease: 'power2.out' }, 31.3);
  SR.sfx(31.3, 'whoosh', { dur: 0.4, rise: false, lo: 300, hi: 2000, gain: 0.3, pan: 0.6 });
  squashG(wt.sq, 31.75, 0.18); SR.sfx(31.75, 'thunk', { gain: 0.55, pan: 0.2 });
  // take 4: ask Nadia, who is in a client meeting; the request hangs while the clock runs
  tl.set(wt.pos, { y: 740 }, T.take4);
  k.pop(door, 33.2, { origin: '50% 100%', ease: 'popBig', pitch: 300, gain: 0.35, pan: 0.5 });
  arc(wt.pos, 33.6, 0.5, 1080, 440, 400);
  SR.sfx(33.58, 'whoosh', { dur: 0.45, rise: false, lo: 400, hi: 2500, gain: 0.25 });
  SR.onTick(t => {
    const u = warp(t), a = SR.win(u, 34.1, 99, 0.3) * (t < T.rewind ? 1 : 1 - ramp(t, T.rewind, T.rewind + 0.5));
    wt.jit.setAttribute('transform', `translate(0,${a * 8 * Math.sin(u * 2 * Math.PI * 0.7)}) rotate(${a * 3 * Math.sin(u * 2 * Math.PI * 0.5)})`);
  });
  // freeze, rewind
  SR.sfx(T.freeze, 'tick', { pitch: 900, gain: 0.35 });
  k.pop(rw, T.rewind - 0.05, { ease: 'popBig', pitch: 500, gain: 0.4 });
  SR.sfx(T.rewind, 'whoosh', { dur: T.rewound - T.rewind, rise: false, lo: 4000, hi: 250, gain: 0.5 });
  tl.to(wt.pos, { x: 1010, y: 740, duration: 0.7, ease: 'power2.inOut' }, T.rewind + 0.1);
  k.unpop(door, T.rewind + 0.4, { origin: '50% 100%' });
  k.unpop(takeB[3], T.rewind + 0.6, { origin: '50% 100%' });
  k.unpop(rw, T.rewound - 0.15);
  tl.to(hero.rot, { keyframes: [{ rotation: 7, duration: 0.08 }, { rotation: -5, duration: 0.12 }, { rotation: 0, duration: 0.5, ease: 'elastic.out(1,0.3)' }] }, 38.3);
  SR.sfx(38.3, 'pop', { pitch: 700, gain: 0.25, pan: 0.35 });
  tl.to(winA, { keyframes: [{ scale: 1.05, duration: 0.08, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.5, ease: 'elastic.out(1,0.3)' }] }, T.whoHears);
  SR.sfx(T.whoHears, 'pop', { pitch: 420, gain: 0.25, pan: 0.6 });

  // ---- 44-56: the sentence ----
  k.unpop([clockA, clockLab], T.toLine);
  k.pop(sb, 45.6, { origin: '20% 100%', ease: 'popBig', pitch: 520, gain: 0.35, pan: -0.3 });
  k.popWords(sWords, 45.75, { sfx: false });
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
  k.unpop(sb, 54.2, { origin: '20% 100%' });

  // ---- 55.5-64: the phone call, split screen ----
  SR.onTick(t => { const a = SR.win(t, 55.5, 56.25, 0.05); deskPh.setAttribute('transform', `translate(${a * 4 * Math.sin(t * 2 * Math.PI * 25)},${-a * 3})`); });
  [55.5, 55.9].forEach(s => { for (let i = 0; i < 7; i++) SR.sfx(s + i * 0.045, 'tick', { pitch: i % 2 ? 1900 : 2400, gain: 0.22, pan: 0.1 }); });
  k.pop(clockA, 56.15, { ease: 'popBig', pitch: 900, gain: 0.25, pan: -0.7 }); k.pop(clockLab, 56.25, { sfx: false });
  dots.forEach((d, i) => k.unpop(d, T.split + i * FR * 0.5, { dur: 0.15 }));
  tl.to(split, { x: 0, duration: 0.45, ease: 'power3.out' }, T.split);
  SR.sfx(T.split, 'whoosh', { dur: 0.45, rise: false, lo: 300, hi: 4000, gain: 0.35, pan: 0.5 });
  k.unpop(wt.popg, T.split - 0.05); k.pop(wt.popg, 63.8, { ease: 'popBig', pitch: 800, gain: 0.3 });
  k.pop(quote, 57.9, { origin: '35% 100%', ease: 'popBig', pitch: 700, gain: 0.35, pan: 0.5 });
  antic(hero.sq, T.tileBack);
  arc(hero.pos, T.tileBack, 0.35, FRI, RY, 60);
  squashG(hero.sq, T.tileBack + 0.35, 0.22); SR.sfx(T.tileBack + 0.35, 'thunk', { gain: 0.4, pan: 0.35 });
  tl.to(hero.slice, { x: MONX - 90 - FRI - 90 + 20, duration: 0.55, ease: 'power1.inOut' }, T.slice);
  tl.to(hero.slice, { keyframes: [{ y: -80, duration: 0.25, ease: 'power2.out' }, { y: 0, duration: 0.3, ease: 'power2.in' }] }, T.slice);
  SR.sfx(T.slice, 'sparkle', { gain: 0.3, pan: 0.5 }); SR.sfx(T.slice + 0.55, 'pop', { pitch: 900, gain: 0.3, pan: 0.6 });
  k.unpop(quote, 63.3, { origin: '35% 100%' });
  tl.to(split, { x: 980, duration: 0.4, ease: 'power3.in' }, 63.5);
  SR.sfx(63.5, 'whoosh', { dur: 0.4, rise: true, lo: 300, hi: 3000, gain: 0.25, pan: 0.5 });

  // ---- 64-69.4: the clash, pushed in ----
  arc(wt.pos, 64.0, 0.4, FRI - 26, RY + 4, 100);
  tl.to(wt.rot, { rotation: -5, duration: 0.4 }, 64.0); tl.to(hero.rot, { rotation: 4, duration: 0.3 }, 64.35);
  squashG(wt.sq, 64.4, 0.15); SR.sfx(64.4, 'thunk', { gain: 0.55, pan: 0.2 });
  const PS = 2.2, push = { scale: PS, x: 960 - FRI * PS, y: 470 - RY * PS };
  tl.fromTo([cam, railL, heroL], { scale: 1, x: 0, y: 0, svgOrigin: '0 0' }, Object.assign({ duration: 1.0, ease: 'power3.inOut', svgOrigin: '0 0', immediateRender: false }, push), 64.3);
  SR.sfx(64.45, 'rumble', { dur: 4.7, gain: 0.45 });
  SR.onTick(t => {
    const a = SR.win(t, 64.45, T.slam, 0.2);
    if (t > 50) {
      wt.jit.setAttribute('transform', `translate(${a * 3 * Math.sin(t * 2 * Math.PI * 11)},${a * 1.5 * Math.sin(t * 2 * Math.PI * 7)}) rotate(${a * 2.2 * Math.sin(t * 2 * Math.PI * 7)})`);
    }
    hero.jit.setAttribute('transform', `translate(${-a * 3 * Math.sin(t * 2 * Math.PI * 10)},0) rotate(${-a * 2 * Math.sin(t * 2 * Math.PI * 8)})`);
  });
  // a question bubble grows into the next scene
  const qb = SR.bubble(wipeL, 960, 560, { w: 320, h: 180, fill: C.deep, tail: 'left', content: 'question' });
  gsap.set(qb, { scale: 0 });
  k.pop(qb, 68.9, { ease: 'popBig', pitch: 650, gain: 0.4 });
  k.unpop(qb.inner, 69.22, { dur: 0.15 });
  k.shapeWipe(qb, 69.4, { scale: 16, dur: 0.45, anticipate: 0.2 });
  const mid3 = 69.86;

  /* ================= SCENE 3: NADIA'S PHONE (blue-deep) ================= */
  const phS = el('g', {}, scenes); gsap.set(phS, { autoAlpha: 0 });
  rect(phS, 0, 0, W, H, C.deep);
  const craneA = anim(phS);
  const crane = SR.props.crane(craneA, 780, 900, 0.8, { color: C.white, accent: C.tint, angle: -40, cable: 110 });
  SR.onTick(t => crane.hook.setAttribute('transform', `rotate(${Math.sin(t * 2 * Math.PI * 0.4) * 5})`));
  const nadA = anim(phS);
  const nad = SR.character(nadA, 420, 900, { shirt: C.tint, sleeve: C.blue, skin: SR.SKIN[0], helmet: C.white });
  const ground = anim(phS); rect(ground, 0, 900, W, 180, C.deepRaised);
  const nadLab = SR.words(phS, 'Nadia, at a client site', 420, 510, stL, C.tint, { align: 'center' });
  nadLab.groups.forEach(g => gsap.set(g, { scale: 0 }));
  gsap.set(nad.rise, { y: 320 });
  const phA = anim(place(phS, 1460, 615));
  rect(phA, -240, -285, 480, 570, C.blue, 44);
  rect(phA, -220, -245, 440, 500, C.deepRaised, 24);
  rect(phA, -40, -268, 80, 10, C.deep, 5);
  const clipId = 'scr'; const cp = el('clipPath', { id: clipId }, document.querySelector('#stage defs')); rect(cp, -220, -245, 440, 500, '#000', 24);
  const msgs = el('g', { 'clip-path': `url(#${clipId})` }, phA);
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
  // the plan: a miniature of the rail
  const m2 = anim(place(set2, 200, 10));
  rect(m2, -400, -230, 400, 230, C.blue, 26);
  rect(m2, -340, -200, 130, 28, C.white, 6); rect(m2, -340, -168, 130, 28, C.yellow, 6);
  el('rect', { x: -160, y: -203, width: 120, height: 66, rx: 8, fill: 'none', stroke: C.tint, 'stroke-width': 6, 'stroke-dasharray': '10 8' }, m2);
  rect(m2, -154, -197, 26, 54, C.yellow, 6);
  SR.textEl(m2, 'Fri', -275, -100, stL, C.white, 'middle'); SR.textEl(m2, 'Mon', -100, -100, stL, C.white, 'middle');
  SR.textEl(m2, 'Here’s the plan.', -200, -34, stB, C.white, 'middle');
  gsap.set(m2, { scale: 0 });
  const ts2 = stamp(set2, '16:10', 82);
  const r2 = msg(set2, 'OK, go.', 'left', 142, C.white, C.deep);
  gsap.set(phA, { scale: 0 });

  k.show(phS, mid3); k.hide(offS, mid3 + 0.02); tl.set(qb, { autoAlpha: 0 }, mid3 + 0.04);
  tl.set([cam, railL, heroL], { scale: 1, x: 0, y: 0, svgOrigin: '0 0' }, mid3);
  tl.fromTo(nad.rise, { y: 320 }, { y: 0, duration: 0.5, ease: 'popBig' }, T.phone + 0.35); SR.sfx(T.phone + 0.35, 'boing', { pitch: 300, gain: 0.4, pan: -0.4 });
  k.pop(phA, T.phone + 0.6, { origin: '50% 100%', ease: 'popBig', pitch: 420, gain: 0.35, pan: 0.5 });
  k.popWords(nadLab.groups, T.phone + 0.75);
  k.pop(m1, T.msg1, { origin: '100% 100%', ease: 'popBig', sfx: false });
  k.pop(ts1, T.reply1 - 0.1, { origin: '0% 100%', sfx: false });
  k.pop(r1, T.reply1, { origin: '0% 100%', ease: 'popBig', sfx: false });
  // "do both": both tiles slam into Friday
  [wt, hero].forEach((o, i) => {
    tl.to(o.pos, { keyframes: [{ y: RY - 36, duration: 0.1, ease: 'power2.out' }, { y: RY, duration: 0.1, ease: 'power2.in' }] }, T.slam - 0.2 + i * FR);
    squashG(o.sq, T.slam + i * FR, 0.3);
  });
  SR.sfx(T.slam, 'thunk', { gain: 0.7, pan: 0.3 }); SR.sfx(T.slam + 0.02, 'impact', { gain: 0.2, pan: 0.3 });
  // the second message wipes the first
  tl.to(set1, { x: -460, duration: 0.45, ease: 'power3.inOut' }, T.msg2 - 0.1);
  tl.fromTo(set2, { x: 460 }, { x: 0, duration: 0.45, ease: 'power3.inOut' }, T.msg2 - 0.1);
  tl.set(m2, { scale: 1 }, T.msg2 - 0.1);
  SR.sfx(T.msg2 - 0.1, 'whoosh', { dur: 0.45, rise: false, lo: 600, hi: 4000, gain: 0.3, pan: 0.5 });
  k.pop(ts2, T.reply2 - 0.1, { origin: '0% 100%', sfx: false });
  k.pop(r2, T.reply2, { origin: '0% 100%', ease: 'popBig', sfx: false });
  // the real rail rearranges to match the plan
  const RA = T.rearrange;
  tl.to(wt.pos, { x: FRI, y: RY - 25, duration: 0.5, ease: 'power3.inOut' }, RA);
  tl.to(wt.rot, { rotation: 0, duration: 0.5, ease: 'power3.inOut' }, RA);
  tl.to(wt.bodyG, { scaleY: 46 / 96, duration: 0.5, ease: 'power3.inOut' }, RA);
  tl.to(hero.rot, { rotation: 0, duration: 0.5, ease: 'power3.inOut' }, RA);
  tl.to(hero.pos, { x: FRI, y: RY + 25, duration: 0.5, ease: 'power3.inOut' }, RA + 0.06);
  tl.to(hero.slice, { y: -25, duration: 0.5, ease: 'power3.inOut' }, RA + 0.06);
  tl.to(hero.mainG, { x: 19, scaleX: 220 / 182, scaleY: 46 / 96, duration: 0.5, ease: 'power3.inOut' }, RA + 0.06);
  SR.sfx(RA + 0.5, 'pop', { pitch: 700, gain: 0.3, pan: 0.1 }); SR.sfx(RA + 0.56, 'pop', { pitch: 900, gain: 0.3, pan: 0.4 });
  life(nad, { seed: 0.7, side: 1, talk: [[72.3, 72.95], [78.1, 78.75]], listen: [[70.9, 72.2], [75.9, 78.0]] });

  /* ================= CALLBACK + END (blue-deep) ================= */
  const CB = T.callback;
  k.unpop(phA, CB, { origin: '50% 100%' }); k.outWords(nadLab.groups, CB);
  tl.to(nad.rise, { y: 320, duration: 0.35, ease: 'power2.in' }, CB + 0.05); tl.set(nadA, { autoAlpha: 0 }, CB + 0.42);
  k.unpop(craneA, CB + 0.08, { origin: '40% 100%' });
  tl.to(ground, { scaleY: 0, transformOrigin: '50% 100%', duration: 0.3, ease: 'power2.in' }, CB + 0.1);
  k.unpop(monNext, CB);
  SR.sfx(CB, 'whoosh', { dur: 0.5, rise: false, lo: 3000, hi: 300, gain: 0.35 });
  const RD = CB + 0.2;
  tl.to(railL, { y: HY, duration: 0.6, ease: 'power3.inOut' }, RD);
  tl.to(hero.pos, { y: RY + HY, duration: 0.6, ease: 'power3.inOut' }, RD);
  tl.to(hero.slice, { x: 0, y: 0, duration: 0.5, ease: 'power3.inOut' }, RD);
  tl.to(hero.mainG, { x: 0, scaleX: 1, scaleY: 1, duration: 0.5, ease: 'power3.inOut' }, RD);
  tl.to(wt.pos, { x: -200, y: RY + HY, duration: 0.55, ease: 'power2.in' }, RD);
  tl.to(wt.bodyG, { scaleY: 1, duration: 0.4 }, RD);
  // same first frame, the opposite result
  SR.sfx(T.white2, 'whoosh', { dur: 0.6, lo: 150, hi: 1200, gain: 0.35 });
  tl.to(wt.pos, { x: sx(0) - STEP, duration: T.shove2 - T.white2, ease: 'power2.in' }, T.white2);
  tl.to(wt.pos, { x: sx(0), duration: 0.25, ease: 'power2.out' }, T.shove2);
  squashG(wt.sq, T.shove2, -0.12);
  SR.sfx(T.shove2, 'thunk', { gain: 0.45 }); SR.sfx(T.shove2, 'tick', { pitch: 1100, gain: 0.35 });
  tiles.forEach((g, i) => tl.to(g, { x: sx(i + 1), duration: 0.25, ease: 'power2.out' }, T.shove2 + i * FR * 0.5));
  // the owner's hand
  const hand = anim(fxL);
  rect(hand, -36, -1200, 72, 1170, C.blue);
  rect(hand, -40, -64, 80, 22, C.deepBand, 6);
  circle(hand, 0, -20, 34, SR.SKIN[2]);
  [-22, -7, 8, 23].forEach(x => rect(hand, x - 6, -8, 12, 26, SR.SKIN[2], 6));
  gsap.set(hand, { x: FRI, y: -200 });
  const top = RY + HY - 48;
  tl.to(hand, { y: top, duration: 0.3, ease: 'power2.out' }, T.hand);
  SR.sfx(T.hand, 'whoosh', { dur: 0.3, rise: false, lo: 400, hi: 2500, gain: 0.25, pan: 0.4 });
  SR.sfx(T.hand + 0.3, 'tick', { pitch: 900, gain: 0.3, pan: 0.4 });
  tl.to(hand, { y: top - 170, duration: 0.3, ease: 'power2.out' }, T.hand + 0.33);
  tl.to(hero.pos, { y: RY + HY - 170, duration: 0.3, ease: 'power2.out' }, T.hand + 0.33);
  k.pop(monNext, T.hand + 0.55, { ease: 'popBig', pitch: 420, gain: 0.3, pan: 0.6 });
  tl.to([hand, hero.pos], { x: MONX, duration: 0.6, ease: 'power1.inOut' }, T.hand + 0.7);
  tl.to(hand, { y: top, duration: 0.25, ease: 'power2.in' }, T.place - 0.25);
  tl.to(hero.pos, { y: RY + HY, duration: 0.25, ease: 'power2.in' }, T.place - 0.25);
  squashG(hero.sq, T.place, 0.12);
  SR.sfx(T.place, 'tick', { pitch: 1300, gain: 0.5, pan: 0.5 }); SR.sfx(T.place, 'pop', { pitch: 420, gain: 0.25, pan: 0.5 });
  tl.to(hand, { y: -300, duration: 0.4, ease: 'power2.in' }, T.place + 0.2);
  const endLine = SR.words(phS, 'Ask the owner before it moves.', 960, 820, stT, C.white, { align: 'center' });
  endLine.groups.forEach(g => gsap.set(g, { scale: 0 }));
  k.popWords(endLine.groups, T.endLine, { sfx: 'tick' });
  // end card: the rail folds away, the tile becomes the bar under the title
  const EC = T.endCard;
  [...tiles, wt.popg, monNext].forEach((g, i) => k.unpop(g, EC - 0.35 + i * 2 * FR, { dur: 0.2 }));
  [...dayL].forEach((g, i) => k.unpop(g, EC - 0.3 + i * FR, { origin: '50% 100%', dur: 0.18 }));
  tl.to(trackG, { scaleX: 0, transformOrigin: '100% 50%', duration: 0.3, ease: 'power3.in' }, EC - 0.3);
  tl.set(panel, { autoAlpha: 0 }, EC);
  const eT = SR.words(phS, 'Say what moves', 960, 520, stD, C.white, { align: 'center' });
  eT.groups.forEach(g => gsap.set(g, { scale: 0 }));
  antic(hero.sq, EC + 0.05);
  arc(hero.pos, EC + 0.05, 0.42, 960, 640, 420);
  SR.sfx(EC + 0.03, 'whoosh', { dur: 0.4, rise: false, lo: 500, hi: 3500, gain: 0.3 });
  squashG(hero.sq, EC + 0.47, 0.25); SR.sfx(EC + 0.47, 'boing', { pitch: 330, dur: 0.5, gain: 0.5 });
  k.popWords(eT.groups, EC + 0.2, { stagger: 3 * FR, dur: 0.5, sfx: false });
  tl.to(endLine.groups, { y: 40, duration: 0.5, ease: 'power3.inOut' }, EC);

  /* ================= people, alive ================= */
  const ctrlArms = (t, g) => {
    const p = ramp(t, 33.0, 33.3) * (1 - ramp(t, T.rewind + 0.2, T.rewind + 0.9));
    return p > 0.001 ? [0, Math.max(p, g)] : null;
  };
  life(ctrl, { seed: 0.3, side: 1, tm: warp, talk: [[46.0, 53.5]], listen: [[22.55, 23.2], [26.0, 26.5], [56.9, 57.6], [61.6, 62.4]], shake: [[29.55, 30.3]], arms: ctrlArms });
  life(dir, { seed: 1.4, side: -1, tm: warp, talk: [[12.8, 15.9]], listen: [[46.2, 53.4]] });
  life(pm, { seed: 2.2, side: -1, listen: [[17.0, 18.6], [T.whoHears, T.whoHears + 1.4], [51.6, 53.6]] });
  life(pmBig, { seed: 0.9, side: -1, talk: [[56.8, 57.6]], shake: [[57.7, 58.45]], arms: () => [0, 0] });

  /* ================= captions (every spoken line) ================= */
  const caps = SR.captions(capL, [
    { t0: 10.6, t1: 12.4, text: 'Thursday, three o’clock.' },
    { t0: 12.6, t1: 16.3, text: 'The sales director needs figures for a tender by Friday noon.' },
    { t0: 16.5, t1: 19.3, text: 'Friday already belongs to someone else.' },
    { t0: 22.45, t1: 23.9, text: 'Four answers.' },
    { t0: 23.9, t1: 28.6, text: 'Each one protects somebody, and each one surprises somebody else.' },
    { t0: 37.1, t1: 39.4, text: 'Something was going to move anyway.' },
    { t0: 39.45, t1: 43.3, text: 'The question is who hears in time to say no.' },
    { t0: 46.1, t1: 50.6, text: 'I can have the figures by Friday noon if the harbour costing moves to Monday.' },
    { t0: 50.6, t1: 54.0, text: 'I’ll check that with its project manager and tell you by four.' },
    { t0: 57.6, t1: 59.5, text: 'He says no. Good.' },
    { t0: 59.5, t1: 62.0, text: 'That is what the question was for.' },
    { t0: 64.7, t1: 69.0, text: 'Now it is a real clash, and no rule says who wins.' },
    { t0: 70.1, t1: 73.4, text: 'Send Nadia a puzzle and she answers both.' },
    { t0: 75.6, t1: 79.2, text: 'Send her a plan, and she can approve it in one word.' }
  ]);
  caps.forEach(c => { k.show(c.g, c.t0); k.hide(c.g, c.t1); });
};
