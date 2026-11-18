---
name: sarens-explainer-video
description: Make a finished Sarens explainer video (MP4, 1920x1080, 30 fps, up to about 120 seconds) in the flat-vector 2D motion-graphics style. That means flat geometric characters and props, elastic pop-in entrances, squash and stretch, one hero shape that carries the story, and element-driven wipes. It uses the Sarens design system colours and Caslon/Gotham fonts, with synced sound design, music and optional voice-over, mastered to -14 LUFS. Use this skill whenever the user asks for an explainer video, animated video, motion graphic, animation, short film, video intro or "a video that explains X" for Sarens, Group Talent, Sarens Academy, an e-learning, onboarding, a policy or a process. Use it even if they only give a topic ("make a 2-minute video on what a performance review is"), or hand over a script, a voice-over file or a music track. Do not use it for editing live-action footage, for slide decks, or for static posters.
---

# Sarens flat-vector explainer video

This skill produces a finished explainer film as `video.mp4`, together with the source that rebuilds it. The look is the canonical flat-vector explainer: flat colour blocks, geometric characters with anchor-point limb rigs, elastic overshoot entrances, 2–4 frame stagger, squash and stretch on contact, and transitions carried by an object. The colours and type come from the Sarens design system. The reference film is `examples/performance-review/`. Read its `film.js` before writing a new one, because it shows every technique in about 230 lines.

How it works: an SVG stage page draws any moment t on request (a paused GSAP timeline plus closed-form tick functions). Headless Chromium captures each frame, averaging 4 sub-frames for motion blur, and ffmpeg encodes and masters the result. Picture and sound read the same cue times, so hits land on the frame.

## Setup (once per session)

You need `node` with the `playwright` package and a Chromium it can launch, `ffmpeg`/`ffprobe`, and `python3` with `numpy` and `scipy`. Check with:

```bash
node -e "require('playwright').chromium.launch().then(b=>{console.log('chromium ok');b.close()})"; ffmpeg -version | head -1; python3 -c "import numpy, scipy; print('py ok')"
```

If something is missing, try `npm i -g playwright && npx playwright install chromium`, `pip install numpy scipy`, and `apt-get install -y ffmpeg` (or `pip install imageio-ffmpeg` and put its binary on PATH). If Chromium cannot be installed, the skill cannot render. Say so plainly rather than producing something else. GSAP and the five font files ship inside the skill, so nothing else needs downloading.

## Workflow

### 1. Intake

Settle these before designing anything. Ask only for what you cannot infer:

- **Topic, audience and the one thing the viewer should be able to do or say afterwards.** That last point decides the story. Explainers fail by covering everything.
- **Length.** The default is 120 s. Under 60 s, use the short structure in `references/structure.md`.
- **Voice-over.** Is there a VO file, a script to time to, or neither? With VO, run `python3 scripts/analyze_audio.py vo.wav --vo` and build the beat sheet on its speech segments. Every spoken line must also appear as a caption (`SR.captions`), because most people watch with the sound off.
- **Music.** Is there a supplied track? If so, run `scripts/analyze_audio.py music.mp3`, put its BPM in `cues.json` and snap the hero hits to its beat grid. With no track, the skill synthesises an upbeat bed. Tell the user it is a placeholder, because nobody has listened to it.
- **Text-only at 120 s.** Without a VO, push back once. The design system caps silent clips at 30 s, and two minutes of reading is heavy. Offer 60 s, or a VO. If they still want 120 s text-only, build it, keep each scene's text short and give it full reading time.
- **Voice (typeface).** Apply the design system's rule and state it: Group Talent learning and people products → **Caslon**; corporate, external or operational/safety instructions → **Gotham**; Romanian → Caslon. Set `"voice"` in `cues.json`.
- **Logo.** The design system has no logo file and forbids redrawing it or typing the name in its place on anything that leaves Group Talent. If the user supplies MarCom artwork, place it on the end card. Otherwise end on the title lockup and say the logo is missing.

### 2. Treatment and cue sheet

Write the treatment down before coding. Include:
1. The idea in two sentences.
2. **The hero.** One simple shape (the yellow dot in the reference) that appears in the first 0.5 s and carries the film through each transition. This is what makes a "one continuous shot" feel.
3. A chaptered beat sheet with timecodes (see `references/structure.md`).
4. The hero moment at 60–75 % of the runtime.
5. An end lockup held 1–2 s with micro-motion.

Map every signature technique in `references/style.md` to a moment in the film.

Then fill `cues.json` with named times (`"t": {...}`), the music sections and the voice. Every hit in `film.js` reads from `T.name`. Never hard-code a time in two places. Put hero hits on beats (at 120 BPM a beat is 0.5 s, and a bar is 2 s).

