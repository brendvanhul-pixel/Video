/* "Plan your week": 120 s recap film for the e-learning on planning your week.
 * Caslon voice (rule 4: Group Talent learning product). No VO file yet: captions carry every line.
 * Hero: the yellow dot = "the one thing that must happen this week".
 * Phone badge -> hijacked by the loudest card -> iris -> margin mark beside the lift study ->
 * clash flag on Wednesday -> send button -> full stop of the end title.
 */
window.FILM = async function (SR, tl, root, T, cues) {
  const { C, W, H, FR, el, place, anim, rect, circle, path, stroke } = SR;
  const k = SR.kit(tl);
  const stTitle = SR.style('title'), stBody = SR.style('body'), stLabel = SR.style('label'), stDisp = SR.style('display');

  /* ---------- layers: world (scenes + hero, camera-able) and captions on top ---------- */
  const world = el('g', {}, root);
  const cam = el('g', {}, world);
  const scenesL = el('g', {}, cam);
  const heroB = el('g', {}, cam);
  const heroL = el('g', {}, heroB);
  // a slow push on every shot; it resets only on frames a transition fully covers
  const shots = [[0, T.tray + 0.9], [T.tray + 0.9, T.s3], [T.s3, T.iris + 0.55], [T.iris + 0.55, T.strip], [T.strip, T.wipe7 + 0.42], [T.wipe7 + 0.42, T.s8], [T.s8, T.s9 - 0.1], [T.s9 - 0.1, 120]];
  SR.onTick(t => {
    const sh = shots.find(([a, b]) => t >= a && t < b) || shots[shots.length - 1];
    const z = 1 + 0.035 * SR.smooth((t - sh[0]) / (sh[1] - sh[0]));
    cam.setAttribute('transform', `translate(${960 * (1 - z)},${540 * (1 - z)}) scale(${z})`);
    heroB.setAttribute('transform', `translate(0,${Math.sin(t * 2 * Math.PI / 1.2) * 4})`);
  });
  const capL = el('g', {}, root);
  const defs = document.querySelector('#stage defs');

  const hero = SR.hero(heroL, { r: 40, fill: C.yellow });
  gsap.set(hero.pos, { x: 585, y: -120 });

  /* ---------- helpers ---------- */
  const scene = (ground) => { const g = el('g', {}, scenesL); gsap.set(g, { autoAlpha: 0 }); if (ground) rect(g, 0, 0, W, H, ground); return g; };
  // keyword line, top left, title style
  const kw = (parent, str, at, out, x = 150, y = 200) => {
    const w = SR.words(parent, str, x, y, stTitle, C.white); gsap.set(w.groups, { scale: 0 });
    k.popWords(w.groups, at); if (out !== undefined) k.outWords(w.groups, out); return w;
  };
  // flies items into one point; centres are given explicitly because elements move before this runs
  const sink = (items, at, px, py, o = {}) => {
    items.forEach(([g, cx, cy], i) => tl.to(g, { x: `+=${px - cx}`, y: `+=${py - cy}`, scale: 0.06, rotation: (i % 2 ? 1 : -1) * 70,
      duration: o.dur || 0.42, ease: 'power3.in', transformOrigin: '50% 50%' }, at + i * (o.stagger || 2 * FR)));
    SR.sfx(at, 'whoosh', { dur: 0.5, rise: true, lo: 3000, hi: 300, gain: 0.45 });
  };
  const hopTo = (at, x, y, o = {}) => k.hop(hero, at, Object.assign({ x, y, dur: 0.45, spin: 200 }, o));
  const heroPop = (at, s) => { tl.fromTo(hero.size, { scale: 0 }, { scale: s, duration: 0.4, ease: 'popBig', immediateRender: false }, at); SR.sfx(at, 'pop', { pitch: 500, gain: 0.45 }); };
  const heroOut = (at) => tl.to(hero.size, { scale: 0, duration: 0.22, ease: 'back.in(2)' }, at);
  // drop-in with squash on landing
  const dropIn = (g, at, o = {}) => {
    const d = o.dur || 0.32;
    tl.fromTo(g, { y: o.from ?? -1000 }, { y: o.to ?? 0, duration: d, ease: 'power2.in' }, at);
    tl.to(g, { keyframes: [{ scaleY: 0.84, scaleX: 1.08, duration: 0.05 }, { scaleY: 1, scaleX: 1, duration: 0.5, ease: 'elastic.out(1.1,0.35)' }], transformOrigin: '50% 100%' }, at + d);
    if (o.sfx !== false) SR.sfx(at + d, o.sfx || 'pop', { pitch: o.pitch || 420, gain: o.gain ?? 0.5, pan: o.pan });
  };
  const icon = (parent, x, y, r, name, bg, ink, acc) => { const g = place(parent, x, y); circle(g, 0, 0, r, bg); SR.icon(place(g, 0, 0, `scale(${r / 150})`), name, ink, acc, { fill: bg }); return g; };
  // job card: white rounded block, icon chip and label
  const card = (parent, cx, cy, w, h, ic, label, o = {}) => {
    const p = place(parent, cx, cy), a = anim(p), sh = anim(a);
    rect(sh, -w / 2, -h / 2, w, h, o.fill || C.white, 20);
    icon(sh, -w / 2 + h / 2 + 6, 0, h * 0.34, ic, C.blue, C.white, C.tint);
    SR.textEl(sh, label, -w / 2 + h + 18, 15, stBody, C.deep);
    return { p, a, sh };
  };
  // plan block on a strip: left edge at x, centred on y
  const block = (parent, x, y, w, h, fill, label, ink = C.deep) => {
    const a = anim(place(parent, x, y));
    const r = rect(a, 0, -h / 2, w, h, fill, 12);
    const t = SR.textEl(a, label, 22, 11, stLabel, ink);
    return { a, r, t, w, h };
  };
  const bang = (g, ink) => { rect(g, -9, -40, 18, 50, ink, 9); circle(g, 0, 30, 10, ink); };
  // little person head-and-shoulders for avatars
  const avatar = (parent, x, y, s, skin, hairCol, shirt, hair = 'long') => {
    const a = anim(place(parent, x, y)), g = place(a, 0, 0, `scale(${s})`);
    path(g, 'M-70,110 C-70,40 70,40 70,110 Z', shirt);
    if (hair === 'long') path(g, 'M-50,-6 C-56,-62 56,-62 50,-6 L54,56 C40,68 26,66 22,46 L-22,46 C-26,66 -40,68 -54,56 Z', hairCol);
    circle(g, 0, 0, 46, skin);
    path(g, 'M-47,-2 C-50,-52 50,-52 47,-2 C38,-24 20,-34 0,-34 C-20,-34 -38,-24 -47,-2 Z', hairCol);
    circle(g, -16, 4, 6, C.deep); circle(g, 16, 4, 6, C.deep);
    return a;
  };

  // hi-vis vest: blue-deep panels with vertical shoulder bands and one waist band, drawn under the arms
  const vest = (c, band = C.white, col = C.deep) => {
    const v = el('g'); c.body.insertBefore(v, c.body.children[1]);
    path(v, 'M-108,600 C-104,570 -84,556 -56,552 L-30,552 L-30,760 L-118,760 Z', col);
    path(v, 'M108,600 C104,570 84,556 56,552 L30,552 L30,760 L118,760 Z', col);
    rect(v, -74, 556, 16, 204, band, 4); rect(v, 58, 556, 16, 204, band, 4);
    rect(v, -114, 706, 84, 16, band, 3); rect(v, 30, 706, 84, 16, band, 3);
  };

  const X0 = 260, STEP = 220, CW = 210, xCol = i => X0 + i * STEP, spanW = n => n * CW + (n - 1) * (STEP - CW), xCol0 = X0;

  /* ========== SCENE 1 · Monday 08:52 (blue-deep) ========== */
  const s1 = scene(C.deep); k.show(s1, 0);
  const clock = SR.words(s1, '08:52', 150, 262, stDisp, C.white); gsap.set(clock.groups, { scale: 0 });
  // phone: the dot lands on its corner and becomes the badge
  const phone = anim(place(s1, 470, 800));
  rect(phone, -115, -420, 230, 420, C.deepBand, 36);
  rect(phone, -95, -380, 190, 320, C.blue, 16);
  circle(phone, 0, -280, 46, C.white);
  path(phone, 'M-22,-300 C-22,-318 22,-318 22,-300 L14,-262 C10,-250 -10,-250 -14,-262 Z', C.blue);
  SR.textEl(phone, 'Tom', 0, -170, stLabel, C.white, 'middle');
  rect(phone, -40, -40, 80, 12, C.deep, 6);
  gsap.set(phone, { scale: 0, transformOrigin: '50% 100%' });
  k.pop(phone, T.phone, { origin: '50% 100%', dur: 0.45, ease: 'popBig', pitch: 260 });
  k.drop(hero, T.drop, { x: 585, groundY: 420, rebound: 90 });
  [T.ring1, T.ring2, T.ring3].forEach((at, i) => {
    tl.to(phone, { keyframes: [{ rotation: 6, duration: 2 * FR }, { rotation: -6, duration: 2 * FR }, { rotation: 6, duration: 2 * FR }, { rotation: 0, duration: 2 * FR }], transformOrigin: '50% 100%' }, at);
    k.squash(hero, at + 0.04, 0.14);
    SR.sfx(at, 'tick', { pitch: 2600, gain: 0.3 }); SR.sfx(at + 0.09, 'tick', { pitch: 2300, gain: 0.25 });
  });
  k.popWords(clock.groups, T.clock, { stagger: 3 * FR, dur: 0.5 });
  const cTom = card(s1, 1270, 395, 900, 130, 'crane', 'Tom: rigging plan');
  const cMar = card(s1, 1270, 555, 900, 130, 'document', 'Marta: lift study, Wed');
  const cHQ = card(s1, 1330, 712, 640, 100, 'bars', 'HQ report, Fri', { fill: C.grey });
  dropIn(cTom.a, T.cards, { pitch: 380, pan: 0.3 });
  dropIn(cMar.a, T.cards + 3 * FR, { pitch: 460, pan: 0.3 });
  dropIn(cHQ.a, T.cards + 6 * FR, { pitch: 300, gain: 0.3, pan: 0.4 });
  // the voice walks across the cards: each one pulses as it is named
  [[cTom, T.nameTom], [cMar, T.nameMarta], [cHQ, T.nameHQ]].forEach(([c, at], i) => {
    tl.to(c.sh, { keyframes: [{ scale: 1.045, duration: 0.1, ease: 'power2.out' }, { scale: 1, duration: 0.55, ease: 'elastic.out(1,0.35)' }], transformOrigin: '50% 50%' }, at);
    SR.sfx(at, 'pluck', { note: [76, 79, 67][i], gain: 0.18, pan: 0.3 });
  });
  [[cTom, 1270, 395], [cMar, 1270, 555], [cHQ, 1330, 712]].forEach(([c, x, y], i) => SR.onTick(t => c.p.setAttribute('transform', `translate(${x},${y}) scale(${1 + 0.005 * Math.sin((t + i * 0.7) * 2 * Math.PI * 0.4)})`)));
  tl.to(cHQ.sh, { y: 6, rotation: -2, duration: 1.2, ease: 'sine.inOut', transformOrigin: '50% 50%' }, T.hqQuiet);
  // transition: a blue tray rises from the bottom edge and swallows the week
  const trayP = place(s1, 0, 0), tray = anim(trayP);
  rect(tray, 0, 0, W, H + 60, C.blue);
  const mouth = anim(place(tray, 960, 70)); rect(mouth, -470, -28, 940, 56, C.deepBand, 28);
  gsap.set(tray, { y: H + 10 });
  tl.to(tray, { y: 0, duration: 0.9, ease: 'power2.inOut' }, T.tray);
  tl.to(mouth, { scaleX: 0, duration: 0.25, ease: 'back.in(2)', transformOrigin: '50% 50%' }, T.tray + 0.62);
  sink([[cTom.a, 1270, 395], [cMar.a, 1270, 555], [cHQ.a, 1330, 712], [phone, 470, 590]], T.tray + 0.05, 960, 640);
  k.outWords(clock.groups, T.tray);
  hopTo(T.tray + 0.05, 960, 640, { scale: 0, dur: 0.4, land: false });

  /* ========== SCENE 2 · The inbox decides (blue-301) ========== */
  const s2 = scene(C.blue);
  k.show(s2, T.s2); k.hide(s1, T.s2 + 0.05);
  const kw2 = kw(s2, 'Loudest first', T.kw2, T.bigBub - 0.2);
  const cl = el('g', {}, s2);
  const slot = [360, 510, 660, 768];
  const tom2 = card(cl, 960, 0, 760, 120, 'crane', 'Tom: rigging plan');
  const mar2 = card(cl, 960, 0, 760, 120, 'document', 'Marta: lift study');
  const hq2 = card(cl, 960, 0, 620, 100, 'bars', 'HQ report', { fill: C.grey });
  gsap.set(tom2.a, { y: slot[0] }); gsap.set(mar2.a, { y: slot[1] }); gsap.set(hq2.a, { y: slot[2] });
  [tom2, mar2, hq2].forEach((c, i) => k.pop(c.sh, T.stack + i * 3 * FR, { origin: '50% 100%', ease: 'popBig', pitch: 400 + 120 * i, gain: 0.35 }));
  const topY = slot[0] - 60 - 44;
  tl.set(hero.pos, { x: 1280, y: topY }, T.dotOn - 0.05);
  heroPop(T.dotOn, 1);
  // the loudest card is drawn on top: deterministic reorder from the schedule
  const loud = [[0, tom2], [T.shuf1, mar2], [T.shuf2, tom2], [T.shuf3, mar2], [T.hqBack, hq2]];
  SR.onTick(t => { let c = loud[0][1]; loud.forEach(([a, cc]) => { if (t >= a) c = cc; }); if (cl.lastChild !== c.p) cl.appendChild(c.p); });
  const jump = (c, at, y, side) => {
    tl.to(c.a, { keyframes: [{ x: side * 560, duration: 0.24, ease: 'power2.out' }, { x: 0, duration: 0.3, ease: 'power2.in' }] }, at);
    tl.to(c.a, { y, duration: 0.54, ease: 'power2.inOut' }, at);
    tl.to(c.sh, { keyframes: [{ scale: 1.08, duration: 0.24 }, { scale: 1, duration: 0.45, ease: 'elastic.out(1,0.4)' }], transformOrigin: '50% 50%' }, at);
    SR.sfx(at, 'zip', { dur: 0.3, gain: 0.35, pan: side * 0.4 });
  };
  const slide = (c, at, y) => tl.to(c.a, { y, duration: 0.4, ease: 'power3.inOut' }, at);
  const bumpDot = (at) => { tl.to(hero.pos, { keyframes: [{ y: topY - 130, duration: 0.24, ease: 'power2.out' }, { y: topY, duration: 0.3, ease: 'power2.in' }] }, at); tl.to(hero.spin, { rotation: '+=180', duration: 0.54 }, at); k.squash(hero, at + 0.54, 0.22); SR.sfx(at + 0.54, 'pop', { pitch: 800, gain: 0.4 }); };
  const bubbles = [
    [T.bub1, 1620, 470, 330, 170, 'left', 0], [T.bub1 + 0.15, 290, 610, 200, 110, 'right', 0],
    [T.bub2, 300, 470, 340, 180, 'right', 0], [T.bub2 + 0.15, 1630, 700, 200, 110, 'left', 0],
    [T.bub3, 1620, 520, 360, 190, 'left', 0], [T.bub3 + 0.12, 300, 380, 190, 100, 'right', 0], [T.bub3 + 0.24, 1660, 290, 160, 90, 'left', 0]
  ];
  const outAt = { [T.bub1]: T.shuf1 + 0.6, [T.bub2]: T.shuf2 + 0.6, [T.bub3]: T.shuf3 + 0.6 };
  bubbles.forEach(([at, x, y, w, h, tail], i) => {
    const b = SR.bubble(s2, x, y, { w, h, fill: C.white, tail, content: bang });
    gsap.set(b, { scale: 0 });
    const o = b.dir > 0 ? '78% 100%' : '22% 100%';
    k.pop(b, at, { origin: o, dur: 0.4, ease: 'popBig', rot: -10 * b.dir, pitch: 500 + (w > 300 ? -150 : 250), pan: x < 960 ? -0.6 : 0.6, gain: w > 300 ? 0.55 : 0.35 });
    const base = Object.keys(outAt).map(Number).filter(v => v <= at + 0.001).pop();
    k.unpop(b, outAt[base] + (i % 3) * 2 * FR, { origin: o });
  });
  jump(mar2, T.shuf1, slot[0], 1); slide(tom2, T.shuf1 + 0.08, slot[1]); slide(hq2, T.shuf1 + 0.16, slot[3]); bumpDot(T.shuf1 + 0.02);
  jump(tom2, T.shuf2, slot[0], -1); slide(mar2, T.shuf2 + 0.08, slot[1]);
  tl.to(hq2.a, { y: 1260, rotation: 12, duration: 0.55, ease: 'power3.in' }, T.shuf2 + 0.16); SR.sfx(T.shuf2 + 0.2, 'whoosh', { dur: 0.4, rise: false, lo: 2000, hi: 300, gain: 0.3 });
  bumpDot(T.shuf2 + 0.02);
  jump(mar2, T.shuf3, slot[0], 1); slide(tom2, T.shuf3 + 0.08, slot[1]); bumpDot(T.shuf3 + 0.02);
  // the quiet job comes back, urgent and shaking
  tl.set(hq2.a, { rotation: 0, y: -300 }, T.hqBack - 0.05);
  tl.to(hq2.a, { y: slot[0], duration: 0.34, ease: 'power2.in' }, T.hqBack);
  tl.to(hq2.sh, { keyframes: [{ scaleY: 0.8, scaleX: 1.12, duration: 0.05 }, { scaleY: 1.06, scaleX: 1.06, duration: 0.5, ease: 'elastic.out(1.1,0.35)' }], transformOrigin: '50% 50%' }, T.hqBack + 0.34);
  SR.sfx(T.hqBack + 0.34, 'boing', { pitch: 240, gain: 0.7 });
  slide(mar2, T.hqBack + 0.3, slot[1]); slide(tom2, T.hqBack + 0.36, slot[2]);
  tl.to(hero.pos, { keyframes: [{ y: topY - 260, duration: 0.2, ease: 'power2.out' }, { y: topY, duration: 0.34, ease: 'power2.in' }] }, T.hqBack + 0.2);
  k.squash(hero, T.hqBack + 0.74, 0.25);
  SR.onTick(t => { const s = t - (T.hqBack + 0.8); const sh = s > 0 && t < T.wipe3 ? Math.sin(s * 2 * Math.PI * 7) * 2.2 * (0.6 + 0.4 * Math.sin(s * 3)) : 0; hq2.p.setAttribute('transform', `translate(${960 + sh * 2},0) rotate(${sh})`); });
  // the biggest bubble grows into scene 3's ground
  const big = SR.bubble(s2, 1560, 560, { w: 420, h: 220, fill: C.deep, tail: 'left', content: bang });
  gsap.set(big, { scale: 0 });
  k.pop(big, T.bigBub, { origin: '22% 100%', dur: 0.5, ease: 'popBig', rot: 10, pitch: 220, gain: 0.6, pan: 0.5 });
  heroOut(T.wipe3 - 0.15);
  k.shapeWipe(big, T.wipe3, { scale: 15, dx: -600, dy: -20, dur: 0.5, anticipate: 0.25 });

  /* ========== SCENE 3 · Why they push (blue-deep; Marta's office on deep-raised) ========== */
  const s3 = scene(C.deep);
  k.show(s3, T.s3); k.hide(s2, T.s3 + 0.05);
  rect(s3, 960, 0, 960, H, C.deepRaised);
  SR.props.crane(s3, 230, 792, 0.75, { color: C.deepBand, accent: C.deepRaised, angle: -60, cable: 100 });
  const tom = SR.character(s3, 560, 800, { shirt: C.blue, sleeve: C.blue, skin: SR.SKIN[1], helmet: C.white, hair: 'none' }); vest(tom);
  rect(tom.armR.fore, -21, 48, 42, 74, C.white, 9); rect(tom.armR.fore, -14, 56, 28, 50, C.tint, 5);
  rect(s3, 0, 790, 960, 290, C.deepBand);
  const ccF = place(s3, 1650, 812, 'scale(0.6)');
  const cc = SR.character(ccF, 0, 0, { shirt: C.deepBand, sleeve: C.blue, skin: SR.SKIN[3], hair: 'side', hairColor: SR.HAIR[0], glasses: true });
  const marta = SR.character(s3, 1430, 800, { shirt: C.tint, sleeve: C.blue, skin: SR.SKIN[2], hair: 'long', hairColor: SR.HAIR[1] });
  SR.props.table(s3, 1150, 1940, 800, C.deep);
  SR.props.laptop(s3, 1250, 800, C.blue);
  const ccLab = anim(place(s3, 1740, 600)); SR.textEl(ccLab, 'cc', 0, 0, stBody, C.white, 'middle'); gsap.set(ccLab, { scale: 0 });
  gsap.set(ccF, { autoAlpha: 0 }); k.show(ccF, T.cc);
  tl.fromTo(tom.rise, { y: 440 }, { y: 0, duration: 0.5, ease: 'popBig' }, T.tomOn); SR.sfx(T.tomOn, 'boing', { pitch: 260, gain: 0.45, pan: -0.4 });
  tl.fromTo(marta.rise, { y: 440 }, { y: 0, duration: 0.5, ease: 'popBig' }, T.martaOn); SR.sfx(T.martaOn, 'boing', { pitch: 320, gain: 0.45, pan: 0.4 });
  tl.fromTo(cc.rise, { y: 380 }, { y: 0, duration: 0.45, ease: 'popBig' }, T.cc); SR.sfx(T.cc, 'pluck', { note: 79, gain: 0.35, pan: 0.6 });
  k.pop(ccLab, T.cc + 0.15, { sfx: false, ease: 'popBig' });
  kw(s3, 'They can’t see when', T.kw3, T.dotBack);
  // a blank card with a question hook in front of each of them
  const qcard = (x, at) => {
    const a = anim(place(s3, x, 400)); rect(a, -80, -100, 160, 200, C.white, 18);
    const hk = stroke(a, 'M-26,-30 C-26,-62 28,-62 28,-28 C28,-4 2,0 2,24', C.deep, 16); const dt = circle(a, 2, 58, 10, C.deep);
    gsap.set(a, { scale: 0 }); gsap.set(dt, { scale: 0, transformOrigin: '50% 50%' });
    k.pop(a, at, { ease: 'popBig', rot: -12, pitch: 650, gain: 0.4 });
    k.draw(hk, at + 0.25, 0.3, { sfx: 'tick' }); k.pop(dt, at + 0.55, { sfx: false });
    return a;
  };
  const q1 = qcard(820, T.tomCard), q2 = qcard(1730, T.martaCard);
  SR.charLife(tom, { seed: 0.3, side: 1, from: T.s3, to: T.iris + 0.6, talk: [[T.tomPhone + 0.4, T.martaCard - 0.2]] });
  SR.charLife(marta, { seed: 1.1, side: -1, from: T.s3, to: T.iris + 0.6, listen: [] });
  SR.charLife(cc, { seed: 2.2, side: -1, from: T.cc, to: T.iris + 0.6, listen: [[T.cc + 0.5, T.iris]] });
  // speakers take turns: Tom lifts his phone, then holds; Marta types, then holds
  SR.onTick(t => {
    if (t < T.s3 || t > T.iris + 0.6) return;
    const up = SR.smooth((t - T.tomPhone) / 0.35) * (1 - SR.smooth((t - (T.martaCard - 0.3)) / 0.4));
    SR.setArms(tom, 0, up);
    const typ = SR.win(t, T.martaType, T.dotBack - 0.3, 0.2);
    const a1 = 0.16 + typ * 0.08 * Math.max(0, Math.sin(t * 2 * Math.PI * 5.5)), a2 = 0.16 + typ * 0.08 * Math.max(0, Math.sin(t * 2 * Math.PI * 5.5 + 2));
    SR.setArms(marta, a1, a2);
  });
  for (let i = 0; i < 10; i++) SR.sfx(T.martaType + 0.2 + i * 0.18, 'tick', { pitch: 3200 + (i % 3) * 300, gain: 0.12, pan: 0.4 });
  SR.sfx(T.tomPhone, 'whoosh', { dur: 0.3, rise: false, lo: 800, hi: 3000, gain: 0.2, pan: -0.4 });
  // the dot returns, rolls to centre, turns white on take-off and opens the iris
  tl.set(hero.size, { scale: 0.8 }, T.dotBack - 0.01);
  tl.set(hero.sq, { scaleX: 1, scaleY: 1 }, T.dotBack - 0.01);
  k.drop(hero, T.dotBack, { x: 700, groundY: 790 + 8, rebound: 70 });
  k.roll(hero, T.roll3, 700, 960, 0.45, 'power2.inOut');
  const irisClip = el('circle', { cx: 0, cy: 0, r: 0 }, el('clipPath', { id: 'iris4' }, defs));
  const s4 = scene(C.blue); s4.setAttribute('clip-path', 'url(#iris4)');
  k.anticipate(hero, T.iris, 0.2);
  tl.set(hero.body, { attr: { fill: C.white } }, T.iris);
  tl.set(hero.body, { attr: { fill: C.blue } }, T.iris + 2 * FR);
  k.iris(hero, T.iris, { x: 960, y: 540, next: s4, clip: irisClip });
  k.hide(s3, T.iris + 0.6);
  tl.set(hero.size, { scale: 0 }, T.iris + 0.62); tl.set(hero.spin, { scale: 1 }, T.iris + 0.62);
  tl.set(hero.body, { attr: { fill: C.yellow } }, T.iris + 0.62);

  /* ========== SCENE 4 · Ten minutes, one page (blue-301, white page; dot lives in the blue margin) ========== */
  kw(s4, '10 minutes · one page', T.kw4, T.roll - 0.2, 160);
  const pgP = place(s4, 960, 520), pg = anim(pgP);
  rect(pg, -360, -270, 720, 540, C.white, 16);
  SR.textEl(pg, 'This week', -300, -192, SR.style('eyebrow'), C.blue);
  const rows = [['Rigging plan', 'Tue 12:00'], ['Lift study', 'Wed'], ['HQ report', 'Fri'], ['Permit', 'Thu']];
  const rowAt = [T.row1, T.row2, T.row3, T.row4];
  rows.forEach(([a, b], i) => {
    const y = -100 + i * 100;
    const r1 = SR.words(pg, a, -300, y, stBody, C.deep), r2 = SR.words(pg, b, 300, y, stBody, C.blue, { align: 'right' });
    const rule = anim(place(pg, -300, y + 34)); rect(rule, 0, -2, 600, 4, C.grey, 2);
    gsap.set([...r1.groups, ...r2.groups], { scale: 0 }); gsap.set(rule, { scaleX: 0, transformOrigin: '0% 50%' });
    k.popWords([...r1.groups, ...r2.groups], rowAt[i], { sfx: 'tick' });
    tl.to(rule, { scaleX: 1, duration: 0.4, ease: 'power3.out' }, rowAt[i] + 0.1);
    SR.sfx(rowAt[i] + 0.12, 'pluck', { note: [72, 76, 79, 84][i], gain: 0.18 });
  });
  gsap.set(pg, { scale: 0, transformOrigin: '50% 50%' });
  k.pop(pg, T.iris + 0.3, { ease: 'popBig', dur: 0.6, rot: -4, pitch: 300 });
  // ten-minute timer, top right
  const tmP = place(s4, 1630, 330), tm = anim(tmP);
  el('circle', { cx: 0, cy: 0, r: 88, fill: 'none', stroke: C.deepBand, 'stroke-width': 18 }, tm);
  const sweep = stroke(tm, 'M0,-88 A88,88 0 1 1 -0.01,-88', C.white, 18);
  SR.textEl(tm, '10 min', 0, 11, stLabel, C.white, 'middle');
  gsap.set(tm, { scale: 0 });
  k.pop(tm, T.timer, { ease: 'popBig', pitch: 700 });
  k.draw(sweep, T.timer + 0.3, 3.0, { ease: 'none' });
  SR.sfx(T.timer + 3.3, 'ding', { gain: 0.25, pan: 0.6 });
  // the one thing: the dot hops into the margin beside the lift study row
  tl.set(hero.pos, { x: 300, y: -90 }, T.dotMark - 0.3); tl.set(hero.size, { scale: 0.7 }, T.dotMark - 0.3);
  hopTo(T.dotMark, 540, 495, { dur: 0.7, apexY: 120, pitch: 900 });
  SR.sfx(T.dotMark + 0.7, 'sparkle', { gain: 0.35, pan: -0.4 });
  // split frame: page slides left, Tom's phone lights up on the right
  k.unpop(tm, T.split - 0.2);
  tl.to(pg, { x: -340, duration: 0.6, ease: 'power3.inOut' }, T.split);
  tl.to(hero.pos, { x: 200, duration: 0.6, ease: 'power3.inOut' }, T.split);
  SR.sfx(T.split, 'whoosh', { dur: 0.6, rise: false, lo: 400, hi: 3000, gain: 0.3 });
  const crewA = place(s4, 1390, 812, 'scale(0.72)'), crewB = place(s4, 1770, 812, 'scale(0.72)');
  const cr1 = SR.character(crewA, 0, 0, { shirt: C.blue, sleeve: C.blue, skin: SR.SKIN[3], helmet: C.white, hair: 'none' }); vest(cr1, C.tint);
  const cr2 = SR.character(crewB, 0, 0, { shirt: C.blue, sleeve: C.blue, skin: SR.SKIN[0], helmet: C.white, hair: 'none' }); vest(cr2, C.tint);
  const tom4 = SR.character(s4, 1580, 810, { shirt: C.blue, sleeve: C.blue, skin: SR.SKIN[1], helmet: C.white, hair: 'none' }); vest(tom4);
  rect(tom4.armR.fore, -18, 50, 36, 64, C.deep, 8); const scr4 = rect(tom4.armR.fore, -12, 57, 24, 46, C.deepBand, 4);
  const ground4 = anim(place(s4, 0, 0)); rect(ground4, 0, 806, W, 300, C.deepBand);
  gsap.set(ground4, { y: 300 });
  tl.to(ground4, { y: 0, duration: 0.5, ease: 'power3.out' }, T.split + 0.1);
  gsap.set([cr1.rise, cr2.rise, tom4.rise], { y: 460, autoAlpha: 0 });
  k.show(tom4.rise, T.tomOn4); k.show(cr1.rise, T.crew1); k.show(cr2.rise, T.crew2);
  tl.fromTo(tom4.rise, { y: 460 }, { y: 0, duration: 0.5, ease: 'popBig' }, T.tomOn4); SR.sfx(T.tomOn4, 'boing', { pitch: 260, gain: 0.45, pan: 0.5 });
  tl.fromTo(cr1.rise, { y: 460 }, { y: 0, duration: 0.5, ease: 'popBig' }, T.crew1); SR.sfx(T.crew1, 'boing', { pitch: 340, gain: 0.4, pan: 0.3 });
  tl.fromTo(cr2.rise, { y: 460 }, { y: 0, duration: 0.5, ease: 'popBig' }, T.crew2); SR.sfx(T.crew2, 'boing', { pitch: 400, gain: 0.4, pan: 0.8 });
  SR.charLife(tom4, { seed: 0.7, side: -1, from: T.tomOn4, to: T.roll + 0.4, listen: [[T.phoneLit + 0.2, T.nod + 1.2]] });
  SR.charLife(cr1, { seed: 1.9, side: 1, from: T.crew1, to: T.roll + 0.4 });
  SR.charLife(cr2, { seed: 2.6, side: -1, from: T.crew2, to: T.roll + 0.4 });
  const tb = SR.bubble(s4, 1290, 420, { w: 400, h: 120, fill: C.white, tail: 'right', content: (g) => SR.textEl(g, 'Tuesday, 12:00', 0, 15, stBody, C.deep, 'middle') });
  gsap.set(tb, { scale: 0 });
  tl.to(scr4, { attr: { fill: C.blue }, duration: 0.1, ease: 'none' }, T.phoneLit - 0.1);
  k.pop(tb, T.phoneLit, { origin: '78% 100%', ease: 'popBig', rot: -8, pitch: 700, pan: 0.4 });
  SR.sfx(T.phoneLit, 'ding', { gain: 0.45, pan: 0.3 });
  tl.to(tb, { keyframes: [{ scale: 1.06, duration: 0.1 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1,0.35)' }] }, T.nod);
  SR.sfx(T.pocket, 'whoosh', { dur: 0.3, rise: false, lo: 2000, hi: 500, gain: 0.2, pan: 0.5 });
  SR.onTick(t => { if (t < T.tomOn4 || t > T.roll + 0.4) return; SR.setArms(tom4, 0, 0.85 * SR.win(t, T.phoneOn, T.pocket, 0.3)); });
  k.unpop(tb, T.exit4 - 0.1, { origin: '78% 100%' });
  [tom4.rise, cr1.rise, cr2.rise].forEach((r, i) => { k.unpop(r, T.exit4 + i * 2 * FR, { origin: '50% 100%' }); k.hide(r, T.exit4 + 0.35); });
  // roll-through: the page rolls over into a horizontal week strip
  tl.to(pg, { scaleY: 0.02, scaleX: 1.2, duration: 0.35, ease: 'power3.in' }, T.roll);
  SR.sfx(T.roll, 'whoosh', { dur: 0.6, rise: true, lo: 500, hi: 5000, gain: 0.45 });
  hopTo(T.roll + 0.05, xCol0 + STEP - 34, 470, { dur: 0.5, pitch: 700 });

  /* ========== SCENES 5-6 · the week strip (shared) ========== */
  // (xCol0/STEP are needed above: the dot lands beside the lift study's left end)
  const g5 = scene(C.blue); k.show(g5, T.strip); k.hide(s4, T.strip + 0.05);
  const g6 = scene(); const disc = circle(g6, xCol(3) - 34, 470, 1, C.deep); gsap.set(disc, { scale: 0, transformOrigin: '50% 50%' });
  const stripG = scene();
  const strip = anim(place(stripG, 0, 520));
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Next Mon'];
  const cells = days.map((d, i) => rect(strip, xCol(i), -190, CW, 410, i === 5 ? C.deepRaised : C.deepBand, 14));
  const dayLab = days.map((d, i) => { const a = anim(place(strip, xCol(i) + CW / 2, -218)); SR.textEl(a, d, 0, 0, stLabel, i === 5 ? C.grey : C.white, 'middle'); gsap.set(a, { scale: 0 }); return a; });
  k.show(stripG, T.strip);
  tl.fromTo(strip, { scaleY: 0.02, scaleX: 1.15 }, { scaleY: 1, scaleX: 1, duration: 0.55, ease: 'popBig', transformOrigin: '50% 50%', immediateRender: false }, T.strip);
  SR.sfx(T.strip + 0.05, 'pop', { pitch: 260, gain: 0.5 });
  dayLab.forEach((a, i) => k.pop(a, T.labels + i * 2 * FR, { origin: '50% 100%', sfx: false }));
  SR.sfx(T.labels, 'tick', { gain: 0.3 });

  /* ========== SCENE 5 · Dates move, check the record ========== */
  const s5 = scene(); k.show(s5, T.strip);
  const L0 = 380, L1 = 470, L2 = 580, L3 = 690; // lane centres
  const drw = block(s5, xCol(0), L0, CW, 56, C.white, 'Drawing');
  const stu = block(s5, xCol(1), L1, spanW(2), 76, C.white, 'Lift study');
  [drw.a, stu.a].forEach((a, i) => { gsap.set(a, { scale: 0 }); k.pop(a, T.blocks + i * 3 * FR, { origin: '0% 50%', ease: 'popBig', pitch: 500 + i * 150 }); });
  // "Drawing: Mon -> Thu" with a drawn arrow (no arrow glyph in Caslon)
  const k5a = SR.words(s5, 'Drawing: Mon', 150, 200, stTitle, C.white);
  const arP = place(s5, k5a.endX + 30, 172), ar = anim(arP);
  rect(ar, 0, -6, 70, 12, C.white, 6); path(ar, 'M62,-24 L96,0 L62,24 Z', C.white);
  const k5a2 = SR.words(s5, 'Thu', k5a.endX + 150, 200, stTitle, C.white);
  const k5aAll = [...k5a.groups, ar, ...k5a2.groups];
  gsap.set(k5aAll, { scale: 0 });
  k.popWords(k5aAll, T.kw5a); k.outWords(k5aAll, T.kw5out);
  gsap.set(drw.a, { transformOrigin: '0% 50%' });
  tl.to(drw.a, { x: 3 * STEP, duration: 0.4, ease: 'power3.inOut' }, T.slip);
  tl.to(drw.a, { keyframes: [{ scaleX: 1.35, duration: 0.2 }, { scaleX: 1, duration: 0.55, ease: 'elastic.out(1,0.4)' }] }, T.slip);
  SR.sfx(T.slip, 'zip', { dur: 0.35, gain: 0.45 });
  tl.to(stu.a, { x: 2 * STEP, duration: 0.6, ease: 'back.out(1.3)' }, T.drag);
  tl.to(stu.a, { keyframes: [{ scaleX: 1.22, scaleY: 0.9, duration: 0.25 }, { scaleX: 1, scaleY: 1, duration: 0.6, ease: 'elastic.out(1,0.35)' }], transformOrigin: '100% 50%' }, T.drag);
  SR.sfx(T.drag, 'whoosh', { dur: 0.5, rise: false, lo: 300, hi: 2500, gain: 0.35 });
  tl.to(hero.pos, { x: xCol(3) - 34, duration: 0.6, ease: 'back.out(1.8)' }, T.drag + 4 * FR);
  tl.to(hero.spin, { rotation: '+=240', duration: 0.6, ease: 'power2.out' }, T.drag + 4 * FR);
  // the record: past jobs like it flip up behind each block while the voice asks how they went
  const stackOn = (b, w, h, at, n) => {
    const cards = [...Array(n)].map((_, i) => { const r = rect(b.a, 0, -h / 2 - 14 * (i + 1), w, h, i % 2 ? C.grey : C.tint, 12); b.a.insertBefore(r, b.a.firstChild); return r; });
    cards.forEach((r, i) => { gsap.set(r, { scaleY: 0, transformOrigin: '50% 100%' }); tl.to(r, { scaleY: 1, duration: 0.35, ease: 'popBig' }, at + i * 0.22); SR.sfx(at + i * 0.22, 'pluck', { note: [72, 76, 79][i], gain: 0.2 }); });
    cards.forEach((r, i) => tl.to(r, { scaleY: 0, duration: 0.22, ease: 'back.in(2)' }, T.recOut + (n - 1 - i) * 2 * FR));
  };
  stackOn(stu, spanW(2), 76, T.rec1, 3);
  stackOn(drw, CW, 56, T.rec2, 3);
  // report: no record, so its block grows extra days (ghost stack is empty)
  const repG = anim(place(s5, xCol(4), L2));
  const repR = rect(repG, 0, -38, CW, 76, C.grey, 12); SR.textEl(repG, 'HQ report', 22, 11, stLabel, C.deep);
  // no record: the extra day is drawn as a dashed outline exactly on Thursday, then the block grows into it
  const xg = anim(place(s5, xCol(3), L2));
  el('rect', { x: 2, y: -36, width: CW - 4, height: 72, rx: 12, fill: 'none', stroke: C.white, 'stroke-width': 4, 'stroke-dasharray': '14 10' }, xg);
  gsap.set(xg, { scale: 0 });
  k.pop(xg, T.ghost5, { origin: '100% 50%', ease: 'popBig', pitch: 520 });
  tl.to(xg, { autoAlpha: 0, duration: 0.15 }, T.stretch + 0.5);
  gsap.set(repG, { autoAlpha: 0 }); k.show(repG, T.report);
  dropIn(repG, T.report, { from: -560, pitch: 320 });
  kw(s5, 'No record: extra days', T.kw5b, T.permit - 0.3);
  tl.to(repG, { x: -STEP, duration: 0.55, ease: 'power2.inOut' }, T.stretch);
  tl.to(repR, { attr: { width: spanW(2) }, duration: 0.55, ease: 'power2.inOut' }, T.stretch);
  SR.sfx(T.stretch, 'whoosh', { dur: 0.55, rise: true, lo: 200, hi: 1500, gain: 0.4 });
  // permit: six on time, so it lands on its date
  kw(s5, '6 on time: its date', T.kw5c, T.might - 0.3);
  const per = block(s5, xCol(2), L3, CW, 76, C.tint, 'Permit');
  gsap.set(per.a, { scale: 0, y: -80 });
  k.pop(per.a, T.permit, { ease: 'popBig', pitch: 600 });
  SR.onTick(t => { if (t > T.permit && t < T.permitLand) per.r.setAttribute('transform', `translate(0,${Math.sin((t - T.permit) * 2 * Math.PI * 0.9) * 6})`); else per.r.setAttribute('transform', ''); });
  const tickG = anim(place(s5, 0, L3));
  const ticks = [...Array(6)].map((_, i) => { const a = anim(place(tickG, 310 + i * 64, 0)); circle(a, 0, 0, 26, C.white); stroke(a, 'M-12,0 L-3,10 L13,-9', C.blue, 7); gsap.set(a, { scale: 0 }); return a; });
  ticks.forEach((a, i) => { k.pop(a, T.ticks + i * 4 * FR, { sfx: false, ease: 'popBig' }); SR.sfx(T.ticks + i * 4 * FR, 'tick', { pitch: 1800 * Math.pow(2, i / 12), gain: 0.3 }); });
  tl.to(per.a, { y: 0, duration: 0.24, ease: 'power2.in' }, T.permitLand - 0.24);
  tl.to(per.a, { keyframes: [{ scaleY: 0.8, scaleX: 1.1, duration: 0.05 }, { scaleY: 1, scaleX: 1, duration: 0.5, ease: 'elastic.out(1.1,0.35)' }], transformOrigin: '50% 100%' }, T.permitLand);
  SR.sfx(T.permitLand, 'thunk', { gain: 0.7 });
  // "might": a dashed outline that hovers outside the strip; a question flies to Marta
  kw(s5, '“Might”: ask first', T.kw5d, T.collapse5);
  const mtG = anim(place(s5, 1700, 560)), mt = anim(mtG);
  el('rect', { x: -100, y: -48, width: 200, height: 96, rx: 14, fill: 'none', stroke: C.white, 'stroke-width': 5, 'stroke-dasharray': '16 11' }, mt);
  SR.textEl(mt, 'Maybe more', 0, 11, stLabel, C.white, 'middle');
  gsap.set(mtG, { scale: 0 });
  k.pop(mtG, T.might, { ease: 'popBig', rot: 8, pitch: 700 });
  SR.onTick(t => mt.setAttribute('transform', t > T.might ? `translate(0,${Math.sin((t - T.might) * 2 * Math.PI * 0.6) * 9}) rotate(${Math.sin((t - T.might) * 2 * Math.PI * 0.4) * 2})` : ''));
  const mav = avatar(s5, 1640, 196, 0.85, SR.SKIN[2], SR.HAIR[1], C.tint);
  gsap.set(mav, { scale: 0 });
  k.pop(mav, T.avatar, { ease: 'popBig', pitch: 520, pan: 0.6 });
  const qb = SR.bubble(s5, 1500, 186, { w: 130, h: 90, fill: C.white, tail: 'right', content: 'question' });
  gsap.set(qb, { x: 200, y: 330, scale: 0 });
  tl.to(qb, { scale: 1, duration: 0.3, ease: 'popBig' }, T.ask);
  tl.to(qb, { x: 0, duration: 0.6, ease: 'power1.inOut' }, T.ask);
  tl.to(qb, { keyframes: [{ y: 120, duration: 0.3, ease: 'power2.out' }, { y: 0, duration: 0.3, ease: 'power2.in' }] }, T.ask);
  SR.sfx(T.ask, 'whoosh', { dur: 0.5, rise: false, lo: 800, hi: 4000, gain: 0.3, pan: 0.6 }); SR.sfx(T.ask + 0.6, 'pluck', { note: 84, gain: 0.35, pan: 0.6 });
  tl.to(mav, { keyframes: [{ y: -8, rotation: -6, duration: 0.15 }, { y: 0, rotation: 0, duration: 0.5, ease: 'elastic.out(1,0.35)' }], transformOrigin: '50% 100%' }, T.ask + 0.62);
  // everything except the strip collapses into the dot; a blue-deep ground opens from it
  const dpx = xCol(3) - 34, dpy = 470;
  sink([[drw.a, xCol(3) + CW / 2, L0], [stu.a, xCol(3) + spanW(2) / 2, L1], [repG, xCol(3) + spanW(2) / 2, L2], [per.a, xCol(2) + CW / 2, L3],
    [tickG, 470, L3], [mtG, 1700, 560], [qb, 1500, 186], [mav, 1640, 220]], T.collapse5, dpx, dpy, { stagger: FR });
  tl.to(hero.size, { keyframes: [{ scale: 0.95, duration: 0.12, ease: 'power2.out' }, { scale: 0.7, duration: 0.4, ease: 'elastic.out(1,0.35)' }] }, T.collapse5 + 0.48);
  SR.sfx(T.collapse5 + 0.48, 'pop', { pitch: 300, gain: 0.5 });
  k.show(g6, T.disc);
  tl.fromTo(disc, { scale: 0 }, { scale: 2400, duration: 0.5, ease: 'power3.in', immediateRender: false }, T.disc);
  SR.sfx(T.disc, 'whoosh', { dur: 0.5, rise: true, lo: 150, hi: 3000, gain: 0.4 });
  k.hide(s5, T.disc + 0.55); k.hide(g5, T.disc + 0.55);
  tl.set(disc, { scale: 0 }, T.disc + 0.56); tl.set(disc, { attr: { r: 0 } }, T.disc + 0.56);
  const g6g = el('g', {}, g6); rect(g6g, 0, 0, W, H, C.deep); gsap.set(g6g, { autoAlpha: 0 }); k.show(g6g, T.disc + 0.55);

  /* ========== SCENE 6 · Wednesday morning, hero moment (blue-deep) ========== */
  const s6 = scene(); k.show(s6, T.disc + 0.5);
  const yb = 776, dayX = i => xCol(i) + CW / 2;
  hopTo(T.dotDown, dayX(0), yb, { dur: 0.55, apexY: 400, pitch: 500 });
  // Monday -> Tuesday -> Wednesday, a tick on each day line, then a stop that lights Wednesday
  [[T.roll6a, 0, 1], [T.roll6b, 1, 2]].forEach(([at, a, b], i) => {
    k.anticipate(hero, at, 0.12);
    tl.to(hero.pos, { x: dayX(b), duration: 0.6, ease: 'power2.inOut' }, at);
    tl.to(hero.spin, { rotation: '+=' + (STEP / 28 * 180 / Math.PI), duration: 0.6, ease: 'power2.inOut' }, at);
    k.squash(hero, at + 0.6, 0.18);
    SR.sfx(at + 0.3, 'tick', { pitch: 2100 + i * 400, gain: 0.35 }); SR.sfx(at + 0.6, 'pop', { pitch: 600 + i * 150, gain: 0.3 });
  });
  tl.to(cells[2], { attr: { fill: C.blue }, duration: 0.3, ease: 'power2.out' }, T.here);
  tl.to(dayLab[2], { keyframes: [{ scale: 1.3, duration: 0.12 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1,0.35)' }] }, T.here);
  SR.sfx(T.here, 'ding', { gain: 0.3 });
  kw(s6, 'Same two days', T.kw6a, T.kw6b - 0.2, 200);
  // the dot leans toward Thursday: something is coming
  tl.to(hero.sq, { keyframes: [{ scaleX: 1.14, scaleY: 0.88, duration: 0.35, ease: 'power2.out' }, { scaleX: 1, scaleY: 1, duration: 0.4 }] }, T.hit - 1.1);
  const LC = 550, hw = spanW(2) / 2, cx6 = xCol(3) + hw;
  // clash zone: diagonal hatching on Thursday and Friday, white at 20 %
  el('rect', { x: xCol(3), y: 330, width: spanW(2), height: 410, rx: 14 }, el('clipPath', { id: 'clash6' }, defs));
  const hz = el('g', { 'clip-path': 'url(#clash6)' }, s6), hs = anim(hz);
  for (let x = xCol(3) - 240; x < xCol(3) + spanW(2) + 40; x += 38) path(hs, `M${x + 200},330 h16 l-200,410 h-16 Z`, C.white);
  hs.setAttribute('fill-opacity', 0.2);
  gsap.set(hz, { autoAlpha: 0 }); gsap.set(hs, { scaleY: 0, transformOrigin: '50% 50%' });
  k.show(hz, T.hit + 2 * FR);
  tl.to(hs, { scaleY: 1, duration: 0.3, ease: 'popBig' }, T.hit + 2 * FR);
  SR.onTick(t => hs.setAttribute('fill-opacity', t > T.hit + 0.4 ? 0.17 + 0.05 * Math.sin((t - T.hit) * 2 * Math.PI * 0.7) : 0.2));
  const rep6 = block(s6, xCol(3), LC, spanW(2), 76, C.grey, 'HQ report');
  const stu6 = block(s6, xCol(3), LC, spanW(2), 76, C.white, 'Lift study');
  CustomEase.create('slam', 'M0,0 C0.55,0 1,0.45 1,1');
  gsap.set(stu6.a, { x: -1750 }); gsap.set(rep6.a, { x: 1400 });
  tl.to(stu6.a, { x: -hw, duration: 10 * FR, ease: 'slam' }, T.hit - 10 * FR);
  tl.to(rep6.a, { x: hw, duration: 10 * FR, ease: 'slam' }, T.hit - 10 * FR);
  SR.sfx(T.hit - 10 * FR, 'whoosh', { dur: 10 * FR, rise: true, lo: 300, hi: 5000, gain: 0.5, pan: -0.5 });
  SR.sfx(T.hit - 10 * FR, 'whoosh', { dur: 10 * FR, rise: true, lo: 400, hi: 6000, gain: 0.5, pan: 0.5 });
  // contact on the bar line: 2-frame squash held at the contact edges, spring recoil 40 px each way
  tl.set(stu6.a, { scaleX: 0.7, scaleY: 1.3, transformOrigin: '100% 50%' }, T.hit);
  tl.set(rep6.a, { scaleX: 0.7, scaleY: 1.3, transformOrigin: '0% 50%' }, T.hit);
  tl.to(stu6.a, { x: -hw - 40, scaleX: 1, scaleY: 1, duration: 0.42, ease: 'elastic.out(1.1,0.4)' }, T.hit + 2 * FR);
  tl.to(rep6.a, { x: hw + 40, scaleX: 1, scaleY: 1, duration: 0.42, ease: 'elastic.out(1.1,0.4)' }, T.hit + 2 * FR);
  SR.sfx(T.hit, 'impact', { gain: 0.85 }); SR.sfx(T.hit, 'thunk', { gain: 0.6 }); SR.sfx(T.hit, 'rumble', { dur: 0.4, gain: 0.45 });
  // then both push into the same two days: double-booked, the report jammed up behind with its label still readable
  tl.to(stu6.a, { x: 0, duration: 0.35, ease: 'back.out(1.5)' }, T.hit + 0.55);
  tl.to(rep6.a, { x: 0, y: -56, duration: 0.35, ease: 'back.out(1.5)' }, T.hit + 0.6);
  SR.sfx(T.hit + 0.55, 'zip', { dur: 0.3, gain: 0.3 });
  SR.onTick(t => { const s_ = t - T.hit - 1.0; if (s_ > 0 && t < T.wipe7) { const j = Math.sin(s_ * 2 * Math.PI * 0.9); stu6.r.setAttribute('transform', `translate(${j * 1.5},0)`); rep6.r.setAttribute('transform', `translate(${-j * 1.5},0)`); } else { stu6.r.setAttribute('transform', ''); rep6.r.setAttribute('transform', ''); } });
  // the dot launches 2 frames after contact: up 8 frames, hangs 6, drops 7 onto the jam
  const flagY = LC - 38 - 56 - 28;
  tl.to(hero.pos, { x: cx6, duration: 21 * FR, ease: 'power1.inOut' }, T.hit + 2 * FR);
  tl.to(hero.pos, { keyframes: [{ y: 330, duration: 8 * FR, ease: 'power3.out' }, { y: 318, duration: 6 * FR, ease: 'sine.inOut' }, { y: flagY, duration: 7 * FR, ease: 'power2.in' }] }, T.hit + 2 * FR);
  tl.to(hero.sq, { keyframes: [{ scaleX: 0.82, scaleY: 1.22, duration: 4 * FR }, { scaleX: 1, scaleY: 1, duration: 10 * FR }, { scaleX: 0.88, scaleY: 1.14, duration: 7 * FR }] }, T.hit + 2 * FR);
  tl.to(hero.spin, { rotation: '+=360', duration: 0.7, ease: 'power2.out' }, T.hit + 2 * FR);
  SR.sfx(T.hit + 2 * FR, 'boing', { pitch: 380, gain: 0.6 });
  tl.to(hero.sq, { keyframes: [{ scaleX: 1.25, scaleY: 0.8, duration: 0.05 }, { scaleX: 1, scaleY: 1, duration: 0.55, ease: 'elastic.out(1.1,0.3)' }] }, T.flag);
  SR.sfx(T.flag, 'thunk', { gain: 0.5 }); SR.sfx(T.flag, 'sparkle', { gain: 0.25 });
  // camera: punch to 1.12 in 4 frames, settle to 1.06, shake 3 frames; ease home before the next line
  tl.fromTo(world, { scale: 1, x: 0, svgOrigin: `${cx6} ${LC}` }, { scale: 1.12, svgOrigin: `${cx6} ${LC}`, duration: 4 * FR, ease: 'power2.out', immediateRender: false }, T.hit);
  tl.to(world, { scale: 1.06, svgOrigin: `${cx6} ${LC}`, duration: 18 * FR, ease: 'power2.inOut' }, T.hit + 4 * FR);
  tl.to(world, { keyframes: [{ x: 8, duration: FR }, { x: -8, duration: FR }, { x: 5, duration: FR }, { x: 0, duration: FR }] }, T.hit);
  tl.to(world, { scale: 1, svgOrigin: `${cx6} ${LC}`, duration: 0.7, ease: 'power2.inOut' }, T.kw6b - 0.8);
  kw(s6, 'Wednesday, not Friday', T.kw6b, T.wipe7 - 0.1);
  tl.to(cells[4], { attr: { fill: C.deepRaised }, duration: 0.4, ease: 'power1.inOut' }, T.dim);
  tl.to(dayLab[2], { keyframes: [{ scale: 1.25, duration: 0.12 }, { scale: 1, duration: 0.45, ease: 'elastic.out(1,0.35)' }] }, T.dim + 0.3);
  SR.sfx(T.dim + 0.3, 'ding', { gain: 0.3 });

  /* ========== SCENE 7 · Wednesday at four (blue-301 phone screen slides in) ========== */
  const s7 = scene(); k.show(s7, T.wipe7);
  const g7 = rect(s7, 0, 0, W + 40, H, C.blue);
  tl.fromTo(g7, { x: W }, { x: 0, duration: 0.42, ease: 'power3.out', immediateRender: false }, T.wipe7);
  SR.sfx(T.wipe7, 'whoosh', { dur: 0.42, rise: true, lo: 400, hi: 5000, gain: 0.5 });
  k.hide(stripG, T.wipe7 + 0.45); k.hide(s6, T.wipe7 + 0.45); k.hide(g6, T.wipe7 + 0.45);
  hopTo(T.wipe7 + 0.05, 1650, 490, { dur: 0.6, scale: 1, pitch: 800 });
  const s7c = el('g', {}, s7); gsap.set(s7c, { autoAlpha: 0 }); k.show(s7c, T.wipe7 + 0.4);
  rect(s7c, 190, 290, 300, 530, C.deep, 10);
  const paul = SR.character(s7c, 340, 820, { shirt: C.tint, sleeve: C.deepBand, skin: SR.SKIN[0], hair: 'side', hairColor: SR.HAIR[2], glasses: true, collar: 'tie', tieColor: C.deep });
  const leafP = place(s7c, 190, 290), leaf = anim(leafP);
  rect(leaf, 0, 0, 300, 530, C.deepBand, 10); circle(leaf, 262, 280, 14, C.tint);
  rect(s7c, 0, 816, W, 264, C.deepBand);
  tl.to(leaf, { scaleX: 0.16, duration: 0.45, ease: 'power3.out', transformOrigin: '0% 50%' }, T.door);
  tl.to(leaf, { keyframes: [{ scaleX: 0.22, duration: 0.15 }, { scaleX: 0.16, duration: 0.3, ease: 'elastic.out(1,0.4)' }] }, T.door + 0.45);
  SR.sfx(T.door, 'whoosh', { dur: 0.4, rise: false, lo: 300, hi: 2000, gain: 0.3, pan: -0.6 }); SR.sfx(T.door + 0.4, 'thunk', { gain: 0.3, pan: -0.6 });
  tl.to(paul.rise, { x: 260, duration: 0.6, ease: 'power2.inOut' }, T.paulOut);
  tl.to(paul.rise, { keyframes: [{ y: -36, duration: 0.3, ease: 'power2.out' }, { y: 0, duration: 0.3, ease: 'power2.in' }] }, T.paulOut);
  SR.sfx(T.paulOut + 0.6, 'pop', { pitch: 260, gain: 0.4, pan: -0.5 });
  SR.charLife(paul, { seed: 0.9, side: 1, from: T.door, to: T.s8, listen: [[T.chip1, T.send]], talk: [[T.reply, T.reply + 1.4]] });
  const clk = SR.words(s7c, '16:00', 150, 200, stTitle, C.white); gsap.set(clk.groups, { scale: 0 }); k.popWords(clk.groups, T.clock7);
  SR.sfx(T.clock7, 'ding', { gain: 0.3 });
  // your message: one bubble, three chips
  const mbP = place(s7c, 1240, 340), mb = anim(mbP);
  path(mb, 'M400,40 L470,110 L340,62 Z', C.white);
  rect(mb, -480, -72, 960, 144, C.white, 72);
  const chipTxt = ['Clash', 'My order', 'Your call?'];
  const cw = chipTxt.map(s => SR.measure(s, stBody) + 64), gap = 28, tot = cw.reduce((a, b) => a + b, 0) + gap * 2;
  let cxx = -tot / 2;
  const chips = chipTxt.map((s, i) => { const a = anim(place(mb, cxx + cw[i] / 2, 0)); rect(a, -cw[i] / 2, -40, cw[i], 80, C.blue, 40); SR.textEl(a, s, 0, 15, stBody, C.white, 'middle'); gsap.set(a, { scale: 0 }); cxx += cw[i] + gap; return a; });
  gsap.set(mb, { scale: 0 });
  k.pop(mb, T.bubble7, { origin: '90% 100%', ease: 'popBig', pitch: 400, pan: 0.4 });
  [T.chip1, T.chip2, T.chip3].forEach((at, i) => k.pop(chips[i], at, { ease: 'popBig', rot: -8, pitch: 600 + i * 120, pan: 0.3 }));
  // the dot is the send button
  k.anticipate(hero, T.send, 0.25);
  k.squash(hero, T.send + 0.02, 0.32);
  SR.sfx(T.send, 'zip', { dur: 0.3, gain: 0.5, pan: 0.5 });
  tl.to(mb, { keyframes: [{ y: -26, duration: 0.18, ease: 'power2.out' }, { y: -16, duration: 0.4, ease: 'elastic.out(1,0.4)' }] }, T.send + 0.05);
  const rpP = place(s7c, 1100, 540), rp = anim(rpP);
  const rTxt = 'Study first. Report Monday.', rw = SR.measure(rTxt, stBody) + 90;
  path(rp, `M${-rw / 2 + 60},30 L${-rw / 2 - 30},90 L${-rw / 2 + 140},50 Z`, C.deep);
  rect(rp, -rw / 2, -56, rw, 112, C.deep, 56);
  SR.textEl(rp, rTxt, 0, 15, stBody, C.white, 'middle');
  gsap.set(rp, { scale: 0 });
  k.pop(rp, T.reply, { origin: '10% 100%', ease: 'popBig', rot: 8, pitch: 500, pan: -0.3 });
  SR.sfx(T.reply, 'ding', { gain: 0.45, pan: -0.3 });
  // mini strip: Thu, Fri, Next Mon
  const msP = place(s7c, 0, 0), ms = anim(msP);
  const MX = 1100, MS = 210, MW = 200;
  ['Thu', 'Fri', 'Next Mon'].forEach((d, i) => { rect(ms, MX + i * MS, 668, MW, 148, i === 2 ? C.deepRaised : C.deepBand, 12); SR.textEl(ms, d, MX + i * MS + MW / 2, 652, stLabel, i === 2 ? C.grey : C.white, 'middle'); });
  const mStu = block(ms, MX + 6, 712, 2 * MW + 10 - 12, 56, C.white, 'Lift study');
  const mRep = block(ms, MX + 6, 774, 2 * MW + 10 - 12, 56, C.grey, 'HQ report');
  gsap.set(ms, { scale: 0, transformOrigin: '50% 100%' });
  k.pop(ms, T.mini, { origin: '50% 100%', ease: 'popBig', pitch: 300 });
  tl.to(mRep.a, { x: MS * 2, duration: 0.5, ease: 'power1.inOut' }, T.reportHop);
  tl.to(mRep.a, { keyframes: [{ y: -130, duration: 0.24, ease: 'power2.out' }, { y: 0, duration: 0.26, ease: 'power2.in' }] }, T.reportHop);
  tl.to(mRep.r, { attr: { width: MW - 12 }, duration: 0.5, ease: 'power2.inOut' }, T.reportHop);
  tl.to(mRep.a, { keyframes: [{ scaleY: 0.8, scaleX: 1.08, duration: 0.05 }, { scaleY: 1, scaleX: 1, duration: 0.45, ease: 'elastic.out(1.1,0.35)' }], transformOrigin: '50% 100%' }, T.reportHop + 0.5);
  SR.sfx(T.reportHop, 'whoosh', { dur: 0.45, rise: false, lo: 500, hi: 3500, gain: 0.3 }); SR.sfx(T.reportHop + 0.5, 'thunk', { gain: 0.6 });
  tl.to(mStu.r, { attr: { height: 118 }, duration: 0.45, ease: 'back.out(1.6)' }, T.studyGrow);
  tl.to(mStu.t, { attr: { y: 42 }, duration: 0.45, ease: 'back.out(1.6)' }, T.studyGrow);
  SR.sfx(T.studyGrow, 'zip', { dur: 0.3, gain: 0.3 });
  tl.to(ms, { keyframes: [{ scale: 1.04, duration: 0.08 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1.1,0.35)' }] }, T.snap);
  SR.sfx(T.snap, 'pop', { pitch: 700, gain: 0.45 });
  // Paul's reply grows into the next ground
  k.shapeWipe(rp, T.wipe8, { scale: 16, dx: -140, dy: 0, dur: 0.5, anticipate: 0.2 });
  hopTo(T.wipe8 + 0.1, 785, 365, { dur: 0.55, scale: 0.6, pitch: 600 });

  /* ========== SCENE 8 · Friday afternoon (blue-deep, calm) ========== */
  const s8 = scene(C.deep); k.show(s8, T.s8); k.hide(s7, T.s8 + 0.05);
  rect(s8, 0, 830, W, 250, C.deepRaised);
  const crP = place(s8, 0, 0), crA = anim(crP);
  const crane = SR.props.crane(crA, 1420, 830, 0.8, { color: C.blue, accent: C.deepBand, angle: -26, cable: 110 });
  rect(crane.hook, -48, 140, 96, 64, C.tint, 6);
  tl.fromTo(crane.boom, { rotation: -26 }, { rotation: -36, duration: 9, ease: 'sine.inOut', svgOrigin: '0 0', immediateRender: false }, T.s8 + 0.3);
  SR.onTick(t => { if (t > T.s8) crane.hook.setAttribute('transform', `rotate(${Math.sin((t - T.s8) * 2 * Math.PI * 0.35) * 4 + 26 - 10 * SR.smooth((t - T.s8 - 0.3) / 9)})`); });
  const eng = SR.character(s8, 470, 840, { shirt: C.blue, sleeve: C.deepBand, skin: SR.SKIN[3], hair: 'short', hairColor: SR.HAIR[1] });
  const deskP = place(s8, 0, 0), desk = anim(deskP);
  SR.props.table(desk, 160, 860, 840, C.deepBand);
  SR.props.laptop(desk, 700, 840, C.blue); SR.props.mug(desk, 270, 840, C.white);
  SR.charLife(eng, { seed: 0.4, side: 1, from: T.s8, to: T.collapse8 + 0.5 });
  SR.onTick(t => { if (t < T.s8 || t > T.collapse8 + 0.5) return; const u = SR.smooth((t - T.lean) / 1.2); SR.setArms(eng, 0.3 * u, 0.3 * u); });
  tl.to(eng.rise, { rotation: -5, duration: 1.4, ease: 'sine.inOut', transformOrigin: '50% 100%' }, T.lean);
  SR.onTick(t => { const b = t > T.lean + 1.4 && t < T.collapse8 ? 0.012 * Math.sin((t - T.lean - 1.4) * 2 * Math.PI * 0.25) : 0; eng.p.setAttribute('transform', `translate(470,${840 - 740}) scale(${1 + b})`); });
  kw(s8, 'A calmer week', T.kw8, T.collapse8);
  const s8sG = place(s8, 0, 0), s8s = anim(s8sG);
  const X8 = 820, S8 = 165, W8 = 155, x8 = i => X8 + i * S8, w8 = n => n * W8 + (n - 1) * (S8 - W8);
  days.forEach((d, i) => { rect(s8s, x8(i), 320, W8, 200, i === 5 ? C.deepRaised : C.deepBand, 12); SR.textEl(s8s, d, x8(i) + W8 / 2, 300, stLabel, i === 5 ? C.grey : C.white, 'middle'); });
  const b8 = [[1, 365, 1, C.white, 'Rigging', true], [3, 365, 2, C.white, 'Lift study', true], [2, 455, 1, C.tint, 'Permit', true], [5, 455, 1, C.grey, 'Report', false]]
    .map(([c, y, n, f, l, tk]) => { const b = block(s8s, x8(c) + 4, y, w8(n) - 8, 70, f, l); if (tk) { const a = anim(place(b.a, w8(n) - 12, -36)); circle(a, 0, 0, 20, C.blue); stroke(a, 'M-9,0 L-2,8 L10,-7', C.white, 6); gsap.set(a, { scale: 0 }); b.tick = a; } return b; });
  [[b8[0], T.tick1], [b8[2], T.tick2], [b8[1], T.tick3]].forEach(([b, at], i) => { k.pop(b.tick, at, { sfx: false, ease: 'popBig' }); SR.sfx(at, 'pluck', { note: [79, 84, 88][i], gain: 0.25 }); });
  // everything collapses into the dot
  sink([[s8s, 1310, 420], [crA, 1600, 640], [eng.rise, 470, 560], [desk, 510, 900]], T.collapse8, 785, 365, { stagger: 2 * FR });
  tl.to(eng.p, { autoAlpha: 0, duration: 0.01 }, T.collapse8 + 0.5);

  /* ========== SCENE 9 · End lockup (blue-deep) ========== */
  const s9 = scene(C.deep); k.show(s9, T.s9); k.hide(s8, T.s9 + 0.05);
  const L1t = 'Ten minutes on Monday.', L2t = 'One look on Wednesday', finR = 20;
  let stE = stDisp; const wMax = () => Math.max(SR.measure(L1t, stE), SR.measure(L2t, stE) + 16 + 2 * finR);
  if (wMax() > W - 2 * 120) stE = SR.style('display', { size: Math.floor(stDisp.size * (W - 240) / wMax()) });
  const lead = Math.round(stE.size * 1.15), lx = Math.round((W - wMax()) / 2), b1 = Math.round(540 - lead / 2 + stE.size * 0.32), b2 = b1 + lead;
  const e1 = SR.words(s9, L1t, lx, b1, stE, C.white);
  const e2 = SR.words(s9, L2t, lx, b2, stE, C.white);
  const rise = (gs, at) => { gs.forEach((g, i) => tl.fromTo(g, { y: 44, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'pop' }, at + i * 3 * FR)); SR.sfx(at, 'tick', { gain: 0.25 }); };
  gsap.set([...e1.groups, ...e2.groups], { opacity: 0 });
  rise(e1.groups, T.title1); rise(e2.groups, T.title2);
  const finX = e2.endX + 16 + finR, finY = b2 - finR;
  // after the collapse the dot travels in one arc to hover over the end of the line, then drops in as the full stop
  k.anticipate(hero, T.hover, 0.12);
  const hvX = Math.min(W - 120, finX + 150), hvY = b2 - 45;
  tl.to(hero.pos, { x: hvX, duration: 0.9, ease: 'power2.inOut' }, T.hover);
  tl.to(hero.pos, { keyframes: [{ y: 230, duration: 0.45, ease: 'power2.out' }, { y: hvY, duration: 0.45, ease: 'sine.inOut' }] }, T.hover);
  tl.to(hero.size, { scale: finR / 40 * 1.2, duration: 0.9, ease: 'power2.inOut' }, T.hover);
  tl.to(hero.spin, { rotation: '+=200', duration: 0.9, ease: 'power2.inOut' }, T.hover);
  SR.sfx(T.hover, 'whoosh', { dur: 0.6, rise: false, lo: 600, hi: 3500, gain: 0.3 });
  k.anticipate(hero, T.finalHop, 0.15);
  tl.to(hero.pos, { x: finX, duration: T.finalLand - T.finalHop, ease: 'power1.inOut' }, T.finalHop);
  tl.to(hero.pos, { keyframes: [{ y: hvY - 55, duration: (T.finalLand - T.finalHop) * 0.4, ease: 'power2.out' }, { y: finY, duration: (T.finalLand - T.finalHop) * 0.6, ease: 'power2.in' }] }, T.finalHop);
  tl.to(hero.size, { scale: finR / 40, duration: T.finalLand - T.finalHop, ease: 'power2.in' }, T.finalHop);
  tl.to(hero.sq, { scaleX: 0.86, scaleY: 1.18, duration: T.finalLand - T.finalHop - 0.05 }, T.finalHop + 0.05);
  k.squash(hero, T.finalLand, 0.3); SR.sfx(T.finalLand, 'boing', { pitch: 330, gain: 0.55 });
  SR.sfx(T.finalLand, 'thunk', { gain: 0.5 }); SR.sfx(T.finalLand, 'sparkle', { gain: 0.3 });
  tl.to(e2.groups[e2.groups.length - 1], { keyframes: [{ y: 7, duration: 0.05 }, { y: 0, duration: 0.5, ease: 'elastic.out(1,0.3)' }] }, T.finalLand + 0.02);
  const sparks = [-60, 0, 60].map(a => rect(s9, -4, -60, 8, 0, C.white, 4));
  sparks.forEach((sp, i) => sp.setAttribute('transform', `translate(${finX},${finY}) rotate(${[-60, 0, 60][i] - 20})`));
  SR.onTick(t => {
    const s = t - T.finalLand; if (s < 0) return;
    const e = SR.smooth(s / 0.18), r = SR.smooth((s - 0.18) / 0.22);
    sparks.forEach(sp => { sp.setAttribute('height', Math.max(0, 30 * e - 30 * r)); sp.setAttribute('y', -66 - 26 * r); });
    if (s > 0.9) hero.spin.setAttribute('transform', `rotate(${Math.sin((s - 0.9) * 2 * Math.PI * 0.5) * 12})`);
  });

  /* ---------- captions: every spoken line, one system on every ground ---------- */
  // white Caslon on a square block; blue-deep block on blue-301 ground, blue-deep-band block on blue-deep ground
  const sw = [T.tray + 0.9, T.s3, T.iris + 0.55, T.disc + 0.3, T.wipe7 + 0.3, T.s8];
  const deepAt = t => t < sw[0] || (t >= sw[1] && t < sw[2]) || (t >= sw[3] && t < sw[4]) || t >= sw[5];
  const boxOn = t => deepAt(t) ? C.deepBand : C.deep;
  const stC = SR.style('caption');
  cues.captions.forEach(([t0, t1, text]) => {
    const g = el('g', {}, capL); gsap.set(g, { autoAlpha: 0 });
    const lines = []; let cur = [];
    text.split(' ').forEach(w => { const tst = [...cur, w].join(' '); if (cur.length && tst.length > 42) { lines.push(cur.join(' ')); cur = [w]; } else cur.push(w); });
    if (cur.length) lines.push(cur.join(' '));
    const wMx = Math.max(...lines.map(l => SR.measure(l, stC))), bh = lines.length * stC.lh + 28, by = H - 96 - bh;
    const box = rect(g, (W - wMx) / 2 - 28, by, wMx + 56, bh, boxOn(t0));
    lines.forEach((l, i) => SR.textEl(g, l, W / 2, by + 14 + stC.size * 0.86 + i * stC.lh, stC, C.white, 'middle'));
    sw.forEach(x => { if (x > t0 && x < t1) tl.set(box, { attr: { fill: boxOn(x + 0.01) } }, x); });
    k.show(g, t0); k.hide(g, t1);
  });
};
