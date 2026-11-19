/* "The rest of her sentence"  Topic 4 refresher, Their view first.  Caslon voice (rule 4, Group Talent learning).
 * Hero: Mira's yellow speech bubble. It is cut in half; the loose half becomes the trucks on P2.
 * The film runs the call wrong, freezes, rewinds (a real time remap of the same scene) and runs it right.
 * Grounds: blue-deep (bubble on black-ish), quay blue-301 | office blue-deep. Yellow only on those grounds.
 */
window.FILM = async function (SR, tl, root, T, cues) {
  const { C, W, H, M, FR, el, place, anim, rect, circle, path, stroke } = SR;
  const k = SR.kit(tl);
  const LB = SR.style('label'), BODY = SR.style('body'), TITLE = SR.style('title'), EYE = SR.style('eyebrow');
  const defs = document.querySelector('#stage defs');

  /* ---------- time remap: freeze at T.freeze, rewind to T.rewTo, then path B ---------- */
  const mapT = t => {
    if (t < T.freeze) return t;
    if (t < T.rewStart) return T.freeze;
    if (t < T.rewEnd) { const u = (t - T.rewStart) / (T.rewEnd - T.rewStart); const e = 0.5 - 0.5 * Math.cos(Math.PI * u); return T.freeze - e * (T.freeze - T.rewTo); }
    if (t < T.B) return T.rewTo;
    return t;
  };
  let REAL = 0;
  Object.defineProperty(window, 'renderAt', { configurable: true,
    set(fn) { this.__ra = t => { REAL = t; fn(mapT(t)); }; }, get() { return this.__ra; } });
  const realTick = fn => SR.onTick(() => fn(REAL));

  /* ---------- helpers ---------- */
  function wrap(str, st, maxW) {
    const lines = []; let cur = [];
    str.split(' ').forEach(w => { const tst = [...cur, w].join(' '); if (cur.length && SR.measure(tst, st) > maxW) { lines.push(cur.join(' ')); cur = [w]; } else cur.push(w); });
    if (cur.length) lines.push(cur.join(' '));
    return lines;
  }
  // rounded talk bubble with a short tail pointing down at the phone line. Returns {mv, g, w, h, words, tip}
  function talk(parent, cx, cy, lines, o = {}) {
    const st = o.st || LB, padX = o.padX ?? 34, padY = 24, fill = o.fill || C.grey, ink = o.ink || C.deep;
    const tw = Math.max(o.minW || 0, ...lines.map(l => SR.measure(l, st)));
    const w = tw + 2 * padX + (o.iconW || 0), h = lines.length * st.lh + 2 * padY - (st.lh - st.size) + 6;
    if (o.bottom !== undefined) cy = o.bottom - h / 2;
    const mv = anim(place(parent, cx, cy)), g = anim(mv);
    const tx = o.tailX ?? 0;
    if (o.tail !== false) path(g, `M${tx - 20},${h / 2 - 4} L${tx},${h / 2 + 36} L${tx + 20},${h / 2 - 4} Z`, fill);
    rect(g, -w / 2, -h / 2, w, h, fill, Math.min(40, h / 2));
    const words = [];
    lines.forEach((l, i) => words.push(...SR.words(g, l, -w / 2 + padX + (o.iconW || 0), -h / 2 + padY + st.size * 0.78 + i * st.lh, st, ink).groups));
    return { mv, g, w, h, cx, cy, words, tip: [tx, h / 2 + 36], origin: `${tx + w / 2}px ${h + 36}px` };
  }
  function popAt(b, at, o = {}) { return k.pop(b.g, at, Object.assign({ origin: b.origin, dur: 0.45, ease: 'popBig', rot: o.rot ?? -6 }, o)); }
  function unpopAt(b, at) { k.unpop(b.g, at, { origin: b.origin }); }
  function typeWords(groups, at, step, o = {}) {
    groups.forEach((g, i) => {
      tl.fromTo(g, { scale: 0, transformOrigin: '50% 100%' }, { scale: 1, transformOrigin: '50% 100%', duration: 0.22, ease: 'pop' }, at + i * step);
      SR.sfx(at + i * step, 'tick', { pitch: 1700 + 260 * ((i * 7) % 5), gain: o.gain ?? 0.13, pan: o.pan ?? 0 });
    });
    return at + (groups.length - 1) * step + 0.22;
  }
  const snip = (t, pan = 0) => { SR.sfx(t, 'tick', { pitch: 4200, gain: 0.5, pan }); SR.sfx(t + 0.03, 'tick', { pitch: 3100, gain: 0.45, pan }); SR.sfx(t - 0.06, 'whoosh', { dur: 0.1, rise: true, lo: 3000, hi: 9000, gain: 0.25, pan }); };
  const hiss = (t, dur, gain = 0.09) => { for (let s = 0; s < dur - 0.4; s += 0.9) SR.sfx(t + s, 'whoosh', { dur: 1.8, rise: false, lo: 3500, hi: 7500, gain }); };
  function truckIcon(p, x, y, s, cab = C.deep, bed = C.deep) {
    const g = place(p, x, y, `scale(${s})`);
    rect(g, -50, -40, 30, 30, cab, 6); rect(g, -50, -14, 100, 10, cab, 3); rect(g, -16, -28, 66, 14, bed, 3);
    [-36, 18, 38].forEach(cx => circle(g, cx, -2, 8, cab)); return g;
  }
  function truck(parent, x) {             // parked flat truck, cab facing left, origin bottom centre on the deck
    const mv = anim(place(parent, x, DECK)), s = anim(mv);
    rect(s, -100, -36, 200, 14, C.deep, 4);
    rect(s, -100, -98, 64, 66, C.white, 10); rect(s, -92, -88, 30, 26, C.deep, 5);
    rect(s, -32, -62, 132, 26, C.grey, 4); rect(s, -18, -94, 104, 32, C.tint, 4);
    [-72, 42, 78].forEach(cx => { circle(s, cx, -15, 17, C.deep); circle(s, cx, -15, 6, C.grey); });
    return { mv, s };
  }
  function crew(parent, x) {
    const g = anim(place(parent, x, DECK));
    rect(g, -22, -38, 44, 38, C.deep, 6); rect(g, -26, -112, 52, 80, C.deepBand, 18); rect(g, -26, -84, 52, 10, C.white, 3);
    circle(g, 0, -134, 22, SR.SKIN[1]); path(g, 'M-25,-138 C-25,-168 25,-168 25,-138 Z', C.white); rect(g, -30, -142, 60, 8, C.white, 4);
    return g;
  }
  // Mira's split bubble: left half (what she gets to say) + right half (the rest of her sentence)
  const LEFT_TXT = 'Position two doesn’t work. The crane can’t get there, because since last week the client’s';
  const RIGHT_TXT = 'trucks are on the quay every morning now.';
  const lLines = wrap(LEFT_TXT, LB, 470), rLines = wrap(RIGHT_TXT, LB, 300);
  const lW = Math.max(...lLines.map(l => SR.measure(l, LB))), rW = Math.max(...rLines.map(l => SR.measure(l, LB)));
  const PADX = 36, PADY = 24, GAP = 44, RAD = 40;
  const MB = { w: PADX + lW + GAP + rW + PADX, h: Math.max(lLines.length, rLines.length) * LB.lh + 2 * PADY - (LB.lh - LB.size) + 6 };
  function miraBubble(parent, cx, cy, tailAbsX) {
    const { w, h } = MB, sx = -w / 2 + PADX + lW + GAP / 2, tx = tailAbsX - cx;
    const mv = anim(place(parent, cx, cy)), g = anim(mv);
    const left = anim(g);
    path(left, `M${tx - 20},${h / 2 - 4} L${tx},${h / 2 + 36} L${tx + 20},${h / 2 - 4} Z`, C.yellow);
    path(left, `M${sx + 1},${-h / 2} H${-w / 2 + RAD} A${RAD},${RAD} 0 0 0 ${-w / 2},${-h / 2 + RAD} V${h / 2 - RAD} A${RAD},${RAD} 0 0 0 ${-w / 2 + RAD},${h / 2} H${sx + 1} Z`, C.yellow);
    const lw = []; let endX = 0, lastY = 0;
    lLines.forEach((l, i) => { const r = SR.words(left, l, -w / 2 + PADX, -h / 2 + PADY + LB.size * 0.78 + i * LB.lh, LB, C.deep); lw.push(...r.groups); endX = r.endX; lastY = r.y; });
    const ell = SR.words(left, '…', endX + 4, lastY, LB, C.deep).groups[0];
    const rightMv = anim(g), right = anim(rightMv);
    path(right, `M${sx},${-h / 2} H${w / 2 - RAD} A${RAD},${RAD} 0 0 1 ${w / 2},${-h / 2 + RAD} V${h / 2 - RAD} A${RAD},${RAD} 0 0 1 ${w / 2 - RAD},${h / 2} H${sx} Z`, C.yellow);
    const rw = [];
    rLines.forEach((l, i) => rw.push(...SR.words(right, l, sx + GAP / 2, -h / 2 + PADY + LB.size * 0.78 + i * LB.lh, LB, C.deep).groups));
    const icon = anim(place(right, w / 2 - 92, h / 2 - 18)); truckIcon(icon, 0, 0, 0.9);
    const rTxt = rw;
    return { mv, g, left, rightMv, right, lw, ell, rw: rTxt, icon, sx, w, h, tip: [tx, h / 2 + 36], origin: `${tx + w / 2}px ${h + 36}px`, cx, cy };
  }

  /* ---------- layout constants ---------- */
  const DECK = 780, LINE_Y = 340, MIRA_X = 230, ENG_X = 1120, PM_X = 1790, BASE = 790;
  const PHONE = [316, 548], ENG_EAR = [1049, 512];
  const MBX = 110 + MB.w / 2, MBY = LINE_Y - 40 - MB.h / 2, TAIL_X = 360;
  const S0 = 42 / 32;                          // opening/closing bubble scale: label 32 -> caption 42 px

  /* ================= S0: the cut sentence on blue-deep ================= */
  const s0 = el('g', {}, root);
  rect(s0, 0, 0, W, H, C.deep);
  const s0p = place(s0, 960, 540, `scale(${S0})`);
  const b0 = miraBubble(s0p, 0, 0, TAIL_X - MBX);
  gsap.set([...b0.lw, b0.ell, ...b0.rw, b0.icon], { scale: 0 });
  hiss(0.05, 4.3);
  k.pop(b0.g, T.bub0, { origin: b0.origin, dur: 0.5, ease: 'popBig', rot: -4, pitch: 420 });
  typeWords([...b0.lw, b0.ell], T.type0, (T.snip0 - 0.25 - T.type0) / b0.lw.length);
  const slash = stroke(s0p, `M${b0.sx},${-MB.h / 2 - 50} L${b0.sx},${MB.h / 2 + 50}`, C.white, 6);
  gsap.set(slash, { autoAlpha: 0 });
  tl.set(slash, { autoAlpha: 1 }, T.snip0 - 0.05); k.draw(slash, T.snip0 - 0.05, 0.08, { ease: 'none' }); k.undraw(slash, T.snip0 + 0.06, 0.16);
  tl.set(slash, { autoAlpha: 0 }, T.snip0 + 0.24);
  snip(T.snip0);
  // the right half hangs from its top-right corner, then falls out of frame
  gsap.set(b0.rightMv, { transformOrigin: '100% 0%' });
  tl.to(b0.rightMv, { keyframes: [{ x: 10, y: 6, rotation: -4, duration: 0.06, ease: 'power2.out' }, { rotation: -9, duration: 0.7, ease: 'elastic.out(1,0.35)' }] }, T.snip0);
  tl.to(b0.rightMv, { y: 700, rotation: -38, duration: 0.55, ease: 'power2.in' }, T.fall0);
  SR.sfx(T.fall0, 'whoosh', { dur: 0.5, rise: false, lo: 2500, hi: 400, gain: 0.3 });
  // the stub folds into a dot at its tail; the dot hops to Mira's phone and opens the call
  const heroL = el('g', {}, root);            // above every scene
  const dot = SR.hero(heroL, { r: 20, fill: C.yellow, shine: false });
  const tip0 = [960 + b0.tip[0] * S0, 540 + b0.tip[1] * S0];
  gsap.set(dot.pos, { x: tip0[0], y: tip0[1] - 20 }); gsap.set(dot.size, { scale: 0 });
  tl.to(b0.g, { scale: 0, duration: 0.3, ease: 'back.in(1.6)', transformOrigin: b0.origin }, T.stub0 - 0.3);
  tl.fromTo(dot.size, { scale: 0 }, { scale: 1, duration: 0.3, ease: 'popBig' }, T.stub0 - 0.05); SR.sfx(T.stub0 - 0.05, 'pop', { pitch: 520, gain: 0.4 });
  k.hop(dot, T.dotHop, { x: PHONE[0] + 6, y: PHONE[1] - 26, apexY: 330, dur: T.dotLand - T.dotHop, spin: 0, pitch: 640 });

  /* ================= CALL SCENE (built twice: path A, then path B after the rewind) ================= */
  function buildCall(id) {
    const clip = el('circle', { cx: PHONE[0], cy: PHONE[1], r: 2300 }, el('clipPath', { id: 'clip' + id }, defs));
    const sc = el('g', {}, root); gsap.set(sc, { autoAlpha: 0 });
    const inner = el('g', { 'clip-path': `url(#clip${id})` }, sc);
    const cam = anim(inner);
    rect(cam, -200, -200, 1160, H + 400, C.blue);
    rect(cam, 960, -200, 1160, H + 400, C.deep);
    // the phone line: the only route between the two halves
    const line = stroke(cam, `M${PHONE[0]},${PHONE[1]} C${TAIL_X},${PHONE[1] - 10} ${TAIL_X},${LINE_Y + 60} ${TAIL_X},${LINE_Y} L${ENG_EAR[0] - 40},${LINE_Y} C${ENG_EAR[0]},${LINE_Y} ${ENG_EAR[0]},${LINE_Y + 30} ${ENG_EAR[0]},${ENG_EAR[1]}`, C.white, 6);
    // office: monitor (lift sequence), engineer with headset, project manager with a long agenda
    const mira = SR.character(cam, MIRA_X, BASE, { shirt: C.deepBand, sleeve: C.deepBand, skin: SR.SKIN[2], helmet: C.white, stripes: C.white });
    mira.armR.upper.setAttribute('visibility', 'hidden');
    stroke(mira.body, 'M98,612 L150,552 L92,508', C.deepBand, 34);
    rect(mira.body, 70, 452, 26, 58, C.deep, 8); circle(mira.body, 92, 508, 19, SR.SKIN[2]);
    const eng = SR.character(cam, ENG_X, BASE, { shirt: C.white, sleeve: C.grey, skin: SR.SKIN[1], hair: 'side', hairColor: SR.HAIR[1], collar: 'v' });
    stroke(eng.head, 'M-70,-10 C-70,-98 70,-98 70,-10', C.tint, 10);
    rect(eng.head, -84, -22, 22, 46, C.tint, 9); rect(eng.head, 62, -22, 22, 46, C.tint, 9);
    stroke(eng.head, 'M-74,18 C-68,44 -52,50 -30,46', C.tint, 7);
    const pm = SR.character(cam, PM_X, BASE, { shirt: C.tint, sleeve: C.blue, skin: SR.SKIN[3], hair: 'short', hairColor: SR.HAIR[0], glasses: true, collar: 'tie', tieColor: C.deep });
    const agenda = anim(place(cam, 1668, 560)); rect(agenda, -52, 0, 104, 250, C.white, 8);
    [30, 62, 94, 126, 158, 190].forEach((y, i) => rect(agenda, -34, y, i % 2 ? 50 : 68, 12, C.tint, 6));
    rect(cam, 960, DECK, 1160, 400, C.deepBand);              // desk
    const mon = anim(place(cam, 1470, 780)), monS = anim(mon);
    rect(monS, -16, -70, 32, 70, C.grey, 6); rect(monS, -70, -14, 140, 14, C.grey, 7);
    rect(monS, -190, -320, 380, 260, C.grey, 16); rect(monS, -174, -304, 348, 228, C.blue, 8);
    const scr = anim(monS);
    SR.words(scr, 'Lift sequence', -150, -256, LB, C.white);
    SR.words(scr, 'P2', -150, -196, LB, C.white);
    const tOld = anim(scr); SR.words(tOld, 'start 07:00', 150, -196, LB, C.white, { align: 'right' });
    const tNew = anim(scr); SR.words(tNew, 'start 10:30', 150, -196, LB, C.white, { align: 'right' });
    const issued = anim(scr); SR.words(issued, 'Issued', -150, -136, LB, C.white);
    const ck1 = stroke(issued, 'M-12,-148 L0,-136 L22,-160', C.white, 7), ck2 = stroke(issued, 'M24,-148 L36,-136 L58,-160', C.white, 7);
    const stamp = anim(place(scr, 0, -146)), stampS = anim(stamp);
    const swd = SR.measure('Revised, checked', LB) + 40;
    rect(stampS, -swd / 2, -30, swd, 56, C.blue); el('rect', { x: -swd / 2, y: -30, width: swd, height: 56, rx: 6, fill: 'none', stroke: C.white, 'stroke-width': 6 }, stampS);
    SR.textEl(stampS, 'Revised, checked', 0, 9, LB, C.white, 'middle');
    const chip = anim(place(scr, -60, -206)), chipS = anim(chip);
    rect(chipS, -46, -26, 92, 52, C.yellow, 16); truckIcon(chipS, 0, 18, 0.55);
    // quay: deck, water, P2 marker
    const deckL = el('g', {}, cam);
    rect(deckL, -200, DECK, 1160, 120, C.deep); rect(deckL, 70, DECK - 30, 34, 32, C.deep, 8);
    rect(deckL, -200, 900, 1160, 400, C.deepBand);
    const waves = [0, 1, 2, 3, 4].map(i => rect(deckL, 0, 940 + (i % 2) * 50, 90, 8, C.blue, 4));
    SR.onTick(t => waves.forEach((wv, i) => wv.setAttribute('x', ((i * 230 + t * (20 + 6 * i)) % 1100) - 100)));
    rect(cam, 960, DECK, 1160, 400, C.deepBand);
    const flag = SR.flag(cam, 760, DECK, 'P2', { fill: C.white });
    const pause = anim(place(cam, 760 + SR.measure('P2', LB) + 56 + 34, DECK - 198)); rect(pause, -16, -24, 12, 48, C.white, 4); rect(pause, 4, -24, 12, 48, C.white, 4);
    const trucksL = el('g', {}, cam), craneL = el('g', {}, cam);
    const bubL = el('g', {}, cam), labL = el('g', {}, sc);
    return { sc, cam, clip, line, mira, eng, pm, agenda, mon, monS, tOld, tNew, issued, ck1, ck2, stamp, stampS, chip, chipS, flag, pause, trucksL, craneL, bubL, labL };
  }
  // Mira holds the phone; the headset and phone stay put while heads bob
  function lifeFor(S, from, to, o) {
    SR.charLife(S.mira, { seed: 0.4, side: 1, from, to, talk: o.miraTalk, listen: o.miraListen });
    SR.charLife(S.eng, { seed: 1.3, side: -1, from, to, talk: o.engTalk, listen: o.engListen });
    SR.charLife(S.pm, { seed: 2.2, side: -1, from, to, talk: o.pmTalk, listen: o.pmListen });
    SR.onTick(t => { if (t >= from && t <= to) S.agenda.setAttribute('transform', `rotate(${Math.sin(t * 1.3) * 1.2})`); });
  }
  function crane(S, x) {
    const mv = anim(place(S.craneL, 0, 0)), body = anim(mv);
    const cr = SR.props.crane(body, x, DECK - 12 * 0.7, 0.7, { color: C.white, accent: C.tint, angle: -38, cable: 110 });
    return { mv, body, cr };
  }

  /* ---------------- PATH A: defend ---------------- */
  const A = buildCall('A');
  const camOrigin = `${PHONE[0]} ${PHONE[1]}`;
  k.show(A.sc, T.dotLand);
  tl.fromTo(A.clip, { attr: { r: 0 } }, { attr: { r: 2300 }, duration: 0.5, ease: 'power3.in', immediateRender: false }, T.dotLand + 0.02);
  tl.set(A.clip, { attr: { r: 0 } }, 0);
  SR.sfx(T.dotLand - 0.05, 'whoosh', { dur: 0.6, rise: true, lo: 150, hi: 5000, gain: 0.5 });
  k.hide(s0, T.dotLand + 0.55);
  tl.fromTo(A.cam, { scale: 1.12, svgOrigin: camOrigin }, { scale: 1, svgOrigin: camOrigin, duration: 1.0, ease: 'power3.out', immediateRender: false }, T.dotLand + 0.05);
  gsap.set([A.eng.rise, A.pm.rise], { y: 340 });
  tl.fromTo(A.eng.rise, { y: 340 }, { y: 0, duration: 0.5, ease: 'popBig' }, T.charB); SR.sfx(T.charB, 'boing', { pitch: 300, gain: 0.4, pan: 0.3 });
  tl.fromTo(A.pm.rise, { y: 340 }, { y: 0, duration: 0.5, ease: 'popBig' }, T.charC); SR.sfx(T.charC, 'boing', { pitch: 260, gain: 0.4, pan: 0.6 });
  k.draw(A.line, T.line, 0.6, { sfx: 'zip' });
  gsap.set([A.flag.a, A.monS, A.stampS, A.chipS, A.pause], { scale: 0 });
  gsap.set([A.tNew], { autoAlpha: 0 });
  k.pop(A.flag.a, T.flag, { origin: '50% 100%', dur: 0.5, ease: 'popBig', pitch: 500, pan: -0.3 });
  tl.fromTo(A.flag.fl, { rotation: -14, transformOrigin: '0% 50%' }, { rotation: 0, duration: 0.9, ease: 'elastic.out(1,0.3)' }, T.flag + 0.08);
  k.pop(A.monS, T.screen, { origin: '50% 100%', dur: 0.5, ease: 'popBig', pitch: 380, pan: 0.4 });
  k.draw(A.ck1, T.tick1, 0.2, { sfx: 'zip' }); k.draw(A.ck2, T.tick2, 0.2, { sfx: 'zip' });
  // establishing labels
  const head = SR.words(A.labL, 'Tuesday 09:00, weekly project call', 960, 196, TITLE, C.white, { align: 'center' });
  const labM = SR.words(A.labL, 'Mira, site supervisor (on the quay)', 110, 836, LB, C.white);
  const labE = SR.words(A.labL, 'You, project engineer', ENG_X, 836, LB, C.white, { align: 'center' });
  const labP = SR.words(A.labL, 'Project manager', W - M, 836, LB, C.white, { align: 'right' });
  [head, labM, labE, labP].forEach(r => gsap.set(r.groups, { scale: 0 }));
  k.popWords(head.groups, T.heading);
  k.popWords(labM.groups, T.labMira); k.popWords(labE.groups, T.labEng); k.popWords(labP.groups, T.labPM);
  [head, labM, labE, labP].forEach((r, i) => k.outWords(r.groups, T.labelsOut + i * 0.06));
  // Mira speaks again: the dot climbs the line and opens into her bubble
  const bA = miraBubble(A.bubL, MBX, MBY, TAIL_X);
  gsap.set(bA.g, { scale: 0 }); gsap.set([...bA.lw, bA.ell, ...bA.rw, bA.icon], { scale: 0 });
  tl.to(dot.pos, { keyframes: [{ x: TAIL_X, y: LINE_Y + 40, duration: 0.18, ease: 'power2.out' }, { y: LINE_Y + 10, duration: 0.07 }] }, T.dotUp);
  tl.to(dot.size, { scale: 0, duration: 0.12, ease: 'power2.in' }, T.miraBub - 0.02);
  k.hide(dot.pos, T.miraBub + 0.12);
  k.pop(bA.g, T.miraBub, { origin: bA.origin, dur: 0.5, ease: 'popBig', rot: -5, pitch: 440, pan: -0.5 });
  typeWords([...bA.lw, bA.ell], T.type1, (T.engBub - 0.3 - T.type1) / bA.lw.length, { pan: -0.5 });
  // engineer's reply shoots along the line and cuts her off
  const BOT = LINE_Y - 40;
  const rep = talk(A.bubL, ENG_X + 60, 0, ['I checked it twice.', 'Position two is correct.'], { bottom: BOT });
  gsap.set(rep.g, { scale: 0 });
  popAt(rep, T.engBub, { pitch: 620, pan: 0.5, rot: 6 });
  const seamAbs = MBX + bA.sx, repDX = seamAbs + 6 - (ENG_X + 60 - rep.w / 2);
  tl.to(rep.mv, { x: repDX, duration: T.snip - T.shoot, ease: 'power3.in' }, T.shoot);
  SR.sfx(T.shoot, 'whoosh', { dur: T.snip - T.shoot, rise: true, lo: 800, hi: 6000, gain: 0.45, pan: 0.2 });
  tl.to(rep.mv, { keyframes: [{ x: repDX + 14, duration: 0.06 }, { x: repDX, duration: 0.45, ease: 'elastic.out(1,0.35)' }] }, T.snip);
  snip(T.snip, -0.2);
  // her cut half drops down the line onto P2 and unfolds into two trucks
  const halfCX = bA.sx + (MB.w / 2 - bA.sx) / 2, dropX = 745 - (MBX + halfCX), dropY = DECK - (MBY + MB.h / 2);
  tl.to(bA.rightMv, { x: dropX, duration: T.halfLand - T.snip, ease: 'power1.inOut' }, T.snip);
  gsap.set(bA.rightMv, { transformOrigin: '50% 100%' });
  tl.to(bA.rightMv, { keyframes: [{ y: -30, rotation: -10, duration: 0.16, ease: 'power2.out' }, { y: dropY, rotation: 0, duration: T.halfLand - T.snip - 0.16, ease: 'power2.in' }] }, T.snip);
  SR.sfx(T.snip + 0.08, 'whoosh', { dur: 0.45, rise: false, lo: 5000, hi: 1200, gain: 0.22, pan: -0.3 });
  tl.to(bA.right, { scaleX: 1.35, scaleY: 0.45, duration: 0.08, ease: 'power2.out', transformOrigin: '50% 100%' }, T.halfLand - 0.02);
  k.hide(bA.rightMv, T.trucks);
  const trA = [truck(A.trucksL, 635), truck(A.trucksL, 852)];
  trA.forEach((tr, i) => { gsap.set(tr.s, { scale: 0 }); tl.fromTo(tr.s, { scale: 0, transformOrigin: '50% 100%' }, { scale: 1, duration: 0.5, ease: 'popBig', transformOrigin: '50% 100%' }, T.trucks + i * 3 * FR); SR.sfx(T.trucks + i * 3 * FR, 'pop', { pitch: 140, gain: 0.7, pan: -0.4 + 0.2 * i }); });
  // "Fine. We'll see on site."  "Next item."
  unpopAt(rep, T.replyOut); tl.to(bA.left, { scale: 0, duration: 0.22, ease: 'back.in(2)', transformOrigin: bA.origin }, T.replyOut);
  const fine = talk(A.bubL, 330, 0, ['Fine. We’ll see on site.'], { fill: C.yellow, tailX: TAIL_X - 330, bottom: BOT });
  const nxt = talk(A.bubL, PM_X - 60, 0, ['Next item.'], { tailX: 40, bottom: BOT });
  gsap.set([fine.g, nxt.g], { scale: 0 });
  popAt(fine, T.fine, { pitch: 420, pan: -0.5 }); popAt(nxt, T.next, { pitch: 560, pan: 0.6, rot: 6 });
  unpopAt(fine, T.bubOut); unpopAt(nxt, T.bubOut + 0.05);
  // the call ends; Thursday
  tl.to(A.mira.rise, { y: 360, duration: 0.35, ease: 'back.in(1.4)' }, T.miraOut);
  k.undraw(A.line, T.miraOut, 0.4);
  const cal = anim(place(A.labL, 290, 200)), calS = anim(cal);
  rect(calS, -170, -92, 340, 184, C.white, 18); rect(calS, -170, -92, 340, 56, C.deep, 18); rect(calS, -170, -56, 340, 20, C.deep);
  const face = (day, time) => { const f = anim(calS); SR.textEl(f, day, 0, -54, LB, C.white, 'middle'); SR.textEl(f, time, 0, 56, TITLE, C.deep, 'middle'); return f; };
  const fTue = face('Tuesday', '09:00'), fThu = face('Thursday', '07:00');
  gsap.set(calS, { scale: 0 }); gsap.set(fThu, { scaleY: 0 });
  k.pop(calS, T.cal, { dur: 0.45, ease: 'popBig', pitch: 600, pan: -0.5 });
  tl.to(fTue, { scaleY: 0, duration: 0.1, ease: 'power2.in', transformOrigin: '50% 0%' }, T.calFlip);
  tl.fromTo(fThu, { scaleY: 0, transformOrigin: '50% 0%' }, { scaleY: 1, duration: 0.3, ease: 'pop', transformOrigin: '50% 0%' }, T.calFlip + 0.1);
  SR.sfx(T.calFlip, 'zip', { dur: 0.12, gain: 0.35, pan: -0.5 }); SR.sfx(T.calFlip + 0.12, 'tick', { pitch: 1200, gain: 0.3 });
  const crA = crane(A, 410);
  tl.fromTo(crA.mv, { x: -820 }, { x: 0, duration: T.craneStop - T.craneIn, ease: 'power2.out' }, T.craneIn);
  tl.to(crA.body, { keyframes: [{ x: 10, rotation: 1.2, duration: 0.08, transformOrigin: '50% 100%' }, { x: 0, rotation: 0, duration: 0.5, ease: 'elastic.out(1,0.35)' }] }, T.craneStop);
  SR.sfx(T.craneIn, 'rumble', { dur: T.craneStop - T.craneIn + 0.2, gain: 0.5 }); SR.sfx(T.craneStop, 'thunk', { gain: 0.5, pan: -0.3 });
  SR.onTick(t => { const s = t - T.craneStop; const a = s > 0 ? 9 * Math.exp(-s * 0.7) * Math.sin(s * 2 * Math.PI * 0.55) : 2 * Math.sin(t * 2 * Math.PI * 0.4);
    crA.cr.hook.setAttribute('transform', `rotate(${a})`); });
  const crewA = [crew(A.craneL, 150), crew(A.craneL, 226)]; gsap.set(crewA, { scale: 0 });
  crewA.forEach((c, i) => k.pop(c, T.crew + i * 0.15, { origin: '50% 100%', dur: 0.45, ease: 'popBig', pitch: 360 + 60 * i, pan: -0.6 }));
  SR.onTick(t => crewA.forEach((c, i) => { if (t > T.crew + 0.6) c.firstChild.setAttribute('transform', `translate(0,${Math.sin((t + i) * 2.2) * 1.5})`); }));
  lifeFor(A, T.dotLand - 0.1, T.B, { miraTalk: [[T.miraBub, T.snip], [T.fine, T.fine + 1.0]], miraListen: [[T.engBub, T.snip - 0.2]],
    engTalk: [[T.engBub, T.snip + 0.2]], engListen: [[T.miraBub, T.engBub - 0.2], [T.fine, T.next - 0.1]], pmTalk: [[T.next, T.next + 0.8]], pmListen: [[T.engBub, T.snip]] });
  // freeze: colour drains, then the remap above runs everything backwards to the frame before the snip
  const flt = el('filter', { id: 'desat', 'color-interpolation-filters': 'sRGB' }, defs);
  const cm = el('feColorMatrix', { type: 'saturate', values: '1' }, flt);
  realTick(t => {
    const s = t < T.freeze ? 1 : t < T.B ? 1 - SR.smooth((t - T.freeze) / 0.25) : 1;
    if (s < 0.999) { cm.setAttribute('values', s.toFixed(3)); A.sc.setAttribute('filter', 'url(#desat)'); } else A.sc.removeAttribute('filter');
  });
  SR.sfx(T.freeze, 'thunk', { gain: 0.35 });
  SR.sfx(T.rewStart, 'zip', { dur: T.rewEnd - T.rewStart, gain: 0.3 });
  SR.sfx(T.rewStart, 'whoosh', { dur: T.rewEnd - T.rewStart, rise: false, lo: 400, hi: 7000, gain: 0.35 });
  SR.sfx(T.rewEnd + 0.06, 'tick', { pitch: 1400, gain: 0.6 });
  k.hide(A.sc, T.B);

  /* ---------------- PATH B: say it back, then ask ---------------- */
  const B = buildCall('B');
  k.show(B.sc, T.B);
  { const L = B.line.getTotalLength(); B.line.setAttribute('stroke-dasharray', L); B.line.setAttribute('stroke-dashoffset', 0); }
  gsap.set([B.stampS, B.chipS, B.pause], { scale: 0 }); gsap.set(B.tNew, { autoAlpha: 0 });
  const bB = miraBubble(B.bubL, MBX, MBY, TAIL_X);
  gsap.set([...bB.rw, bB.icon], { scale: 0 });
  // empty reply bubble + three-tick progress line, the question to the viewer
  const empty = talk(B.bubL, ENG_X + 60, 0, [''], { minW: 200, bottom: LINE_Y - 40 });
  const prog = rect(B.bubL, ENG_X + 60 - 130, LINE_Y - 20, 0, 10, C.white, 5);
  const progBg = rect(B.bubL, ENG_X + 60 - 130, LINE_Y - 20, 260, 10, C.deepBand, 5); B.bubL.insertBefore(progBg, prog);
  [T.tickA, T.tickB, T.tickC].forEach((t, i) => { tl.to(prog, { attr: { width: 260 * (i + 1) / 3 }, duration: 0.18, ease: 'power2.out' }, t - 0.18); SR.sfx(t, 'tick', { pitch: 1500, gain: 0.5 }); });
  tl.to([prog, progBg], { autoAlpha: 0, duration: 0.15 }, T.emptyOut);
  unpopAt(empty, T.emptyOut);
  const q1 = SR.words(B.labL, 'Mira is still talking.', 1010, 846, BODY, C.white), q2 = SR.words(B.labL, 'What do you say?', 1010, 938, TITLE, C.white);
  gsap.set([...q1.groups, ...q2.groups], { scale: 0 });
  k.popWords(q1.groups, T.q); k.popWords(q2.groups, T.q + 0.35);
  k.outWords([...q1.groups, ...q2.groups], T.qOut);
  tl.fromTo(B.cam, { scale: 1, svgOrigin: '1300 420' }, { scale: 1.04, svgOrigin: '1300 420', duration: T.qOut - T.B, ease: 'sine.inOut' }, T.B);
  tl.to(B.cam, { scale: 1, svgOrigin: '1300 420', duration: 0.6, ease: 'power3.out' }, T.emptyOut);
  // she finishes; the rest of her sentence travels to his screen and lands on P2
  k.unpop(bB.ell, T.type2 - 0.1, { origin: '50% 100%' });
  typeWords(bB.rw, T.type2, 0.2, { pan: -0.5 });
  k.pop(bB.icon, T.truckIcon, { dur: 0.45, ease: 'popBig', pitch: 700, pan: -0.4 });
  const half2CX = MBX + bB.sx + (MB.w / 2 - bB.sx) / 2;
  const chipAbs = [1470 - 60, 780 - 206];
  tl.to(bB.right, { keyframes: [{ scale: 0.94, duration: 0.18, ease: 'power2.out' }, { scale: 1, duration: 0.12 }], transformOrigin: '50% 50%' }, T.halfGo - 0.2);
  tl.to(bB.rightMv, { x: chipAbs[0] - half2CX, duration: T.halfLand2 - T.halfGo - 0.25, ease: 'power2.inOut' }, T.halfGo);
  tl.to(bB.rightMv, { y: chipAbs[1] - MBY, duration: 0.3, ease: 'power2.in' }, T.halfLand2 - 0.3);
  tl.to(bB.right, { scale: 0.3, duration: 0.35, ease: 'power2.in', transformOrigin: '50% 50%' }, T.halfLand2 - 0.38);
  bB.rw.forEach((g, i) => k.unpop(g, T.halfLand2 - 0.55 + i * FR, { origin: '50% 100%' }));
  SR.sfx(T.halfGo, 'whoosh', { dur: 0.9, rise: true, lo: 400, hi: 5000, gain: 0.4, pan: 0.3 });
  k.hide(bB.rightMv, T.halfLand2);
  k.pop(B.chipS, T.halfLand2, { dur: 0.45, ease: 'popBig', sfx: false });
  SR.sfx(T.halfLand2 + 0.05, 'ding', { gain: 0.4, pan: 0.4 });
  // say it back
  const say = talk(B.bubL, ENG_X + 60, 0, ['So the trucks', 'block position two.'], { iconW: 120, bottom: LINE_Y - 40 });
  const sayIco = place(say.g, -say.w / 2 + 34 + 46, 0); truckIcon(sayIco, 0, 10, 0.8);
  rect(sayIco, -26, -60, 52, 34, C.deep, 8); SR.textEl(sayIco, 'P2', 0, -33, SR.style('label'), C.white, 'middle');
  gsap.set(say.g, { scale: 0 });
  popAt(say, T.say, { pitch: 620, pan: 0.5, rot: 6 });
  const sayDX = seamAbs + 20 - (ENG_X + 60 - say.w / 2);
  tl.to(say.mv, { x: sayDX, duration: T.sayArrive - T.sayGo, ease: 'power2.inOut' }, T.sayGo);
  SR.sfx(T.sayGo, 'whoosh', { dur: T.sayArrive - T.sayGo, rise: false, lo: 3000, hi: 900, gain: 0.3, pan: -0.2 });
  const ckB = anim(place(B.bubL, 110 + 18, MBY - MB.h / 2 + 18)); circle(ckB, 0, 0, 34, C.white); stroke(ckB, 'M-15,1 L-4,13 L16,-11', C.deep, 8);
  gsap.set(ckB, { scale: 0 });
  k.pop(ckB, T.check, { dur: 0.45, ease: 'popBig', sfx: false });
  SR.sfx(T.check, 'pluck', { note: 79, gain: 0.35 }); SR.sfx(T.check + 0.14, 'pluck', { note: 86, gain: 0.35 });
  const labSay = SR.words(B.labL, 'Say it back.', 1440, 868, TITLE, C.white, { align: 'center' });
  gsap.set(labSay.groups, { scale: 0 });
  k.popWords(labSay.groups, T.sayLabel, { stagger: 3 * FR }); k.outWords(labSay.groups, T.sayOut);
  unpopAt(say, T.sayOut); k.unpop(ckB, T.sayOut);
  // then ask
  const ask = talk(B.bubL, ENG_X + 60, 0, ['When are they there?'], { bottom: LINE_Y - 40 });
  gsap.set(ask.g, { scale: 0 });
  popAt(ask, T.ask, { pitch: 640, pan: 0.5, rot: 6 });
  const askDX = seamAbs + 20 - (ENG_X + 60 - ask.w / 2);
  tl.to(ask.mv, { x: askDX, duration: T.askArrive - T.askGo, ease: 'power2.inOut' }, T.askGo);
  SR.sfx(T.askGo, 'whoosh', { dur: T.askArrive - T.askGo, rise: false, lo: 3000, hi: 900, gain: 0.3, pan: -0.2 });
  const labAsk = SR.words(B.labL, 'Then ask.', 1440, 868, TITLE, C.white, { align: 'center' });
  gsap.set(labAsk.groups, { scale: 0 });
  k.popWords(labAsk.groups, T.askLabel, { stagger: 3 * FR }); k.outWords(labAsk.groups, T.askLabelOut);
  tl.to(bB.left, { scale: 0, duration: 0.22, ease: 'back.in(2)', transformOrigin: bB.origin }, T.stubOut);
  const ansX = 110 + 200;
  const ans = talk(B.bubL, ansX, 0, ['Six to ten.', 'Every morning.'], { fill: C.yellow, tailX: TAIL_X - ansX, bottom: LINE_Y - 40 });
  gsap.set(ans.g, { scale: 0 });
  popAt(ans, T.answer, { pitch: 440, pan: -0.5 });
  // her answer turns into a clock: only 6 to 10 fills
  ans.words.forEach((g, i) => k.unpop(g, T.morph - 0.12 + i * FR, { origin: '50% 100%' }));
  tl.to(ans.g, { scaleX: ans.h / ans.w, duration: 0.2, ease: 'power2.in', transformOrigin: '50% 50%' }, T.morph);
  k.hide(ans.mv, T.morph + 0.2);
  const clk = anim(place(B.bubL, ansX, ans.cy)), clkS = anim(clk);
  circle(clkS, 0, 0, 104, C.deep);
  for (let i = 0; i < 12; i++) { const a = place(clkS, 0, 0, `rotate(${i * 30})`); rect(a, -4, -92, 8, i % 3 ? 14 : 22, C.white, 4); }
  const arc = el('path', { d: 'M0,72 A72,72 0 0 1 -62.35,-36', fill: 'none', stroke: C.yellow, 'stroke-width': 26 }, clkS);
  const hand = anim(clkS); rect(hand, -5, -64, 10, 70, C.white, 5); circle(clkS, 0, 0, 12, C.white);
  gsap.set(clkS, { scale: 0 });
  tl.fromTo(clkS, { scale: 0.5, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.45, ease: 'popBig', transformOrigin: '50% 50%', immediateRender: false }, T.morph + 0.18);
  SR.sfx(T.morph + 0.18, 'pop', { pitch: 380, gain: 0.45, pan: -0.5 });
  const arcL = Math.PI * 72 * 120 / 180; arc.setAttribute('stroke-dasharray', arcL);
  tl.fromTo(arc, { attr: { 'stroke-dashoffset': arcL } }, { attr: { 'stroke-dashoffset': 0 }, duration: 1.5, ease: 'none' }, T.arc + 0.5);
  tl.fromTo(hand, { rotation: 180, svgOrigin: '0 0' }, { rotation: 300, svgOrigin: '0 0', duration: 1.5, ease: 'none' }, T.arc + 0.5);
  [0, 0.5, 1.0, 1.5].forEach((d, i) => SR.sfx(T.arc + 0.5 + d, 'tick', { pitch: 1600 + 150 * i, gain: 0.35 + 0.08 * i, pan: -0.5 }));
  unpopAt(ask, T.askOut);
  // "Until I revise it, position two is on hold."  P2 paused, sequence revised
  const hold = talk(B.bubL, ENG_X + 60, 0, ['Until I revise it,', 'position two is on hold.'], { bottom: LINE_Y - 40 });
  gsap.set(hold.g, { scale: 0 });
  popAt(hold, T.hold, { pitch: 600, pan: 0.5, rot: 6 }); unpopAt(hold, T.holdOut);
  k.pop(B.pause, T.pause, { dur: 0.45, ease: 'popBig', pitch: 480, pan: -0.2 });
  tl.to(B.tOld, { y: -30, autoAlpha: 0, duration: 0.22, ease: 'power2.in' }, T.timeSlide);
  tl.fromTo(B.tNew, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, ease: 'pop', immediateRender: false }, T.timeSlide + 0.18);
  SR.sfx(T.timeSlide, 'zip', { dur: 0.3, gain: 0.35, pan: 0.4 });
  tl.to(B.issued, { autoAlpha: 0, duration: 0.1 }, T.stamp - 0.05);
  tl.fromTo(B.stampS, { scale: 1.8, rotation: -14, transformOrigin: '50% 50%' }, { scale: 1, rotation: -5, duration: 0.18, ease: 'power3.in', transformOrigin: '50% 50%', immediateRender: false }, T.stamp - 0.18);
  tl.to(B.monS, { keyframes: [{ y: 5, duration: 0.04 }, { y: 0, duration: 0.4, ease: 'elastic.out(1,0.3)' }] }, T.stamp);
  SR.sfx(T.stamp, 'thunk', { gain: 0.6, pan: 0.4 });
  // Thursday 10:00: the trucks leave; 10:30: the crane rolls onto P2 and sets up
  k.unpop(clkS, T.callEnd);
  tl.to(B.mira.rise, { y: 360, duration: 0.35, ease: 'back.in(1.4)' }, T.callEnd + 0.05);
  k.undraw(B.line, T.callEnd, 0.4);
  const calB = anim(place(B.labL, 290, 200)), calBS = anim(calB);
  rect(calBS, -170, -92, 340, 184, C.white, 18); rect(calBS, -170, -92, 340, 56, C.deep, 18); rect(calBS, -170, -56, 340, 20, C.deep);
  SR.textEl(calBS, 'Thursday', 0, -54, LB, C.white, 'middle');
  const c10 = anim(calBS); SR.textEl(c10, '10:00', 0, 56, TITLE, C.deep, 'middle');
  const c1030 = anim(calBS); SR.textEl(c1030, '10:30', 0, 56, TITLE, C.deep, 'middle');
  gsap.set(calBS, { scale: 0 }); gsap.set(c1030, { scaleY: 0 });
  k.pop(calBS, T.thu, { dur: 0.45, ease: 'popBig', pitch: 600, pan: -0.5 });
  tl.to(c10, { scaleY: 0, duration: 0.1, ease: 'power2.in', transformOrigin: '50% 0%' }, T.calTime);
  tl.fromTo(c1030, { scaleY: 0, transformOrigin: '50% 0%' }, { scaleY: 1, duration: 0.3, ease: 'pop', transformOrigin: '50% 0%' }, T.calTime + 0.1);
  SR.sfx(T.calTime, 'zip', { dur: 0.12, gain: 0.35, pan: -0.5 });
  const trB = [truck(B.trucksL, 635), truck(B.trucksL, 852)];
  trB.forEach((tr, i) => { gsap.set(tr.s, { scale: 0 }); tl.fromTo(tr.s, { scale: 0, transformOrigin: '50% 100%' }, { scale: 1, duration: 0.45, ease: 'popBig', transformOrigin: '50% 100%' }, T.trucks2 + i * 3 * FR); SR.sfx(T.trucks2 + i * 3 * FR, 'pop', { pitch: 160, gain: 0.5, pan: -0.4 }); });
  trB.forEach((tr, i) => { tl.to(tr.s, { keyframes: [{ scaleX: 1.06, scaleY: 0.95, duration: 0.12 }, { scaleX: 1, scaleY: 1, duration: 0.2 }], transformOrigin: '50% 100%' }, T.trucksGo - 0.12 + i * 0.08);
    tl.to(tr.mv, { x: -1300, duration: 0.85, ease: 'power2.in' }, T.trucksGo + i * 0.08); });
  SR.sfx(T.trucksGo, 'rumble', { dur: 0.9, gain: 0.45, pan: -0.5 });
  const crB = crane(B, 700);
  const og = [[-140, -1], [150, 1]].map(([x, sg]) => { const p = place(crB.cr.g, x, -32), beam = anim(p); rect(beam, sg < 0 ? -80 : 0, -8, 80, 16, C.tint, 4);
    const leg = anim(place(beam, sg * 72, 0)); rect(leg, -6, 0, 12, 48, C.tint, 3); rect(leg, -22, 44, 44, 10, C.white, 3); return { beam, leg, sg }; });
  og.forEach(o => { gsap.set(o.beam, { scaleX: 0, transformOrigin: o.sg < 0 ? '100% 50%' : '0% 50%' }); gsap.set(o.leg, { scaleY: 0, transformOrigin: '50% 0%' }); });
  tl.fromTo(crB.mv, { x: -1100 }, { x: 0, duration: T.crane2Stop - T.crane2, ease: 'power2.out' }, T.crane2);
  SR.sfx(T.crane2, 'rumble', { dur: T.crane2Stop - T.crane2, gain: 0.45 });
  k.unpop(B.pause, T.crane2Stop - 0.1);
  [[og[1].beam, { scaleX: 1 }, T.out1], [og[0].beam, { scaleX: 1 }, T.out2], [og[1].leg, { scaleY: 1 }, T.out3], [og[0].leg, { scaleY: 1 }, T.out4]].forEach(([tg, v, t]) => {
    tl.to(tg, Object.assign({ duration: 0.12, ease: 'power3.in' }, v), t - 0.12); SR.sfx(t, 'thunk', { gain: 0.55, pan: -0.3 }); });
  tl.to(crB.body, { y: -6, duration: 0.3, ease: 'power2.out' }, T.out4);
  SR.onTick(t => { const s = t - T.crane2Stop; const a = s > 0 ? 7 * Math.exp(-s * 0.8) * Math.sin(s * 2 * Math.PI * 0.55) + 1.5 * Math.sin(t * 2 * Math.PI * 0.4) : 2 * Math.sin(t * 2 * Math.PI * 0.4);
    crB.cr.hook.setAttribute('transform', `rotate(${a})`); });
  lifeFor(B, T.B, T.wipe + 0.5, { miraTalk: [[T.type2, T.type2 + 1.7], [T.answer, T.answer + 1.3]], miraListen: [[T.sayArrive, T.check + 0.8], [T.askArrive, T.answer - 0.2]],
    engTalk: [[T.say, T.say + 1.0], [T.ask, T.ask + 0.8], [T.hold, T.hold + 1.3]], engListen: [[T.emptyOut, T.halfLand2], [T.answer, T.morph + 1]], pmListen: [[T.type2, T.halfLand2]] });
  // engineer's mouth stays open while the reply waits
  SR.onTick(t => { if (t >= T.B && t < T.emptyOut) B.eng.mouth.setAttribute('transform', 'scale(1.1,2.2)'); });

  /* ================= END: the whole sentence, the rule, then the title ================= */
  const wipes = el('g', {}, root);
  const mid = k.blockWipe(wipes, T.wipe, { dir: 'right', color: C.deep });
  const sE = el('g', {}, root); gsap.set(sE, { autoAlpha: 0 });
  root.insertBefore(sE, wipes);
  rect(sE, 0, 0, W, H, C.deep);
  const sEp = place(sE, 960, 540, `scale(${S0})`);
  const bE = miraBubble(sEp, 0, 0, TAIL_X - MBX);
  gsap.set([bE.ell, bE.icon], { autoAlpha: 0 }); gsap.set(bE.g, { scale: 0 });
  k.show(sE, mid); k.hide(B.sc, mid);
  k.pop(bE.g, T.endBub, { origin: bE.origin, dur: 0.55, ease: 'popBig', rot: -4, pitch: 420 });
  hiss(T.endBub - 0.3, 1.6, 0.06);
  const rule = SR.words(sE, 'Say it back. Then ask.', 960, 540 + (MB.h / 2 + 36) * S0 + 124, TITLE, C.white, { align: 'center' });
  gsap.set(rule.groups, { scale: 0 });
  typeWords(rule.groups, T.rule, 0.16, { gain: 0.2 });
  SR.onTick(t => { if (t > T.endBub + 0.6 && t < T.collapse) bE.mv.setAttribute('transform', `translate(0,${Math.sin((t - T.endBub) * 1.6) * 4})`); });
  // everything folds into the yellow dot, which lands as the full stop of the title
  rule.groups.forEach((g, i) => k.unpop(g, T.collapse + i * FR, { origin: '50% 100%' }));
  tl.to(bE.g, { scale: 0, rotation: -20, duration: 0.4, ease: 'power3.in', transformOrigin: '50% 50%' }, T.collapse + 0.05);
  SR.sfx(T.collapse, 'whoosh', { dur: 0.5, rise: true, lo: 3000, hi: 300, gain: 0.45 });
  const s5 = el('g', {}, root); gsap.set(s5, { autoAlpha: 0 });
  const bw = anim(place(s5, 960, 540)); circle(bw, 0, 0, 1110, C.blue); gsap.set(bw, { scale: 0 });
  const stD = SR.style('display');
  const L1 = 'The rest of', L2 = 'her sentence', finR = 20;
  const bW = Math.max(SR.measure(L1, stD), SR.measure(L2, stD) + 14 + 2 * finR);
  const bx = Math.round((W - bW) / 2), y1 = 470, y2 = y1 + stD.lh;
  const eyeb = SR.words(s5, 'Their view first', bx + 6, y1 - 170, EYE, C.grey);
  const tw1 = SR.words(s5, L1, bx, y1, stD, C.white), tw2 = SR.words(s5, L2, bx, y2, stD, C.white);
  [...eyeb.groups, ...tw1.groups, ...tw2.groups].forEach(g => gsap.set(g, { scale: 0 }));
  const endH = SR.hero(s5, { r: 70, fill: C.yellow });
  gsap.set(endH.pos, { x: 960, y: 540 }); gsap.set(endH.size, { scale: 0 });
  k.show(s5, T.heroPop - 0.02);
  tl.fromTo(endH.size, { scale: 0 }, { scale: 1, duration: 0.45, ease: 'popBig', transformOrigin: '50% 50%' }, T.heroPop); SR.sfx(T.heroPop, 'pop', { pitch: 400, gain: 0.5 });
  tl.fromTo(bw, { scale: 0 }, { scale: 1, duration: 0.42, ease: 'power3.in', transformOrigin: '50% 50%' }, T.blueWipe); SR.sfx(T.blueWipe, 'whoosh', { dur: 0.42, lo: 200, hi: 4000, gain: 0.35 });
  k.hide(sE, T.blueWipe + 0.45);
  k.anticipate(endH, T.hop, 0.1);
  tl.to(endH.pos, { y: -200, duration: 0.32, ease: 'power2.in' }, T.hop); SR.sfx(T.hop, 'whoosh', { dur: 0.32, lo: 600, hi: 5000, gain: 0.3 });
  k.popWords(eyeb.groups, T.title - 0.1);
  k.popWords(tw1.groups, T.title, { stagger: 3 * FR, dur: 0.5 });
  k.popWords(tw2.groups, T.title + 0.25, { stagger: 3 * FR, dur: 0.5, sfx: false });
  const finX = tw2.endX + 14 + finR, finY = y2 - finR;
  tl.set(endH.pos, { x: finX }, T.hop + 0.4); tl.set(endH.size, { scale: finR / 70 }, T.hop + 0.4);
  tl.fromTo(endH.pos, { y: -120 }, { y: finY, duration: T.finalLand - T.hop - 0.62, ease: 'power2.in', immediateRender: false }, T.hop + 0.62);
  tl.to(endH.sq, { scaleX: 0.85, scaleY: 1.2, duration: 0.2 }, T.hop + 0.62);
  k.squash(endH, T.finalLand, 0.3);
  SR.sfx(T.finalLand, 'boing', { pitch: 330, dur: 0.5, gain: 0.45, pan: 0.3 }); SR.sfx(T.finalLand, 'sparkle', { gain: 0.22, pan: 0.3 });
  tl.to(tw2.groups[1], { keyframes: [{ y: 6, duration: 0.05 }, { y: 0, duration: 0.5, ease: 'elastic.out(1,0.3)' }] }, T.finalLand - 0.02);
  const sparks = [0, 1, 2].map(() => rect(s5, -4, -60, 8, 0, C.white, 4));
  sparks.forEach((sp, i) => sp.setAttribute('transform', `translate(${finX},${finY}) rotate(${[-60, 0, 60][i] - 30})`));
  SR.onTick(t => {
    const s = t - T.finalLand; if (s < 0) return;
    const e = SR.smooth(s / 0.18), r = SR.smooth((s - 0.18) / 0.22);
    sparks.forEach(sp => { sp.setAttribute('height', Math.max(0, 34 * e - 34 * r)); sp.setAttribute('y', -70 - 30 * r); });
    if (s > 0.9) endH.spin.setAttribute('transform', `rotate(${Math.sin((s - 0.9) * 2 * Math.PI * 0.5) * 12})`);
  });

  root.appendChild(heroL);
  /* ================= captions (real time, unaffected by the rewind) ================= */
  const capL = el('g', {}, root);
  const caps = SR.captions(capL, cues.captions.map(([t0, t1, text]) => ({ t0, t1, text })));
  realTick(t => caps.forEach(c => { const on = t >= c.t0 && t < c.t1; c.g.style.visibility = on ? 'visible' : 'hidden'; c.g.style.opacity = on ? 1 : 0; }));
};