### 3. Key frames before motion

```bash
bash scripts/new_project.sh <dir>                       # blank template
bash scripts/new_project.sh <dir> performance-review    # or start from the reference film
```

Build the scenes in `<dir>/film.js` using the library (`references/library-api.md`). Then write `cues.js` and render stills at 8–12 key times:

```bash
cd <dir> && echo "window.CUES=$(cat cues.json);" > cues.js
node <skill>/scripts/stills.cjs <dir> <dir>/stills 0.5 1.0 2.5 ...
```

Look at the stills and tile them with ffmpeg into one sheet. Each still should work as a poster: a clear hierarchy, empty space, text inside the 96 px margin, nothing cramped, and colours obeying `references/brand-rules.md`. Fix what looks default or generic before animating.

### 4. Motion

Choreograph with the motion kit (`k.pop`, `k.popWords`, `k.drop`, `k.hop`, `k.roll`, `k.iris`, `k.shapeWipe`, `k.collapse`, `k.blockWipe` and so on). They already carry the house easing, stagger, squash and sound cues. Iterate with `bash scripts/build.sh <dir> --preview` (no motion blur, faster). For the fastest moves, step through them frame by frame: extract 18 consecutive frames with ffmpeg and tile them. Check the spacing, the arcs, and anticipation before every jump. Check that only one hero moves at a time, and that there are no dead spans over about 3 s without micro-motion.

### 5. Sound

Sound effects come automatically from the kit, and you can add more with `SR.sfx(t, type, {...})`. Types: pop, boing, whoosh, tick, ding, thunk, zip, rumble, pluck, sparkle, impact. Music comes from `cues.json` (`music.file`, or `music.sections` + `music.end` for the synth bed). VO comes from `vo.file` + `vo.offset`, and the music ducks about 9 dB under speech. `build.sh` masters to -14 LUFS integrated, true peak ≤ -1.5 dBTP.

### 6. Final render and QC

```bash
bash <skill>/scripts/build.sh <dir>
```

This exports the sound cues and runs a text QA (resting text inside margins and at or above the size floor). It then renders with motion blur in parallel, encodes H.264 CRF 14 with AAC 48 kHz, and runs `check.py`, which checks duration, frames, resolution, fps, loudness, true peak, black frames, dead spans and the yellow budget, and writes `build/contact.png`. A 120 s film takes roughly 5–10 minutes on 4 cores. Fix every FAIL. Read every WARN and either fix it or say why it stands. Open the contact sheet and look at it.

### 7. Deliver

Send `video.mp4` and a short report:
- the concept in two sentences
- the beat sheet with timecodes
- the voice used and the rule that chose it
- how each signature technique is realised
- the check numbers
- any design-system exceptions used
- an honest top-3 weaknesses and a 1–10 self-score per craft area (style fidelity, concept, motion, design and type, sound and sync, technical)

Be straight about the music if it was synthesised, and about character acting, which is the weakest part of code-driven animation.

## Brand in one paragraph (full rules: `references/brand-rules.md`)

Grounds are `blue-301` #2A5E97, `blue-deep` #11263C, `white`, `grey-tint` or `blue-wash`. Shapes use the blues, `blue-tint`, `grey-sarens` and white. Yellow #FFE300 is the highlight. It is allowed only on blue-301 or blue-deep, in about one element per scene, never as text, never on a light ground and never above about a tenth of the frame. When the hero has to fill the frame, it changes colour on the take-off frame (the reference turns it white). Text is white on the blues and blue-deep on the light grounds and on yellow. Marine-281 is never used. There are no gradients, glows, grain or drop shadows anywhere. One typeface per film, at the video type sizes, with nothing smaller than the label size (32 px in Caslon, 28 px in Gotham), and no uppercase, bold Caslon or italics.

## Files

- `assets/engine/`: copied into every project. Contains `stage.html`, `sarens.js` (the library), `lib/` (GSAP + CustomEase) and `fonts/` (Caslon, Gotham).
- `assets/film-template.js`, `assets/cues-template.json`: starting point for a blank project.
- `examples/performance-review/`: the 24 s reference film (`film.js`, `cues.json`).
- `scripts/`: `new_project.sh`, `build.sh`, `stills.cjs`, `render.cjs`, `export_sfx.cjs`, `audio.py`, `analyze_audio.py`, `check.py`.
- `references/style.md`: the flat-vector signature techniques and the craft checklist. Read it before the treatment.
- `references/structure.md`: chapter structures for 120 s and 60 s films, and pacing.
- `references/brand-rules.md`: the Sarens rules that apply to video, and the explainer exceptions.
- `references/library-api.md`: every helper in `sarens.js`.
- `references/sarens-tokens.json`: the design system's tokens, for lookups.
