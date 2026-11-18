/* Starting skeleton: hook -> statement -> end lockup, carried by one hero dot.
 * Replace the copy, add chapters between, and keep every time in cues.json (T.name).
 * See examples/performance-review/film.js for characters, badges, iris and wipes.
 */
window.FILM = async function (SR, tl, root, T, cues) {
  const { C, W, H, el, rect } = SR;
  const k = SR.kit(tl);

  // ---- scene 1: brand ground, hero drop, title (yellow allowed on blue-301)
  const s1 = el('g', {}, root);
  rect(s1, 0, 0, W, H, C.blue);
  const title = SR.textBlock(s1, 'Your question goes here?', 160, 470, SR.style('display'), C.white, { maxWidth: 1500 });
  gsap.set(title.groups, { scale: 0 });
  const hero = SR.hero(s1, { r: 70, fill: C.yellow });
  SR.onTick(SR.contactShadow(s1, hero, 820, C.deepBand, { until: T.title }));
  k.drop(hero, T.drop, { x: 960, groundY: 820 });
  k.popWords(title.groups, T.title);
  k.hop(hero, T.title + 0.1, { x: 1700, y: 900, dur: 0.5, scale: 0.4 });

  // ---- scene 2: statement on blue-deep, entered by a block wipe
  const s2 = el('g', {}, root); gsap.set(s2, { autoAlpha: 0 });
  rect(s2, 0, 0, W, H, C.deep);
  const st = SR.textBlock(s2, 'One clear sentence that says what it is.', 160, 470, SR.style('title'), C.white, { maxWidth: 1200 });
  gsap.set(st.groups, { scale: 0 });
  const wipes = el('g', {}, root);
  const mid = k.blockWipe(wipes, T.toStatement, { dir: 'right', color: C.blue });
  k.show(s2, mid); k.hide(s1, mid);
  k.popWords(st.groups, T.statement);

  // ---- scene 3: end lockup, the dot lands as the full stop
  const s3 = el('g', {}, root); gsap.set(s3, { autoAlpha: 0 });
  rect(s3, 0, 0, W, H, C.blue);
  const stE = SR.style('display');
  const tW = SR.words(s3, 'Topic title', 160, 600, stE, C.white);
  gsap.set(tW.groups, { scale: 0 });
  const end = SR.hero(s3, { r: 70, fill: C.yellow });
  gsap.set(end.pos, { x: tW.endX + 34, y: -150 }); gsap.set(end.size, { scale: 20 / 70 });
  k.outWords(st.groups, T.collapse);
  k.show(s3, T.endTitle - 0.1); k.hide(s2, T.endTitle - 0.1);
  k.popWords(tW.groups, T.endTitle, { stagger: 3 * SR.FR, dur: 0.5 });
  tl.to(end.pos, { y: 600 - 20, duration: 0.4, ease: 'power2.in' }, T.finalLand - 0.4);
  k.squash(end, T.finalLand, 0.3);
  SR.sfx(T.finalLand, 'boing', { pitch: 330, gain: 0.6 }); SR.sfx(T.finalLand, 'sparkle', { gain: 0.3 });
  SR.onTick(t => { if (t > T.finalLand + 0.9) end.spin.setAttribute('transform', `rotate(${Math.sin((t - T.finalLand) * Math.PI) * 12})`); });
};
