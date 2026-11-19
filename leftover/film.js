/* "The leftover" v2: 75 s LMS refresher (Group Talent learning piece -> Caslon, rule 4).
 * Hero: the leftover word-block. It is a real word in a real sentence on page 9 (first frame),
 * glows yellow, cools into grey text, shrinks into a bar among bars, hides through the film,
 * glows again only when the old value is searched, flips to the new value, and finally
 * flies back in to land behind "old value" on the end card.
 * Twelve page objects travel through every scene. Close-ups are the same page objects at 2.2x:
 * the bars of the first lines resolve into the words they stand for, so every zoom is one continuous move.
 */
window.FILM = async function (SR, tl, root, T, cues) {
  const { C, W, H, FR, el, place, anim, rect, circle, path, stroke } = SR;
  const k = SR.kit(tl);
  const stT = SR.style('title'), stB = SR.style('body'), stL = SR.style('label'), stE = SR.style('eyebrow'), stC = SR.style('caption');
  const nb = s => s.replace(/ /g, ' ');

  /* ---------------- layers ---------------- */
  const bg = el('g', {}, root);
  rect(bg, 0, 0, W, H, C.blue);
  const drain = rect(bg, 0, 0, W, H, C.deep); gsap.set(drain, { autoAlpha: 0 });
  const camG = el('g', {}, root);                      // camera, closed form (see CAM below)
  const samScene = el('g', {}, camG);                  // Sam's desk sits inside the camera so the push into the monitor is real
  const pageLayer = el('g', {}, camG);
  const samFront = el('g', {}, camG);                  // sticky note + label, above the pages
  const fg = el('g', {}, root);
  const capLayer = el('g', {}, root);

  /* ---------------- page geometry ---------------- */
  // page-local: 600 x 850 centred. Close-up: scale 2.2, centre (960, 1105) -> page top at y 170.
  const CS = 2.2, CC = { x: 960, y: 170 + 425 * CS };
  const lineY = ln => CC.y + CS * (-300 + 46 * ln);       // close-up y of a text line centre
  const HEADY = CC.y + CS * -375;
  const TX0 = 410, TX1 = 1510;                            // text column at close-up
  const BASE = 24;                                        // baseline below the bar centre
  const SPACE = SR.measure('a b', stT) - SR.measure('ab', stT), GAP = 16;
  const Tk = (o, n) => ({ old: o, neu: n });
  const SPEC = {
    0: { eb: 'Page 1', lines: [['Offer made to', Tk('Havenlink', 'Portmar')], ['for one', Tk('450 t', '750 t'), 'crawler crane,'], ['starting', Tk('14 April 2025', '3 March 2027')]] },
    8: { eb: 'Page 9: terms', lines: [['Every lift is invoiced'], ['to', Tk('Havenlink', 'Portmar'), 'at the'], ['rates in section 6.']] },
    10: { eb: 'Page 11: validity', lines: [['This offer is valid for'], ['work from', Tk('14 April 2025', '3 March 2027')], ['and 90 days after.']] },
    11: { eb: 'Page 12: calculation summary', lines: [['Crane class:', Tk('450 t', '750 t')], ['Mobilisation: 2 days'], ['Transport: by road']] }
  };
  const PAGES = [], TOK = {};
  for (let i = 0; i < 12; i++) {
    const pg = anim(pageLayer);
    rect(pg, -300, -820, 600, 1640, 'none');             // symmetric bbox so GSAP's 50% 50% origin is the page centre
    rect(pg, -300, -425, 600, 850, C.deep, 6);
    const r = SR.rng(31 + i * 7);
    // close-up coordinates, scaled into page space
    const cz = el('g', { transform: `scale(${1 / CS}) translate(${-CC.x},${-CC.y})` }, pg);
    const bars = el('g', {}, cz), rest = el('g', {}, pg);
    const spec = SPEC[i];
    const nLines = spec ? spec.lines.length : 0;
    const ebW = spec ? SR.measure(spec.eb, stE) : (230 + 80 * r()) * CS;
    rect(bars, TX0, HEADY - 15 * CS, ebW, 30 * CS * 0.7, C.grey, 15 * CS * 0.7);
    // random bars for every line not carried by text
    for (let ln = nLines; ln < 15; ln++) {
      const y = -300 + ln * 46, end = ln % 5 === 4 ? -70 + 120 * r() : 250;
      let x = -250;
      while (x < end - 30) { const w = Math.min(40 + 110 * r(), end - x); if (w > 24) rect(rest, x, y - 11, w, 22, C.tint, 11); x += w + 16; }
    }
    const P = { pg, bars, ov: null, toks: [], label: null, i };
    if (spec) {
      const ov = el('g', {}, cz); gsap.set(ov, { autoAlpha: 0 }); P.ov = ov;
      SR.textEl(ov, spec.eb, TX0, HEADY + 12, stE, C.tint);
      spec.lines.forEach((parts, ln) => {
        const yc = lineY(ln), yb = yc + BASE; let x = TX0; const movers = [];
        parts.forEach((p, pi) => {
          if (typeof p === 'string') {
            p.split(' ').forEach(w => {
              const ww = SR.measure(w, stT);
              const m = anim(place(ov, x, yb)); SR.textEl(m, w, 0, 0, stT, C.grey);
              rect(bars, x, yc - 24, ww, 48, C.tint, 24);
              movers.push(m); x += ww + SPACE;
            });
          } else {
            x += GAP;
            const wO = SR.measure(p.old, stT), wN = SR.measure(p.neu, stT);
            const m = anim(place(ov, x, yb)), flip = anim(place(m, 0, -23));
            const chipY = rect(flip, -14, -37, wO + 28, 74, C.yellow, 12);
            const chipW = rect(flip, -14, -37, wN + 28, 74, C.white, 12);
            const tOld = SR.textEl(flip, nb(p.old), 0, 23, stT, C.grey), tNew = SR.textEl(flip, nb(p.neu), 0, 23, stT, C.deep);
            gsap.set([chipY, chipW, tNew], { autoAlpha: 0 }); gsap.set(flip, { transformOrigin: '50% 50%' });
            const bar = rect(bars, x - 6, yc - 37, wO + 12, 74, C.tint, 26);
            const tok = { m, flip, chipY, chipW, tOld, tNew, bar, wO, wN, x, yc, page: i, followers: [], idx: movers.length };
            P.toks.push(tok); movers.push(m); x += wO + GAP + SPACE;
            tok.lineMovers = movers;
          }
        });
        P.toks.filter(t => t.lineMovers === movers).forEach(t => { t.followers = movers.slice(t.idx + 1); });
        if (x - SPACE > TX1 + 60) console.warn('line too wide', i, ln, x);
      });
    }
    // page number label for the strip and grid (only shown there)
    const lab = el('g', { transform: `translate(0,${425 + 36 / 0.28}) scale(${1 / 0.28})` }, pg);
    SR.textEl(lab, String(i + 1), 0, 0, stL, C.grey, 'middle');
    gsap.set(lab, { autoAlpha: 0 }); P.label = lab;
    PAGES.push(P);
  }
  SPEC[0].toks = PAGES[0].toks; // page 1 tokens: client, crane, start
  TOK.hero = PAGES[8].toks[0]; TOK.calc = PAGES[11].toks[0]; TOK.p11 = PAGES[10].toks[0];
  const pages = PAGES.map(p => p.pg);
  pageLayer.appendChild(pages[8]);                   // page 9 on top: the opening close-up sits inside the fan

  const fanPos = i => ({ x: 960 + (i - 5.5) * 112, y: 600 + Math.pow(i - 5.5, 2) * 1.5, rotation: (i - 8) * 1.4, scale: 0.55 });
  const gridPos = i => ({ x: 440 + (i % 6) * 208, y: 420 + Math.floor(i / 6) * 280, rotation: 0, scale: 0.28 });
  const monPos = { x: 840, y: 525, rotation: 0, scale: 0.34 };
  const closePos = { x: CC.x, y: CC.y, rotation: 0, scale: CS };
  pages.forEach(p => gsap.set(p, { transformOrigin: '50% 50%' }));
  const setPage = (i, pos, at, vis = 1) => tl.set(pages[i], { x: pos.x, y: pos.y, rotation: pos.rotation, scale: pos.scale, autoAlpha: vis }, at);
  const only = (i, at) => pages.forEach((p, j) => tl.set(p, { autoAlpha: j === i ? 1 : 0 }, at));
  // bars <-> words on a page (the "resolve"), 0.2 s crossfade
  const toText = (i, at) => { tl.fromTo(PAGES[i].bars, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2, ease: 'none', immediateRender: false }, at); tl.fromTo(PAGES[i].ov, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: 'none', immediateRender: false }, at); };
  const toBars = (i, at) => { tl.fromTo(PAGES[i].bars, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: 'none', immediateRender: false }, at); tl.fromTo(PAGES[i].ov, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2, ease: 'none', immediateRender: false }, at); };
  const resetOv = (list, at) => list.forEach(i => { tl.set(PAGES[i].bars, { autoAlpha: 1 }, at); tl.set(PAGES[i].ov, { autoAlpha: 0 }, at); });
  const labels = (on, at) => PAGES.forEach(P => tl.set(P.label, { autoAlpha: on ? 1 : 0 }, at));

  /* ---------------- CAM: closed-form camera windows ---------------- */
  // state: scale s about layer point F, which lands on screen point P. Windows interpolate s geometrically.
  const easeIO = u => { u = SR.clamp(u, 0, 1); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
  const expoOut = u => { u = SR.clamp(u, 0, 1); return u >= 1 ? 1 : 1 - Math.pow(2, -10 * u); };
  const expoIO = u => { u = SR.clamp(u, 0, 1); return u === 0 ? 0 : u === 1 ? 1 : u < 0.5 ? Math.pow(2, 20 * u - 10) / 2 : (2 - Math.pow(2, -20 * u + 10)) / 2; };
  const CAM = [];
  const camWin = (a, b, F, s0, P0, s1, P1, ease, reset) => CAM.push({ a, b, F, s0, P0, s1, P1, ease, reset });
  const zoomIn = (i, pos, a, b, ease = easeIO, keep = false) => { camWin(a, b, pos, 1, pos, CS / pos.scale, CC, ease, true); setPage(i, closePos, b); if (!keep) only(i, b); };
  const zoomOut = (i, pos, a, b, ease = expoOut, s0mul = 1, P0 = CC) => { setPage(i, pos, a); camWin(a, b, pos, CS / pos.scale * s0mul, P0, 1, pos, ease, true); };
  SR.onTick(t => {
    let w = null; for (const c of CAM) if (c.a <= t) w = c;
    let s = 1, F = { x: 0, y: 0 }, P = { x: 0, y: 0 };
    if (w) {
      if (t < w.b) { const e = w.ease((t - w.a) / (w.b - w.a)); s = w.s0 * Math.pow(w.s1 / w.s0, e); F = w.F; P = { x: SR.lerp(w.P0.x, w.P1.x, e), y: SR.lerp(w.P0.y, w.P1.y, e) }; }
      else if (!w.reset) { s = w.s1; F = w.F; P = w.P1; }
    }
    camG.setAttribute('transform', `translate(${P.x - s * F.x},${P.y - s * F.y}) scale(${s})`);
  });

  /* ---------------- token states ---------------- */
  const highlight = (tk, at, pitch, gain = 0.45) => {
    tl.set(tk.chipY, { autoAlpha: 1, attr: { fill: C.yellow } }, at);
    tl.fromTo(tk.chipY, { scale: 0.55, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.4, ease: 'popBig', immediateRender: false }, at);
    tl.set(tk.tOld, { attr: { fill: C.deep } }, at);
    tl.fromTo(tk.flip, { scale: 1 }, { keyframes: [{ scale: 1.12, duration: 0.08 }, { scale: 1, duration: 0.45, ease: 'elastic.out(1,0.4)' }], immediateRender: false }, at);
    SR.sfx(at, 'ding', { pitch, gain });
  };
  const cool = (tk, at, dur = 0.6) => {
    tl.to(tk.chipY, { attr: { fill: C.deep }, duration: dur, ease: 'power2.inOut' }, at);
    tl.to(tk.tOld, { attr: { fill: C.grey }, duration: dur, ease: 'power2.inOut' }, at);
    tl.set(tk.chipY, { autoAlpha: 0 }, at + dur);
    tl.to(tk.flip, { keyframes: [{ y: 7, duration: 0.25, ease: 'power2.in' }, { y: 0, duration: 0.6, ease: 'elastic.out(1,0.35)' }] }, at + dur * 0.5);
  };
  const flip = (tk, at, o = {}) => {
    tl.to(tk.flip, { scaleY: 0, duration: 5 * FR, ease: 'power2.in' }, at);
    const sw = at + 5 * FR;
    tl.set([tk.chipY, tk.tOld], { autoAlpha: 0 }, sw);
    tl.set(tk.chipW, { autoAlpha: 1, attr: { fill: C.white } }, sw); tl.set(tk.tNew, { autoAlpha: 1, attr: { fill: C.deep } }, sw);
    tl.to(tk.flip, { scaleY: 1, duration: 6 * FR, ease: 'back.out(2)' }, sw);
    tk.followers.forEach(m => tl.to(m, { x: tk.wN - tk.wO, duration: 0.3, ease: 'pop' }, sw));
    tl.set(tk.bar, { attr: { width: tk.wN + 12 } }, sw);
    SR.sfx(at, 'tick', { pitch: 1500, gain: 0.4 }); SR.sfx(sw, 'pop', { pitch: o.pitch || 900, gain: 0.3 });
  };
  const settle = (tk, at) => {
    tl.to(tk.chipW, { attr: { fill: C.deep }, duration: 0.45, ease: 'power2.inOut' }, at);
    tl.to(tk.tNew, { attr: { fill: C.grey }, duration: 0.45, ease: 'power2.inOut' }, at);
    tl.set(tk.chipW, { autoAlpha: 0 }, at + 0.45);
  };

  /* ================= HOOK 0-5: one word glows in a real sentence, then hides among bars ================= */
  // opening frame: page 9 close, the other eleven already in the fan around it (camera framing does the rest)
  const f9 = fanPos(8);
  const z = CS / f9.scale;
  pages.forEach((p, i) => { const f = fanPos(i); gsap.set(p, i === 8 ? closePos : { x: CC.x + z * (f.x - f9.x), y: CC.y + z * (f.y - f9.y), rotation: f.rotation, scale: f.scale * z, autoAlpha: 1 }); });
  gsap.set(PAGES[8].bars, { autoAlpha: 0 }); gsap.set(PAGES[8].ov, { autoAlpha: 1 });
  highlight(TOK.hero, T.glow, 880, 0.5);
  cool(TOK.hero, T.cool);
  SR.sfx(T.cool, 'whoosh', { dur: 0.7, rise: false, lo: 2500, hi: 400, gain: 0.22 });
  toBars(8, T.resolve0);
  zoomOut(8, fanPos(8), T.pullFan, T.pullFan + 1.0, expoOut);
  SR.sfx(T.pullFan, 'whoosh', { dur: 0.7, rise: false, lo: 5000, hi: 500, gain: 0.35 });
  pages.forEach((p, i) => { if (i !== 8) setPage(i, fanPos(i), T.pullFan); });
  camWin(T.fanOut + 0.7, T.toMonitor, f9, 1, f9, 1.035, f9, SR.smooth, false);           // the camera waits on page 9
  camWin(T.toMonitor, T.toMonitor + 0.45, f9, 1.035, f9, 1, f9, easeIO, true);

  /* ================= SAM 5-17.4: three things are different ================= */
  const SX = 330, BY = 820;
  const samG = el('g', {}, samScene); gsap.set(samG, { autoAlpha: 0 });
  const sam = SR.character(samG, SX, BY, { shirt: C.tint, sleeve: C.deepBand, skin: SR.SKIN[1], hair: 'short', hairColor: SR.HAIR[1], collar: 'v' });
  const desk = anim(samScene); rect(desk, -400, BY, W + 800, 700, C.deepBand);
  const mouse = rect(desk, 560, BY - 18, 56, 22, C.grey, 11);
  gsap.set(desk, { y: 320 });
  const mon = anim(place(samScene, 840, BY));
  rect(mon, -260, -480, 520, 370, C.deep, 14); rect(mon, -240, -460, 480, 330, C.blue, 4);
  rect(mon, -20, -112, 40, 112, C.deep); rect(mon, -110, -16, 220, 20, C.deep, 8);
  gsap.set(mon, { scale: 0, transformOrigin: '50% 100%' });
  const samLabel = SR.words(samFront, 'Sam, tender team', SX, 405, stL, C.white, { align: 'center' });
  gsap.set(samLabel.groups, { scale: 0 });

  tl.to(desk, { y: 0, duration: 0.5, ease: 'power3.out' }, T.desk); SR.sfx(T.desk, 'whoosh', { dur: 0.4, gain: 0.25, lo: 200, hi: 1500 });
  k.pop(mon, T.monitor, { origin: '50% 100%', dur: 0.5, ease: 'popBig', pitch: 300 });
  pages.forEach((p, i) => {
    const at = T.toMonitor + (11 - i) * 0.04;
    tl.to(p, { x: monPos.x, y: monPos.y, rotation: 0, scale: monPos.scale, duration: 0.5, ease: 'power3.inOut' }, at);
    if (i) tl.set(p, { autoAlpha: 0 }, at + 0.5);
  });
  SR.sfx(T.toMonitor, 'whoosh', { dur: 0.8, rise: true, lo: 400, hi: 3000, gain: 0.3 });
  k.show(samG, T.samRise - 0.01);
  tl.fromTo(sam.rise, { y: 380 }, { y: 0, duration: 0.55, ease: 'popBig' }, T.samRise); SR.sfx(T.samRise, 'boing', { pitch: 260, gain: 0.45, pan: -0.4 });
  k.popWords(samLabel.groups, T.samLabel);
  // Sam's performance: blink, breathe, look at the screen, reach and click, nod at each line, lean back
  const look = [[T.look1, T.three - 0.3], [T.line1 - 0.3, T.lean - 0.2]];
  const reach = [[T.click - 0.45, T.click + 0.35]];
  const nods = [T.click + 0.05, T.line1 + 0.1, T.line2 + 0.1, T.line3 + 0.1];
  SR.onTick(t => {
    if (t < T.samRise - 0.1 || t > T.in1) return;
    const lk = SR.inWins(t, look, 0.3), rc = SR.inWins(t, reach, 0.2), ln = SR.smooth((t - T.lean) / 0.5) * (1 - SR.smooth((t - T.push1 - 0.2) / 0.3));
    const ph = ((t + 0.4) % 2.7 + 2.7) % 2.7, bl = ph < 0.12 ? 1 - Math.sin(ph / 0.12 * Math.PI) * 0.9 : 1;
    const nod = nods.reduce((m, n) => m + (t > n && t < n + 0.5 ? Math.sin((t - n) / 0.5 * Math.PI) * 7 : 0), 0);
    const breathe = Math.sin(t * Math.PI * 0.8) * 2;
    sam.head.setAttribute('transform', `translate(${lk * 10},${breathe + nod * 0.6 - ln * 6}) rotate(${lk * 7 - ln * 5})`);
    sam.eyes.setAttribute('transform', `translate(${lk * 9},${4 * (1 - bl)}) scale(1,${bl})`);
    sam.body.setAttribute('transform', `translate(0,${breathe * 0.5 + ln * 10}) rotate(${-ln * 3},0,760)`);
    SR.setArms(sam, 0, rc * 0.55 + ln * 0.0);
  });
  // the click opens the offer on screen
  tl.to(pages[0], { keyframes: [{ scale: monPos.scale * 1.12, duration: 0.08, ease: 'power2.out' }, { scale: monPos.scale, duration: 0.5, ease: 'elastic.out(1,0.35)' }] }, T.click);
  tl.to(mouse, { keyframes: [{ y: 4, duration: 0.05 }, { y: 0, duration: 0.15 }] }, T.click);
  SR.sfx(T.click, 'tick', { pitch: 3200, gain: 0.45 }); SR.sfx(T.click + 0.06, 'pop', { pitch: 500, gain: 0.3 });
  // "three things are different": the three values on the screen pulse in turn
  PAGES[0].toks.forEach((tk, j) => {
    const at = T.three + j * 0.2;
    tl.set(tk.bar, { attr: { fill: C.white } }, at); tl.set(tk.bar, { attr: { fill: C.tint } }, at + 0.45);
    SR.sfx(at, 'pop', { pitch: 1200 + 200 * j, gain: 0.2 });
  });

  // sticky note: grey-tint, slaps on at -4 degrees, first line writes on the slap frame
  const rows = [['Client', 'Havenlink', 'Portmar'], ['Crane', '450 t', '750 t'], ['Start', '14 April 2025', '3 March 2027']];
  const labW = Math.max(...rows.map(r => SR.measure(r[0], stL))) + 30;
  const rowW = rows.map(r => labW + SR.measure(r[1], stB) + 22 + 50 + 22 + SR.measure(r[2], stB));
  const cardW = Math.ceil(Math.max(...rowW) + 80), cardH = 300;
  const cardCX = Math.min(1800 - cardW / 2, 990 + cardW / 2), cardCY = 360;
  const card = anim(place(samFront, cardCX, cardCY, 'rotate(-4)'));
  rect(card, -cardW / 2, -cardH / 2, cardW, cardH, C.greyTint, 4);
  const rowG = rows.map((r, i) => {
    const y = -cardH / 2 + 86 + i * 86, x = -cardW / 2 + 40;
    const a = SR.words(card, r[0], x, y, stL, C.grey431);
    const b = SR.words(card, r[1], x + labW, y, stB, C.grey431);
    const ax = b.endX + 22, ar = anim(place(card, ax, y - 14));
    stroke(ar, 'M0,0 H42 M27,-13 L42,0 L27,13', C.grey431, 6);
    const c = SR.words(card, r[2], ax + 50 + 22, y, stB, C.deep);
    const g = [...a.groups, ...b.groups, ar, ...c.groups]; gsap.set(g, { scale: 0 }); return g;
  });
  gsap.set(card, { autoAlpha: 0, transformOrigin: '50% 50%' });
  const slap = T.line1 - 0.12;
  k.show(card, slap);
  tl.fromTo(card, { scale: 1.6, y: -90, rotation: 7 }, { scale: 1, y: 0, rotation: 0, duration: 0.12, ease: 'power3.in' }, slap);
  tl.to(card, { keyframes: [{ scaleX: 1.2, scaleY: 0.8, duration: 3 * FR, ease: 'power2.out' }, { scaleX: 1, scaleY: 1, duration: 0.55, ease: 'elastic.out(1,0.35)' }] }, slap + 0.12);
  SR.sfx(slap + 0.12, 'thunk', { gain: 0.55, pan: 0.4 });
  [slap + 0.12, T.line2, T.line3].forEach((at, i) => k.popWords(rowG[i], at, { stagger: 2 * FR, sfx: 'tick' }));

  // push into the monitor: the whole desk scales about the screen; page 1 becomes the close-up
  zoomIn(0, monPos, T.push1, T.in1, easeIO);
  SR.sfx(T.push1, 'whoosh', { dur: 0.8, rise: true, lo: 300, hi: 5000, gain: 0.45 });
  k.hide(samScene, T.in1); k.hide(samFront, T.in1);

  /* ================= PAGE 1 17.4-24.4: three fixes, then twelve pages ================= */
  toText(0, T.in1);
  const ticks = [0, 1, 2].map(j => { const a = anim(place(fg, 1300 + j * 54, HEADY)); stroke(a, 'M-16,0 L-4,12 L18,-14', C.white, 8); gsap.set(a, { scale: 0 }); return a; });
  const doneW = SR.words(fg, 'done', 1300 + 3 * 54 - 8, HEADY + 12, stE, C.white); gsap.set(doneW.groups, { scale: 0 });
  [T.flip1, T.flip2, T.flip3].forEach((at, j) => {
    const tk = PAGES[0].toks[j];
    flip(tk, at, { pitch: 700 + 150 * j });
    k.pop(ticks[j], at + 0.25, { dur: 0.35, ease: 'popBig', sfx: false });
    settle(tk, at + 1.1);
  });
  k.popWords(doneW.groups, T.done, { sfx: false }); SR.sfx(T.done, 'ding', { pitch: 1568, gain: 0.22 });
  [...ticks, ...doneW.groups].forEach(g => k.unpop(g, T.pull - 0.25));
  // pull back: the camera reveals page 1 as one of twelve
  toBars(0, T.pull - 0.2);
  pages.forEach((p, i) => { if (i) setPage(i, gridPos(i), T.pull); });
  zoomOut(0, gridPos(0), T.pull, T.pull + 0.9, expoOut);
  labels(true, T.pull);
  SR.sfx(T.pull, 'whoosh', { dur: 0.7, rise: false, lo: 5000, hi: 400, gain: 0.35 });
  const lab12 = SR.words(fg, '12 pages', 960, 210, stT, C.white, { align: 'center' }); gsap.set(lab12.groups, { scale: 0 });
  k.popWords(lab12.groups, T.label12);
  k.outWords(lab12.groups, T.glide - 0.3);
  labels(false, T.glide);
  zoomIn(8, gridPos(8), T.glide, T.in9, easeIO);
  SR.sfx(T.glide, 'whoosh', { dur: 0.8, rise: true, lo: 200, hi: 5000, gain: 0.45 });

  /* ================= PAGE 9 / 11 / 12 25.2-34.5: the leftover reads as correct ================= */
  // reading bar, in close-up screen coordinates; the last sweep becomes the wipe to the next page
  function sweep(i, at, per) {
    const P = PAGES[i], spec = SPEC[i];
    spec.lines.forEach((parts, ln) => {
      const wLine = parts.reduce((s, p) => s + (typeof p === 'string' ? SR.measure(p, stT) + SPACE : SR.measure(p.old, stT) + 2 * GAP + SPACE), -SPACE);
      const bar = rect(fg, TX0, lineY(ln) + BASE + 28, 0, 8, C.tint, 4);
      tl.fromTo(bar, { attr: { width: 0 } }, { attr: { width: wLine }, duration: per, ease: 'none', immediateRender: false }, at + ln * per);
      tl.set(bar, { attr: { width: 0 } }, at + (ln + 1) * per);
      SR.sfx(at + ln * per, 'whoosh', { dur: per, rise: false, lo: 1500, hi: 5000, gain: 0.12, pan: -0.3 + 0.3 * ln });
    });
    return at + spec.lines.length * per;
  }
  function barWipe(i, at, next, nextText) {
    const ln = SPEC[i].lines.length - 1, y = lineY(ln) + BASE + 28;
    const b = rect(fg, TX0, y, 0, 8, C.tint, 4); gsap.set(b, { autoAlpha: 0 });
    tl.set(b, { autoAlpha: 1, attr: { x: TX0, y, width: 600, height: 8 } }, at);
    tl.to(b, { attr: { width: W - TX0 + 20 }, duration: 0.15, ease: 'power2.in' }, at);
    tl.to(b, { attr: { y: -20, height: H + 40, x: -20, width: W + 40, rx: 0 }, duration: 0.28, ease: 'power3.in' }, at + 0.15);
    const mid = at + 0.43;
    tl.set(pages[i], { autoAlpha: 0 }, mid); setPage(next, closePos, mid); only(next, mid);
    tl.set(PAGES[next].bars, { autoAlpha: 0 }, mid); tl.set(PAGES[next].ov, { autoAlpha: 1 }, mid);
    tl.to(b, { attr: { height: 0 }, duration: 0.3, ease: 'power3.out' }, mid + 0.02);
    tl.set(b, { autoAlpha: 0 }, mid + 0.33);
    SR.sfx(at, 'whoosh', { dur: 0.45, rise: true, lo: 400, hi: 5000, gain: 0.35 });
    SR.sfx(mid + 0.02, 'whoosh', { dur: 0.3, rise: false, lo: 3000, hi: 600, gain: 0.25 });
    return mid;
  }
  toText(8, T.in9);
  sweep(8, T.sweep9, 0.75);
  barWipe(8, T.wipe11, 10);
  sweep(10, T.sweep11, 0.5);
  barWipe(10, T.wipe12, 11);
  sweep(11, T.sweep12, 0.42);
  // pull back to the twelve pages for the search
  toBars(11, T.pull12 - 0.2);
  pages.forEach((p, i) => { if (i !== 11) setPage(i, gridPos(i), T.pull12); });
  zoomOut(11, gridPos(11), T.pull12, T.pull12 + 0.9, expoOut);
  resetOv([8, 10], T.pull12);
  labels(true, T.pull12);
  SR.sfx(T.pull12, 'whoosh', { dur: 0.7, rise: false, lo: 5000, hi: 400, gain: 0.35 });

  /* ================= SEARCH 34.5-59.9 ================= */
  const boxP = place(fg, 960, 145), box = anim(boxP);
  rect(box, -420, -48, 840, 96, C.white);
  const lens = circle(box, -372, -6, 18, 'none'); lens.setAttribute('stroke', C.deep); lens.setAttribute('stroke-width', 7);
  stroke(box, 'M-359,7 L-342,24', C.deep, 8);
  const TXB = -330, typed = SR.textEl(box, '', TXB, 15, stB, C.deep);
  const cursor = rect(box, TXB, -28, 5, 56, C.deep, 2);
  const counters = {};
  ['3 hits', '1 hit', '0 hits'].forEach(s => { counters[s] = SR.textEl(box, s, 396, 11, stL, C.grey431, 'end'); gsap.set(counters[s], { autoAlpha: 0 }); });
  const counter = (s, at, until) => { tl.set(counters[s], { autoAlpha: 1 }, at); tl.fromTo(counters[s], { y: 12 }, { y: 0, duration: 0.3, ease: 'pop', immediateRender: false }, at); tl.set(counters[s], { autoAlpha: 0 }, until); SR.sfx(at, 'pop', { pitch: 1300, gain: 0.25 }); };
  gsap.set(box, { autoAlpha: 0, transformOrigin: '50% 100%' });
  k.show(box, T.box);
  tl.fromTo(box, { y: -260 }, { y: 0, duration: 0.3, ease: 'power2.in' }, T.box);
  tl.to(box, { keyframes: [{ scaleX: 1.06, scaleY: 0.85, duration: 0.06 }, { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'elastic.out(1,0.35)' }] }, T.box + 0.3);
  SR.sfx(T.box + 0.3, 'boing', { pitch: 240, gain: 0.35 });
  const DT = 0.075, DB = 0.028;
  const ev = [
    { t: T.type1, s: 'Portmar' }, { t: T.rewind1, s: 'Portmar', del: true },
    { t: T.type2, s: 'Havenlink' }, { t: T.rewind2, s: 'Havenlink', del: true },
    { t: T.type3, s: '450 t' }, { t: T.rewind3, s: '450 t', del: true },
    { t: T.type4, s: '14 April 2025', dt: 0.058 }, { t: T.rewind4, s: '14 April 2025', del: true },
    { t: T.type5, s: 'Havenlink' }];
  const mc = {}, mw = s => (mc[s] ??= s ? SR.measure(nb(s), stB) : 0);
  SR.onTick(t => {
    let s = '', busy = false;
    for (const e of ev) {
      if (t < e.t) break;
      const n = Math.floor((t - e.t) / (e.del ? DB : (e.dt || DT))) + 1;
      s = e.del ? e.s.slice(0, Math.max(0, e.s.length - n)) : e.s.slice(0, Math.min(e.s.length, n));
      busy = n <= e.s.length;
    }
    typed.textContent = nb(s);
    cursor.setAttribute('x', TXB + mw(s) + (s ? 5 : 0));
    cursor.setAttribute('visibility', busy || Math.floor((t - T.box) * 2) % 2 === 0 ? 'visible' : 'hidden');
  });
  const rk = SR.rng(5);
  ev.forEach(e => { if (!e.del) [...e.s].forEach((_, i) => SR.sfx(e.t + i * (e.dt || DT), 'tick', { pitch: 1800 + 500 * rk(), gain: 0.15 })); });
  SR.sfx(T.rewind1, 'zip', { dur: 0.3, gain: 0.35 });
  [T.rewind2, T.rewind3, T.rewind4].forEach(t => SR.sfx(t, 'zip', { dur: 0.25, gain: 0.2 }));
  [T.enter1, T.enter2, T.enter3, T.enter4, T.enter5].forEach(t => SR.sfx(t, 'tick', { pitch: 1200, gain: 0.35 }));
  for (let t = T.freeze + 0.5; t < T.unfreeze; t += 0.5) SR.sfx(t, 'tick', { pitch: 3000, gain: 0.06 });

  // freeze: colour drains from everything but the box
  tl.to(drain, { autoAlpha: 1, duration: 0.3, ease: 'none' }, T.freeze);
  tl.to(camG, { opacity: 0.28, duration: 0.3, ease: 'none' }, T.freeze);
  const q = SR.words(fg, 'What does Sam search for?', 960, 600, stT, C.white, { align: 'center' }); gsap.set(q.groups, { scale: 0 });
  k.popWords(q.groups, T.freeze + 0.25, { sfx: false });
  k.outWords(q.groups, T.unfreeze - 0.15);
  tl.to(drain, { autoAlpha: 0, duration: 0.3, ease: 'none' }, T.unfreeze);
  tl.to(camG, { opacity: 1, duration: 0.3, ease: 'none' }, T.unfreeze);

  // wrong search: the camera leans into page 1 and its three hits light up, all on tiles Sam already fixed
  counter('3 hits', T.enter1, T.rewind1);
  const g0 = gridPos(0), lean = { x: 760, y: 560 };
  labels(false, T.lean1); labels(true, T.shrink1 + 0.45);
  camWin(T.lean1, T.lean1 + 0.4, g0, 1, g0, 2.6, lean, expoOut, false);
  camWin(T.shrink1, T.shrink1 + 0.45, g0, 2.6, lean, 1, g0, easeIO, true);
  SR.sfx(T.lean1, 'whoosh', { dur: 0.4, rise: false, lo: 4000, hi: 800, gain: 0.3 });
  PAGES[0].toks.forEach((tk, j) => {
    const at = T.hits1 + j * 0.2;
    tl.set(tk.bar, { attr: { fill: C.white } }, at);
    tl.fromTo(tk.bar, { attr: { height: 74 } }, { keyframes: [{ attr: { height: 90, y: tk.yc - 45 }, duration: 3 * FR }, { attr: { height: 74, y: tk.yc - 37 }, duration: 3 * FR }], immediateRender: false }, at);
    SR.sfx(at, 'ding', { pitch: 2093 + j * 262, gain: 0.25 });
    tl.set(tk.bar, { attr: { fill: C.tint } }, T.shrink1 + 0.2);
  });
  SR.sfx(T.shrink1, 'whoosh', { dur: 0.45, rise: false, lo: 800, hi: 3000, gain: 0.2 });

  // right search: push into page 9, the leftover lights up in the sentence the reading bar skipped
  counter('1 hit', T.enter2, T.rewind2);
  labels(false, T.push9);
  zoomIn(8, gridPos(8), T.push9, T.push9 + 0.65, expoOut);
  SR.sfx(T.push9, 'whoosh', { dur: 0.6, rise: true, lo: 300, hi: 6000, gain: 0.45 });
  toText(8, T.push9 + 0.65);
  const finds = [
    { tk: TOK.hero, hit: T.hit2, fl: T.flipH2, se: T.settle2, pitch: 1046.5 },
    { tk: TOK.calc, hit: T.hit3, fl: T.flipH3, se: T.settle3, pitch: 1318.5, page: 11, cut: T.enter3 + 0.08, enter: T.enter3, until: T.rewind3 },
    { tk: TOK.p11, hit: T.hit4, fl: T.flipH4, se: T.settle4, pitch: 1568, page: 10, cut: T.enter4 + 0.08, enter: T.enter4, until: T.rewind4 }];
  finds.forEach((f, j) => {
    if (f.page !== undefined) {
      counter('1 hit', f.enter, f.until);
      setPage(f.page, closePos, f.cut); only(f.page, f.cut);
      tl.set(PAGES[f.page].bars, { autoAlpha: 0 }, f.cut); tl.set(PAGES[f.page].ov, { autoAlpha: 1 }, f.cut);
      SR.sfx(f.cut, 'whoosh', { dur: 0.25, rise: false, lo: 2000, hi: 6000, gain: 0.2 });
    }
    highlight(f.tk, f.hit, f.pitch, 0.55);
    flip(f.tk, f.fl, { pitch: 900 + 150 * j });
    settle(f.tk, f.se);
  });
  counter('0 hits', T.enter5, T.pull11 + 0.6);
  SR.sfx(T.enter5 + 0.05, 'sparkle', { gain: 0.25 });

  /* ================= CALLBACK 58.9-67.8: the same frame as the opening, nothing glows ================= */
  toBars(10, T.pull11 - 0.2);
  pages.forEach((p, i) => { if (i !== 10) setPage(i, gridPos(i), T.pull11); });
  zoomOut(10, gridPos(10), T.pull11, T.pull11 + 0.8, expoOut);
  SR.sfx(T.pull11, 'whoosh', { dur: 0.7, rise: false, lo: 5000, hi: 400, gain: 0.3 });
  tl.to(box, { scale: 0, duration: 0.25, ease: 'back.in(2)' }, T.pull11 + 0.5);
  resetOv([8, 11], T.toFan);
  labels(false, T.toFan);
  pages.forEach((p, i) => { const f = fanPos(i); tl.to(p, { x: f.x, y: f.y, rotation: f.rotation, scale: f.scale, duration: 0.8, ease: 'power3.inOut' }, T.toFan + i * 0.03); });
  SR.sfx(T.toFan, 'whoosh', { dur: 1.1, rise: false, lo: 600, hi: 3000, gain: 0.3 });
  zoomIn(8, f9, T.inCall, T.call, easeIO, true);
  pages.forEach((p, i) => { if (i !== 8) { const f = fanPos(i); tl.set(p, { x: CC.x + z * (f.x - f9.x), y: CC.y + z * (f.y - f9.y), scale: f.scale * z }, T.call); } });
  SR.sfx(T.inCall, 'whoosh', { dur: 0.8, rise: true, lo: 200, hi: 4000, gain: 0.3 });
  toText(8, T.call);
  // hold on the grey word, now correct; slow drift in
  const HC = { x: TOK.hero.x + TOK.hero.wN / 2, y: TOK.hero.yc };
  const drift = 1.035;
  camWin(T.call + 0.2, T.outCall - 0.2, HC, 1, HC, drift, HC, SR.smooth, false);
  toBars(8, T.outCall - 0.2);
  zoomOut(8, f9, T.outCall, T.outCall + 0.8, expoOut, drift, { x: HC.x + drift * (CC.x - HC.x), y: HC.y + drift * (CC.y - HC.y) });
  pages.forEach((p, i) => { if (i !== 8) setPage(i, fanPos(i), T.outCall); });
  SR.sfx(T.outCall, 'whoosh', { dur: 0.6, rise: false, lo: 5000, hi: 500, gain: 0.3 });
  // fold shut and send
  pages.forEach((p, i) => tl.to(p, { x: 960, y: 600, rotation: 0, duration: 0.45, ease: 'power3.inOut' }, T.fold + (11 - i) * 0.025));
  SR.sfx(T.fold, 'whoosh', { dur: 0.5, rise: false, lo: 800, hi: 4000, gain: 0.3 });
  SR.sfx(T.fold + 0.5, 'thunk', { gain: 0.25 });
  pages.forEach((p, i) => tl.to(p, { keyframes: [{ x: 900, rotation: -2, duration: 0.15, ease: 'power2.out' }, { x: 2400, rotation: 6, duration: 0.4, ease: 'power3.in' }] }, T.send));
  SR.sfx(T.send + 0.1, 'whoosh', { dur: 0.45, rise: true, lo: 300, hi: 7000, gain: 0.5, pan: 0.6 });

  /* ================= END CARD 67.8-75 on blue-301: the hero comes back ================= */
  const end = el('g', {}, fg);
  const lines = ['Before you send', 'List what changed since this file was made.', 'Search for the old value of each change.'];
  const maxW = Math.max(...lines.map(s => SR.measure(s, stT)));
  const EX = Math.round((W - maxW) / 2), EY = [380, 520, 640];
  const head = SR.words(end, lines[0], EX, EY[0], stT, C.grey);
  const i1 = SR.words(end, lines[1], EX, EY[1], stT, C.white);
  const a2 = 'Search for the', b2 = 'old value', c2 = 'of each change.';
  const wa = SR.measure(a2, stT), wb = SR.measure(b2, stT);
  const bx = EX + wa + SPACE + GAP;
  const heroE = anim(place(end, bx + wb / 2, EY[2] - 23)), heroSq = anim(heroE);
  const heroR = rect(heroSq, -wb / 2 - 14, -37, wb + 28, 74, C.yellow, 12);
  gsap.set(heroE, { autoAlpha: 0 }); gsap.set(heroSq, { transformOrigin: '50% 50%' });
  const i2a = SR.words(end, a2, EX, EY[2], stT, C.white);
  const i2b = SR.words(end, b2, bx, EY[2], stT, C.white);
  const i2c = SR.words(end, c2, bx + wb + GAP + SPACE, EY[2], stT, C.white);
  const all = [...head.groups, ...i1.groups, ...i2a.groups, ...i2b.groups, ...i2c.groups];
  gsap.set(all, { scale: 0 });
  k.popWords(head.groups, T.head);
  k.popWords(i1.groups, T.item1);
  k.popWords([...i2a.groups, ...i2b.groups, ...i2c.groups], T.item2);
  // the block glows in place behind "old value": the same move as the opening frame
  tl.set(heroE, { autoAlpha: 1 }, T.chip);
  tl.fromTo(heroSq, { scale: 0.55 }, { scale: 1, duration: 0.4, ease: 'popBig', immediateRender: false }, T.chip);
  i2b.groups.forEach(g => tl.set(g.firstChild, { attr: { fill: C.deep } }, T.chip));
  [...i2a.groups, ...i2b.groups, ...i2c.groups].forEach((g, j) => tl.to(g, { keyframes: [{ y: 5, duration: 0.05 }, { y: 0, duration: 0.5, ease: 'elastic.out(1,0.3)' }] }, T.chip + j * FR));
  SR.sfx(T.chip, 'ding', { pitch: 880, gain: 0.5 });
  SR.onTick(t => { if (t > T.chip + 0.7) heroR.setAttribute('transform', `scale(${1 + 0.02 * Math.sin((t - T.chip - 0.7) * Math.PI)},1)`); else heroR.removeAttribute('transform'); });

  /* ---------------- captions: one system, a blue-deep lower-third band, one line each ---------------- */
  const caps = cues.captions;
  const BAND_Y = 912;
  const band = anim(capLayer); rect(band, 0, BAND_Y, W, H - BAND_Y, C.deep); gsap.set(band, { y: H - BAND_Y + 10 });
  const wins = []; caps.forEach(([a, b]) => { const l = wins[wins.length - 1]; if (l && a - l[1] < 1.6) l[1] = b; else wins.push([a, b]); });
  wins.forEach(([a, b]) => {
    tl.to(band, { y: 0, duration: 0.25, ease: 'power3.out' }, a - 0.2);
    tl.to(band, { y: H - BAND_Y + 10, duration: 0.25, ease: 'power3.in' }, b + 0.1);
  });
  caps.forEach(([a, b, s]) => {
    const g = el('g', {}, capLayer); gsap.set(g, { autoAlpha: 0 });
    SR.textEl(g, s, W / 2, BAND_Y + 56, stC, C.white, 'middle');
    k.show(g, a); k.hide(g, b);
  });
};
