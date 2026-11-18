# The flat-vector explainer style

This is the canonical form of the Google/Material-era explainer, polished to showreel level. An expert should be able to name the style within one second. Everything below is checked on every film.

## Signature techniques and how to get them

| Technique | Target | In this library |
|---|---|---|
| Flat colour blocks, no gradients, no outlines | Every surface is one solid token. Strokes only for drawn marks (check, question hook), at least 6 px | `rect`, `circle`, `path`; `stroke` only for marks |
| Geometric characters with limb rigs | Head, torso and arms are primitives. Arms rotate on shoulder and elbow anchors. Blink, breathe, bob; talk = mouth + gesture; listen = tilt + nod | `SR.character`, `SR.charLife` |
| Elastic overshoot entrances | cubic-bezier(.34,1.56,.64,1) (`pop`), bigger `popBig` for badges and characters. Anticipation → overshoot → settle | `k.pop`, `k.popWords` |
| Stagger | 2–4 frames between items in a group (words 2, bars 3) | `popWords` stagger 2/30 s |
| One hero moves at a time | When something important moves, everything else holds or only breathes. Speakers take turns | Plan in the cue sheet |
| Squash and stretch | About 10 % in travel, 15–30 % on contact, elastic settle. Stretch along the fall, squash on landing | `k.drop`, `k.hop`, `k.squash`, `k.anticipate` |
| Arcs | Jumps follow arcs (x and y on different eases). Projectiles follow a bezier and rotate along their tangent | `k.hop` keyframes, `SR.bez` |
| Follow-through and secondary action | Ticks dip as the hero rolls past, a flag wobbles after popping up, the target recoils on impact, the title nudges when the dot lands | `keyframes` + `elastic.out` |
| Element-driven transitions | An object carries the cut: the dot opens an iris, a speech bubble grows into the next ground, items collapse into the dot. Never a crossfade | `k.iris`, `k.shapeWipe`, `k.collapse`, `k.blockWipe` |
| Shape wipes | A full-frame shape crosses or grows in about 0.4–0.6 s on `power3.in`, with the next scene revealed 2–3 frames behind | as above |
| Camera | A slow push (1.00→1.07) over a dialogue scene. A quick settle (1.12→1.00, `power3.out`) after an iris | `k.push` |
| Living holds | Nothing rests completely still for more than about 3 s: blink, breathing, a crane hook swinging, bars breathing, a dot that sways | `SR.onTick` closed-form functions |
| Motion blur | 4 sub-frames per frame over a 180° shutter on everything; fast moves get a natural smear | automatic in `build.sh` |
| Sound locked to picture | Every entry has a pop, tick, boing or whoosh at the same cue time. Hero hits sit on the beat | kit helpers register sound; `SR.sfx` for extras |

## Determinism (non-negotiable)

Every frame must be a pure function of t. That means no `Date`, no `Math.random` (use `SR.rng(seed)`), no CSS transitions and no state that builds up between frames. Workers render chunks out of order, so any hidden state shows up as jumps at chunk boundaries. Put physics, particles and wobble in closed form inside `SR.onTick`, like the arrow, confetti and coin in the reference.

GSAP gotchas that bite:
- A group whose transform GSAP animates must not also carry a static `transform`. Use `place()` for position and `anim()` for the animated child.
- Origins: `smoothOrigin` is off globally. Change `transformOrigin` only while scale is 1 and rotation is 0, or the element jumps.
- Use `fromTo` for anything that must hold its start state when seeked into from far away.
- The hero's `size` and `spin` groups have centred origins already. Its `sq` group squashes from the bottom.

## Craft checklist (look for these in stills and frame steps)

- Composition: a clear focal point, a grid, empty space, text inside 96 px, and no element accidentally kissing another or the edge.
- Type: one voice, the video sizes, nothing below the label size, sentence case, rag checked, no orphan words on a two-line title.
- Motion: no linear eases except mechanical motion, anticipation before every jump, overlap rather than everything starting together, and arcs.
- Rhythm: busy beats alternate with calm ones. No dead span over about 3 s. The hero moment is the biggest move in the film.
- Technical: no popping (an element appearing without an entrance), no clipped elements, no thin strokes that shimmer, correct fonts (the renderer aborts on a fallback).

## Self-score honestly (1–10)

6 = template level, 8 = high-end agency, 9 = award shortlist. Score style fidelity, concept, motion craft, design and typography, sound and sync, and technical. Fix the lowest first. Code-driven character acting usually scores lowest. Keep characters simple, give them only a few strong poses, and let shapes and type carry the energy.
