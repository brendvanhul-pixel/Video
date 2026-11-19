/* "Same page": 83 s refresher for Topic 4, Their view first. Caslon voice (rule 4).
 * Shape: freeze and replay. Hero: the lift plan sheet, two copies that only lock into one after the say-back.
 * Dialogue lives in speech bubbles (muted-safe); narration runs as captions until a VO is recorded.
 * Mira's bubbles are the yellow accent: the information the engineer is missing.
 */
window.FILM = async function (SR, tl, root, T, cues) {
  const { C, W, H, FR, el, place, anim, rect, circle, path, stroke } = SR;
  const k = SR.kit(tl);
  const stTitle = SR.style('title'), stBody = SR.style('body'), stLabel = SR.style('label');
  const defs = document.querySelector('#stage defs');

  /* ---------- time warp: run 1 freezes at T.freeze, rewinds to the end of Mira's sentence, replay starts at T.replay ---------- */
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
  rect(cam, 0, 0, W, H, C.deep);
  const sC = el('g', {}, cam);            // the call: quay (left) and office (right)
  const sheetsL = el('g', {}, cam);       // the two copies of the lift plan
  const bubL = el('g', {}, cam);          // speech bubbles
  const hud = el('g', {}, cam);           // on-screen labels
  const endBg = el('g', {}, cam); rect(endBg, 0, 0, W, H, C.deep); gsap.set(endBg, { autoAlpha: 0 });
  const sT = el('g', {}, cam);            // Thursday on the quay
  const endL = el('g', {}, cam);          // callback
  const capL = el('g', {}, root);
  // colour drains to grey for the freeze and the rewind (real time, not warped)
  const flt = el('filter', { id: 'grey', 'color-interpolation-filters': 'sRGB' }, defs);
  const sat = el('feColorMatrix', { type: 'saturate', values: 1 }, flt);
  SR.onTick((tt, t) => {
    const g = SR.smooth((t - F0) / 0.35) * (1 - SR.smooth((t - T.rewindEnd) / 0.08));
    if (g > 0.001) { sat.setAttribute('values', 1 - 0.85 * g); world.setAttribute('filter', 'url(#grey)'); } else world.removeAttribute('filter');
  });

  /* ---------- helpers ---------- */
  const vest = (c, band = C.white, col = C.deep) => {
    const v = el('g'); c.body.insertBefore(v, c.body.children[1]);
    path(v, 'M-108,600 C-104,570 -84,556 -56,552 L-30,552 L-30,760 L-118,760 Z', col);
    path(v, 'M108,600 C104,570 84,556 56,552 L30,552 L30,760 L118,760 Z', col);
    rect(v, -74, 556, 16, 204, band, 4); rect(v, 58, 556, 16, 204, band, 4);
    rect(v, -114, 706, 84, 16, band, 3); rect(v, 30, 706, 84, 16, band, 3);
  };
  const wrap = (text, st, maxW) => { const L = []; let cur = []; text.split(' ').forEach(w => { const t = [...cur, w].join(' '); if (cur.length && SR.measure(t, st) > maxW) { L.push(cur.join(' ')); cur = [w]; } else cur.push(w); }); if (cur.length) L.push(cur.join(' ')); return L; };
  // speech bubble: rounded block, tail toward the speaker, words that type in
  const say = (x, y, text, o = {}) => {
    const st = o.st || stBody, fill = o.fill || C.white, lines = wrap(text, st, o.maxW || 600);
    const w = Math.max(...lines.map(l => SR.measure(l, st))) + 64, h = lines.length * st.lh + 40;
    const p = place(bubL, x, y), a = anim(p);
    const tx = o.tail === 'right' ? w / 2 - 70 : -w / 2 + 70, dir = o.tail === 'right' ? 1 : -1;
    path(a, `M${tx - 26},${h / 2 - 8} L${tx + dir * 54},${h / 2 + 50} L${tx + 26},${h / 2 - 8} Z`, fill);
    rect(a, -w / 2, -h / 2, w, h, fill, 30);
    const groups = [];
    lines.forEach((ln, i) => groups.push(...SR.words(a, ln, -w / 2 + 32, -h / 2 + 20 + st.size * 0.8 + i * st.lh, st, C.deep).groups));
    gsap.set(a, { scale: 0 }); gsap.set(groups, { scale: 0 });
    return { p, a, groups, w, h, origin: o.tail === 'right' ? '85% 100%' : '15% 100%' };
  };
  const type = (b, at, per = 0.075, o = {}) => {
    if (o.pop !== false) k.pop(b.a, at, { origin: b.origin, ease: 'popBig', dur: 0.4, pitch: o.pitch || 600, pan: o.pan, gain: 0.35 });
    const t0 = at + (o.pop === false ? 0 : 0.18);
    b.groups.forEach((g, i) => tl.fromTo(g, { scale: 0, transformOrigin: '50% 100%' }, { scale: 1, transformOrigin: '50% 100%', duration: 0.3, ease: 'pop' }, t0 + i * per));
    for (let i = 0; i < b.groups.length; i += 3) SR.sfx(t0 + i * per, 'tick', { pitch: 3000 + (i % 2) * 400, gain: 0.1, pan: o.pan });
    return t0 + b.groups.length * per;
  };
  const truck = (parent, x, y, s = 1, col = C.deep, cab = C.deep) => { const g = place(parent, x, y, `scale(${s})`); rect(g, -40, -22, 58, 26, col, 4); rect(g, 20, -30, 22, 34, cab, 4); circle(g, -26, 6, 7, col); circle(g, 30, 6, 7, col); return g; };
  // the lift plan sheet: crane symbol, three positions, start time; options add the trucks, clock, pause, stamp
  const sheet = (parent, cx, cy, o = {}) => {
    const p = place(parent, cx, cy), a = anim(p);
    rect(a, -200, -140, 400, 280, C.white, 14);
    SR.textEl(a, o.header || 'Lift sequence', -176, -96, stLabel, C.deep);
    SR.icon(place(a, -108, 34, 'scale(0.48)'), 'crane', C.deep, C.blue, { fill: C.white });
    const mk = [30, 95, 160].map((x, i) => { const m = anim(place(a, x, 46)); circle(m, 0, 0, 28, C.blue); SR.textEl(m, 'P' + (i + 1), 0, 11, stLabel, C.white, 'middle'); return m; });
    const tA = anim(place(a, -176, 118)); SR.textEl(tA, 'Start 07:00', 0, 0, stLabel, C.deep);
    const tB = anim(place(a, -176, 118)); SR.textEl(tB, 'Start 10:30', 0, 0, stLabel, C.deep);
    gsap.set(o.late ? tA : tB, { scale: 0 });
    const tr = [anim(place(a, 95, -2)), anim(place(a, 95, -38))];
    tr.forEach(g => { truck(g, 0, 0, 0.8); if (!o.trucks) gsap.set(g, { scale: 0 }); });
    const ck = anim(place(a, 150, -84)); circle(ck, 0, 0, 34, C.deep);
    const arc = stroke(ck, 'M0,24 A24,24 0 0 1 -20.8,-12', C.yellow, 10);
    rect(ck, -3, -22, 6, 22, C.white, 3); rect(ck, -3, -3, 16, 6, C.white, 3);
    if (!o.clock) gsap.set(ck, { scale: 0 });
    const pz = anim(place(a, 118, 22)); circle(pz, 0, 0, 17, C.deep); rect(pz, -7, -8, 5, 16, C.white, 2); rect(pz, 2, -8, 5, 16, C.white, 2);
    if (!o.pause) gsap.set(pz, { scale: 0 });
    const sp = anim(place(a, 86, 104)), spi = place(sp, 0, 0, 'rotate(-6)');
    el('rect', { x: -112, y: -28, width: 224, height: 56, rx: 6, fill: C.white, stroke: C.blue, 'stroke-width': 6 }, spi);
    SR.textEl(spi, 'Revised, checked', 0, 11, stLabel, C.blue, 'middle');
    if (!o.stamp) gsap.set(sp, { scale: 0 });
    return { p, a, mk, tA, tB, tr, ck, arc, pz, sp };
  };

  /* ========== 0:00 Black. One sheet peels into two copies; trucks land on Mira's copy ========== */
  const A = sheet(sheetsL, 735, 505, { header: 'Lift sequence' });
  const B = sheet(sheetsL, 1185, 535, { header: 'Lift sequence: issued' });
  const tick2 = [0, 1].map(i => { const g = anim(place(B.a, 146 + i * 30, -106)); circle(g, 0, 0, 13, C.blue); stroke(g, 'M-6,0 L-1,5 L7,-5', C.white, 4); gsap.set(g, { scale: 0 }); return g; });
  // both start stacked in the centre at the callback's position and scale
  tl.fromTo([A.a, B.a], { x: (i) => [960 - 735, 960 - 1185][i], y: (i) => [470 - 505, 470 - 535][i], scale: 1.4 }, { x: (i) => [960 - 735, 960 - 1185][i], y: (i) => [470 - 505, 470 - 535][i], scale: 1.4, duration: 0.01 }, 0);
  tl.to(B.a, { keyframes: [{ rotation: 4, y: 470 - 535 - 14, duration: 0.5, ease: 'power2.out' }, { rotation: 0, duration: 0.4 }] }, T.peel);
  SR.sfx(T.peel, 'whoosh', { dur: 0.6, rise: false, lo: 1500, hi: 6000, gain: 0.2 });
  tl.to(A.a, { x: 0, y: 0, scale: 1, duration: 1.6, ease: 'power2.inOut' }, T.drift);
  tl.to(B.a, { x: 0, y: 0, scale: 1, duration: 1.6, ease: 'power2.inOut' }, T.drift + 0.08);
  SR.sfx(T.drift, 'whoosh', { dur: 1.2, rise: false, lo: 300, hi: 1500, gain: 0.15 });
  A.tr.forEach((g, i) => { tl.fromTo(g, { scale: 0, y: '-=30' }, { scale: 1, y: '+=30', duration: 0.4, ease: 'popBig' }, [T.truck1, T.truck2][i]); SR.sfx([T.truck1, T.truck2][i], 'pop', { pitch: 380 + i * 90, gain: 0.35, pan: -0.3 }); });

  /* ========== 0:06 Pull back: the quay and the office, the phone line, who is who ========== */
  const lp = anim(place(sC, 0, 0));
  rect(lp, 0, 0, 480, H, C.blue);
  [[20, 600, 150, 90, C.deepBand], [20, 690, 150, 90, C.tint], [180, 640, 120, 140, C.deepBand]].forEach(([x, y, w, h, f]) => rect(lp, x, y, w, h, f, 4));
  const mira = SR.character(lp, 250, 812, { shirt: C.blue, sleeve: C.blue, skin: SR.SKIN[0], helmet: C.white, hair: 'none' }); vest(mira);
  rect(mira.armR.fore, -18, 52, 36, 64, C.deep, 8);
  rect(lp, 0, 800, 480, 280, C.deepBand); rect(lp, 0, 788, 480, 14, C.white, 4);
  [40, 200, 360].forEach(x => rect(lp, x, 788, 12, 60, C.white, 4));
  const rp = anim(place(sC, 0, 0));
  rect(rp, 1440, 0, 480, H, C.deepRaised);
  const pmP = place(rp, 1540, 822, 'scale(0.8)');
  const pm = SR.character(pmP, 0, 0, { shirt: C.white, sleeve: C.grey, skin: SR.SKIN[2], hair: 'side', hairColor: SR.HAIR[3], glasses: true, collar: 'tie', tieColor: C.blue });
  const ag = place(pm.body, 64, 560); rect(ag, 0, 0, 120, 330, C.white, 6); for (let i = 0; i < 9; i++) rect(ag, 16, 24 + i * 32, i % 3 === 2 ? 60 : 88, 10, C.grey, 5);
  const eng = SR.character(rp, 1730, 822, { shirt: C.tint, sleeve: C.blue, skin: SR.SKIN[1], hair: 'short', hairColor: SR.HAIR[0] });
  stroke(eng.head, 'M-70,-6 C-72,-104 72,-104 70,-6', C.deep, 10); rect(eng.head, -82, -14, 20, 40, C.deep, 8); rect(eng.head, 62, -14, 20, 40, C.deep, 8);
  stroke(eng.head, 'M-72,22 C-66,52 -46,58 -26,52', C.deep, 6);
  SR.props.table(rp, 1440, 1960, 822, C.deep);
  SR.props.laptop(rp, 1590, 822, C.blue);
  gsap.set(lp, { x: -520 }); gsap.set(rp, { x: 520 });
  tl.to(lp, { x: 0, duration: 0.8, ease: 'power3.out' }, T.panels);
  tl.to(rp, { x: 0, duration: 0.8, ease: 'power3.out' }, T.panels + 0.1);
  SR.sfx(T.panels, 'whoosh', { dur: 0.8, rise: true, lo: 200, hi: 2500, gain: 0.35 });
  tl.fromTo(mira.rise, { y: 440 }, { y: 0, duration: 0.5, ease: 'popBig' }, T.panels + 0.6); SR.sfx(T.panels + 0.6, 'boing', { pitch: 300, gain: 0.35, pan: -0.7 });
  tl.fromTo(eng.rise, { y: 440 }, { y: 0, duration: 0.5, ease: 'popBig' }, T.panels + 0.75); SR.sfx(T.panels + 0.75, 'boing', { pitch: 260, gain: 0.35, pan: 0.7 });
  tl.fromTo(pm.rise, { y: 500 }, { y: 0, duration: 0.5, ease: 'popBig' }, T.panels + 0.9);
  const lineP = stroke(sC, 'M352,470 L352,236 L1660,236 L1660,520', C.white, 6);
  k.draw(lineP, T.line, 0.8, { ease: 'power2.inOut' });
  SR.sfx(T.line, 'rumble', { dur: 1.0, gain: 0.12 });
  // labels re-establish who owns what
  const lab = (str, x, y, st, align, at) => { const w = SR.words(hud, str, x, y, st, C.white, { align }); gsap.set(w.groups, { scale: 0 }); k.popWords(w.groups, at, { gain: 0.15 }); k.outWords(w.groups, T.labsOut); return w; };
  lab('Tuesday 09:00, weekly project call', 960, 150, stBody, 'center', T.title);
  lab('Mira', 110, 330, stBody, 'left', T.labMira); lab('site supervisor,', 110, 374, stLabel, 'left', T.labMira + 0.2); lab('on the quay', 110, 414, stLabel, 'left', T.labMira + 0.3);
  lab('You', 1630, 330, stBody, 'right', T.labYou); lab('project engineer', 1630, 374, stLabel, 'right', T.labYou + 0.2);
  lab('Project manager', 1540, 478, stLabel, 'center', T.labPM);
  tick2.forEach((g, i) => { k.pop(g, T.issued + 0.3 * i, { ease: 'popBig', sfx: false }); SR.sfx(T.issued + 0.3 * i, 'pluck', { note: [79, 84][i], gain: 0.25, pan: 0.4 }); });
  tl.to(B.a, { keyframes: [{ scale: 1.04, duration: 0.1 }, { scale: 1, duration: 0.45, ease: 'elastic.out(1,0.35)' }] }, T.issued + 0.6);
  // the call never sits still: both people breathe and blink; Mira keeps the phone at her ear
  SR.charLife(mira, { seed: 0.2, side: 1, from: T.panels, to: T.collapse, talk: [[T.mira1, T.herEnd - 0.6], [T.mira2, T.mira2 + 1.0], [T.yes, T.yes + 0.8], [T.six, T.six + 0.7]], listen: [[T.his1, T.hisDrop], [T.say, T.carry], [T.ask, T.six], [T.view, T.nod + 0.8]] });
  SR.charLife(eng, { seed: 1.1, side: -1, from: T.panels, to: T.collapse, talk: [[T.his1, T.his1 + 1.2], [T.say, T.say + 1.3], [T.ask, T.ask + 0.8], [T.view, T.view + 1.8]], listen: [[T.mira1, T.herEnd], [T.replay, T.say - 0.2], [T.yes, T.ask - 0.2], [T.six, T.view - 0.2]] });
  SR.charLife(pm, { seed: 2.2, side: 1, from: T.panels, to: T.collapse, talk: [[T.pm, T.pm + 0.7]] });
  SR.onTick(tt => { if (tt >= T.panels && tt <= T.collapse) { const ph = 0.9; const a = mira.armR; SR.setArms(mira, 0, ph); } });

  /* ========== 0:17 Run 1. Mira's point slides off his clean copy; his reply drops into the gap ========== */
  const mira1 = say(670, 250, 'Position two doesn’t work. Since last week the client’s trucks are on the quay every morning.', { fill: C.yellow, tail: 'left', maxW: 590 });
  type(mira1, T.mira1, 0.11, { pan: -0.5 });
  tl.to(mira1.a, { x: 1185 - 670, y: 470 - 250, scale: 0.34, duration: 0.6, ease: 'power2.inOut' }, T.herEnd);
  tl.to(mira1.a, { x: 1420 - 670, y: 760 - 250, rotation: 28, scale: 0, duration: 0.55, ease: 'power2.in' }, T.herEnd + 0.6);
  SR.sfx(T.herEnd, 'whoosh', { dur: 0.6, rise: false, lo: 600, hi: 3000, gain: 0.25 }); SR.sfx(T.herEnd + 0.62, 'zip', { dur: 0.4, gain: 0.2 });
  const his1 = say(1300, 250, 'I checked it twice. The sequence is correct.', { tail: 'right', maxW: 520 });
  type(his1, T.his1, 0.1, { pan: 0.5 });
  tl.to(his1.a, { x: 960 - 1300, y: 380 - 250, scale: 0.16, duration: 0.35, ease: 'power2.in' }, T.hisDrop);
  tl.to(his1.a, { y: 1260 - 250, rotation: 40, duration: 0.55, ease: 'power2.in' }, T.hisDrop + 0.35);
  SR.sfx(T.hisDrop, 'whoosh', { dur: 0.35, rise: true, lo: 800, hi: 4000, gain: 0.3 }); SR.sfx(T.hisDrop + 0.36, 'thunk', { gain: 0.45 });
  // 0:27 "Fine. We'll see on site." / "Next item." The calendar flips to Thursday
  const mira2 = say(670, 250, 'Fine. We’ll see on site.', { fill: C.yellow, tail: 'left' });
  type(mira2, T.mira2, 0.1, { pan: -0.5 }); k.unpop(mira2.a, T.cal - 0.1, { origin: mira2.origin });
  const pmb = say(1380, 440, 'Next item.', { fill: C.grey, tail: 'right' });
  type(pmb, T.pm, 0.1, { pan: 0.6 }); k.unpop(pmb.a, T.cal, { origin: pmb.origin });
  const calP = place(hud, 960, 300), cal = anim(calP), calIn = anim(cal);
  rect(calIn, -130, -80, 260, 160, C.blue, 16);
  const cT1 = anim(calIn); SR.textEl(cT1, 'Tuesday', 0, 16, stBody, C.white, 'middle');
  const cT2 = anim(calIn); SR.textEl(cT2, 'Thursday', 0, 16, stBody, C.white, 'middle'); gsap.set(cT2, { scale: 0 });
  gsap.set(cal, { scale: 0 });
  k.pop(cal, T.cal, { ease: 'popBig', pitch: 500 });
  tl.to(calIn, { keyframes: [{ scaleY: 0, duration: 0.12, ease: 'power2.in' }, { scaleY: 1, duration: 0.2, ease: 'power2.out' }], transformOrigin: '50% 50%' }, T.calFlip);
  tl.set(cT1, { scale: 0 }, T.calFlip + 0.12); tl.set(cT2, { scale: 1 }, T.calFlip + 0.12);
  SR.sfx(T.calFlip, 'zip', { dur: 0.2, gain: 0.3 });
  k.shapeWipe(cal, T.wipeT, { scale: 16, dx: 0, dy: 240, dur: 0.5, anticipate: 0.2 });

  /* ========== 0:31 Thursday 07:00: the crane meets the trucks on position two ========== */
  gsap.set(sT, { autoAlpha: 0 }); k.show(sT, T.thu);
  const sTa = anim(place(sT, 0, 0));
  rect(sTa, 0, 0, W, H, C.blue);
  [[60, 520, 180, 240], [260, 600, 160, 160], [1700, 480, 180, 280]].forEach(([x, y, w, h]) => rect(sTa, x, y, w, h, C.deepBand, 4));
  const crew = [[300, SR.SKIN[3]], [440, SR.SKIN[1]]].map(([x, sk]) => { const g = place(sTa, x, 772, 'scale(0.55)'); const c = SR.character(g, 0, 0, { shirt: C.blue, sleeve: C.blue, skin: sk, helmet: C.white, hair: 'none' }); vest(c, C.tint); return c; });
  rect(sTa, 0, 760, W, 320, C.deep);
  [600, 1000, 1400].forEach((x, i) => { const m = place(sTa, x, 820); el('ellipse', { cx: 0, cy: 0, rx: 60, ry: 22, fill: 'none', stroke: C.white, 'stroke-width': 6 }, m); SR.textEl(m, 'P' + (i + 1), 0, 72, stLabel, C.white, 'middle'); });
  const trG = anim(place(sTa, 0, 0));
  [[900, 1], [1210, 1]].forEach(([x]) => { const g = place(trG, x, 760); rect(g, 64, -96, 230, 84, C.grey, 8); rect(g, 0, -120, 70, 108, C.white, 8); rect(g, 12, -108, 40, 36, C.deepBand, 4); circle(g, 50, -6, 24, C.deepBand); circle(g, 200, -6, 24, C.deepBand); circle(g, 260, -6, 24, C.deepBand); });
  const crA = anim(place(sTa, 0, 0));
  const crane = SR.props.crane(crA, 704, 790, 1.1, { color: C.white, accent: C.tint, angle: -34, cable: 140 });
  const outs = [-140, -60, 60, 140].map(dx => { const g = anim(place(crA, 704 + dx * 1.1, 760)); rect(g, -6, 0, 12, 44, C.tint, 3); rect(g, -26, 40, 52, 14, C.white, 4); gsap.set(g, { scaleY: 0, transformOrigin: '50% 0%' }); return g; });
  SR.onTick(tt => crane.hook.setAttribute('transform', `rotate(${34 + Math.sin(tt * 2 * Math.PI * 0.45) * (tt > T.craneStop && tt < T.thu2 ? 7 * Math.exp(-(tt - T.craneStop) * 0.6) + 2 : 2)})`));
  [crew[0], crew[1]].forEach((c, i) => SR.charLife(c, { seed: i + 0.5, side: 1, from: T.thu, to: T.collapse }));
  const thuL = SR.words(sTa, 'Thursday 07:00', 150, 200, stTitle, C.white); gsap.set(thuL.groups, { scale: 0 }); k.popWords(thuL.groups, T.thu + 0.2);
  tl.fromTo(crA, { x: -1300 }, { x: 0, duration: T.craneStop - T.craneIn, ease: 'power1.out', immediateRender: false }, T.craneIn);
  SR.sfx(T.craneIn, 'rumble', { dur: T.craneStop - T.craneIn + 0.3, gain: 0.5 });
  tl.to(crA, { keyframes: [{ x: 14, duration: 0.1 }, { x: 0, duration: 0.5, ease: 'elastic.out(1,0.35)' }] }, T.craneStop);
  SR.sfx(T.craneStop, 'thunk', { gain: 0.45 });
  gsap.set(crA, { x: -1300 });

  /* ========== 0:35 Freeze, drain to grey, rewind to the end of Mira's sentence ========== */
  SR.sfx(F1, 'whoosh', { dur: 0.8, rise: false, lo: 4000, hi: 800, gain: 0.35 });
  SR.sfx(F1 + 0.6, 'whoosh', { dur: 0.9, rise: false, lo: 5000, hi: 600, gain: 0.35 });
  SR.sfx(F1 + 1.4, 'whoosh', { dur: 0.9, rise: true, lo: 600, hi: 5000, gain: 0.3 });
  SR.sfx(F1, 'rumble', { dur: R1 - F1, gain: 0.2 });
  SR.sfx(T.rewindEnd, 'tick', { pitch: 3200, gain: 0.6 });

  /* ========== 0:38 Replay. Same frame, his bubble empty. What comes first? ========== */
  // run-1 pieces that ended up elsewhere are put back exactly as they were when Mira finished
  tl.set(sT, { autoAlpha: 0 }, T.replay);
  tl.set([his1.a, mira2.a, pmb.a, mira1.a, cal], { autoAlpha: 0 }, T.replay);
  const miraR = say(670, 250, 'Position two doesn’t work. Since last week the client’s trucks are on the quay every morning.', { fill: C.yellow, tail: 'left', maxW: 590 });
  gsap.set(miraR.groups, { scale: 1 }); tl.set(miraR.a, { scale: 1 }, T.replay);
  const sayB = say(1300, 250, 'So since last week the trucks block position two every morning?', { tail: 'right', maxW: 520 });
  k.pop(sayB.a, T.replay + 0.05, { origin: sayB.origin, ease: 'popBig', pitch: 500, pan: 0.5, gain: 0.3 });
  const prog = rect(hud, 1300 - 220, 245, 0, 12, C.tint, 6);
  [T.tick1, T.tick2, T.tick3].forEach((at, i) => { tl.to(prog, { attr: { width: 440 * (i + 1) / 3 }, duration: 0.3, ease: 'power2.out' }, at); SR.sfx(at, 'tick', { pitch: 1800, gain: 0.4 }); });
  tl.set(prog, { autoAlpha: 0 }, T.say - 0.1);
  const q = SR.words(hud, 'Mira has finished. You disagree. What comes first?', 960, 760, stBody, C.white, { align: 'center' });
  gsap.set(q.groups, { scale: 0 }); k.popWords(q.groups, T.replay + 0.3); k.outWords(q.groups, T.say - 0.4);
  tl.fromTo(cam, { scale: 1, svgOrigin: '1300 420' }, { scale: 1.07, svgOrigin: '1300 420', duration: T.say - 0.4 - T.replay, ease: 'sine.inOut', immediateRender: false }, T.replay);
  tl.to(cam, { scale: 1, svgOrigin: '1300 420', duration: 0.5, ease: 'power2.inOut' }, T.say - 0.4);

  /* ========== 0:42 Say it back: his bubble carries her trucks onto his copy, she says yes, the copies lock ========== */
  type(sayB, T.say, 0.1, { pop: false, pan: 0.5 });
  const cA = [735 + 95, 505 - 20], cB = [1185 + 95, 535 - 20];
  tl.to(sayB.a, { x: cA[0] - 1300, y: cA[1] - 120 - 250, scale: 0.4, duration: 0.8, ease: 'power2.inOut' }, T.carry);
  const carried = anim(place(bubL, cA[0], cA[1])); truck(carried, 0, 18, 0.8); truck(carried, 0, -18, 0.8);
  gsap.set(carried, { autoAlpha: 0 }); k.show(carried, T.carry + 0.8);
  tl.fromTo(carried, { y: 0 }, { y: -70, duration: 0.25, ease: 'power2.out', immediateRender: false }, T.carry + 0.8);
  SR.sfx(T.carry + 0.8, 'pop', { pitch: 700, gain: 0.4, pan: -0.3 });
  tl.to(sayB.a, { x: cB[0] - 1300, y: cB[1] - 120 - 250, duration: 0.7, ease: 'power2.inOut' }, T.carry + 1.05);
  tl.to(carried, { x: cB[0] - cA[0], duration: 0.7, ease: 'power2.inOut' }, T.carry + 1.05);
  tl.to(carried, { y: 0, duration: 0.25, ease: 'power2.in' }, T.drop - 0.25);
  tl.set(carried, { autoAlpha: 0 }, T.drop);
  B.tr.forEach((g, i) => { tl.fromTo(g, { scale: 0 }, { scale: 1, duration: 0.35, ease: 'popBig', immediateRender: false }, T.drop + i * 3 * FR); SR.sfx(T.drop + i * 3 * FR, 'pop', { pitch: 420 + i * 100, gain: 0.4, pan: 0.3 }); });
  tl.to(sayB.a, { x: 0, y: 0, scale: 1, duration: 0.45, ease: 'power2.inOut' }, T.drop);
  k.unpop(miraR.a, T.yes - 0.15, { origin: miraR.origin });
  const yes = say(670, 270, 'Yes. Exactly.', { fill: C.yellow, tail: 'left' });
  type(yes, T.yes, 0.12, { pan: -0.5 });
  const chk = anim(place(bubL, 670 + yes.w / 2 - 6, 270 - yes.h / 2 + 6)); circle(chk, 0, 0, 30, C.deep); stroke(chk, 'M-12,0 L-3,10 L13,-9', C.white, 7);
  gsap.set(chk, { scale: 0 }); k.pop(chk, T.check, { ease: 'popBig', sfx: false });
  SR.sfx(T.check, 'pluck', { note: 76, gain: 0.35 }); SR.sfx(T.check + 0.14, 'pluck', { note: 83, gain: 0.35 });
  // only now do the copies slide together and lock into one sheet
  tl.to(A.a, { x: 960 - 735, y: 520 - 505, duration: T.lock - T.slideTogether, ease: 'power3.in' }, T.slideTogether);
  tl.to(B.a, { x: 960 - 1185, y: 520 - 535, duration: T.lock - T.slideTogether, ease: 'power3.in' }, T.slideTogether);
  tl.set(B.a, { autoAlpha: 0 }, T.lock);
  tl.to(A.a, { keyframes: [{ scaleX: 1.06, scaleY: 0.96, duration: 0.05 }, { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'elastic.out(1.1,0.35)' }], transformOrigin: '50% 50%' }, T.lock);
  SR.sfx(T.lock, 'thunk', { gain: 0.55 }); SR.sfx(T.lock, 'tick', { pitch: 2400, gain: 0.5 });
  // the rule builds as a row of three labels under the sheet
  const steps = ['Say it back.', 'Ask.', 'Your view, and why.'], gapS = 70;
  const sw = steps.map(s => SR.measure(s, stBody)); let sx = (W - sw.reduce((a, b) => a + b, 0) - gapS * 2) / 2;
  const stepG = steps.map((s, i) => { const w = SR.words(hud, s, sx, 760, stBody, C.white); sx += sw[i] + gapS; gsap.set(w.groups, { scale: 0 }); return w; });
  [T.labSay, T.labAsk, T.labView].forEach((at, i) => k.popWords(stepG[i].groups, at, { gain: 0.25 }));

  /* ========== 0:52 Ask: one short question; her answer becomes the clock on the sheet ========== */
  k.unpop(yes.a, T.ask - 0.2, { origin: yes.origin }); k.unpop(chk, T.ask - 0.2); k.unpop(sayB.a, T.ask - 0.2, { origin: sayB.origin });
  const askB = say(1300, 250, 'When are they there?', { tail: 'right' });
  type(askB, T.ask, 0.12, { pan: 0.5 });
  const sixB = say(670, 270, 'Six to ten.', { fill: C.yellow, tail: 'left' });
  type(sixB, T.six, 0.12, { pan: -0.5 });
  tl.to(sixB.a, { x: 960 + 150 - 670, y: 520 - 84 - 270, scale: 0.08, duration: 0.5, ease: 'power3.in' }, T.clockFly);
  k.pop(A.ck, T.clockFly + 0.45, { ease: 'popBig', pitch: 800 });
  k.draw(A.arc, T.arc, 0.6, { ease: 'power2.inOut' }); SR.sfx(T.arc + 0.6, 'tick', { pitch: 2600, gain: 0.4 });

  /* ========== 0:57 His view, with his reason: it crosses the single sheet in one clean move ========== */
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

  /* ========== 1:06 Revised, checked. Thursday 10:30: the trucks are gone, the crane sets up on P2 ========== */
  tl.fromTo(A.sp, { scale: 1.8 }, { scale: 1, duration: 0.3, ease: 'power3.in', immediateRender: false }, T.stamp);
  tl.set(A.sp, { autoAlpha: 1 }, T.stamp);
  SR.sfx(T.stamp + 0.3, 'thunk', { gain: 0.7 });
  tl.to(A.a, { keyframes: [{ scale: 0.97, duration: 0.05 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1,0.35)' }] }, T.stamp + 0.3);
  // zoom into P2: the sheet becomes the quay
  tl.to(A.a, { scale: 9, duration: 0.5, ease: 'power3.in', transformOrigin: `${(95 + 200) / 400 * 100}% ${(46 + 140) / 280 * 100}%` }, T.zoomP2);
  SR.sfx(T.zoomP2, 'whoosh', { dur: 0.5, rise: true, lo: 300, hi: 5000, gain: 0.45 });
  tl.set([sheetsL, hud, bubL, sC], { autoAlpha: 0 }, T.thu2);
  tl.set(sT, { autoAlpha: 1 }, T.thu2); tl.set(crA, { x: -1300 }, T.thu2);
  tl.set(thuL.groups, { scale: 0 }, T.thu2);
  const t10 = SR.words(sTa, 'Thursday 10:00', 150, 200, stTitle, C.white), t1030 = SR.words(sTa, 'Thursday 10:30', 150, 200, stTitle, C.white);
  gsap.set([...t10.groups, ...t1030.groups], { scale: 0 });
  k.popWords(t10.groups, T.thu2 + 0.15); k.outWords(t10.groups, T.label1030 - 0.3); k.popWords(t1030.groups, T.label1030);
  tl.to(trG, { x: 1400, duration: 1.3, ease: 'power2.in' }, T.trucksOut);
  SR.sfx(T.trucksOut, 'rumble', { dur: 1.3, gain: 0.45 }); SR.sfx(T.trucksOut + 0.5, 'whoosh', { dur: 0.8, rise: false, lo: 300, hi: 1500, gain: 0.3 });
  tl.fromTo(crA, { x: -1300 }, { x: 1000 - 704, duration: 1.4, ease: 'power1.out', immediateRender: false }, T.craneRoll);
  SR.sfx(T.craneRoll, 'rumble', { dur: 1.5, gain: 0.5 });
  tl.to(crA, { keyframes: [{ x: 1000 - 704 + 12, duration: 0.1 }, { x: 1000 - 704, duration: 0.5, ease: 'elastic.out(1,0.35)' }] }, T.craneRoll + 1.4);
  outs.forEach((g, i) => { const at = T.out1 + i * 0.5; tl.to(g, { scaleY: 1, duration: 0.18, ease: 'power3.in' }, at - 0.18); SR.sfx(at, 'thunk', { gain: 0.55 }); tl.to(crA, { keyframes: [{ y: -3, duration: 0.04 }, { y: 0, duration: 0.2 }] }, at); });
  crew.forEach((c, i) => tl.to(c.rise, { keyframes: [{ y: -16, duration: 0.15 }, { y: 0, duration: 0.4, ease: 'elastic.out(1,0.35)' }] }, T.out1 + 2.0 + i * 0.12));

  /* ========== 1:15 Callback: black, one sheet carrying everything, then the rule ========== */
  k.show(endBg, T.collapse);
  tl.to(sTa, { scale: 0.02, rotation: -8, duration: 0.45, ease: 'power3.in', transformOrigin: '50% 45%' }, T.collapse);
  SR.sfx(T.collapse, 'whoosh', { dur: 0.45, rise: true, lo: 3000, hi: 300, gain: 0.4 });
  tl.set(sT, { autoAlpha: 0 }, T.endSheet);
  const E = sheet(endL, 960, 470, { header: 'Lift sequence', trucks: true, clock: true, pause: true, stamp: true, late: true });
  gsap.set(E.a, { scale: 0 });
  tl.fromTo(E.a, { scale: 0 }, { scale: 1.4, duration: 0.5, ease: 'popBig', immediateRender: false }, T.endSheet);
  SR.sfx(T.endSheet, 'pop', { pitch: 300, gain: 0.5 });
  SR.onTick(tt => { if (tt > T.endSheet + 0.6) E.p.setAttribute('transform', `translate(960,${470 + Math.sin((tt - T.endSheet) * 2 * Math.PI * 0.3) * 4})`); });
  const rule = SR.words(endL, 'Say it back. Then your view, and why.', 960, 830, stTitle, C.white, { align: 'center' });
  gsap.set(rule.groups, { opacity: 0 });
  rule.groups.forEach((g, i) => tl.fromTo(g, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'pop', immediateRender: false }, T.rule + i * 0.16));
  for (let i = 0; i < rule.groups.length; i++) SR.sfx(T.rule + i * 0.16, 'tick', { pitch: 2600, gain: 0.12 });

  /* ---------- captions for the narration (real time, so the rewind does not replay them) ---------- */
  const stC = SR.style('caption');
  const deepAt = t => t < T.thu || (t >= T.replay && t < T.thu2) || t >= T.collapse;
  cues.captions.forEach(([t0, t1, text]) => {
    const g = el('g', {}, capL);
    const lines = []; let cur = [];
    text.split(' ').forEach(w => { const tst = [...cur, w].join(' '); if (cur.length && tst.length > 42) { lines.push(cur.join(' ')); cur = [w]; } else cur.push(w); });
    if (cur.length) lines.push(cur.join(' '));
    const wMx = Math.max(...lines.map(l => SR.measure(l, stC))), bh = lines.length * stC.lh + 28, by = H - 96 - bh;
    const box = rect(g, (W - wMx) / 2 - 28, by, wMx + 56, bh, C.blue);
    lines.forEach((l, i) => SR.textEl(g, l, W / 2, by + 14 + stC.size * 0.86 + i * stC.lh, stC, C.white, 'middle'));
    SR.onTick((tt, t) => { const on = t >= t0 && t < t1; g.setAttribute('visibility', on ? 'visible' : 'hidden'); if (on) box.setAttribute('fill', deepAt(t) ? C.blue : C.deep); });
  });
};
