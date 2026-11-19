/* sarens.js — flat-vector explainer engine in the Sarens brand.
 * Every frame is a pure function of t: GSAP timeline (paused, seeked) + closed-form tick functions.
 * Load order in stage.html: lib/gsap.min.js, lib/CustomEase.min.js, sarens.js, cues.js, film.js
 * See references/library-api.md for the full API.
 */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const W = 1920, H = 1080, M = 96, FPS = 30, FR = 1 / 30;

  /* ---------- Sarens colour tokens (tokens.json). marine-281 is deliberately absent. ---------- */
  const C = {
    blue: '#2A5E97',        // blue-301, brand
    deep: '#11263C',        // blue-deep
    deepRaised: '#152F4C',  // blue-deep-raised
    deepBand: '#1D426A',    // blue-deep-band
    tint: '#94AECB',        // blue-tint
    wash: '#DFE7EF',        // blue-wash
    yellow: '#FFE300',      // yellow-108, highlight: dark grounds only, one element per scene
    white: '#FFFFFF',
    grey: '#D9DEE2',        // grey-sarens
    greyTint: '#EEF0F2',    // grey-tint
    grey431: '#606566',     // body text on light only
    good: '#1B8A6B', warn: '#CC5E0E', bad: '#DB3B45' // status only, always with a word
  };
  // Illustration-only tones (the design system is silent on skin and hair). Exception, see brand-rules.md.
  const SKIN = ['#F3CDB0', '#E0A882', '#B97A52', '#7A4B30'];
  const HAIR = ['#11263C', '#4A3326', '#8A5A3C', '#D9DEE2'];
  const DARK = new Set([C.blue, C.deep, C.deepRaised, C.deepBand]);
  const textOn = g => DARK.has(g) ? C.white : C.deep;
  const shadeOn = g => ({ [C.blue]: C.deepBand, [C.deep]: C.deepRaised, [C.deepRaised]: C.deep, [C.deepBand]: C.deepRaised,
    [C.white]: C.grey, [C.greyTint]: C.grey, [C.wash]: C.tint, [C.grey]: C.tint })[g] || C.deepBand;
  const yellowOK = g => DARK.has(g);

  /* ---------- type (09-video.md). Caslon = Group Talent learning voice, Gotham = corporate/external ---------- */
  const TYPE = {
    caslon: { family: 'Adobe Caslon Pro', figure: [320, 290, 400, -0.02], display: [170, 160, 400, -0.015], title: [84, 92, 400, -0.01],
      body: [46, 60, 400, -0.005], caption: [42, 56, 400, 0], label: [32, 40, 400, 0], eyebrow: [32, 40, 400, 0.03] },
    gotham: { family: 'Gotham', figure: [280, 260, 300, -0.04], display: [150, 140, 500, -0.03], title: [72, 80, 500, -0.02],
      body: [40, 52, 400, -0.01], caption: [40, 52, 400, 0], label: [28, 36, 500, 0], eyebrow: [28, 36, 500, 0.06] }
  };
  let VOICE = 'caslon';
  function style(name, over = {}) {
    const v = TYPE[VOICE]; const s = v[name];
    if (!s) throw new Error('unknown type style ' + name);
    return Object.assign({ name, family: v.family, size: s[0], lh: s[1], weight: s[2], ls: s[3] }, over);
  }

  /* ---------- svg helpers ---------- */
  function el(tag, attrs = {}, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] !== undefined) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const place = (parent, x, y, extra = '') => el('g', { transform: `translate(${x},${y}) ${extra}` }, parent);
  const anim = parent => el('g', {}, parent);       // GSAP owns this group's transform; never give it a static one
  const rect = (p, x, y, w, h, fill, r = 0) => el('rect', { x, y, width: w, height: h, rx: r, ry: r, fill }, p);
  const circle = (p, cx, cy, r, fill) => el('circle', { cx, cy, r, fill }, p);
  const path = (p, d, fill, attrs = {}) => el('path', Object.assign({ d, fill }, attrs), p);
  const stroke = (p, d, color, w, attrs = {}) => el('path', Object.assign({ d, fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, attrs), p);

  /* ---------- maths ---------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const lerp = (a, b, u) => a + (b - a) * u;
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const win = (t, a, b, ramp = 0.15) => smooth((t - a) / ramp) * (1 - smooth((t - b) / ramp));
  const inWins = (t, wins, ramp) => (wins || []).reduce((m, [a, b]) => Math.max(m, win(t, a, b, ramp)), 0);

  /* ---------- text ---------- */
  let STAGE;
  function measure(str, st) {
    const t = el('text', { x: -9999, y: -9999, 'font-family': st.family, 'font-size': st.size, 'font-weight': st.weight, 'letter-spacing': st.ls * st.size }, STAGE);
    t.textContent = str; const w = t.getComputedTextLength(); t.remove(); return w;
  }
  function textEl(parent, str, x, y, st, fill, anchor = 'start') {
    const t = el('text', { x, y, 'font-family': st.family, 'font-size': st.size, 'font-weight': st.weight, 'letter-spacing': st.ls * st.size, fill, 'text-anchor': anchor }, parent);
    t.textContent = str; return t;
  }
  // One line; every word is an animated group whose origin is its own baseline centre.
  function words(parent, str, x, y, st, fill, opts = {}) {
    const ws = str.split(' ').filter(Boolean);
    const space = measure('a b', st) - measure('ab', st);
    const total = ws.reduce((s, w) => s + measure(w, st), 0) + space * (ws.length - 1);
    let cx = opts.align === 'center' ? x - total / 2 : opts.align === 'right' ? x - total : x;
    const x0 = cx, groups = [];
    ws.forEach(w => {
      const ww = measure(w, st);
      const a = anim(place(parent, cx + ww / 2, y));
      const t = textEl(a, w, 0, 0, st, fill, 'middle');
      if (opts.opacity) t.setAttribute('fill-opacity', opts.opacity);
      groups.push(a); cx += ww + space;
    });
    return { groups, x: x0, width: total, endX: x0 + total, y };
  }
  // Wrapped block. Returns all word groups in reading order plus per-line info.
  function textBlock(parent, str, x, y, st, fill, opts = {}) {
    const maxW = opts.maxWidth || (W - 2 * M);
    const lines = []; let cur = [];
    str.split(' ').forEach(w => {
      const test = [...cur, w].join(' ');
      if (cur.length && measure(test, st) > maxW) { lines.push(cur.join(' ')); cur = [w]; } else cur.push(w);
    });
    if (cur.length) lines.push(cur.join(' '));
    const out = { groups: [], lines: [], width: 0 };
    lines.forEach((ln, i) => {
      const r = words(parent, ln, x, y + i * st.lh, st, fill, opts);
      out.groups.push(...r.groups); out.lines.push(r); out.width = Math.max(out.width, r.width);
    });
    out.height = (lines.length - 1) * st.lh + st.size; out.bottom = y + (lines.length - 1) * st.lh;
    return out;
  }
  // DS rule: text rests 400 ms per word + 1000 ms, never under 2000 ms.
  const readTime = str => Math.max(2.0, 0.4 * str.split(/\s+/).filter(Boolean).length + 1.0);

  /* ---------- sound cues: helpers register them, export_sfx.js writes build/sfx.json ---------- */
  const SFX = [];
  function sfx(t, type, o = {}) { if (t >= 0) SFX.push(Object.assign({ t: +t.toFixed(4), type }, o)); }

  /* ---------- tick registry (closed-form micro-motion) ---------- */
  const TICKS = [];
  const onTick = fn => TICKS.push(fn);
  let WARP = null; const setWarp = fn => { WARP = fn; };

  /* ---------- motion kit bound to the master timeline ---------- */
  function kit(tl) {
    const k = {};
    k.show = (tg, at) => tl.set(tg, { autoAlpha: 1 }, at);
    k.hide = (tg, at) => tl.set(tg, { autoAlpha: 0 }, at);
    k.pop = (tg, at, o = {}) => {
      if (o.sfx !== false) sfx(at, o.sfx || 'pop', { gain: o.gain, pitch: o.pitch, pan: o.pan });
      return tl.fromTo(tg, { scale: 0, rotation: o.rot || 0, transformOrigin: o.origin || '50% 50%' },
        { scale: 1, rotation: 0, transformOrigin: o.origin || '50% 50%', duration: o.dur || 0.4, ease: o.ease || 'pop' }, at);
    };
    k.unpop = (tg, at, o = {}) => tl.to(tg, { scale: 0, transformOrigin: o.origin || '50% 50%', duration: o.dur || 0.22, ease: 'back.in(2)' }, at);
    // words in with 2-frame stagger; one soft tick for the group
    k.popWords = (groups, at, o = {}) => {
      const st = o.stagger || 2 * FR;
      if (o.sfx !== false) sfx(at, o.sfx || 'tick', { gain: o.gain });
      groups.forEach((g, i) => tl.fromTo(g, { scale: 0, transformOrigin: '50% 100%' }, { scale: 1, transformOrigin: '50% 100%', duration: o.dur || 0.4, ease: o.ease || 'pop' }, at + i * st));
      return at + (groups.length - 1) * st + (o.dur || 0.4);
    };
    k.outWords = (groups, at, o = {}) => { [...groups].reverse().forEach((g, i) => k.unpop(g, at + i * (o.stagger || FR), { origin: '50% 100%' })); return at + groups.length * FR + 0.22; };
    k.draw = (pathEl, at, dur = 0.35, o = {}) => {
      const L = pathEl.getTotalLength(); pathEl.setAttribute('stroke-dasharray', L);
      if (o.sfx) sfx(at, o.sfx);
      return tl.fromTo(pathEl, { attr: { 'stroke-dashoffset': L } }, { attr: { 'stroke-dashoffset': 0 }, duration: dur, ease: o.ease || 'power2.inOut' }, at);
    };
    k.undraw = (pathEl, at, dur = 0.2) => { const L = pathEl.getTotalLength(); return tl.to(pathEl, { attr: { 'stroke-dashoffset': -L }, duration: dur, ease: 'power2.in' }, at); };
    // squash on contact (origin bottom), elastic settle
    k.squash = (hero, at, amt = 0.2) => {
      tl.to(hero.sq, { scaleX: 1 + amt, scaleY: 1 - amt, duration: 0.05, ease: 'power2.out' }, at - 0.03);
      tl.to(hero.sq, { scaleX: 1, scaleY: 1, duration: 0.6, ease: 'elastic.out(1.1,0.3)' }, at + 0.02);
    };
    k.anticipate = (hero, at, lead = 0.12) => {
      tl.to(hero.sq, { scaleX: 1.15, scaleY: 0.84, duration: lead - 0.02, ease: 'power2.out' }, at - lead);
      tl.to(hero.sq, { scaleX: 0.9, scaleY: 1.12, duration: 0.1, ease: 'power2.out' }, at - 0.02);
      tl.to(hero.sq, { scaleX: 1, scaleY: 1, duration: 0.2 }, at + 0.1);
    };
    // the canonical hook: fall in (stretch) -> squash -> rebound -> settle
    k.drop = (hero, at, o) => {
      const { x, groundY } = o; const R = hero.r, top = o.fromY ?? -R - 20, land = at + (o.dur || 0.5);
      tl.set(hero.pos, { x, y: top }, at);
      tl.fromTo(hero.pos, { y: top }, { y: groundY - R, duration: land - at, ease: 'power2.in', immediateRender: false }, at);
      tl.fromTo(hero.sq, { scaleX: 0.9, scaleY: 1.12 }, { scaleX: 0.86, scaleY: 1.16, duration: land - at - 0.07, ease: 'power1.in', immediateRender: false }, at);
      tl.to(hero.sq, { scaleX: 1.22, scaleY: 0.78, duration: 0.07, ease: 'power2.out' }, land - 0.035);
      tl.to(hero.pos, { y: groundY - R - (o.rebound ?? 120), duration: 0.18, ease: 'power2.out' }, land);
      tl.to(hero.sq, { scaleX: 0.94, scaleY: 1.08, duration: 0.1 }, land + 0.04);
      tl.to(hero.sq, { scaleX: 1, scaleY: 1, duration: 0.08 }, land + 0.14);
      tl.to(hero.pos, { y: groundY - R, duration: 0.18, ease: 'power2.in' }, land + 0.18);
      k.squash(hero, land + 0.36, 0.12);
      sfx(at, 'whoosh', { dur: land - at, rise: true, lo: 200, hi: 2500, gain: 0.45 });
      sfx(land, 'boing', { pitch: 150, gain: 0.8 }); sfx(land + 0.36, 'pop', { pitch: 300, gain: 0.35 });
      return land + 0.36;
    };
    // hop along an arc to (x,y) with anticipation, optional resize and roll, squash on landing
    k.hop = (hero, at, o) => {
      const dur = o.dur || 0.45, peak = o.peak ?? 160;
      k.anticipate(hero, at);
      tl.to(hero.pos, { x: o.x, duration: dur, ease: 'power1.inOut' }, at);
      const y0 = o.fromY; // optional explicit start y for arc height
      tl.to(hero.pos, { keyframes: [{ y: (o.apexY ?? Math.min(o.y, y0 ?? o.y) - peak), duration: dur * 0.45, ease: 'power2.out' }, { y: o.y, duration: dur * 0.55, ease: 'power2.in' }] }, at);
      if (o.scale !== undefined) tl.to(hero.size, { scale: o.scale, duration: dur, ease: 'power2.inOut' }, at);
      tl.to(hero.spin, { rotation: `+=${o.spin ?? 300}`, duration: dur, ease: 'power1.inOut' }, at);
      if (o.sfx !== false) sfx(at - 0.02, 'whoosh', { dur: Math.min(dur, 0.4), rise: false, lo: 500, hi: 3500, gain: 0.3 });
      if (o.land !== false) { k.squash(hero, at + dur, o.squash ?? 0.22); sfx(at + dur, o.landSfx || 'pop', { pitch: o.pitch || 700, gain: 0.5 }); }
      return at + dur;
    };
    // roll along the ground line, rotation matches distance
    k.roll = (hero, at, x0, x1, dur, ease = 'power1.inOut') => {
      const r = hero.r * (gsap.getProperty(hero.size, 'scale') || 1);
      tl.to(hero.pos, { x: x1, duration: dur, ease }, at);
      tl.to(hero.spin, { rotation: `+=${(x1 - x0) / r * 180 / Math.PI}`, duration: dur, ease }, at);
      sfx(at, 'rumble', { dur, gain: 0.3 });
    };
    // circle grows into a full-frame iris; next scene is revealed through a clip that lags 3 frames
    k.iris = (hero, at, o) => {
      const { x, y, next, clip } = o; const R = hero.r;
      tl.to(hero.pos, { x, y, duration: 0.25, ease: 'power2.out' }, at);
      tl.to(hero.spin, { scale: 0, duration: 0.15, ease: 'power2.in', transformOrigin: '50% 50%' }, at);
      tl.to(hero.size, { scale: 2300 / R, duration: 0.5, ease: 'power3.in' }, at + 0.05);
      k.show(next, at);
      tl.set(clip, { attr: { cx: x, cy: y } }, at);
      tl.fromTo(clip, { attr: { r: 0 } }, { attr: { r: 2300 }, duration: 0.5, ease: 'power3.in', immediateRender: false }, at + 0.05 + 3 * FR);
      tl.set(next, { attr: { 'clip-path': 'none' } }, at + 0.6);
      sfx(at - 0.1, 'whoosh', { dur: 0.65, rise: true, lo: 150, hi: 5000, gain: 0.6 });
      return at + 0.6;
    };
    // any shape scales up to fill the frame (speech bubble, badge, block)
    k.shapeWipe = (shape, at, o = {}) => {
      const ant = o.anticipate ?? 0.25;
      if (ant) tl.to(shape, { scale: 0.86, duration: ant, ease: 'power2.out', transformOrigin: '50% 50%' }, at - ant);
      tl.to(shape, { scale: o.scale || 22, x: o.dx || 0, y: o.dy || 0, duration: o.dur || 0.5, ease: 'power3.in', transformOrigin: '50% 50%' }, at);
      sfx(at - ant, 'whoosh', { dur: (o.dur || 0.5) + ant, rise: true, lo: 150, hi: 6000, gain: 0.55 });
      return at + (o.dur || 0.5);
    };
    // the design system's native transition: a flat block crosses the frame in one beat; swap scenes at the returned midpoint
    k.blockWipe = (layer, at, o = {}) => {
      const dir = o.dir || 'right', dur = o.dur || 0.5, color = o.color || C.deep;
      const b = rect(layer, 0, 0, W, H, color); gsap.set(b, { autoAlpha: 0 });
      const ax = dir === 'right' ? 'x' : dir === 'left' ? 'x' : 'y';
      const sgn = (dir === 'right' || dir === 'down') ? 1 : -1, span = ax === 'x' ? W : H;
      tl.set(b, { autoAlpha: 1, [ax]: -sgn * span }, at);
      tl.to(b, { [ax]: 0, duration: dur / 2, ease: 'power3.in' }, at);
      tl.to(b, { [ax]: sgn * span, duration: dur / 2, ease: 'power3.out' }, at + dur / 2);
      tl.set(b, { autoAlpha: 0 }, at + dur);
      sfx(at, 'whoosh', { dur, rise: true, lo: 300, hi: 4000, gain: 0.45 });
      return at + dur / 2;
    };
    // everything flies into one point (element-driven transition)
    k.collapse = (targets, at, px, py, o = {}) => {
      targets.forEach((t, i) => {
        const b = t.getBBox(), ctm = t.getCTM(); // centre in stage coords
        const cx = ctm.a * (b.x + b.width / 2) + ctm.c * (b.y + b.height / 2) + ctm.e;
        const cy = ctm.b * (b.x + b.width / 2) + ctm.d * (b.y + b.height / 2) + ctm.f;
        tl.to(t, { x: `+=${px - cx}`, y: `+=${py - cy}`, scale: 0.1, rotation: (i - 1) * 90, duration: o.dur || 0.42, ease: 'power3.in', transformOrigin: '50% 50%' }, at + i * (o.stagger || 3 * FR));
      });
      sfx(at, 'whoosh', { dur: 0.5, rise: true, lo: 3000, hi: 300, gain: 0.45 });
      return at + (targets.length - 1) * (o.stagger || 3 * FR) + (o.dur || 0.42);
    };
    k.push = (group, at, dur, from, to, origin = '960 540') =>
      tl.fromTo(group, { scale: from, svgOrigin: origin }, { scale: to, svgOrigin: origin, duration: dur, ease: 'sine.inOut' }, at);
    k.countUp = (textNode, at, from, to, dur = 0.6, fmt = v => Math.round(v).toString()) => {
      const o = { v: from }; textNode.textContent = fmt(from);
      tl.to(o, { v: to, duration: dur, ease: 'power2.out', onUpdate: () => { textNode.textContent = fmt(o.v); } }, at);
      sfx(at, 'zip', { dur, gain: 0.35 });
    };
    k.drawRuler = (r, at) => {
      tl.fromTo(r.line, { attr: { width: 0 } }, { attr: { width: r.width } , duration: 0.55, ease: 'power3.out' }, at);
      r.ticks.forEach((tk, i) => k.pop(tk, at + 0.15 + i * 2 * FR, { origin: '50% 0%', sfx: false }));
      r.ticks.forEach((tk, i) => sfx(at + 0.15 + i * 2 * FR, 'pluck', { note: [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96, 98][i % 12], gain: 0.2, pan: -0.7 + 1.4 * i / Math.max(1, r.ticks.length - 1) }));
      return at + 0.15 + r.ticks.length * 2 * FR + 0.4;
    };
    return k;
  }

  /* ---------- hero: the one element that carries the film ---------- */
  function hero(parent, o = {}) {
    const r = o.r || 70;
    const pos = el('g', {}, parent), size = anim(pos), sq = anim(size);
    gsap.set(sq, { transformOrigin: '50% 100%' });
    const body = circle(sq, 0, 0, r, o.fill || C.yellow);
    const spin = anim(sq);
    circle(spin, 0, 0, r, 'none');               // gives spin a centred bbox so it rotates about the centre
    gsap.set(size, { transformOrigin: '50% 50%' }); gsap.set(spin, { transformOrigin: '50% 50%' });
    if (o.shine !== false) stroke(spin, `M${-r * 0.62},${-r * 0.12} A${r * 0.64},${r * 0.64} 0 0 1 ${-r * 0.12},${-r * 0.62}`, o.shineColor || C.white, r * 0.16);
    return { pos, size, sq, spin, body, r };
  }
  // contact shadow that shrinks with height; call from a tick
  function contactShadow(parent, hero, groundY, color, o = {}) {
    const e = el('ellipse', { cx: 0, cy: groundY, rx: 0, ry: 0, fill: color }, parent);
    return t => {
      if ((o.from !== undefined && t < o.from) || (o.until !== undefined && t > o.until)) { e.setAttribute('rx', 0); e.setAttribute('ry', 0); return; }
      const y = gsap.getProperty(hero.pos, 'y'), x = gsap.getProperty(hero.pos, 'x'), s = gsap.getProperty(hero.size, 'scale');
      const h = clamp((groundY - hero.r * s - y) / 500, 0, 1);
      e.setAttribute('cx', x); e.setAttribute('rx', hero.r * s * 1.1 * (1 - 0.6 * h)); e.setAttribute('ry', 14 * s * (1 - 0.6 * h));
    };
  }

  /* ---------- character rig (bust, seated or behind a counter) ---------- */
  // baseY = the line the torso disappears behind (table top). Parts: rise > body > head > eyes/mouth; arms: shoulder > upper > elbow > fore.
  function character(parent, x, baseY, o = {}) {
    const shirt = o.shirt || C.blue, sleeve = o.sleeve || shirt, skin = o.skin || SKIN[1], hair = o.hairColor || HAIR[0];
    const p = place(parent, x, baseY - 740), rise = anim(p), body = anim(rise);
    path(body, 'M-118,760 L-108,600 C-104,566 -80,550 -50,550 H50 C80,550 104,566 108,600 L118,760 Z', shirt);
    rect(body, -20, 520, 40, 44, skin, 12);
    if (o.collar === 'tie') path(body, 'M-12,552 H12 L8,590 L0,640 L-8,590 Z', o.tieColor || C.deep);
    if (o.collar === 'v') path(body, 'M-26,550 L0,592 L26,550 Z', skin);
    if (o.stripes) { rect(body, -112, 640, 224, 16, o.stripes, 4); rect(body, -114, 684, 228, 16, o.stripes, 4); }
    const headB = anim(place(body, 0, 470));
    if (o.hair === 'long') path(headB, 'M-74,-10 C-80,-80 80,-80 74,-10 L78,80 C60,96 40,96 34,70 L-34,70 C-40,96 -60,96 -78,80 Z', hair);
    circle(headB, 0, 0, 66, skin);
    const hairs = {
      short: 'M-66,-6 C-70,-60 -30,-82 4,-80 C40,-80 70,-56 66,-6 C50,-30 20,-42 -10,-40 C-34,-38 -54,-24 -66,-6 Z',
      bun: 'M-68,-2 C-74,-74 74,-74 68,-2 C60,-34 40,-50 0,-50 C-40,-50 -60,-34 -68,-2 Z',
      long: 'M-68,0 C-72,-74 72,-74 68,0 C56,-30 30,-46 0,-46 C-30,-46 -56,-30 -68,0 Z',
      side: 'M-68,-4 C-70,-70 60,-86 68,-10 C40,-44 0,-50 -30,-30 C-44,-20 -58,-12 -68,-4 Z'
    };
    if (o.hair !== 'none' && !o.helmet) path(headB, hairs[o.hair || 'short'] || hairs.short, hair);
    if (o.hair === 'bun' && !o.helmet) circle(headB, 0, -70, 26, hair);
    if (o.helmet) { path(headB, 'M-74,-14 C-74,-96 74,-96 74,-14 Z', o.helmet); rect(headB, -84, -22, 168, 14, o.helmet, 7); }
    const eyes = anim(headB);
    el('ellipse', { cx: -24, cy: 4, rx: 7.5, ry: 9.5, fill: C.deep }, eyes);
    el('ellipse', { cx: 24, cy: 4, rx: 7.5, ry: 9.5, fill: C.deep }, eyes);
    if (o.glasses) { [-24, 24].forEach(cx => el('circle', { cx, cy: 4, r: 19, fill: 'none', stroke: C.deep, 'stroke-width': 6 }, headB)); rect(headB, -6, 1, 12, 6, C.deep, 3); }
    const mouth = anim(place(headB, 0, 34));
    path(mouth, 'M-15,-4 Q0,10 15,-4 Q0,18 -15,-4 Z', C.deep);
    function arm(side) {
      const upper = anim(place(body, side * 92, 590));
      rect(upper, -17, -6, 34, 112, sleeve, 17);
      const fore = anim(place(upper, 0, 100));
      rect(fore, -15, -14, 30, 100, sleeve, 15);
      circle(fore, 0, 92, 19, skin);
      return { upper, fore };
    }
    const armL = arm(-1), armR = arm(1);
    const rest = { L: [10, -34], R: [-10, 34] };
    const c = { p, rise, body, head: headB, eyes, mouth, armL, armR, rest };
    setArms(c, 0, 0);
    return c;
  }
  function setArms(c, gl, gr) { // gestures 0..1 per arm (0 = resting on the table)
    c.armL.upper.setAttribute('transform', `rotate(${c.rest.L[0] - gl * 55})`);
    c.armL.fore.setAttribute('transform', `rotate(${c.rest.L[1] - gl * 60})`);
    c.armR.upper.setAttribute('transform', `rotate(${c.rest.R[0] + gr * 55})`);
    c.armR.fore.setAttribute('transform', `rotate(${c.rest.R[1] + gr * 60})`);
  }
  // Life: blink, breathing, head bob, talk (mouth + gesture), listen (tilt + nod). side: +1 faces right, -1 faces left.
  function charLife(c, o = {}) {
    const offs = o.seed || 0, side = o.side || 1;
    onTick(t => {
      if (o.from !== undefined && (t < o.from || t > o.to)) return;
      const talk = inWins(t, o.talk), listen = inWins(t, o.listen);
      const ph = ((t + offs) % 2.9 + 2.9) % 2.9, bl = ph < 0.12 ? 1 - Math.sin(ph / 0.12 * Math.PI) * 0.9 : 1;
      const bob = Math.sin((t + offs) * Math.PI) * 3 + talk * Math.sin(t * 4 * Math.PI) * 4 + listen * Math.max(0, Math.sin(t * 2 * Math.PI * 0.8)) * 5;
      const tilt = talk * Math.sin(t * 2 * Math.PI) * 4 + listen * side * 6;
      c.head.setAttribute('transform', `translate(0,${bob}) rotate(${tilt})`);
      c.eyes.setAttribute('transform', `translate(0,${4 * (1 - bl)}) scale(1,${bl})`);
      c.mouth.setAttribute('transform', `scale(1,${1 + talk * (0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 4.2)) * 1.2})`);
      c.body.setAttribute('transform', `translate(0,${Math.sin((t + offs) * Math.PI) * 2})`);
      const g = talk * (0.6 + 0.4 * Math.sin(t * 2 * Math.PI * 1.1));
      setArms(c, side > 0 ? g : 0, side > 0 ? 0 : g);
    });
  }

  /* ---------- props & icons (flat, no strokes thinner than 6 px at 1080p) ---------- */
  const props = {
    table(p, x0, x1, y, color = C.deep, depth = 190) { rect(p, x0, y, x1 - x0, 30, color, 15); rect(p, x0 + 30, y + 24, x1 - x0 - 60, depth, color); },
    window(p, x, y, w = 320, h = 360, o = {}) {
      const g = place(p, x, y); rect(g, -16, -16, w + 32, h + 32, o.frame || C.deep); rect(g, 0, 0, w, h, o.sky || C.blue);
      if (o.sun) circle(g, w * 0.75, h * 0.24, 34, o.sun);
      const inner = el('g', {}, g);
      const bars = () => { rect(g, 0, h * 0.48, w, 10, o.frame || C.deep); rect(g, w / 2 - 5, 0, 10, h, o.frame || C.deep); };
      return { g, inner, bars };
    },
    // mobile crane: carrier, cab, telescopic boom, hook block. Returns {g, boom, hook} for animation.
    crane(p, x, y, s = 1, o = {}) {
      const col = o.color || C.white, acc = o.accent || C.tint;
      const g = place(p, x, y, `scale(${s})`);
      rect(g, -150, -60, 300, 46, col, 6);
      [-110, -40, 40, 110].forEach(cx => { circle(g, cx, -12, 24, C.deep); circle(g, cx, -12, 9, acc); });
      rect(g, 90, -118, 70, 60, col, 6); rect(g, 104, -106, 40, 26, acc, 4);
      const boomP = place(g, -40, -78), boom = anim(boomP);
      gsap.set(boom, { rotation: o.angle ?? -38, svgOrigin: '0 0' });
      rect(boom, -10, -16, 340, 32, col, 4); rect(boom, 300, -12, 160, 24, col, 4);
      const tipP = place(boom, 450, 0);
      const hook = anim(tipP);
      rect(hook, -3, 0, 6, o.cable || 140, col); rect(hook, -18, o.cable || 140, 36, 30, acc, 4);
      rect(g, -160, -84, 60, 26, acc, 4);
      return { g, boom, hook };
    },
    laptop(p, x, y, color = C.blue) { const g = place(p, x, y); path(g, 'M-80,0 L-70,-120 H70 L80,0 Z', color); circle(g, 0, -62, 11, C.white); return g; },
    mug(p, x, y, color = C.white) { const g = place(p, x, y); rect(g, -30, -70, 60, 70, color, 10); stroke(g, 'M30,-54 a20,20 0 0 1 0,36', color, 10); return g; },
    plant(p, x, y, o = {}) {
      const g = place(p, x, y), sw = anim(g);
      path(sw, 'M0,-170 C-60,-210 -90,-290 -40,-330 C-10,-280 0,-230 0,-170 Z', o.leaf || C.tint);
      path(sw, 'M0,-170 C50,-220 110,-250 140,-210 C100,-180 50,-170 0,-170 Z', o.leaf2 || C.blue);
      path(sw, 'M0,-160 C-40,-170 -110,-160 -130,-110 C-80,-110 -40,-130 0,-160 Z', o.leaf2 || C.blue);
      path(g, 'M-60,-170 H60 L44,0 H-44 Z', o.pot || C.deep);
      onTick(t => sw.setAttribute('transform', `rotate(${Math.sin(t * 2 * Math.PI * 0.25) * 1.5})`));
      return g;
    },
    hardhat(p, x, y, color = C.white) { const g = place(p, x, y); path(g, 'M-70,0 C-70,-70 70,-70 70,0 Z', color); rect(g, -88, -12, 176, 14, color, 7); rect(g, -10, -66, 20, 56, C.grey, 8); return g; }
  };
  // speech bubble; content: 'dots' | 'check' | 'heart' | 'question' | fn(g)
  function bubble(parent, x, y, o = {}) {
    const w = o.w || 230, h = o.h || 130, fill = o.fill || C.blue, ink = o.ink || textOn(fill);
    const g = anim(place(parent, x, y)), dir = o.tail === 'left' ? -1 : 1, tx = dir * w * 0.28;
    path(g, `M${tx - 22},${h / 2 - 6} L${tx + dir * 46},${h / 2 + 48} L${tx + 26},${h / 2 - 6} Z`, fill);
    rect(g, -w / 2, -h / 2, w, h, fill, h / 2);
    const inner = anim(g);
    const c = o.content || 'dots';
    if (c === 'dots') { const d = [0, 1, 2].map(i => circle(inner, -44 + i * 44, 0, 14, ink)); onTick(t => d.forEach((e, i) => e.setAttribute('cy', -Math.max(0, Math.sin((t * 2.2 - i * 0.18) * 2 * Math.PI)) * 12))); }
    else if (c === 'check') stroke(inner, 'M-40,2 L-10,30 L44,-26', ink, 16);
    else if (c === 'heart') path(inner, 'M0,34 C-60,-6 -40,-52 0,-24 C40,-52 60,-6 0,34 Z', ink);
    else if (c === 'question') { stroke(inner, 'M-18,-22 C-18,-46 22,-46 22,-22 C22,-6 2,-4 2,12', ink, 14); circle(inner, 2, 34, 8, ink); }
    else if (typeof c === 'function') c(inner, ink);
    g.inner = inner; g.dir = dir;
    return g;
  }
  // icon drawn inside a circular badge of radius ~170. Returns {g, parts} where parts animate separately.
  function badge(parent, x, y, o = {}) {
    const p = place(parent, x, y), fly = anim(p), b = anim(fly);
    const fill = o.fill || C.blue, ink = o.ink || textOn(fill), acc = o.accent || (yellowOK(fill) ? C.yellow : C.blue);
    circle(b, 0, 0, o.r || 170, fill);
    const parts = icon(b, o.icon || 'check', ink, acc, o);
    return { p, fly, b, parts, fill };
  }
  function icon(g, name, ink, acc, o = {}) {
    const parts = {};
    switch (name) {
      case 'bars': rect(g, -100, 78, 200, 12, ink, 6);
        parts.bars = [[-66, 70, ink], [0, 112, ink], [66, 160, acc]].map(([bx, h, c]) => { const a = anim(place(g, bx, 78)); rect(a, -26, -h, 52, h, c, 10); return a; }); break;
      case 'check': parts.check = stroke(g, 'M-74,4 L-22,56 L80,-58', ink, 34); break;
      case 'target': parts.rings = [[124, ink], [90, o.fill || C.white], [56, ink], [24, acc]].map(([r, c]) => { const a = anim(g); circle(a, 0, 0, r, c); return a; }); break;
      case 'heart': path(g, 'M0,70 C-120,-10 -84,-110 0,-50 C84,-110 120,-10 0,70 Z', ink); break;
      case 'clock': circle(g, 0, 0, 110, ink); circle(g, 0, 0, 92, o.fill || C.blue);
        parts.hand = anim(g); rect(parts.hand, -7, -76, 14, 84, ink, 7); parts.hand2 = anim(g); rect(parts.hand2, -7, -7, 60, 14, acc, 7); circle(g, 0, 0, 14, ink); break;
      case 'calendar': rect(g, -110, -90, 220, 190, ink, 18); rect(g, -110, -90, 220, 54, acc, 18); rect(g, -110, -56, 220, 20, acc);
        for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) rect(g, -88 + c * 48, -18 + r * 38, 32, 26, o.fill || C.blue, 6); break;
      case 'people': [[-60, ink], [60, ink]].forEach(([cx, c]) => { circle(g, cx, -40, 38, c); path(g, `M${cx - 62},90 C${cx - 62},10 ${cx + 62},10 ${cx + 62},90 Z`, c); }); circle(g, 0, -10, 44, acc); path(g, 'M-70,110 C-70,30 70,30 70,110 Z', acc); break;
      case 'document': path(g, 'M-80,-110 H40 L90,-60 V110 H-80 Z', ink); path(g, 'M40,-110 V-60 H90 Z', o.fill || C.blue);
        parts.lines = [-40, 0, 40].map((y, i) => { const a = anim(place(g, -50, y)); rect(a, 0, -8, i === 2 ? 70 : 110, 16, o.fill || C.blue, 8); return a; }); break;
      case 'chat': rect(g, -110, -80, 180, 120, ink, 60); path(g, 'M-70,30 L-90,80 L-30,36 Z', ink); rect(g, -40, -30, 150, 110, acc, 55); break;
      case 'star': path(g, 'M0,-110 L32,-36 L110,-30 L50,22 L68,100 L0,58 L-68,100 L-50,22 L-110,-30 L-32,-36 Z', ink); break;
      case 'arrowUp': stroke(g, 'M-90,70 L-20,0 L20,40 L90,-40', ink, 26); path(g, 'M50,-60 L106,-56 L102,0 Z', ink); break;
      case 'lightbulb': circle(g, 0, -30, 80, ink); rect(g, -40, 40, 80, 50, ink, 10); rect(g, -32, 96, 64, 18, acc, 9); break;
      case 'shield': path(g, 'M0,-110 L96,-74 V0 C96,60 50,96 0,116 C-50,96 -96,60 -96,0 V-74 Z', ink); parts.check = stroke(g, 'M-44,4 L-12,36 L48,-30', o.fill || C.blue, 24); break;
      case 'gear': for (let i = 0; i < 8; i++) { const a = place(g, 0, 0, `rotate(${i * 45})`); rect(a, -18, -112, 36, 40, ink, 6); } circle(g, 0, 0, 84, ink); circle(g, 0, 0, 34, o.fill || C.blue); break;
      case 'hardhat': path(g, 'M-96,30 C-96,-80 96,-80 96,30 Z', ink); rect(g, -122, 22, 244, 22, ink, 11); rect(g, -14, -76, 28, 80, acc, 12); break;
      case 'crane': rect(g, -110, 50, 220, 36, ink, 6); [-70, 0, 70].forEach(cx => circle(g, cx, 92, 20, acc));
        { const bm = place(g, -60, 50, 'rotate(-48)'); rect(bm, -8, -12, 220, 24, ink, 4); const tp = place(bm, 210, 0, 'rotate(48)'); rect(tp, -3, 0, 6, 60, ink); rect(tp, -14, 60, 28, 22, acc, 4); } break;
      default: break;
    }
    return parts;
  }
  // the Sarens measure: a dimension line with end ticks and unit cells (sr-ticks). Stroke 3 px at 1080p per the system; we use 8 px for the explainer's bolder scale.
  function ruler(parent, x, y, width, n, o = {}) {
    const color = o.color || C.white, g = el('g', {}, parent);
    const line = rect(g, x, y - 4, width, 8, color, 4);
    const ticks = [], xs = [];
    for (let i = 0; i < n; i++) {
      const tx = x + (n === 1 ? width / 2 : i * width / (n - 1)); xs.push(tx);
      const a = anim(place(g, tx, y));
      circle(a, 0, 0, o.dot || 10, color);
      if (o.labels) { const st = style('label'); textEl(a, o.labels[i], 0, 58, st, color, 'middle'); }
      ticks.push(a);
    }
    return { g, line, ticks, xs, width, x, y };
  }
  function flag(parent, x, y, label, o = {}) {
    const a = anim(place(parent, x, y)); const pole = o.pole || C.white, fill = o.fill || C.white, ink = o.ink || textOn(fill);
    rect(a, -5, -230, 10, 230, pole, 5);
    const st = style('label'); const fw = measure(label, st) + 56;
    const fl = anim(a);
    path(fl, `M5,-230 H${fw} l-22,32 l22,32 H5 Z`, fill);
    textEl(fl, label, 24, -187, st, ink);
    return { a, fl };
  }
  // closed-form projectile on a quadratic bezier: returns {x,y,angle} for u in [0,1]
  function bez(P0, Cp, P2, u) {
    const mt = 1 - u;
    const x = mt * mt * P0[0] + 2 * mt * u * Cp[0] + u * u * P2[0], y = mt * mt * P0[1] + 2 * mt * u * Cp[1] + u * u * P2[1];
    const dx = 2 * mt * (Cp[0] - P0[0]) + 2 * u * (P2[0] - Cp[0]), dy = 2 * mt * (Cp[1] - P0[1]) + 2 * u * (P2[1] - Cp[1]);
    return { x, y, angle: Math.atan2(dy, dx) * 180 / Math.PI };
  }
  // seeded confetti burst at t0 from (x,y) in parent coords
  function confetti(parent, x, y, t0, o = {}) {
    const r = rng(o.seed || 7), colors = o.colors || [C.white, C.tint, C.blue, C.deep];
    const g = place(parent, x, y);
    const bits = [...Array(o.n || 26)].map(() => {
      const c = colors[Math.floor(r() * colors.length)];
      const s = r() < 0.5 ? rect(g, -9, -5, 18, 10, c, 3) : circle(g, 0, 0, 7, c);
      const ang = -Math.PI * (0.15 + 0.7 * r());
      return { s, vx: Math.cos(ang) * (380 + 640 * r()) * (r() < 0.5 ? -1 : 1), vy: Math.sin(ang) * (500 + 650 * r()), spin: (r() - 0.5) * 1400, life: 0.9 + 0.5 * r() };
    });
    sfx(t0, 'sparkle', { gain: 0.25 });
    onTick(t => bits.forEach(b => {
      const s = t - t0;
      if (s < 0 || s > b.life) { b.s.setAttribute('visibility', 'hidden'); return; }
      const k = s > b.life - 0.25 ? (b.life - s) / 0.25 : Math.min(1, s / 0.05);
      b.s.setAttribute('visibility', 'visible');
      b.s.setAttribute('transform', `translate(${b.vx * s * 0.7},${b.vy * s + 950 * s * s}) rotate(${b.spin * s}) scale(${k})`);
    }));
    return g;
  }
  // captions for spoken lines: white on a blue-deep square block, bottom centre, inside the margin (09-video.md)
  function captions(parent, segs) {
    const st = style('caption'); const layer = el('g', {}, parent);
    return segs.map(sg => {
      const g = el('g', {}, layer); gsap.set(g, { autoAlpha: 0 });
      const lines = []; let cur = [];
      sg.text.split(' ').forEach(w => { const tst = [...cur, w].join(' '); if (cur.length && tst.length > 42) { lines.push(cur.join(' ')); cur = [w]; } else cur.push(w); });
      if (cur.length) lines.push(cur.join(' '));
      const wMax = Math.max(...lines.map(l => measure(l, st)));
      const bh = lines.length * st.lh + 28, by = H - M - bh;
      rect(g, (W - wMax) / 2 - 28, by, wMax + 56, bh, C.deep);
      lines.forEach((l, i) => textEl(g, l, W / 2, by + 14 + st.size * 0.86 + i * st.lh, st, C.white, 'middle'));
      sg.g = g; return sg;
    });
  }

  /* ---------- boot ---------- */
  async function loadFonts() {
    const faces = [
      ['Adobe Caslon Pro', 'fonts/ACaslonPro-Regular.otf', '100 900'],
      ['Gotham', 'fonts/Gotham-Light.otf', '300'], ['Gotham', 'fonts/Gotham-Book.otf', '400'],
      ['Gotham', 'fonts/Gotham-Medium.otf', '500'], ['Gotham', 'fonts/Gotham-Bold.otf', '700']];
    for (const [fam, url, wt] of faces) { const f = new FontFace(fam, `url(${url})`, { weight: wt }); await f.load(); document.fonts.add(f); }
    await document.fonts.ready;
  }
  async function boot(film) {
    STAGE = document.getElementById('stage');
    const cues = window.CUES || {};
    VOICE = cues.voice === 'gotham' ? 'gotham' : 'caslon';
    STAGE.setAttribute('font-family', TYPE[VOICE].family);
    await loadFonts();
    gsap.defaults({ smoothOrigin: false });
    CustomEase.create('pop', 'M0,0 C0.34,1.56 0.64,1 1,1');      // the signature overshoot, cubic-bezier(.34,1.56,.64,1)
    CustomEase.create('popBig', 'M0,0 C0.3,1.9 0.6,1 1,1');
    const root = document.getElementById('root');
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'pop', duration: 0.4, smoothOrigin: false } });
    const T = cues.t || {};
    await film(SR, tl, root, T, cues);
    const DUR = cues.duration;
    tl.set({}, {}, DUR);
    window.DURATION = DUR;
    window.SFX = SFX.filter(s => s.t < DUR).sort((a, b) => a.t - b.t);
    // optional time warp (freeze / rewind): the timeline and ticks see warped time, ticks also get real time
    window.renderAt = t => { const tt = WARP ? WARP(t) : t; tl.seek(tt, false); TICKS.forEach(fn => fn(tt, t)); };
    window.renderAt(0);
    window.ready = true;
  }

  const SR = { W, H, M, FPS, FR, C, SKIN, HAIR, textOn, shadeOn, yellowOK, TYPE, style, el, place, anim, rect, circle, path, stroke,
    clamp, smooth, lerp, rng, win, inWins, measure, textEl, words, textBlock, readTime, sfx, onTick, setWarp, kit, hero, contactShadow,
    character, setArms, charLife, props, bubble, badge, icon, ruler, flag, bez, confetti, captions, boot,
    get voice() { return VOICE; } };
  window.SR = SR;
})();
