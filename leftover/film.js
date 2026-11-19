/* "The leftover": 75 s LMS refresher (Group Talent learning piece -> Caslon, rule 4).
 * Hero: one word-block, the leftover client name on page 9. It glows yellow in the hook,
 * cools into grey text, hides in plain sight, glows again only when the right search finds it,
 * and lands on the end card behind "old value".
 * The twelve pages are one set of objects that travel through every scene:
 * fan -> monitor -> page 1 -> grid -> page 9 -> search thumbnails -> fan -> sent.
 */
window.FILM = async function (SR, tl, root, T, cues) {
  const { C, W, H, FR, el, place, anim, rect, circle, path, stroke } = SR;
  const k = SR.kit(tl);
  const stB = SR.style('body'), stT = SR.style('title'), stL = SR.style('label'), stE = SR.style('eyebrow');

  /* ---------------- layers ---------------- */
  const bg = el('g', {}, root);
  rect(bg, 0, 0, W, H, C.blue);                            // desk / brand ground, under everything
  const drain = rect(bg, 0, 0, W, H, C.deep); gsap.set(drain, { autoAlpha: 0 });
  const samBack = el('g', {}, bg);
  const camG = el('g', {}, root);                          // pages camera, driven in closed form below
  const fg = el('g', {}, root);
  const wipes = el('g', {}, root);
  const capLayer = el('g', {}, root);

  /* ---------------- the twelve pages ---------------- */
  const PW = 600, PH = 850, BH = 22, STEP = 46, X0 = -250, X1 = 250;
  const specialsSpec = {
    0: [{ line: 2, x: -120, w: 150, key: 'p1a' }, { line: 3, x: -250, w: 90, key: 'p1b' }, { line: 4, x: 20, w: 170, key: 'p1c' }],
    8: [{ line: 8, x: -250, w: 150, key: 'hero' }],
    10: [{ line: 5, x: -60, w: 170, key: 'p11' }],
    11: [{ line: 3, x: -40, w: 100, key: 'calc' }]
  };
  const SP = {};
  const pages = [...Array(12)].map((_, i) => {
    const pg = anim(camG);
    rect(pg, -PW / 2, -PH / 2, PW, PH, C.deep, 6);
    const r = SR.rng(31 + i * 7);
    rect(pg, X0, -360 - 15, 230 + 80 * r(), 30, C.grey, 15);   // heading bar
    const sp = specialsSpec[i] || [];
    for (let ln = 0; ln < 15; ln++) {
      const y = -300 + ln * STEP;
      const s = sp.find(q => q.line === ln);
      const lineEnd = ln % 5 === 4 ? X0 + 180 + 120 * r() : X1;  // paragraph ends short
      let x = X0;
      const fill = (to) => { while (x < to - 30) { const w = Math.min(40 + 110 * r(), to - x); if (w > 24) rect(pg, x, y - BH / 2, w, BH, C.tint, BH / 2); x += w + 16; } };
      if (s) {
        fill(s.x - 16); x = s.x;
        const g = anim(place(pg, s.x + s.w / 2, y));
        const rr = rect(g, -s.w / 2, -BH / 2, s.w, BH, C.tint, BH / 2);
        SP[s.key] = { g, r: rr, lx: s.x + s.w / 2, ly: y, page: i };
        x = s.x + s.w + 16; fill(lineEnd);
      } else fill(lineEnd);
    }
    return pg;
  });
  const fanPos = i => ({ x: 960 + (i - 5.5) * 112, y: 600 + Math.pow(i - 5.5, 2) * 1.5, rotation: (i - 5.5) * 1.4, scale: 0.55 });
  const gridPos = i => ({ x: 440 + (i % 6) * 208, y: 420 + Math.floor(i / 6) * 280, rotation: 0, scale: 0.28 });
  const thumbPos = i => ({ x: 201 + i * 138, y: 430, rotation: 0, scale: 0.2 });
  const monPos = { x: 840, y: 525, rotation: 0, scale: 0.34 };
  const closePos = { x: 960, y: 170 + PH / 2 * 2.2, rotation: 0, scale: 2.2 };
  const f0 = fanPos(0);
  pages.forEach(p => gsap.set(p, { x: f0.x, y: f0.y, rotation: 0, scale: 0, transformOrigin: '50% 50%' }));
  const globalOf = (key, pos) => { const s = SP[key]; return { x: pos.x + pos.scale * s.lx, y: pos.y + pos.scale * s.ly }; };

  /* ---------------- camera on the pages (closed form) ---------------- */
  const ease3 = u => { u = SR.clamp(u, 0, 1); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
  const p9fan = (() => { const f = fanPos(8); return { x: f.x - 80, y: f.y }; })();
  const p9grid = gridPos(8), glideS = closePos.scale / p9grid.scale;
  SR.onTick(t => {
    let s = 1, fx = 960, fy = 540, tx = 960, ty = 540;    // scale s about focus f, focus lands at tx,ty
    if (t >= T.fan && t < T.toMonitor + 0.5) {
      const u = t < T.toMonitor ? 0.05 * SR.smooth((t - T.fan) / (T.toMonitor - T.fan)) : 0.05 * (1 - ease3((t - T.toMonitor) / 0.5));
      s = 1 + u; fx = tx = p9fan.x; fy = ty = p9fan.y;
    } else if (t >= T.glide && t < T.wipe + 0.25) {
      const e = ease3((t - T.glide) / 0.85);
      s = Math.pow(glideS, e); fx = p9grid.x; fy = p9grid.y; tx = SR.lerp(p9grid.x, closePos.x, e); ty = SR.lerp(p9grid.y, closePos.y, e);
    } else if (t >= T.callback && t < T.fold + 0.4) {
      const u = t < T.fold ? 0.045 * SR.smooth((t - T.callback) / (T.fold - T.callback)) : 0.045 * (1 - ease3((t - T.fold) / 0.4));
      s = 1 + u; fx = tx = p9fan.x; fy = ty = p9fan.y;
    }
    camG.setAttribute('transform', `translate(${tx - s * fx},${ty - s * fy}) scale(${s})`);
  });

  /* ================= HOOK 0-6.5: the fan, the glow, the title ================= */
  pages.forEach(p => tl.fromTo(p, { scale: 0 }, { scale: 0.55, duration: 0.4, ease: 'popBig' }, T.fan));
  SR.sfx(T.fan, 'pop', { pitch: 260, gain: 0.4 });
  SR.sfx(T.fan + 0.25, 'whoosh', { dur: 1.1, rise: false, lo: 1500, hi: 6000, gain: 0.3 });
  pages.forEach((p, i) => {
    const f = fanPos(i), at = T.fan + 0.3 + i * 0.07;
    tl.to(p, { x: f.x, y: f.y, rotation: f.rotation, duration: 0.55, ease: 'pop' }, at);
    SR.sfx(at, 'tick', { pitch: 700 + 40 * i, gain: 0.1, pan: -0.7 + 1.4 * i / 11 });
  });
  const hero = SP.hero;
  gsap.set(hero.g, { transformOrigin: '50% 50%' });
  tl.set(hero.r, { attr: { fill: C.yellow } }, T.glow);
  tl.fromTo(hero.g, { scale: 1 }, { keyframes: [{ scale: 1.7, duration: 0.12, ease: 'power2.out' }, { scale: 1, duration: 0.6, ease: 'elastic.out(1,0.35)' }] }, T.glow);
  SR.sfx(T.glow, 'ding', { pitch: 880, gain: 0.35 });
  tl.to(hero.g, { keyframes: [{ scale: 1.35, duration: 0.15, ease: 'power2.out' }, { scale: 1, duration: 0.5, ease: 'elastic.out(1,0.4)' }] }, T.pulse);
  SR.sfx(T.pulse, 'pop', { pitch: 900, gain: 0.25 });
  tl.to(hero.r, { attr: { fill: C.tint }, duration: 0.7, ease: 'power1.inOut' }, T.cool);
  tl.to(hero.g, { keyframes: [{ y: 4, scaleY: 0.85, duration: 0.25 }, { y: 0, scaleY: 1, duration: 0.5, ease: 'elastic.out(1,0.4)' }] }, T.cool + 0.4);
  SR.sfx(T.cool, 'whoosh', { dur: 0.8, rise: false, lo: 2500, hi: 400, gain: 0.25 });
  const title = SR.words(fg, 'The leftover', 960, 250, SR.style('display'), C.white, { align: 'center' });
  gsap.set(title.groups, { scale: 0 });
  k.popWords(title.groups, T.title, { stagger: 3 * FR, dur: 0.5 });
  k.outWords(title.groups, T.titleOut);

  /* ================= SAM 6.5-16.8: three things are different ================= */
  const samG = el('g', {}, samBack); gsap.set(samG, { autoAlpha: 0 });
  const sam = SR.character(samG, 330, 820, { shirt: C.tint, sleeve: C.deepBand, skin: SR.SKIN[1], hair: 'short', hairColor: SR.HAIR[1], collar: 'v' });
  gsap.set(sam.rise, { y: 360 });
  const desk = anim(samBack); rect(desk, -40, 820, W + 80, 300, C.deep); gsap.set(desk, { y: 300 });
  const monP = place(samBack, 840, 820), mon = anim(monP);
  rect(mon, -260, -480, 520, 370, C.deep, 14); rect(mon, -240, -460, 480, 330, C.blue, 4);
  rect(mon, -20, -112, 40, 112, C.deep); rect(mon, -110, -16, 220, 20, C.deep, 8);
  gsap.set(mon, { scale: 0, transformOrigin: '50% 100%' });
  const samLabel = SR.words(fg, 'Sam, tender team', 330, 405, stL, C.white, { align: 'center' });
  gsap.set(samLabel.groups, { scale: 0 });

  tl.to(desk, { y: 0, duration: 0.5, ease: 'power3.out' }, T.desk); SR.sfx(T.desk, 'whoosh', { dur: 0.4, gain: 0.25, lo: 200, hi: 1500 });
  k.pop(mon, T.monitor, { origin: '50% 100%', dur: 0.5, ease: 'popBig', pitch: 300 });
  pages.forEach((p, i) => {
    const at = T.toMonitor + (11 - i) * 0.05;
    tl.to(p, { x: monPos.x, y: monPos.y, rotation: 0, scale: monPos.scale, duration: 0.5, ease: 'power3.inOut' }, at);
    if (i) tl.set(p, { autoAlpha: 0 }, at + 0.5);
  });
  SR.sfx(T.toMonitor, 'whoosh', { dur: 0.8, rise: true, lo: 400, hi: 3000, gain: 0.3 });
  k.show(samG, T.samRise); k.hide(samG, T.samOut + 0.35);
  tl.fromTo(sam.rise, { y: 360 }, { y: 0, duration: 0.55, ease: 'popBig' }, T.samRise); SR.sfx(T.samRise, 'boing', { pitch: 260, gain: 0.45, pan: -0.4 });
  k.popWords(samLabel.groups, T.samLabel);
  SR.charLife(sam, { seed: 0.4, side: 1, from: T.samRise - 0.1, to: T.zoom1 + 0.5, listen: [[T.line1, T.line3 + 1.2]] });

  // sticky note: three changes, old value -> new value
  const rows = [['Client', 'Havenlink', 'Portmar'], ['Crane', '450 t', '750 t'], ['Start', '14 April 2025', '3 March 2027']];
  const labW = Math.max(...rows.map(r => SR.measure(r[0], stL))) + 34;
  const rowW = rows.map(r => labW + SR.measure(r[1], stB) + 24 + 54 + 24 + SR.measure(r[2], stB));
  const cardW = Math.ceil(Math.max(...rowW) + 88), cardH = 320;
  const cardCX = Math.min(1810 - cardW / 2, 1000 + cardW / 2), cardCY = 380;
  const cardP = place(fg, cardCX, cardCY, 'rotate(-2)'), card = anim(cardP);
  rect(card, -cardW / 2, -cardH / 2, cardW, cardH, C.white, 6);
  const rowG = rows.map((r, i) => {
    const y = -cardH / 2 + 92 + i * 92, x = -cardW / 2 + 44;
    const a = SR.words(card, r[0], x, y, stL, C.grey431);
    const b = SR.words(card, r[1], x + labW, y, stB, C.grey431);
    const ax = b.endX + 24, ar = anim(place(card, ax, y - 14));
    stroke(ar, 'M0,0 H46 M30,-14 L46,0 L30,14', C.grey431, 6);
    const c = SR.words(card, r[2], ax + 54 + 24, y, stB, C.deep);
    const g = [...a.groups, ...b.groups, ar, ...c.groups];
    gsap.set(g, { scale: 0 });
    return g;
  });
  gsap.set(card, { autoAlpha: 0 });
  k.show(card, T.sticky);
  tl.fromTo(card, { scale: 1.5, y: -60, rotation: 6, transformOrigin: '50% 50%' }, { scale: 1, y: 0, rotation: 0, duration: 0.2, ease: 'power3.in' }, T.sticky);
  tl.to(card, { keyframes: [{ scaleX: 1.04, scaleY: 0.95, duration: 0.05 }, { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'elastic.out(1,0.35)' }] }, T.sticky + 0.2);
  SR.sfx(T.sticky + 0.2, 'thunk', { gain: 0.55, pan: 0.4 });
  [T.line1, T.line2, T.line3].forEach((at, i) => k.popWords(rowG[i], at, { stagger: 2 * FR, sfx: 'tick' }));

  // out: Sam sinks, desk drops, note and monitor fold, page 1 comes forward
  k.unpop(card, T.samOut, { origin: '50% 50%' });
  k.outWords(samLabel.groups, T.samOut);
  tl.to(sam.rise, { y: 380, duration: 0.3, ease: 'back.in(1.6)' }, T.samOut);
  tl.to(desk, { y: 300, duration: 0.35, ease: 'power3.in' }, T.samOut + 0.05);
  tl.to(mon, { scale: 0, duration: 0.3, ease: 'back.in(1.6)' }, T.zoom1);
  tl.to(pages[0], { x: closePos.x, y: closePos.y, scale: closePos.scale, duration: 0.55, ease: 'power3.inOut' }, T.zoom1);
  SR.sfx(T.zoom1, 'whoosh', { dur: 0.55, rise: true, lo: 300, hi: 5000, gain: 0.45 });

  /* ---------------- close-up builder: a page at 2.2x with real sentences ---------------- */
  const LX = 380, LY0 = 400, LH = 80;
  function closeup(eyebrow) {
    const g = el('g', {}, fg); gsap.set(g, { autoAlpha: 0 });
    const mv = anim(g);
    rect(mv, -10, 0, W + 20, H, C.blue);
    rect(mv, 300, 170, 1320, 1000, C.deep, 12);
    const eb = SR.words(mv, eyebrow, LX, 270, stE, C.tint);
    return { g, mv, eb, filler(fromY) { for (let y = fromY, i = 0; y < 1100; y += STEP * 2.2 * 0.62, i++) { const r = SR.rng(90 + i); let x = LX; while (x < 1520) { const w = Math.min(90 + 200 * r(), 1540 - x); rect(mv, x, y - 12, w, 24, C.deepBand, 12); x += w + 34; } } } };
  }
  // a line of text where some parts are tokens that can flip to a new value; later parts reflow
  function partLine(parent, parts, y) {
    let x = LX; const out = [];
    parts.forEach(p => {
      const s = (typeof p === 'string' ? p : p.old).replace(/ /g, '\u00A0');
      const w = SR.measure(s, stB);
      const mover = anim(place(parent, x, y));
      if (typeof p === 'string') { SR.textEl(mover, s, 0, 0, stB, C.grey); out.push({ mover }); }
      else {
        const nw = SR.measure(p.new, stB);
        const flip = anim(mover);
        const chip = rect(flip, -10, -44, nw + 20, 62, C.white, 8);
        const tOld = SR.textEl(flip, p.old, 0, 0, stB, C.grey);
        const tNew = SR.textEl(flip, p.new, 0, 0, stB, C.deep);
        gsap.set([chip, tNew], { autoAlpha: 0 });
        out.push({ mover, flip, chip, tOld, tNew, delta: nw - w, tok: true });
      }
      x += w;
    });
    return out;
  }

  /* ================= PAGE 1 16.8-24.4: three fixes, then twelve pages ================= */
  const c1 = closeup('Page 1');
  const l1 = [
    partLine(c1.mv, ['This offer is made to ', { old: 'Havenlink', new: 'Portmar' }, ' for the hire'], LY0),
    partLine(c1.mv, ['of one ', { old: '450 t', new: '750 t' }, ' crawler crane, with work'], LY0 + LH),
    partLine(c1.mv, ['starting on ', { old: '14 April 2025', new: '3 March 2027' }, '.'], LY0 + 2 * LH)
  ];
  c1.filler(LY0 + 3 * LH + 40);
  const ticks1 = [0, 1, 2].map(i => { const a = anim(place(c1.mv, 1430 + i * 52, 258)); stroke(a, 'M-16,0 L-4,12 L18,-14', C.white, 8); gsap.set(a, { scale: 0 }); return a; });
  const done1 = SR.words(c1.mv, 'done', 1430 + 3 * 52 - 10, 270, stE, C.white); gsap.set(done1.groups, { scale: 0 });
  tl.fromTo(c1.g, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: 'none' }, T.close1);
  tl.set(pages[0], { autoAlpha: 0 }, T.close1 + 0.25);
  [T.flip1, T.flip2, T.flip3].forEach((at, i) => {
    const line = l1[i], tk = line.find(p => p.tok);
    gsap.set(tk.flip, { transformOrigin: '50% 50%' });
    tl.to(tk.flip, { scaleY: 0, duration: 0.1, ease: 'power2.in' }, at);
    tl.set([tk.chip, tk.tNew], { autoAlpha: 1 }, at + 0.1); tl.set(tk.tOld, { autoAlpha: 0 }, at + 0.1);
    tl.to(tk.flip, { scaleY: 1, duration: 0.35, ease: 'popBig' }, at + 0.1);
    line.slice(line.indexOf(tk) + 1).forEach(p => tl.to(p.mover, { x: tk.delta, duration: 0.3, ease: 'pop' }, at + 0.12));
    SR.sfx(at, 'tick', { pitch: 1700, gain: 0.35 }); SR.sfx(at + 0.1, 'pop', { pitch: 600 + 120 * i, gain: 0.3 });
    k.pop(ticks1[i], at + 0.25, { dur: 0.35, ease: 'popBig', sfx: false });
  });
  k.popWords(done1.groups, T.done, { sfx: false }); SR.sfx(T.done, 'ding', { pitch: 1568, gain: 0.22 });

  // pull back: page 1 becomes one of twelve
  tl.set(pages[0], { autoAlpha: 1 }, T.pull);
  tl.to(c1.g, { autoAlpha: 0, duration: 0.2, ease: 'none' }, T.pull);
  const g0 = gridPos(0);
  tl.to(pages[0], { x: g0.x, y: g0.y, scale: g0.scale, duration: 0.6, ease: 'power3.inOut' }, T.pull);
  SR.sfx(T.pull, 'whoosh', { dur: 0.6, rise: false, lo: 5000, hi: 400, gain: 0.35 });
  pages.forEach((p, i) => {
    if (!i) return; const g = gridPos(i), at = T.grid + i * 0.05;
    tl.set(p, { autoAlpha: 1, x: g.x, y: g.y, rotation: 0, scale: 0 }, at - 0.01);
    tl.to(p, { scale: g.scale, duration: 0.45, ease: 'popBig' }, at);
    SR.sfx(at, 'pop', { pitch: 500 + 40 * i, gain: 0.15, pan: -0.6 + 1.2 * (i % 6) / 5 });
  });
  const lab12 = SR.words(fg, '12 pages', 960, 210, stT, C.white, { align: 'center' }); gsap.set(lab12.groups, { scale: 0 });
  k.popWords(lab12.groups, T.label12);
  k.outWords(lab12.groups, T.glide - 0.25);
  SR.sfx(T.glide, 'whoosh', { dur: 0.85, rise: true, lo: 200, hi: 5000, gain: 0.45 });

  /* ================= PAGE 9 / 11 / CALC 25.2-35.3: the leftover reads as correct ================= */
  function sweepLines(c, lines, at, per = 0.62) {
    lines.forEach((s, i) => {
      const w = SR.measure(s, stB);
      const bar = rect(c.mv, LX, LY0 + i * LH + 16, 0, 7, C.tint, 3);
      tl.fromTo(bar, { attr: { width: 0 } }, { attr: { width: w }, duration: per, ease: 'none', immediateRender: false }, at + i * per);
      tl.set(bar, { attr: { width: 0 } }, at + (i + 1) * per);
      SR.sfx(at + i * per, 'whoosh', { dur: per, rise: false, lo: 1500, hi: 5000, gain: 0.12, pan: -0.3 + 0.3 * i });
    });
  }
  const c9 = closeup('Page 9: terms');
  const L9 = ['Every lift under this offer is invoiced', 'to Havenlink at the rates in section 6,', 'payable 30 days from the invoice date.'];
  L9.forEach((s, i) => SR.textEl(c9.mv, s, LX, LY0 + i * LH, stB, C.grey));
  c9.filler(LY0 + 3 * LH + 40);
  tl.fromTo(c9.g, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: 'none' }, T.close9);
  sweepLines(c9, L9, T.sweep9, 0.75);

  const c11 = closeup('Page 11: validity');
  const L11 = ['This offer is valid for work starting', 'on 14 April 2025, for 90 days.'];
  L11.forEach((s, i) => SR.textEl(c11.mv, s, LX, LY0 + i * LH, stB, C.grey));
  c11.filler(LY0 + 2 * LH + 40);
  const cc = closeup('Calculation summary');
  const LC = ['Crane class: 450 t crawler crane', 'Mobilisation: 2 days, by road'];
  LC.forEach((s, i) => SR.textEl(cc.mv, s, LX, LY0 + i * LH, stB, C.grey));
  cc.filler(LY0 + 2 * LH + 40);
  const slide = (out, inn, at) => {
    k.show(inn.g, at);
    tl.fromTo(inn.mv, { x: W + 40 }, { x: 0, duration: 0.45, ease: 'power3.inOut' }, at);
    tl.to(out.mv, { x: -W - 40, duration: 0.45, ease: 'power3.inOut' }, at);
    k.hide(out.g, at + 0.46);
    SR.sfx(at, 'whoosh', { dur: 0.45, lo: 400, hi: 4000, gain: 0.3 });
  };
  slide(c9, c11, T.p11); sweepLines(c11, L11, T.sweep11, 0.55);
  slide(c11, cc, T.calc); sweepLines(cc, LC, T.sweepCalc, 0.55);

  /* ================= SEARCH 35.3-60: the wrong search, then the right one ================= */
  const mid = k.blockWipe(wipes, T.wipe, { dir: 'right', color: C.deep, dur: 0.5 });
  k.hide(cc.g, mid);
  pages.forEach((p, i) => { const q = thumbPos(i); tl.set(p, { autoAlpha: 1, x: q.x, y: q.y, rotation: 0, scale: q.scale }, mid); });
  const ui = el('g', {}, fg); gsap.set(ui, { autoAlpha: 0 }); k.show(ui, mid);
  const thumbLabels = pages.map((_, i) => SR.words(ui, i === 11 ? 'Calc' : String(i + 1), thumbPos(i).x, 568, stL, C.grey, { align: 'center' }));
  const boxG = anim(place(ui, 960, 200));
  rect(boxG, -500, -70, 1000, 140, C.white);
  circle(boxG, -424, -8, 26, 'none').setAttribute('stroke', C.deep);
  boxG.lastChild.setAttribute('stroke-width', 8);
  stroke(boxG, 'M-405,11 L-382,34', C.deep, 10);
  const TX = -360, typed = SR.textEl(boxG, '', TX, 28, stT, C.deep);
  const cursor = rect(boxG, TX, -40, 6, 84, C.deep, 3);
  gsap.set(boxG, { scale: 0 });
  k.pop(boxG, T.box, { dur: 0.45, ease: 'popBig', pitch: 420 });

  // typing script, closed form
  const DT = 0.075, DB = 0.028;
  const ev = [
    { t: T.type1, s: 'Portmar' }, { t: T.rewind1, s: 'Portmar', del: true },
    { t: T.type2, s: 'Havenlink' }, { t: T.rewind2, s: 'Havenlink', del: true },
    { t: T.type3, s: '450 t' }, { t: T.rewind3, s: '450 t', del: true },
    { t: T.type4, s: '14 April 2025' }];
  const mcache = {};
  const mw = s => (mcache[s] ??= s ? SR.measure(s, stT) : 0);
  const strAt = t => {
    let s = '', busy = false;
    for (const e of ev) {
      if (t < e.t) break;
      const n = Math.floor((t - e.t) / (e.del ? DB : DT)) + 1;
      s = e.del ? e.s.slice(0, Math.max(0, e.s.length - n)) : e.s.slice(0, Math.min(e.s.length, n));
      busy = e.del ? n <= e.s.length : n <= e.s.length;
    }
    return { s, busy };
  };
  SR.onTick(t => {
    const { s, busy } = strAt(t);
    typed.textContent = s;
    cursor.setAttribute('x', TX + mw(s) + (s ? 6 : 0));
    cursor.setAttribute('visibility', busy || Math.floor((t - T.box) * 2) % 2 === 0 ? 'visible' : 'hidden');
  });
  const rk = SR.rng(5);
  ev.forEach(e => { if (!e.del) [...e.s].forEach((_, i) => SR.sfx(e.t + i * DT, 'tick', { pitch: 1800 + 500 * rk(), gain: 0.16 })); });
  SR.sfx(T.rewind1, 'zip', { dur: 0.3, gain: 0.35 });
  SR.sfx(T.rewind2, 'zip', { dur: 0.22, gain: 0.2 }); SR.sfx(T.rewind3, 'zip', { dur: 0.22, gain: 0.2 });
  for (let t = T.freeze + 0.5; t < T.unfreeze; t += 0.5) SR.sfx(t, 'tick', { pitch: 3000, gain: 0.07 });

  // freeze: colour drains from everything but the box
  tl.to(drain, { autoAlpha: 1, duration: 0.3, ease: 'none' }, T.freeze);
  tl.to([camG, ...thumbLabels.flatMap(l => l.groups)], { opacity: 0.3, duration: 0.3, ease: 'none' }, T.freeze);
  const q = SR.words(ui, 'What does Sam search for?', 960, 740, stT, C.white, { align: 'center' }); gsap.set(q.groups, { scale: 0 });
  k.popWords(q.groups, T.question, { sfx: false });
  k.outWords(q.groups, T.unfreeze - 0.1);
  tl.to(drain, { autoAlpha: 0, duration: 0.3, ease: 'none' }, T.unfreeze);
  tl.to([camG, ...thumbLabels.flatMap(l => l.groups)], { opacity: 1, duration: 0.3, ease: 'none' }, T.unfreeze);

  // wrong search: the new name only finds page 1
  const tp0 = thumbPos(0);
  ['p1a', 'p1b', 'p1c'].forEach((key, i) => {
    const at = T.hits1 + i * 0.15; gsap.set(SP[key].g, { transformOrigin: '50% 50%' });
    tl.set(SP[key].r, { attr: { fill: C.white } }, at);
    tl.fromTo(SP[key].g, { scale: 1 }, { keyframes: [{ scale: 1.8, duration: 0.08 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1,0.4)' }] }, at);
    SR.sfx(at, 'ding', { pitch: 2093 + i * 260, gain: 0.2 });
    tl.set(SP[key].r, { attr: { fill: C.tint } }, T.rewind1 + 0.1);
  });
  const resY = [690, 750, 810];
  const res1 = SR.words(ui, 'Portmar: 3 hits, all on page 1', 960, resY[0], stB, C.white, { align: 'center' }); gsap.set(res1.groups, { scale: 0 });
  k.popWords(res1.groups, T.res1);
  tl.to(pages[0], { keyframes: [{ scale: tp0.scale * 1.25, y: tp0.y - 20, duration: 0.18, ease: 'power2.out' }, { scale: tp0.scale, y: tp0.y, duration: 0.5, ease: 'elastic.out(1,0.35)' }] }, T.beat);
  SR.sfx(T.beat, 'boing', { pitch: 300, gain: 0.3, pan: -0.8 });
  k.outWords(res1.groups, T.rewind1);

  // right search: each old value glows, pops out of its line, flips to the new value, goes back
  const hits = [
    { key: 'hero', at: T.hit2, old: 'Havenlink', neu: 'Portmar', res: 'Havenlink: page 9', pitch: 1046.5 },
    { key: 'calc', at: T.hit3, old: '450 t', neu: '750 t', res: '450 t: calculation summary', pitch: 1318.5 },
    { key: 'p11', at: T.hit4, old: '14 April 2025', neu: '3 March 2027', res: '14 April 2025: page 11', pitch: 1568 }];
  hits.forEach((h, i) => {
    const s = SP[h.key], g = globalOf(h.key, thumbPos(s.page));
    const wO = SR.measure(h.old, stB), wN = SR.measure(h.neu, stB), cw = Math.max(wO, wN) + 48;
    const cx = SR.clamp(g.x, 96 + cw / 2, 1824 - cw / 2), cy = g.y - 6;
    const chipP = anim(ui), chip = anim(chipP);
    const ry = rect(chip, -(wO + 48) / 2, -42, wO + 48, 76, C.yellow, 10);
    const rw = rect(chip, -(wN + 48) / 2, -42, wN + 48, 76, C.white, 10);
    const to = SR.textEl(chip, h.old, 0, 14, stB, C.deep, 'middle'), tn = SR.textEl(chip, h.neu, 0, 14, stB, C.deep, 'middle');
    gsap.set([rw, tn], { autoAlpha: 0 }); gsap.set(chipP, { autoAlpha: 0, x: g.x, y: g.y, scale: 0.1 });
    gsap.set(chip, { transformOrigin: '50% 50%' }); gsap.set(s.g, { transformOrigin: '50% 50%' });
    tl.set(s.r, { attr: { fill: C.yellow } }, h.at);
    tl.fromTo(s.g, { scale: 1 }, { keyframes: [{ scale: 2, duration: 0.1 }, { scale: 1, duration: 0.3, ease: 'elastic.out(1,0.4)' }] }, h.at);
    SR.sfx(h.at, 'ding', { pitch: h.pitch, gain: 0.5 });
    tl.set(chipP, { autoAlpha: 1 }, h.at + 0.15);
    tl.fromTo(chipP, { x: g.x, y: g.y, scale: 0.1 }, { x: cx, y: cy, scale: 1, duration: 0.45, ease: 'popBig', immediateRender: false }, h.at + 0.15);
    SR.sfx(h.at + 0.15, 'pop', { pitch: 700 + 150 * i, gain: 0.35 });
    tl.to(chip, { scaleY: 0, duration: 0.1, ease: 'power2.in' }, h.at + 0.9);
    tl.set([rw, tn], { autoAlpha: 1 }, h.at + 1.0); tl.set([ry, to], { autoAlpha: 0 }, h.at + 1.0);
    tl.to(chip, { scaleY: 1, duration: 0.35, ease: 'popBig' }, h.at + 1.0);
    SR.sfx(h.at + 1.0, 'tick', { pitch: 1400, gain: 0.4 });
    tl.to(chipP, { x: g.x, y: g.y, scale: 0.1, duration: 0.32, ease: 'power3.in' }, h.at + 1.7);
    tl.set(chipP, { autoAlpha: 0 }, h.at + 2.02);
    tl.set(s.r, { attr: { fill: C.tint } }, h.at + 2.02);
    tl.fromTo(s.g, { scaleY: 1 }, { keyframes: [{ scaleY: 0.5, duration: 0.05 }, { scaleY: 1, duration: 0.35, ease: 'elastic.out(1,0.4)' }] }, h.at + 2.02);
    SR.sfx(h.at + 2.02, 'pop', { pitch: 1100, gain: 0.25 });
    const r = SR.words(ui, h.res, 960, resY[i], stB, C.white, { align: 'center' }); gsap.set(r.groups, { scale: 0 });
    k.popWords(r.groups, h.at + 0.35, { sfx: false });
    k.outWords(r.groups, T.boxOut + 0.1 + 0.1 * i);
  });

  /* ================= CALLBACK 60-68: same frame as the start, nothing glows ================= */
  tl.to(boxG, { scale: 0, duration: 0.25, ease: 'back.in(2)' }, T.boxOut + 0.3);
  thumbLabels.forEach((l, i) => k.outWords(l.groups, T.boxOut + 0.3 + i * FR));
  pages.forEach((p, i) => {
    const f = fanPos(i), at = T.toFan + i * 0.06;
    tl.to(p, { x: f.x, y: f.y, rotation: f.rotation, scale: f.scale, duration: 0.8, ease: 'power3.inOut' }, at);
  });
  SR.sfx(T.toFan, 'whoosh', { dur: 1.4, rise: false, lo: 600, hi: 3000, gain: 0.3 });
  k.hide(ui, T.toFan + 1.2);
  // fold shut and send
  pages.forEach((p, i) => tl.to(p, { x: 960, y: 600, rotation: 0, duration: 0.45, ease: 'power3.inOut' }, T.fold + (11 - i) * 0.03));
  SR.sfx(T.fold, 'whoosh', { dur: 0.6, rise: false, lo: 800, hi: 4000, gain: 0.35 });
  SR.sfx(T.fold + 0.5, 'thunk', { gain: 0.25 });
  pages.forEach(p => tl.to(p, { keyframes: [{ x: 900, duration: 0.18, ease: 'power2.out' }, { x: 2500, rotation: 8, duration: 0.42, ease: 'power3.in' }] }, T.send));
  SR.sfx(T.send + 0.1, 'whoosh', { dur: 0.5, rise: true, lo: 300, hi: 7000, gain: 0.5, pan: 0.5 });

  /* ================= END CARD 68.2-75 ================= */
  const midE = k.blockWipe(wipes, T.toEnd, { dir: 'right', color: C.deep, dur: 0.5 });
  const end = el('g', {}, fg); gsap.set(end, { autoAlpha: 0 }); k.show(end, midE);
  rect(end, 0, 0, W, H, C.deep);
  const EX = 200;
  const head = SR.words(end, 'Before you send', EX, 330, stT, C.tint);
  const i1 = SR.words(end, 'List what changed since this file was made.', EX, 490, stT, C.white);
  const a2 = 'Search for the', b2 = 'old value', c2 = 'of each change.';
  const sp = SR.measure('a b', stT) - SR.measure('ab', stT);
  const wa = SR.measure(a2, stT), wb = SR.measure(b2, stT);
  const chipE = anim(place(end, EX + wa + sp + wb / 2, 630 + 20));
  rect(chipE, -wb / 2 - 12, -94, wb + 24, 112, C.yellow, 12);
  gsap.set(chipE, { scale: 0, transformOrigin: '50% 100%' });
  const i2a = SR.words(end, a2, EX, 630, stT, C.white);
  const i2b = SR.words(end, b2, EX + wa + sp, 630, stT, C.white);
  const i2c = SR.words(end, c2, EX + wa + sp + wb + sp, 630, stT, C.white);
  const all = [...head.groups, ...i1.groups, ...i2a.groups, ...i2b.groups, ...i2c.groups];
  gsap.set(all, { scale: 0 });
  k.popWords(head.groups, T.head);
  k.popWords(i1.groups, T.item1);
  k.popWords([...i2a.groups, ...i2b.groups, ...i2c.groups], T.item2);
  // the hero lands behind "old value": drop with stretch, squash on contact, text turns blue-deep
  tl.fromTo(chipE, { scale: 1, y: -700, scaleX: 0.8, scaleY: 1.25 }, { y: 0, scaleX: 0.85, scaleY: 1.2, duration: 0.32, ease: 'power2.in', immediateRender: false }, T.chip - 0.32);
  tl.set(chipE, { scale: 1 }, T.chip - 0.33);
  tl.to(chipE, { keyframes: [{ scaleX: 1.12, scaleY: 0.8, duration: 0.06 }, { scaleX: 1, scaleY: 1, duration: 0.6, ease: 'elastic.out(1.1,0.3)' }] }, T.chip);
  i2b.groups.forEach(g => tl.set(g.firstChild, { attr: { fill: C.deep } }, T.chip));
  i2b.groups.forEach(g => tl.to(g, { keyframes: [{ y: 6, duration: 0.05 }, { y: 0, duration: 0.5, ease: 'elastic.out(1,0.3)' }] }, T.chip));
  SR.sfx(T.chip - 0.32, 'whoosh', { dur: 0.32, rise: true, lo: 600, hi: 5000, gain: 0.35 });
  SR.sfx(T.chip, 'boing', { pitch: 330, gain: 0.55 }); SR.sfx(T.chip, 'sparkle', { gain: 0.25 });
  SR.onTick(t => { if (t > T.chip + 0.9) { const s = 1 + 0.025 * Math.sin((t - T.chip - 0.9) * Math.PI); chipE.firstChild.setAttribute('transform', `scale(${s},1)`); } });

  /* ---------------- captions for every spoken line ---------------- */
  const caps = SR.captions(capLayer, cues.captions.map(([t0, t1, text]) => ({ t0, t1, text })));
  caps.forEach(c => { k.show(c.g, c.t0); k.hide(c.g, c.t1); });
};
