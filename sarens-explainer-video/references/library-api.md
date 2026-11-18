# sarens.js API

Everything hangs off `SR` (global). A film is `window.FILM = async function (SR, tl, root, T, cues) {...}`. `tl` is the paused master timeline (default ease `pop`, 0.4 s). `root` is the stage group. `T` is `cues.t`. Build scenes as `<g>` children of `root`, hidden with `gsap.set(g, {autoAlpha: 0})` until shown.

## Constants
`SR.W`, `SR.H` (1920, 1080), `SR.M` (96 margin), `SR.FR` (1/30). `SR.C`: blue, deep, deepRaised, deepBand, tint, wash, yellow, white, grey, greyTint, grey431, good, warn, bad. `SR.SKIN[0..3]`, `SR.HAIR[0..3]`.
`SR.textOn(ground)` gives the text colour for a ground. `SR.shadeOn(ground)` gives the flat shadow tone. `SR.yellowOK(ground)` tells you whether yellow is allowed.

## Drawing
`el(tag, attrs, parent)`, `place(parent, x, y)` (static translate), `anim(parent)` (GSAP-owned child), `rect(p, x, y, w, h, fill, r)`, `circle(p, cx, cy, r, fill)`, `path(p, d, fill)`, `stroke(p, d, color, width)` (round caps).
Rule: animate the `anim()` child, never a group that carries a static transform.

## Type
`SR.style(name)` takes one of figure, display, title, body, caption, label, eyebrow, in the active voice.
`SR.measure(str, style)` returns the width.
`SR.words(parent, str, x, y, style, fill, {align: 'left'|'center'|'right', opacity})` returns `{groups, x, width, endX}`. Each word is its own group with its origin at the baseline centre.
`SR.textBlock(parent, str, x, y, style, fill, {maxWidth, align})` wraps the text and returns `{groups, lines, width, bottom}`.
`SR.textEl(...)` is a plain `<text>`. `SR.readTime(str)` returns the minimum rest in seconds.
Set entrance start states with `gsap.set(groups, {scale: 0})`.

## Motion kit: `const k = SR.kit(tl)`
| Call | Does | Sound |
|---|---|---|
| `k.pop(tg, at, {origin, dur, ease, rot, sfx, pitch, pan})` | Scale 0→1 with overshoot | pop |
| `k.unpop(tg, at, {origin})` | Scale to 0, back.in | none |
| `k.popWords(groups, at, {stagger, dur})` | Words in, 2-frame stagger; returns end time | one tick |
| `k.outWords(groups, at)` | Words out in reverse | none |
| `k.draw(pathEl, at, dur, {sfx})` / `k.undraw` | Stroke draws on or off | optional |
| `k.drop(hero, at, {x, groundY})` | Hook drop: stretch, squash, rebound, settle | whoosh, boing, pop |
| `k.hop(hero, at, {x, y, apexY, dur, scale, spin, pitch})` | Anticipation, arc, optional resize, squash on landing | whoosh, pop |
| `k.roll(hero, at, x0, x1, dur, ease)` | Roll along a line, rotation matches distance | rumble |
| `k.squash(hero, at, amt)` / `k.anticipate(hero, at, lead)` | Contact squash (negative = stretch) / wind-up | none |
| `k.iris(hero, at, {x, y, next, clip})` | Hero grows to full frame; `next` scene revealed through clip circle `clip` 3 frames behind | whoosh |
| `k.shapeWipe(shape, at, {scale, dx, dy, dur, anticipate})` | Any shape (bubble, badge) grows to fill the frame | whoosh |
| `k.blockWipe(layer, at, {dir, color, dur})` | DS-native straight block across the frame; returns the midpoint to swap scenes | whoosh |
| `k.collapse(targets, at, px, py)` | Groups fly into a point and shrink | whoosh |
| `k.push(group, at, dur, from, to, origin)` | Camera scale | none |
| `k.countUp(textNode, at, from, to, dur, fmt)` | Figure counts up once | zip |
| `k.drawRuler(ruler, at)` | Line grows, ticks pop with a rising pentatonic pluck | plucks |
| `k.show(tg, at)` / `k.hide(tg, at)` | Cut visibility | none |

## Hero
`SR.hero(parent, {r, fill, shine})` returns `{pos, size, sq, spin, body, r}`. Move `pos` (x, y), resize `size` (centred), squash `sq` (bottom origin), rotate `spin` (centred, carries the shine). Change the colour with `tl.set(hero.body, {attr: {fill}}, at)` on a take-off frame only.
`SR.contactShadow(parent, hero, groundY, color, {from, until})` returns a tick function. Register it with `SR.onTick`.

## Characters
`SR.character(parent, x, baseY, {shirt, sleeve, skin, hair: 'short'|'bun'|'long'|'side'|'none', hairColor, glasses, collar: 'tie'|'v', tieColor, stripes, helmet})` draws a bust whose torso disappears behind a table top at `baseY`. It returns `{rise, body, head, eyes, mouth, armL, armR}`. Use `rise` for entrances (`y: 320 → 0`, `popBig`).
`SR.charLife(c, {seed, side: 1|-1, from, to, talk: [[a, b], ...], listen: [[a, b], ...]})` adds blink, breathing, bob, talking mouth plus arm gesture, and a listening tilt or nod.
`SR.setArms(c, left, right)` sets a manual pose (0 = resting, 1 = raised).

## Props, icons, marks
`SR.props.table(p, x0, x1, y, color)`, `.window(p, x, y, w, h, {sky, frame, sun})` returns `{g, inner, bars()}`. Draw content into `inner`, then call `bars()`.
`.crane(p, x, y, scale, {color, accent, angle, cable})` returns `{boom, hook}`. `.laptop`, `.mug`, `.plant` (sways), `.hardhat`.
`SR.bubble(parent, x, y, {w, h, fill, tail: 'left'|'right', content: 'dots'|'check'|'heart'|'question'|fn})` returns an animatable group, with `.dir` for origin choice.
`SR.badge(parent, x, y, {fill, icon, accent, ink, r})` returns `{fly, b, parts}`. Animate `b` for the entrance and `fly` for exits. Icons: bars, check, target, heart, clock, calendar, people, document, chat, star, arrowUp, lightbulb, shield, gear, hardhat, crane. `parts` exposes sub-elements (bars, check, rings, hand, lines).
`SR.ruler(parent, x, y, width, n, {labels, color})` returns the Sarens measure `{line, ticks, xs}`. `SR.flag(parent, x, y, label, {fill, pole})` returns `{a, fl}`.
`SR.bez(P0, C, P2, u)` returns `{x, y, angle}` for projectiles. `SR.confetti(parent, x, y, t0, {colors, n, seed})`.
`SR.captions(parent, [{t0, t1, text}])` builds caption blocks. Show and hide them with `k.show(seg.g, seg.t0)` and `k.hide(seg.g, seg.t1)`.

## Time and sound
`SR.onTick(fn(t))` registers closed-form micro-motion (runs after every seek).
`SR.sfx(t, type, {gain, pitch, pan, dur, rise, lo, hi, note})` adds a sound cue. Types: pop, boing, whoosh, tick, ding, thunk, zip, rumble, pluck, sparkle, impact.
`SR.rng(seed)`, `SR.smooth`, `SR.clamp`, `SR.lerp`, `SR.win(t, a, b)`, `SR.inWins(t, wins)`.
