/* "Same page" v2: 80 s refresher for Topic 4, Their view first. Caslon voice (rule 4).
 * Shape: freeze and replay. Hero: the lift plan sheet; two copies that only lock into one after the say-back.
 * Dialogue lives in speech bubbles (muted-safe). Mira's bubbles are the yellow accent: the information he is missing.
 */
window.FILM = async function (SR, tl, root, T, cues) {
  const { C, W, H, FR, el, place, anim, rect, circle, path, stroke } = SR;
  const k = SR.kit(tl);
  const stTitle = SR.style('title'), stBody = SR.style('body'), stLabel = SR.style('label');
  const defs = document.querySelector('#stage defs');
  CustomEase.create('inOutC', 'M0,0 C0.65,0 0.35,1 1,1');

  /* ---------- time warp: run 1 freezes, rewinds to the end of Mira's sentence, the replay starts at T.replay ---------- */
  const F0 = T.freeze, F1 = T.freeze + 0.35, R1 = T.rewindEnd - 0.05;
  SR.setWarp(t => {
    if (t < F0 || t >= T.replay) return t;
    if (t < F1) return F0;
    if (t < R1) { const u = (t - F1) / (R1 - F1), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; return F0 - (F0 - T.herEnd) * e; }
    return T.herEnd;
  });

  /* ---------- layers ---------- */
  const world = el('g', {}, root);
  const cam = el('g', {}, world);
  const drift = el('g', {}, cam);         // slow idle push per shot (warped time, so it reverses in the rewind)
  rect(drift, 0, 0, W, H, C.deep);
  const sC = el('g', {}, drift);
  const sheetsL = el('g', {}, drift);
  const dimL = el('g', {}, drift);
  const bubL = el('g', {}, drift);
  const hud = el('g', {}, drift);
  const endBg = el('g', {}, drift); rect(endBg, 0, 0, W, H, C.deep); gsap.set(endBg, { autoAlpha: 0 });
  const sT = el('g', {}, drift);
  const endL = el('g', {}, drift);
  const cardL = el('g', {}, root);
  const capL = el('g', {}, root);
  const shots = [[0, T.thu], [T.thu, T.freeze], [T.replay, T.push], [T.pullBack + 0.6, T.thu2], [T.thu2, T.collapse], [T.collapse, 80]];
  SR.onTick(tt => { const sh = shots.find(([a, b]) => tt >= a && tt < b); const z = sh ? 1 + 0.02 * SR.smooth((tt - sh[0]) / (sh[1] - sh[0])) : 1; drift.setAttribute('transform', `translate(${960 * (1 - z)},${540 * (1 - z)}) scale(${z})`); });
  // colour drains to grey for the freeze and the rewind (real time)
  const flt = el('filter', { id: 'grey', 'color-interpolation-filters': 'sRGB' }, defs);
  const sat = el('feColorMatrix', { type: 'saturate', values: 1 }, flt);
  SR.onTick((tt, t) => {
    const g = SR.smooth((t - F0) / 0.35) * (1 - SR.smooth((t - T.rewindEnd) / 0.08));
    if (g > 0.001) { sat.setAttribute('values', 1 - 0.85 * g); world.setAttribute('filter', 'url(#grey)'); } else world.removeAttribute('filter');
  });

  /* ---------- helpers ---------- */
  // hi-vis vest in the standard layout: tint panels, two bands round the torso, two over the shoulders
  const hiVis = (c) => {
    const v = el('g'); c.body.insertBefore(v, c.body.children[1]);
    path(v, 'M-108,600 C-104,570 -84,556 -56,552 L-26,552 L-26,760 L-118,760 Z', C.tint);
    path(v, 'M108,600 C104,570 84,556 56,552 L26,552 L26,760 L118,760 Z', C.tint);
    rect(v, -70, 554, 14, 96, C.white, 3); rect(v, 56, 554, 14, 96, C.white, 3);
    rect(v, -114, 650, 88, 14, C.white, 3); rect(v, 26, 650, 88, 14, C.white, 3);
    rect(v, -116, 700, 90, 14, C.white, 3); rect(v, 26, 700, 90, 14, C.white, 3);
  };
  const wrap = (text, st, maxW) => { const L = []; let cur = []; text.split(' ').forEach(w => { const t = [...cur, w].join(' '); if (cur.length && SR.measure(t, st) > maxW) { L.push(cur.join(' ')); cur = [w]; } else cur.push(w); }); if (cur.length) L.push(cur.join(' ')); return L; };
  const rise = (groups, at, per = 0.08, dur = 0.35) => groups.forEach((g, i) => tl.fromTo(g, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: dur, ease: 'pop', immediateRender: false }, at + i * per));
  const say = (x, y, text, o = {}) => {
    const st = stBody, fill = o.fill || C.white, lines = wrap(text, st, o.maxW || 600);
    const w = Math.max(...lines.map(l => SR.measure(l, st))) + 64, h = lines.length * st.lh + 40;
    const p = place(bubL, x, y), a = anim(p);
    const tx = o.tail === 'right' ? w / 2 - 70 : -w / 2 + 70, dir = o.tail === 'right' ? 1 : -1;
    path(a, `M${tx - 26},${h / 2 - 8} L${tx + dir * 54},${h / 2 + 50} L${tx + 26},${h / 2 - 8} Z`, fill);
    rect(a, -w / 2, -h / 2, w, h, fill, 30);
    const groups = [];
    lines.forEach((ln, i) => groups.push(...SR.words(a, ln, -w / 2 + 32, -h / 2 + 20 + st.size * 0.8 + i * st.lh, st, C.deep).groups));
    gsap.set(a, { scale: 0 }); gsap.set(groups, { opacity: 0 });
    return { p, a, groups, w, h, origin: o.tail === 'right' ? '85% 100%' : '15% 100%' };
  };
  const type = (b, at, per = 0.09, o = {}) => {
    if (o.pop !== false) k.pop(b.a, at, { origin: b.origin, ease: 'popBig', dur: 0.4, pitch: o.pitch || 600, pan: o.pan, gain: 0.35 });
    const t0 = at + (o.pop === false ? 0 : 0.18);
    rise(b.groups, t0, per);
    for (let i = 0; i < b.groups.length; i += 2) SR.sfx(t0 + i * per, 'tick', { pitch: 2800 + (i % 4) * 250, gain: 0.22, pan: o.pan });
    return t0 + b.groups.length * per;
  };
  // side-view flatbed: cab at the left, two axles; the same shape on the plan and on the quay
  const truckIcon = (g, ink) => { rect(g, -70, -30, 34, 34, ink, 5); rect(g, -38, -12, 108, 16, ink, 3); circle(g, -52, 10, 9, ink); circle(g, 50, 10, 9, ink); rect(g, -64, -24, 18, 12, C.white, 2); };
  const sheet = (parent, cx, cy, o = {}) => {
    const p = place(parent, cx, cy), a = anim(p);
    rect(a, -200, -140, 400, 280, C.white, 14);
    SR.textEl(a, 'Lift sequence', -176, -96, stLabel, C.deep);
    const hx = -176 + SR.measure('Lift sequence', stLabel);
    const iss = anim(place(a, hx, -96)); SR.textEl(iss, ': issued', 0, 0, stLabel, C.deep);
    const ticks = [0, 1].map(i => { const g = anim(place(a, 146 + i * 30, -106)); circle(g, 0, 0, 13, C.blue); stroke(g, 'M-6,0 L-1,5 L7,-5', C.white, 4); return g; });
    if (!o.issued) { gsap.set(iss, { opacity: 0 }); gsap.set(ticks, { scale: 0 }); }
    SR.icon(place(a, -112, 38, 'scale(0.46)'), 'crane', C.deep, C.blue, { fill: C.white });
    [30, 95, 160].forEach((x, i) => { const m = place(a, x, 52); circle(m, 0, 0, 26, C.blue); SR.textEl(m, 'P' + (i + 1), 0, 11, stLabel, C.white, 'middle'); });
    const tA = anim(place(a, -176, 118)); SR.textEl(tA, 'Start 07:00', 0, 0, stLabel, C.deep);
    const tB = anim(place(a, -176, 118)); SR.textEl(tB, 'Start 10:30', 0, 0, stLabel, C.deep);
    gsap.set(o.late ? tA : tB, { scale: 0 });
    const tr = anim(place(a, 95, 2)); truckIcon(tr, C.deep); if (!o.trucks) gsap.set(tr, { scale: 0 });
    const ck = anim(place(a, 150, -86)); circle(ck, 0, 0, 30, C.deep);
    const arc = stroke(ck, 'M0,21 A21,21 0 0 1 -18.2,-10.5', C.yellow, 9);
    rect(ck, -3, -19, 6, 19, C.white, 3); rect(ck, -3, -3, 14, 6, C.white, 3);
    if (!o.clock) { gsap.set(ck, { scale: 0 }); }
    const pz = anim(place(a, 150, -30)); circle(pz, 0, 0, 16, C.deep); rect(pz, -7, -8, 5, 16, C.white, 2); rect(pz, 2, -8, 5, 16, C.white, 2);
    if (!o.pause) gsap.set(pz, { scale: 0 });
    const sp = anim(place(a, 92, 113)), spi = place(sp, 0, 0, 'rotate(-4) scale(0.75)');
    el('rect', { x: -112, y: -28, width: 224, height: 56, rx: 6, fill: C.white, stroke: C.blue, 'stroke-width': 6 }, spi);
    SR.textEl(spi, 'Revised, checked', 0, 11, stLabel, C.blue, 'middle');
    if (!o.stamp) gsap.set(sp, { scale: 0 });
    return { p, a, iss, ticks, tA, tB, tr, ck, arc, pz, sp };
  };
  const mouthOverride = (c, wins, kind) => SR.onTick(tt => { if (SR.inWins(tt, wins, 0.1) > 0.5) c.mouth.setAttribute('transform', kind === 'tight' ? 'translate(0,-2) scale(0.95,0.22)' : 'scale(1.3,1.5)'); });

  /* ========== 0:00 One sheet, already there; it peels into two copies; the client's truck lands on Mira's ========== */
  const A = sheet(sheetsL, 735, 505);
  const B = sheet(sheetsL, 1185, 535);
  tl.fromTo([A.a, B.a], { x: i => [225, -225][i], y: i => [-35, -65][i], scale: 1.4 }, { x: i => [225, -225][i], y: i => [-35, -65][i], scale: 1.4, duration: 0.01 }, 0);
  SR.sfx(T.flutter, 'whoosh', { dur: 0.5, rise: false, lo: 2500, hi: 7000, gain: 0.25 });
  tl.to(B.a, { rotation: -7, duration: 12 * FR, ease: 'power2.out', transformOrigin: '0% 100%' }, T.peel);
  tl.to(B.a, { rotation: 0, duration: 0.4, ease: 'power2.inOut' }, T.peel + 12 * FR);
  SR.sfx(T.peel, 'whoosh', { dur: 0.4, rise: true, lo: 2000, hi: 7000, gain: 0.3 });
  tl.to(A.a, { x: 0, y: 0, scale: 1, duration: 1.4, ease: 'inOutC' }, T.drift);
  tl.to(B.a, { x: 0, y: 0, scale: 1, duration: 1.4, ease: 'inOutC' }, T.drift + 0.06);
  SR.sfx(T.drift, 'whoosh', { dur: 1.0, rise: false, lo: 300, hi: 1800, gain: 0.2 });
  tl.set(A.tr, { scale: 0, y: -40 }, T.truck1 - 0.02); tl.to(A.tr, { keyframes: [{ scale: 1.15, y: 2, duration: 6 * FR, ease: 'power2.in' }, { scale: 1, y: 2, duration: 4 * FR, ease: 'power2.out' }] }, T.truck1);
  SR.sfx(T.truck1 + 6 * FR, 'pop', { pitch: 360, gain: 0.5, pan: -0.3 }); SR.sfx(T.truck1 + 9 * FR, 'pop', { pitch: 520, gain: 0.4, pan: -0.3 });

  /* ========== 0:03 The quay and the office, the phone line, who is who ========== */
  const lp = anim(place(sC, 0, 0));
  rect(lp, 0, 0, 480, H, C.blue);
  path(lp, 'M240,560 L480,560 L480,760 L270,760 Z', C.deep); rect(lp, 300, 500, 70, 60, C.deep, 4); rect(lp, 380, 470, 18, 90, C.deep, 3);
  [[20, 620, 140, 80, C.deepBand], [20, 700, 140, 80, C.tint], [170, 660, 110, 120, C.deepBand]].forEach(([x, y, w, h, f]) => rect(lp, x, y, w, h, f, 4));
  const mira = SR.character(lp, 250, 812, { shirt: C.blue, sleeve: C.blue, skin: SR.SKIN[0], helmet: C.white, hair: 'none' }); hiVis(mira);
  rect(mira.armR.fore, -18, 52, 36, 64, C.deep, 8);
  rect(lp, 0, 800, 480, 56, C.grey); rect(lp, 0, 856, 480, 224, C.deepBand);
  [[60, 920], [220, 960], [120, 1010], [330, 900]].forEach(([x, y]) => stroke(lp, `M${x},${y} q20,-12 40,0 q20,12 40,0`, C.tint, 6));
  const bol = place(lp, 420, 800); path(bol, 'M-22,0 L-16,-40 C-30,-44 -30,-60 0,-60 C30,-60 30,-44 16,-40 L22,0 Z', C.deep);
  const rp = anim(place(sC, 0, 0));
  rect(rp, 1440, 0, 480, H, C.deepRaised);
  const pmP = place(rp, 1540, 822, 'scale(0.8)');
  const pm = SR.character(pmP, 0, 0, { shirt: C.white, sleeve: C.grey, skin: SR.SKIN[2], hair: 'side', hairColor: SR.HAIR[3], glasses: true, collar: 'tie', tieColor: C.blue });
  const ag = place(pm.body, 60, 470); rect(ag, 0, 0, 130, 300, C.white, 6); rect(ag, 0, 0, 130, 36, C.tint, 6); for (let i = 0; i < 8; i++) rect(ag, 16, 52 + i * 30, i % 3 === 2 ? 60 : 96, 10, C.grey, 5);
  const eng = SR.character(rp, 1730, 822, { shirt: C.tint, sleeve: C.blue, skin: SR.SKIN[1], hair: 'short', hairColor: SR.HAIR[0] });
  stroke(eng.head, 'M-70,-6 C-72,-104 72,-104 70,-6', C.deep, 10); rect(eng.head, -82, -14, 20, 40, C.deep, 8); rect(eng.head, 62, -14, 20, 40, C.deep, 8);
  stroke(eng.head, 'M72,22 C66,52 46,58 26,52', C.deep, 6);
  SR.props.table(rp, 1440, 1960, 822, C.deep);
  SR.props.laptop(rp, 1600, 822, C.blue);
  gsap.set(lp, { x: -520 }); gsap.set(rp, { x: 520 });
  tl.to(lp, { x: 0, duration: 0.7, ease: 'power3.out' }, T.panels);
  tl.to(rp, { x: 0, duration: 0.7, ease: 'power3.out' }, T.panels + 0.08);
  SR.sfx(T.panels, 'whoosh', { dur: 0.7, rise: true, lo: 200, hi: 2500, gain: 0.35 });
  tl.fromTo(mira.rise, { y: 440 }, { y: 0, duration: 0.5, ease: 'popBig' }, T.panels + 0.5); SR.sfx(T.panels + 0.5, 'boing', { pitch: 300, gain: 0.35, pan: -0.7 });
  tl.fromTo(eng.rise, { y: 440 }, { y: 0, duration: 0.5, ease: 'popBig' }, T.panels + 0.62); SR.sfx(T.panels + 0.62, 'boing', { pitch: 260, gain: 0.35, pan: 0.7 });
  tl.fromTo(pm.rise, { y: 500 }, { y: 0, duration: 0.5, ease: 'popBig' }, T.panels + 0.74);
  const lineP = stroke(sC, 'M352,470 L352,236 L1860,236 L1860,560 L1806,560', C.white, 6);
  k.draw(lineP, T.line, 0.8, { ease: 'power2.inOut' });
  SR.sfx(T.line, 'rumble', { dur: 1.0, gain: 0.12 });
  const lab = (str, x, y, st, align, at) => { const w = SR.words(hud, str, x, y, st, C.white, { align }); gsap.set(w.groups, { opacity: 0 }); rise(w.groups, at, 0.06); k.outWords(w.groups, T.labsOut); SR.sfx(at, 'tick', { gain: 0.15 }); return w; };
  lab('Tuesday 09:00, weekly project call', 960, 150, stBody, 'center', T.title);
  lab('Mira', 110, 330, stBody, 'left', T.labMira); lab('site supervisor,', 110, 374, stLabel, 'left', T.labMira + 0.2); lab('on the quay', 110, 414, stLabel, 'left', T.labMira + 0.3);
  lab('You', 1820, 400, stBody, 'right', T.labYou); lab('project engineer', 1820, 444, stLabel, 'right', T.labYou + 0.2);
  lab('Project manager', 1540, 530, stLabel, 'center', T.labPM);
  tl.to(B.iss, { opacity: 1, duration: 0.2 }, T.issued);
  B.ticks.forEach((g, i) => { k.pop(g, T.issued + 0.25 + 0.3 * i, { ease: 'popBig', sfx: false }); SR.sfx(T.issued + 0.25 + 0.3 * i, 'pluck', { note: [79, 84][i], gain: 0.25, pan: 0.4 }); });
  // acting: talk, listen, tight-lipped, relieved
  SR.charLife(mira, { seed: 0.2, side: 1, from: T.panels, to: T.collapse, talk: [[T.mira1, T.herEnd - 0.6], [T.mira2, T.mira2 + 1.0], [T.yes, T.yes + 0.8], [T.six, T.six + 0.7]], listen: [[T.his1, T.hisDrop], [T.say, T.carry], [T.ask, T.six], [T.view, T.nod + 0.8]] });
  SR.charLife(eng, { seed: 1.1, side: -1, from: T.panels, to: T.collapse, talk: [[T.his1, T.his1 + 1.2], [T.say, T.say + 1.3], [T.ask, T.ask + 0.8], [T.view, T.view + 1.8]], listen: [[T.mira1, T.herEnd], [T.yes, T.ask - 0.2], [T.six, T.view - 0.2]] });
  SR.charLife(pm, { seed: 2.2, side: 1, from: T.panels, to: T.collapse, talk: [[T.pm, T.pm + 0.7]] });
  mouthOverride(mira, [[T.mira2 + 1.1, T.thu]], 'tight');
  mouthOverride(eng, [[T.hisDrop, T.thu], [T.replay, T.say - 0.1]], 'tight');
  mouthOverride(mira, [[T.check, T.ask - 0.1]], 'relief'); mouthOverride(eng, [[T.check + 0.2, T.ask - 0.1]], 'relief');
  SR.onTick(tt => { if (tt >= T.panels && tt <= T.collapse) SR.setArms(mira, 0, 0.9); });

  /* ========== 0:14 Run 1: her point slides off his clean copy, his reply drops into the gap ========== */
  const MT = 'Position two doesn’t work. Since last week the client’s trucks are on the quay every morning.';
  const mira1 = say(670, 250, MT, { fill: C.yellow, tail: 'left', maxW: 590 });
  type(mira1, T.mira1, 0.11, { pan: -0.5 });
  tl.to(mira1.a, { x: 1185 - 670, y: 470 - 250, scale: 0.34, duration: 0.6, ease: 'power2.inOut' }, T.herEnd);
  tl.to(mira1.a, { x: 1420 - 670, y: 760 - 250, rotation: 28, scale: 0, duration: 0.55, ease: 'power2.in' }, T.herEnd + 0.6);
  SR.sfx(T.herEnd, 'whoosh', { dur: 0.6, rise: false, lo: 600, hi: 3000, gain: 0.25 }); SR.sfx(T.herEnd + 0.62, 'zip', { dur: 0.4, gain: 0.2 });
  const his1 = say(1300, 250, 'I checked it twice. The sequence is correct.', { tail: 'right', maxW: 520 });
  type(his1, T.his1, 0.1, { pan: 0.5 });
  tl.to(his1.a, { x: 960 - 1300, y: 380 - 250, scale: 0.16, duration: 0.35, ease: 'power2.in' }, T.hisDrop);
  tl.to(his1.a, { y: 1260 - 250, rotation: 40, duration: 0.55, ease: 'power2.in' }, T.hisDrop + 0.35);
  SR.sfx(T.hisDrop, 'whoosh', { dur: 0.35, rise: true, lo: 800, hi: 4000, gain: 0.3 }); SR.sfx(T.hisDrop + 0.36, 'thunk', { gain: 0.5 });
  const mira2 = say(670, 250, 'Fine. We’ll see on site.', { fill: C.yellow, tail: 'left' });
  type(mira2, T.mira2, 0.1, { pan: -0.5 }); k.unpop(mira2.a, T.cal - 0.1, { origin: mira2.origin });
  const pmb = say(1380, 440, 'Next item.', { fill: C.grey, tail: 'right' });
  type(pmb, T.pm, 0.1, { pan: 0.6 }); k.unpop(pmb.a, T.cal, { origin: pmb.origin });
  const cal = anim(place(hud, 960, 300)), calIn = anim(cal);
  rect(calIn, -130, -80, 260, 160, C.blue, 16);
  const cT1 = anim(calIn); SR.textEl(cT1, 'Tuesday', 0, 16, stBody, C.white, 'middle');
  const cT2 = anim(calIn); SR.textEl(cT2, 'Thursday', 0, 16, stBody, C.white, 'middle'); gsap.set(cT2, { scale: 0 });
  gsap.set(cal, { scale: 0 });
  k.pop(cal, T.cal, { ease: 'popBig', pitch: 500 });
  tl.to(calIn, { keyframes: [{ scaleY: 0, duration: 0.12, ease: 'power2.in' }, { scaleY: 1, duration: 0.2, ease: 'power2.out' }], transformOrigin: '50% 50%' }, T.calFlip);
  tl.set(cT1, { scale: 0 }, T.calFlip + 0.12); tl.set(cT2, { scale: 1 }, T.calFlip + 0.12);
  SR.sfx(T.calFlip, 'zip', { dur: 0.2, gain: 0.3 });
  k.shapeWipe(cal, T.wipeT, { scale: 16, dx: 0, dy: 240, dur: 0.5, anticipate: 0.2 });

  /* ========== 0:28 Thursday 07:00: boom stowed, the crane heads for P2 and stops nose to nose with the truck parked on it ========== */
  gsap.set(sT, { autoAlpha: 0 }); k.show(sT, T.thu);
  const sTa = anim(place(sT, 0, 0));
  rect(sTa, 0, 0, W, H, C.blue);
  path(sTa, 'M0,560 L520,560 L560,760 L0,760 Z', C.deepBand); [[1380, 470, 150, 290], [1700, 520, 180, 240]].forEach(([x, y, w, h]) => rect(sTa, x, y, w, h, C.deepBand, 4));
  // crew stand well clear, behind a barrier on the far side
  const crew = [[1640, SR.SKIN[3]], [1770, SR.SKIN[1]]].map(([x, sk]) => { const g = place(sTa, x, 772, 'scale(0.55)'); const c = SR.character(g, 0, 0, { shirt: C.blue, sleeve: C.blue, skin: sk, helmet: C.white, hair: 'none' }); hiVis(c); return c; });
  const bar = place(sTa, 1560, 700); rect(bar, 0, 0, 320, 26, C.white, 4); for (let i = 0; i < 4; i++) rect(bar, 20 + i * 80, 0, 40, 26, C.tint); rect(bar, 20, 26, 12, 34, C.white); rect(bar, 288, 26, 12, 34, C.white);
  rect(sTa, 0, 760, W, 320, C.deep);
  const mk = [600, 1000, 1400].map((x, i) => { const m = anim(place(sTa, x, 830)); el('ellipse', { cx: 0, cy: 0, rx: 64, ry: 22, fill: 'none', stroke: C.white, 'stroke-width': 6 }, m); SR.textEl(m, 'P' + (i + 1), 0, 74, stLabel, C.white, 'middle'); return m; });
  // the client's flatbed, parked on P2, cab facing the crane
  const trk = anim(place(sTa, 0, 0)), tg = place(trk, 0, 760);
  rect(tg, 870, -104, 70, 92, C.white, 8); rect(tg, 882, -92, 40, 30, C.deepBand, 4); rect(tg, 936, -40, 250, 28, C.grey, 4); circle(tg, 905, -6, 22, C.deepBand); circle(tg, 1080, -6, 22, C.deepBand); circle(tg, 1140, -6, 22, C.deepBand);
  // the crane: boom stowed low over the carrier, hook secured short
  const crA = anim(place(sTa, 0, 0));
  const crane = SR.props.crane(crA, 0, 790, 0.9, { color: C.white, accent: C.tint, angle: -10, cable: 26 });
  const outs = [-140, -60, 60, 140].map(dx => { const g = anim(place(crA, dx * 0.9, 760)); rect(g, -6, 0, 12, 44, C.tint, 3); rect(g, -26, 40, 52, 14, C.white, 4); gsap.set(g, { scaleY: 0, transformOrigin: '50% 0%' }); return g; });
  const path2 = stroke(sTa, 'M520,800 L990,800 M960,784 L992,800 L960,816', C.white, 6, { 'stroke-dasharray': '16 14' }); gsap.set(path2, { autoAlpha: 0 });
  SR.onTick(tt => {
    const boomA = gsap.getProperty(crane.boom, 'rotation');
    const s = tt - T.craneStop, sway = s > 0 && tt < T.thu2 ? 9 * Math.exp(-s * 2.6) * Math.sin(s * 2 * Math.PI * 2.5) : 0;
    const s2 = tt - (T.boomUp + 0.8), sway2 = s2 > 0 ? 6 * Math.exp(-s2 * 2.2) * Math.sin(s2 * 2 * Math.PI * 1.6) : 0;
    crane.hook.setAttribute('transform', `rotate(${-boomA + sway + sway2 + Math.sin(tt * 1.7) * 0.8})`);
  });
  crew.forEach((c, i) => SR.charLife(c, { seed: i + 0.5, side: -1, from: T.thu, to: T.collapse }));
  const thuL = SR.words(sTa, 'Thursday 07:00', 150, 200, stTitle, C.white); gsap.set(thuL.groups, { opacity: 0 }); rise(thuL.groups, T.thu + 0.2);
  const stopX = 864 - 144;
  tl.fromTo(crA, { x: -700 }, { x: stopX, duration: T.craneStop - T.craneIn, ease: 'power1.out', immediateRender: false }, T.craneIn);
  tl.set(path2, { autoAlpha: 1 }, T.craneIn + 0.3); tl.set(path2, { autoAlpha: 0 }, T.replay);
  tl.to(crA, { keyframes: [{ scaleX: 0.96, scaleY: 1.03, duration: 3 * FR }, { scaleX: 1, scaleY: 1, duration: 5 * FR, ease: 'power2.out' }], transformOrigin: '50% 100%' }, T.craneStop);
  SR.sfx(T.craneIn, 'rumble', { dur: T.craneStop - T.craneIn, gain: 0.6 }); SR.sfx(T.craneStop, 'thunk', { gain: 0.7 });
  tl.to(mk[1], { keyframes: [{ scale: 1.25, duration: 0.12 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1,0.35)' }], transformOrigin: '50% 50%' }, T.craneStop + 0.15);
  // the crew lead raises a hand: stop
  SR.onTick(tt => { if (tt > T.thu && tt < T.thu2) SR.setArms(crew[0], 0.9 * SR.win(tt, T.craneStop + 0.2, T.freeze + 2, 0.2), 0); });
  gsap.set(crA, { x: -700 });

  /* ========== 0:32 Freeze, drain to grey, rewind to the end of Mira's sentence ========== */
  SR.sfx(F1, 'whoosh', { dur: 0.8, rise: false, lo: 4000, hi: 800, gain: 0.35 });
  SR.sfx(F1 + 0.6, 'whoosh', { dur: 0.9, rise: false, lo: 5000, hi: 600, gain: 0.35 });
  SR.sfx(F1 + 1.4, 'whoosh', { dur: 0.9, rise: true, lo: 600, hi: 5000, gain: 0.3 });
  SR.sfx(F1, 'rumble', { dur: R1 - F1, gain: 0.2 });
  SR.sfx(T.rewindEnd, 'tick', { pitch: 3200, gain: 0.6 });

  /* ========== 0:35 Replay: same frame, his bubble empty; the frame dims to one question ========== */
  tl.set(sT, { autoAlpha: 0 }, T.replay);
  tl.set([his1.a, mira2.a, pmb.a, mira1.a, cal], { autoAlpha: 0 }, T.replay);
  const miraR = say(670, 250, MT, { fill: C.yellow, tail: 'left', maxW: 590 });
  gsap.set(miraR.groups, { opacity: 1 }); tl.set(miraR.a, { scale: 1 }, T.replay);
  const sayB = say(1300, 250, 'So since last week the trucks block position two every morning?', { tail: 'right', maxW: 520 });
  k.pop(sayB.a, T.replay + 0.05, { origin: sayB.origin, ease: 'popBig', pitch: 500, pan: 0.5, gain: 0.3 });
  const prog = rect(hud, 1300 - 200, 244, 0, 12, C.tint, 6);
  [T.tick1, T.tick2, T.tick3].forEach((at, i) => { tl.to(prog, { attr: { width: 400 * (i + 1) / 3 }, duration: 0.3, ease: 'power2.out' }, at); SR.sfx(at, 'tick', { pitch: 1800, gain: 0.45 }); });
  tl.set(prog, { autoAlpha: 0 }, T.say - 0.1);
  const dim = rect(dimL, 0, 0, W, H, C.deep); gsap.set(dim, { opacity: 0 });
  tl.to(dim, { opacity: 0.6, duration: 0.25 }, T.replay + 0.2); tl.to(dim, { opacity: 0, duration: 0.25 }, T.say - 0.3);
  const q1 = SR.words(hud, 'Mira has finished. You disagree.', 960, 690, stTitle, C.white, { align: 'center' });
  const q2 = SR.words(hud, 'What comes first?', 960, 790, stTitle, C.white, { align: 'center' });
  gsap.set([...q1.groups, ...q2.groups], { opacity: 0 });
  rise(q1.groups, T.replay + 0.35, 0.1, 0.4); rise(q2.groups, T.replay + 1.0, 0.1, 0.4);
  [...q1.groups, ...q2.groups].forEach(g => tl.to(g, { opacity: 0, duration: 0.2 }, T.say - 0.35));
  tl.fromTo(cam, { scale: 1, svgOrigin: '1300 420' }, { scale: 1.06, svgOrigin: '1300 420', duration: T.say - 0.4 - T.replay, ease: 'sine.inOut', immediateRender: false }, T.replay);
  tl.to(cam, { scale: 1, svgOrigin: '1300 420', duration: 0.4, ease: 'power2.inOut' }, T.say - 0.4);

  /* ========== 0:39 Say it back: the truck itself flies onto his copy; she says yes; the copies lock (hero moment) ========== */
  type(sayB, T.say, 0.1, { pop: false, pan: 0.5 });
  const fly = anim(place(bubL, 735 + 95, 505 + 2)); truckIcon(fly, C.deep);
  gsap.set(fly, { autoAlpha: 0 }); k.show(fly, T.carry);
  tl.to(fly, { keyframes: [{ scale: 1.2, duration: 4 * FR }, { scale: 1, duration: 4 * FR }] }, T.carry);
  tl.to(fly, { x: 450, duration: 20 * FR, ease: 'power1.inOut' }, T.carry + 0.1);
  tl.to(fly, { keyframes: [{ y: -120, duration: 10 * FR, ease: 'power2.out' }, { y: 30, duration: 10 * FR, ease: 'power2.in' }] }, T.carry + 0.1);
  tl.set(fly, { autoAlpha: 0 }, T.drop);
  tl.to(B.tr, { keyframes: [{ scale: 1.15, duration: 4 * FR }, { scale: 1, duration: 4 * FR }] }, T.drop);
  SR.sfx(T.carry, 'pop', { pitch: 700, gain: 0.4, pan: -0.3 }); SR.sfx(T.carry + 0.1, 'whoosh', { dur: 0.6, rise: false, lo: 800, hi: 4000, gain: 0.35 }); SR.sfx(T.drop, 'pop', { pitch: 420, gain: 0.55, pan: 0.3 });
  k.unpop(miraR.a, T.yes - 0.15, { origin: miraR.origin });
  const yes = say(670, 270, 'Yes. Exactly.', { fill: C.yellow, tail: 'left' });
  type(yes, T.yes, 0.12, { pan: -0.5 });
  const chk = anim(place(bubL, 670 + yes.w / 2 - 6, 270 - yes.h / 2 + 6)); circle(chk, 0, 0, 30, C.deep); stroke(chk, 'M-12,0 L-3,10 L13,-9', C.white, 7);
  gsap.set(chk, { scale: 0 }); k.pop(chk, T.check, { ease: 'popBig', sfx: false });
  SR.sfx(T.check, 'pluck', { note: 76, gain: 0.4 }); SR.sfx(T.check + 0.14, 'pluck', { note: 83, gain: 0.4 });
  // push in on the two copies, the right one slides over with a 3-frame overshoot, squash on contact, click, yellow ring
  tl.fromTo(cam, { scale: 1, svgOrigin: '960 520' }, { scale: 1.6, svgOrigin: '960 520', duration: 18 * FR, ease: 'inOutC', immediateRender: false }, T.push);
  tl.to(A.a, { x: 960 - 735, y: 520 - 505, duration: T.lock - T.push - 0.2, ease: 'power3.in' }, T.push + 0.2);
  tl.to(B.a, { keyframes: [{ x: 960 - 1185 - 14, y: 520 - 535, duration: T.lock - T.push - 0.2, ease: 'power3.in' }, { x: 960 - 1185, duration: 3 * FR, ease: 'power2.out' }] }, T.push + 0.2);
  tl.set(B.a, { autoAlpha: 0 }, T.lock + 3 * FR);
  tl.to(A.a, { keyframes: [{ scaleX: 1.04, scaleY: 0.97, duration: 2 * FR }, { scaleX: 1, scaleY: 1, duration: 6 * FR, ease: 'power2.out' }], transformOrigin: '50% 50%' }, T.lock);
  const ring = el('rect', { x: 960 - 216, y: 520 - 156, width: 432, height: 312, rx: 20, fill: 'none', stroke: C.yellow, 'stroke-width': 10 }, sheetsL);
  gsap.set(ring, { autoAlpha: 0 }); tl.set(ring, { autoAlpha: 1 }, T.lock); tl.set(ring, { autoAlpha: 0 }, T.lock + 4 * FR);
  SR.sfx(T.lock, 'thunk', { gain: 0.9 }); SR.sfx(T.lock, 'tick', { pitch: 2600, gain: 0.7 }); SR.sfx(T.lock + 0.02, 'sparkle', { gain: 0.3 });
  tl.to(cam, { scale: 1, svgOrigin: '960 520', duration: 0.6, ease: 'inOutC' }, T.pullBack);
  // the rule builds as three pills under the sheet
  const steps = ['Say it back.', 'Ask.', 'Your view, and why.'], gapS = 28, padS = 30;
  const sw = steps.map(s => SR.measure(s, stBody) + 2 * padS); let sx = (W - sw.reduce((a, b) => a + b, 0) - gapS * 2) / 2;
  const pills = steps.map((s, i) => { const g = anim(place(hud, sx + sw[i] / 2, 736)); rect(g, -sw[i] / 2, -34, sw[i], 68, C.blue, 34); SR.textEl(g, s, 0, 15, stBody, C.white, 'middle'); sx += sw[i] + gapS; gsap.set(g, { scale: 0 }); return g; });
  [T.labSay, T.labAsk, T.labView].forEach((at, i) => k.pop(pills[i], at, { ease: 'popBig', pitch: 520 + i * 120, gain: 0.35 }));

  /* ========== 0:50 Ask: one short question; her answer becomes the clock on the sheet ========== */
  k.unpop(yes.a, T.ask - 0.2, { origin: yes.origin }); k.unpop(chk, T.ask - 0.2); k.unpop(sayB.a, T.ask - 0.2, { origin: sayB.origin });
  const askB = say(1300, 250, 'When are they there?', { tail: 'right' });
  type(askB, T.ask, 0.12, { pan: 0.5 });
  const sixB = say(670, 270, 'Six to ten.', { fill: C.yellow, tail: 'left' });
  type(sixB, T.six, 0.12, { pan: -0.5 });
  tl.to(sixB.a, { x: 960 + 150 - 670, y: 520 - 86 - 270, scale: 0.08, duration: 0.5, ease: 'power3.in' }, T.clockFly);
  tl.set(sixB.a, { autoAlpha: 0 }, T.clockFly + 0.5);
  k.pop(A.ck, T.clockFly + 0.45, { ease: 'popBig', pitch: 800 });
  k.draw(A.arc, T.arc, 0.6, { ease: 'power2.inOut' }); SR.sfx(T.arc + 0.6, 'tick', { pitch: 2600, gain: 0.4 });

  /* ========== 0:54 His view, with his reason, crosses the single sheet in one clean move ========== */
  k.unpop(askB.a, T.view - 0.3, { origin: askB.origin });
  const viewB = say(1300, 240, 'Then position two is on hold until I revise it, because your crew plans from this sequence.', { tail: 'right', maxW: 540 });
  type(viewB, T.view, 0.1, { pan: 0.5 });
  tl.to(viewB.a, { keyframes: [{ x: 960 - 1300, y: 420 - 240, scale: 0.4, duration: 0.35, ease: 'power2.in' }, { x: 330 - 1300, y: 430 - 240, scale: 0.3, duration: 0.35, ease: 'power2.out' }] }, T.cross);
  tl.to(viewB.a, { scale: 0, duration: 0.2, ease: 'back.in(2)' }, T.cross + 0.75);
  SR.sfx(T.cross, 'whoosh', { dur: 0.7, rise: false, lo: 500, hi: 4500, gain: 0.4, pan: -0.3 });
  k.pop(A.pz, T.pause, { ease: 'popBig', pitch: 650 });
  tl.to(A.tA, { y: -26, scale: 0, duration: 0.25, ease: 'power2.in' }, T.slideTime);
  tl.fromTo(A.tB, { y: 26, scale: 0 }, { y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.6)', immediateRender: false }, T.slideTime + 0.2);
  SR.sfx(T.slideTime, 'zip', { dur: 0.35, gain: 0.3 });

  /* ========== 1:01 Revised, checked. Thursday: the truck leaves, the crane rolls onto P2, boom up, four outriggers ========== */
  tl.fromTo(A.sp, { scale: 1.8 }, { scale: 1, duration: 0.3, ease: 'power3.in', immediateRender: false }, T.stamp);
  SR.sfx(T.stamp + 0.3, 'thunk', { gain: 0.8 });
  tl.to(A.a, { keyframes: [{ scale: 0.97, duration: 0.05 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1,0.35)' }] }, T.stamp + 0.3);
  tl.to(A.a, { scale: 9, duration: 0.5, ease: 'power3.in', transformOrigin: `${(95 + 200) / 400 * 100}% ${(52 + 140) / 280 * 100}%` }, T.zoomP2);
  SR.sfx(T.zoomP2, 'whoosh', { dur: 0.5, rise: true, lo: 300, hi: 5000, gain: 0.45 });
  tl.set([sheetsL, hud, bubL, sC, dimL], { autoAlpha: 0 }, T.thu2);
  tl.set(sT, { autoAlpha: 1 }, T.thu2); tl.set(crA, { x: -700 }, T.thu2);
  tl.set(thuL.groups, { opacity: 0 }, T.thu2);
  const t10 = SR.words(sTa, 'Thursday 10:00', 150, 200, stTitle, C.white), t1030 = SR.words(sTa, 'Thursday 10:30', 150, 200, stTitle, C.white);
  gsap.set([...t10.groups, ...t1030.groups], { opacity: 0 });
  rise(t10.groups, T.thu2 + 0.15); t10.groups.forEach(g => tl.to(g, { opacity: 0, duration: 0.2 }, T.label1030 - 0.25)); rise(t1030.groups, T.label1030);
  tl.to(trk, { x: -1300, duration: 1.3, ease: 'power2.in' }, T.trucksOut);
  SR.sfx(T.trucksOut, 'rumble', { dur: 1.2, gain: 0.5 }); SR.sfx(T.trucksOut + 0.5, 'whoosh', { dur: 0.7, rise: false, lo: 300, hi: 1500, gain: 0.3 });
  tl.fromTo(crA, { x: -700 }, { x: 1000, duration: 1.4, ease: 'power1.out', immediateRender: false }, T.craneRoll);
  SR.sfx(T.craneRoll, 'rumble', { dur: 1.4, gain: 0.55 });
  tl.to(crA, { keyframes: [{ scaleX: 0.96, scaleY: 1.03, duration: 3 * FR }, { scaleX: 1, scaleY: 1, duration: 5 * FR }], transformOrigin: '50% 100%' }, T.craneRoll + 1.4);
  tl.to(mk[1], { keyframes: [{ scale: 1.2, duration: 0.12 }, { scale: 1, duration: 0.45, ease: 'elastic.out(1,0.35)' }], transformOrigin: '50% 50%' }, T.craneRoll + 1.4);
  tl.fromTo(crane.boom, { rotation: -10 }, { rotation: -42, duration: 0.8, ease: 'power2.inOut', svgOrigin: '0 0', immediateRender: false }, T.boomUp);
  SR.sfx(T.boomUp, 'zip', { dur: 0.8, gain: 0.25 });
  outs.forEach((g, i) => { const at = T.out1 + i * 0.5; tl.to(g, { scaleY: 1, duration: 0.16, ease: 'power3.in' }, at - 0.16); SR.sfx(at, 'thunk', { gain: 0.95 }); tl.to(crA, { keyframes: [{ y: -4, duration: 0.04 }, { y: 0, duration: 0.2 }] }, at); });
  crew.forEach((c, i) => tl.to(c.rise, { keyframes: [{ y: -16, duration: 0.15 }, { y: 0, duration: 0.4, ease: 'elastic.out(1,0.35)' }] }, T.out1 + 2.0 + i * 0.12));

  /* ========== 1:10 Callback: one sheet carrying everything, the rule, then the end card ========== */
  k.show(endBg, T.collapse);
  tl.to(sTa, { scale: 0.02, rotation: -8, duration: 0.45, ease: 'power3.in', transformOrigin: '50% 45%' }, T.collapse);
  SR.sfx(T.collapse, 'whoosh', { dur: 0.45, rise: true, lo: 3000, hi: 300, gain: 0.4 });
  tl.set(sT, { autoAlpha: 0 }, T.endSheet);
  const E = sheet(endL, 960, 470, { trucks: true, clock: true, pause: true, stamp: true, late: true });
  gsap.set(E.a, { scale: 0 });
  tl.fromTo(E.a, { scale: 0 }, { scale: 1.4, duration: 0.5, ease: 'popBig', immediateRender: false }, T.endSheet);
  SR.sfx(T.endSheet, 'pop', { pitch: 300, gain: 0.5 });
  SR.onTick(tt => { if (tt > T.endSheet + 0.6) E.p.setAttribute('transform', `translate(960,${470 + Math.sin((tt - T.endSheet) * 2 * Math.PI * 0.3) * 4})`); });
  const rule = SR.words(endL, 'Say it back. Then your view, and why.', 960, 830, stTitle, C.white, { align: 'center' });
  gsap.set(rule.groups, { opacity: 0 });
  rise(rule.groups, T.rule, 0.16, 0.4);
  for (let i = 0; i < rule.groups.length; i++) SR.sfx(T.rule + i * 0.16, 'tick', { pitch: 2600, gain: 0.12 });
  // end card: silent, course title; the logo slot stays empty until MarCom supplies the artwork
  gsap.set(cardL, { autoAlpha: 0 }); k.show(cardL, T.endCard);
  rect(cardL, 0, 0, W, H, C.blue);
  SR.textEl(cardL, 'Topic 4 refresher', 960, 400, SR.style('eyebrow'), C.white, 'middle');
  SR.textEl(cardL, 'Their view first', 960, 590, SR.style('display'), C.white, 'middle');

  /* ---------- captions for the narration: real time, balanced lines, never under a label ---------- */
  const stC = SR.style('caption');
  const deepAt = t => t < T.thu || (t >= T.replay && t < T.thu2) || t >= T.collapse;
  cues.captions.forEach(([t0, t1, text]) => {
    const g = el('g', {}, capL);
    const ws = text.split(' '); let lines = [text];
    if (text.length > 42) { let best = 1, bd = 1e9; for (let i = 1; i < ws.length; i++) { const a = ws.slice(0, i).join(' '), b = ws.slice(i).join(' '); if (a.length <= 42 && b.length <= 42 && Math.abs(a.length - b.length) < bd) { bd = Math.abs(a.length - b.length); best = i; } } lines = [ws.slice(0, best).join(' '), ws.slice(best).join(' ')]; }
    const wMx = Math.max(...lines.map(l => SR.measure(l, stC))), bh = lines.length * stC.lh + 28, by = H - 96 - bh;
    const box = rect(g, (W - wMx) / 2 - 28, by, wMx + 56, bh, C.blue);
    lines.forEach((l, i) => SR.textEl(g, l, W / 2, by + 14 + stC.size * 0.86 + i * stC.lh, stC, C.white, 'middle'));
    SR.onTick((tt, t) => { const on = t >= t0 && t < t1; g.setAttribute('visibility', on ? 'visible' : 'hidden');  });
  });
};
