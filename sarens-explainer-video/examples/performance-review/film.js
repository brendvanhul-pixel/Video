/* Reference film: "What is a performance review?"  (Group Talent learning piece -> Caslon voice, rule 4)
 * One hero (the yellow dot) carries the whole film: dot of the "?", rolls through the year,
 * opens the iris into the room, and lands as the full stop of the end title.
 * Read this file top to bottom as the pattern for a new film.
 */
window.FILM = async function (SR, tl, root, T, cues) {
  const { C, W, H, M, FR, el, place, anim, rect, circle, path, stroke } = SR;
  const k = SR.kit(tl);

  /* ================= SCENE 1-2: title + the year (ground blue-301, yellow allowed) ================= */
  const s12 = el('g', {}, root);
  rect(s12, 0, 0, W, H, C.blue);

  // title, measured so the block is centred with the drawn question mark
  const stT = SR.style('title'), stD = SR.style('display');
  const L1 = 'What is a', L2 = 'performance review';
  const qW = 110, blockW = Math.max(SR.measure(L1, stT), SR.measure(L2, stD) + 22 + qW);
  const bx = Math.round((W - blockW) / 2), by1 = 430, by2 = 610;
  const title = el('g', {}, s12);
  const t1 = SR.words(title, L1, bx, by1, stT, C.white);
  const t2 = SR.words(title, L2, bx, by2, stD, C.white);
  const qx = t2.endX + 22;
  const hook = stroke(title, 'M10,-96 C10,-124 32,-140 56,-140 C84,-140 104,-122 104,-97 C104,-72 86,-64 71,-56 C60,-51 56,-45 56,-36', C.white, 22, { transform: `translate(${qx},${by2})` });
  hook.setAttribute('stroke-dasharray', hook.getTotalLength()); hook.setAttribute('stroke-dashoffset', hook.getTotalLength());
  const dotR = 16, dotX = qx + 56, dotY = by2 - dotR;

  // the year as a Sarens measure: a ruler with one cell per month
  const ruler = SR.ruler(s12, 250, 760, 1420, 12, { labels: 'JFMAMJJASOND'.split(''), color: C.white });
  const fJun = SR.flag(s12, ruler.xs[5], 760, 'Mid-year', { fill: C.white });
  const fDec = SR.flag(s12, ruler.xs[11], 760, 'Year-end', { fill: C.white });
  const cap2a = SR.words(s12, 'Once or twice a year,', 120, 230, SR.style('body'), C.white);
  const cap2b = SR.words(s12, 'you and your manager sit down.', 120, 330, stT, C.white);

  const hero = SR.hero(s12, { r: 70, fill: C.yellow });
  SR.onTick(SR.contactShadow(s12, hero, 702, C.deepBand, { from: 0.05, until: T.leap + 0.15 }));

  [...t1.groups, ...t2.groups, ...cap2a.groups, ...cap2b.groups, ...ruler.ticks, fJun.a, fDec.a].forEach(g => gsap.set(g, { scale: 0 }));

  // HOOK 0-1.5 s: drop, squash, rebound, then leap into the question mark
  k.drop(hero, T.drop, { x: 960, groundY: 702 });
  k.popWords([...t1.groups, ...t2.groups], T.words1, { sfx: 'tick' });
  k.draw(hook, T.hook, 0.3);
  k.hop(hero, T.leap, { x: dotX, y: dotY, apexY: 250, dur: T.dotLand - T.leap, scale: dotR / 70, pitch: 1200 });
  tl.to(title, { y: -10, duration: T.s1exit - T.dotLand, ease: 'sine.inOut' }, T.dotLand);

  // 3.0 s: the dot drops out of the "?", the title folds away, the year draws
  k.outWords([...t1.groups, ...t2.groups], T.s1exit + 0.05);
  k.undraw(hook, T.s1exit);
  const rr = 34, lineCY = 760 - 4 - rr;
  k.hop(hero, T.s1exit, { x: ruler.xs[0], y: lineCY, apexY: dotY - 200, dur: T.lineLand - T.s1exit, scale: rr / 70, spin: -60, pitch: 400 });
  k.drawRuler(ruler, T.months - 0.15);
  k.popWords(cap2a.groups, T.cap2a);
  k.popWords(cap2b.groups, T.cap2b);
  k.roll(hero, T.rollStart, ruler.xs[0], ruler.xs[5], T.flagJun - T.rollStart, 'power1.in');
  k.roll(hero, T.flagJun, ruler.xs[5], ruler.xs[11], T.flagDec - T.flagJun, 'power1.out');
  // secondary action: each tick dips as the dot passes
  ruler.xs.forEach((x, i) => {
    if (i === 0 || i === 11) return;
    const u = i <= 5 ? Math.sqrt((x - ruler.xs[0]) / (ruler.xs[5] - ruler.xs[0])) : 1 - Math.sqrt(1 - (x - ruler.xs[5]) / (ruler.xs[11] - ruler.xs[5]));
    const at = i <= 5 ? T.rollStart + u * (T.flagJun - T.rollStart) : T.flagJun + u * (T.flagDec - T.flagJun);
    tl.to(ruler.ticks[i], { keyframes: [{ y: 8, duration: 0.06 }, { y: 0, duration: 0.35, ease: 'elastic.out(1,0.3)' }] }, at - 0.03);
  });
  [[fJun, T.flagJun], [fDec, T.flagDec]].forEach(([f, at]) => {
    k.pop(f.a, at, { origin: '50% 100%', dur: 0.5, ease: 'popBig' });
    tl.fromTo(f.fl, { rotation: -14, transformOrigin: '0% 50%' }, { rotation: 0, duration: 0.9, ease: 'elastic.out(1,0.3)' }, at + 0.08);
  });
  k.squash(hero, T.flagDec, -0.1);

  /* ================= SCENE 3: the room (light wash wall, so no yellow except the sun in the dark window) ================= */
  const irisClip = el('circle', { cx: 0, cy: 0, r: 0 }, el('clipPath', { id: 'iris' }, document.querySelector('#stage defs')));
  const s3 = el('g', { 'clip-path': 'url(#iris)' }, root); gsap.set(s3, { autoAlpha: 0 });
  const cam = el('g', {}, s3);
  rect(cam, -200, -200, W + 400, H + 400, C.wash);
  rect(cam, -200, 892, W + 400, 400, C.blue);
  const win = SR.props.window(cam, 1440, 150, 320, 360, { sky: C.blue, frame: C.deep, sun: C.yellow });
  const crane = SR.props.crane(win.inner, 150, 330, 0.5, { color: C.white, accent: C.tint, angle: -42, cable: 120 });
  win.bars();
  SR.onTick(t => crane.hook.setAttribute('transform', `rotate(${Math.sin(t * 2 * Math.PI * 0.4) * 5})`));
  SR.props.plant(cam, 230, 892, { leaf: C.tint, leaf2: C.blue, pot: C.deep });
  const emp = SR.character(cam, 740, 740, { shirt: C.blue, sleeve: C.deepBand, skin: SR.SKIN[0], hair: 'short', stripes: C.white });
  const mgr = SR.character(cam, 1180, 740, { shirt: C.tint, sleeve: C.blue, skin: SR.SKIN[2], hair: 'bun', glasses: true, collar: 'tie', tieColor: C.deep });
  const tbl = el('g', {}, cam);
  SR.props.table(tbl, 420, 1500, 700, C.deep);
  SR.props.hardhat(tbl, 560, 700, C.white);
  SR.props.laptop(tbl, 1030, 700, C.blue);
  SR.props.mug(tbl, 1350, 700, C.white);
  const cap3 = SR.textBlock(s3, 'A planned, two-way conversation.', 120, 190, stT, C.deep, { maxWidth: 900 });
  cap3.groups.forEach(g => gsap.set(g, { scale: 0 }));
  const bubA1 = SR.bubble(cam, 510, 440, { fill: C.blue, tail: 'right', content: 'dots' });
  const bubB1 = SR.bubble(cam, 1290, 300, { fill: C.deep, tail: 'left', content: 'check' });
  const bubA2 = SR.bubble(cam, 510, 440, { fill: C.blue, tail: 'right', content: 'heart' });
  const bubB2 = SR.bubble(cam, 1290, 300, { fill: C.deep, tail: 'left', content: 'dots' });
  [bubA1, bubB1, bubA2, bubB2].forEach(b => gsap.set(b, { scale: 0 }));
  SR.charLife(emp, { seed: 0.3, side: 1, from: T.iris - 0.1, to: T.badge1, talk: [[T.bubA1, T.bubB1 - 0.2], [T.bubA2, T.bubB2 - 0.2]], listen: [[T.bubB1, T.bubA2 - 0.2], [T.bubB2, T.wipe]] });
  SR.charLife(mgr, { seed: 1.4, side: -1, from: T.iris - 0.1, to: T.badge1, talk: [[T.bubB1, T.bubA2 - 0.2], [T.bubB2, T.wipe]], listen: [[T.bubA1, T.bubB1 - 0.2], [T.bubA2, T.bubB2 - 0.2]] });

  // iris: the dot jumps, turns white on the take-off frame (yellow may not fill the frame), opens into the room
  const irisX = ruler.xs[11] - 200, irisY = 520;
  k.anticipate(hero, T.iris, 0.2);
  tl.set(hero.body, { attr: { fill: C.white } }, T.iris);
  k.iris(hero, T.iris, { x: irisX, y: irisY, next: s3, clip: irisClip });
  k.hide(s12, T.iris + 0.6);
  tl.fromTo(cam, { scale: 1.12, svgOrigin: '960 560' }, { scale: 1, svgOrigin: '960 560', duration: 1.0, ease: 'power3.out' }, T.iris + 0.05);
  k.push(cam, T.iris + 1.05, T.wipeAnt - T.iris - 1.05, 1, 1.07, '960 560');
  tl.fromTo(emp.rise, { y: 320 }, { y: 0, duration: 0.5, ease: 'popBig' }, T.charA); SR.sfx(T.charA, 'boing', { pitch: 260, gain: 0.45, pan: -0.25 });
  tl.fromTo(mgr.rise, { y: 320 }, { y: 0, duration: 0.5, ease: 'popBig' }, T.charB); SR.sfx(T.charB, 'boing', { pitch: 320, gain: 0.45, pan: 0.25 });
  k.popWords(cap3.groups, T.cap3);
  // one speaker at a time
  const orig = b => b.dir > 0 ? '78% 100%' : '22% 100%';
  [[bubA1, T.bubA1, T.bubB1], [bubB1, T.bubB1, T.bubA2], [bubA2, T.bubA2, T.bubB2]].forEach(([b, a, z]) => {
    k.pop(b, a, { origin: orig(b), dur: 0.45, rot: -8 * b.dir, pan: b.dir > 0 ? -0.4 : 0.4, pitch: b.dir > 0 ? 600 : 700 });
    k.unpop(b, z - 0.15, { origin: orig(b) });
  });
  k.pop(bubB2, T.bubB2, { origin: orig(bubB2), dur: 0.45, rot: 8, pan: 0.4, pitch: 700 });
  // the manager's bubble becomes the wipe into the next scene
  k.shapeWipe(bubB2, T.wipe, { scale: 22, dx: -330, dy: 240, dur: T.badge1 - 0.5 - T.wipe, anticipate: T.wipe - T.wipeAnt });

  /* ================= SCENE 4: three parts (ground blue-deep; one yellow mark: the arrow's fletching) ================= */
  const s4 = el('g', {}, root); gsap.set(s4, { autoAlpha: 0 });
  rect(s4, 0, 0, W, H, C.deep);
  const kick4 = SR.words(s4, 'What happens in it', 120, 170, SR.style('eyebrow'), C.tint);
  const colX = [400, 960, 1520], badgeY = 430;
  const b1 = SR.badge(s4, colX[0], badgeY, { fill: C.blue, icon: 'bars', accent: C.tint });
  const b2 = SR.badge(s4, colX[1], badgeY, { fill: C.deepBand, icon: 'check' });
  const b3 = SR.badge(s4, colX[2], badgeY, { fill: C.white, icon: 'target', accent: C.blue, ink: C.deep });
  const labels = [['Look back', "What went well, what didn't"], ['Share feedback', 'Honest, and in both directions'], ['Plan ahead', 'Goals and growth for next year']].map(([a, b], i) => ({
    num: SR.words(s4, '0' + (i + 1), colX[i], 660, SR.style('label'), C.tint, { align: 'center' }),
    la: SR.words(s4, a, colX[i], 728, SR.style('body'), C.white, { align: 'center' }),
    lb: SR.words(s4, b, colX[i], 786, SR.style('label'), C.grey, { align: 'center' }) }));
  const all4 = [...kick4.groups, ...labels.flatMap(l => [...l.num.groups, ...l.la.groups, ...l.lb.groups])];
  all4.forEach(g => gsap.set(g, { scale: 0 }));
  [b1.b, b2.b, b3.b, ...b1.parts.bars, ...b3.parts.rings].forEach(g => gsap.set(g, { scale: 0 }));
  // arrow lives in column 3's local space so it rides along when the column collapses
  const arrowG = el('g', {}, b3.fly), arrow = el('g', {}, arrowG);
  rect(arrow, -300, -7, 270, 14, C.white, 7);
  path(arrow, 'M0,0 L-52,-26 L-40,0 L-52,26 Z', C.white);
  path(arrow, 'M-300,0 L-250,0 L-280,-34 L-320,-34 Z', C.yellow);
  path(arrow, 'M-300,0 L-250,0 L-280,34 L-320,34 Z', C.yellow);
  const heart = anim(place(b2.fly, 130, -140)); path(heart, 'M0,40 C-70,-6 -48,-62 0,-28 C48,-62 70,-6 0,40 Z', C.tint); gsap.set(heart, { scale: 0 });
  const coin = anim(place(b1.fly, 130, -150)); const coinFlip = anim(coin); circle(coinFlip, 0, 0, 40, C.white); circle(coinFlip, 0, 0, 24, C.tint); gsap.set(coin, { scale: 0 });

  k.show(s4, T.wipe + 0.5); k.hide(s3, T.wipe + 0.5);
  k.popWords(kick4.groups, T.wipe + 0.55);
  k.pop(b1.b, T.badge1, { dur: 0.5, ease: 'popBig', rot: -20, pitch: 300, pan: -0.5 });
  b1.parts.bars.forEach((b, i) => { tl.fromTo(b, { scaleY: 0, scaleX: 1.2, transformOrigin: '50% 100%' }, { scaleY: 1, scaleX: 1, duration: 0.45, ease: 'popBig' }, T.bars + i * 3 * FR); SR.sfx(T.bars + i * 3 * FR, 'pop', { pitch: 500 + 200 * i, gain: 0.3, pan: -0.5 }); });
  k.popWords([...labels[0].num.groups, ...labels[0].la.groups, ...labels[0].lb.groups], T.label1);
  k.pop(b2.b, T.badge2, { dur: 0.5, ease: 'popBig', rot: 20, pitch: 350 });
  k.draw(b2.parts.check, T.check, 0.25, { sfx: 'zip' });
  tl.to(b2.b, { keyframes: [{ scale: 1.08, duration: 0.06 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1,0.3)' }] }, T.check + 0.25);
  k.popWords([...labels[1].num.groups, ...labels[1].la.groups, ...labels[1].lb.groups], T.label2);
  k.pop(b3.b, T.badge3, { dur: 0.5, ease: 'popBig', rot: -20, pitch: 400, pan: 0.5 });
  b3.parts.rings.forEach((r, i) => k.pop(r, T.badge3 + 0.06 + i * 2 * FR, { sfx: false }));
  k.popWords([...labels[2].num.groups, ...labels[2].la.groups, ...labels[2].lb.groups], T.label3);
  // HERO MOMENT 17.0 s: the arrow flies in on an arc and hits
  SR.sfx(T.arrow, 'whoosh', { dur: T.hit - T.arrow, rise: true, lo: 600, hi: 7000, gain: 0.5, pan: -0.3 });
  SR.sfx(T.hit, 'thunk', { gain: 0.75, pan: 0.5 });
  const P0 = [-1900, 40], Cp = [-950, -400], P2 = [0, 0];
  SR.onTick(t => {
    if (t < T.arrow) { arrowG.setAttribute('visibility', 'hidden'); return; }
    arrowG.setAttribute('visibility', 'visible');
    let p;
    if (t < T.hit) { const u0 = (t - T.arrow) / (T.hit - T.arrow); p = SR.bez(P0, Cp, P2, 0.35 * u0 + 0.65 * u0 * u0); }
    else { const s = t - T.hit; p = SR.bez(P0, Cp, P2, 1); p.angle += 9 * Math.exp(-s * 5) * Math.sin(s * 2 * Math.PI * 4.5); }
    arrow.setAttribute('transform', `translate(${p.x},${p.y}) rotate(${p.angle})`);
  });
  tl.fromTo(b3.b, { x: 0 }, { keyframes: [{ x: 22, scaleX: 0.92, scaleY: 1.05, duration: 0.05 }, { x: 0, scaleX: 1, scaleY: 1, duration: 0.6, ease: 'elastic.out(1.2,0.3)' }] }, T.hit);
  SR.confetti(b3.fly, 0, 0, T.hit, { colors: [C.white, C.tint, C.blue] });
  k.pop(heart, T.heart, { dur: 0.5, ease: 'popBig', rot: 25, pitch: 800 });
  tl.fromTo(coin, { y: 120, scale: 0 }, { y: 0, scale: 1, duration: 0.55, ease: 'popBig' }, T.coin); SR.sfx(T.coin, 'ding', { gain: 0.35, pan: -0.5 });
  SR.onTick(t => { if (t >= T.coin) { const s = SR.clamp((t - T.coin) / 0.7, 0, 1); coinFlip.setAttribute('transform', `scale(${Math.cos(3 * (1 - Math.pow(1 - s, 3)) * 2 * Math.PI)},1)`); } });
  SR.onTick(t => { if (t > T.label1 && t < T.collapse) b1.parts.bars.forEach((b, i) => b.parentNode.setAttribute('transform', `translate(${[-66, 0, 66][i]},78) scale(1,${1 + 0.03 * Math.sin((t - i * 0.2) * 2 * Math.PI * 0.8)})`)); });
  k.push(s4, T.badge1, T.collapse - T.badge1, 1, 1.03);

  /* ================= SCENE 5: everything collapses into the dot -> end title (ground blue-301) ================= */
  all4.concat([heart, coin]).forEach((g, i) => k.unpop(g, T.collapse + (i % 6) * FR, { dur: 0.2 }));
  k.collapse([b1.fly, b2.fly, b3.fly], T.collapse + 0.06, 960, 540);
  const s5 = el('g', {}, root); gsap.set(s5, { autoAlpha: 0 });
  const wipe = anim(place(s5, 960, 540)); circle(wipe, 0, 0, 1110, C.blue); gsap.set(wipe, { scale: 0 });
  const LT = 'Performance review', stE = SR.style('display');
  const wT = SR.measure(LT, stE), finR = 20;
  const lx = Math.round((W - (wT + 14 + 2 * finR)) / 2), lyT = 590;
  const tW = SR.words(s5, LT, lx, lyT, stE, C.white);
  const tag = SR.words(s5, 'Look back. Plan ahead.', lx + 6, lyT + 120, SR.style('title'), C.grey);
  [...tW.groups, ...tag.groups].forEach(g => gsap.set(g, { scale: 0 }));
  const finX = tW.endX + 14 + finR, finY = lyT - finR;
  const end = SR.hero(s5, { r: 70, fill: C.yellow });
  gsap.set(end.pos, { x: 960, y: 540 }); gsap.set(end.size, { scale: 0 });
  k.show(s5, T.heroPop - 0.02);
  tl.fromTo(end.size, { scale: 0 }, { scale: 1, duration: 0.45, ease: 'popBig', transformOrigin: '50% 50%' }, T.heroPop); SR.sfx(T.heroPop, 'pop', { pitch: 400, gain: 0.55 });
  tl.fromTo(wipe, { scale: 0 }, { scale: 1, duration: 0.42, ease: 'power3.in', transformOrigin: '50% 50%' }, T.blueWipe); SR.sfx(T.blueWipe, 'whoosh', { dur: 0.42, lo: 200, hi: 4000, gain: 0.4 });
  k.hide(s4, T.blueWipe + 0.45);
  k.anticipate(end, T.hop, 0.1);
  tl.to(end.pos, { y: -200, duration: 0.32, ease: 'power2.in' }, T.hop); SR.sfx(T.hop, 'whoosh', { dur: 0.32, lo: 600, hi: 5000, gain: 0.35 });
  k.popWords(tW.groups, T.title, { stagger: 3 * FR, dur: 0.5 });
  k.popWords(tag.groups, T.tagline);
  tl.set(end.pos, { x: finX }, T.hop + 0.4); tl.set(end.size, { scale: finR / 70 }, T.hop + 0.4);
  tl.fromTo(end.pos, { y: -120 }, { y: finY, duration: T.finalLand - T.hop - 0.62, ease: 'power2.in', immediateRender: false }, T.hop + 0.62);
  tl.to(end.sq, { scaleX: 0.85, scaleY: 1.2, duration: 0.2 }, T.hop + 0.62);
  k.squash(end, T.finalLand, 0.3);
  SR.sfx(T.finalLand, 'boing', { pitch: 330, dur: 0.5, gain: 0.6, pan: 0.3 }); SR.sfx(T.finalLand, 'sparkle', { gain: 0.3, pan: 0.3 });
  tl.to(tW.groups[1], { keyframes: [{ y: 6, duration: 0.05 }, { y: 0, duration: 0.5, ease: 'elastic.out(1,0.3)' }] }, T.finalLand - 0.02);
  // living hold: three short spark lines, then a slow breath on the dot
  const sparks = [-60, 0, 60].map(a => rect(s5, -4, -60, 8, 0, C.white, 4));
  sparks.forEach((sp, i) => sp.setAttribute('transform', `translate(${finX},${finY}) rotate(${[-60, 0, 60][i] - 30})`));
  SR.onTick(t => {
    const s = t - T.finalLand; if (s < 0) return;
    const e = SR.smooth(s / 0.18), r = SR.smooth((s - 0.18) / 0.22);
    sparks.forEach(sp => { sp.setAttribute('height', Math.max(0, 34 * e - 34 * r)); sp.setAttribute('y', -70 - 30 * r); });
    if (s > 0.9) end.spin.setAttribute('transform', `rotate(${Math.sin((s - 0.9) * 2 * Math.PI * 0.5) * 12})`);
  });
};
