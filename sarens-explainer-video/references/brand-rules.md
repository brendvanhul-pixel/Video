# Sarens design system rules for explainer video

The source is the Sarens Design System: README, 01-contrast, 03-graphic-elements and 09-video. Tags follow the system: [Manual], [Added], [Pending]. **[Exception]** marks a choice this skill makes that departs from 09-video.md. Exceptions are needed because that page describes a calm, square, poster-like motion language, while this skill makes the elastic flat-vector explainer. MarCom has not reviewed the exceptions. List the ones used in every delivery report.

## Colour

| Token | Hex | Role in an explainer |
|---|---|---|
| blue-301 | #2A5E97 | Brand ground (title, timeline, end card), primary shapes, badges |
| blue-deep | #11263C | Dark ground, tables, ink on light grounds, caption blocks |
| blue-deep-raised / -band | #152F4C / #1D426A | Second and third dark tones: shadows on blue, badges on deep |
| blue-tint | #94AECB | Quiet shapes, secondary marks, muted text on blue-deep only |
| blue-wash | #DFE7EF | Light ground for interior scenes |
| grey-tint / grey-sarens | #EEF0F2 / #D9DEE2 | Light ground / shapes and muted text on dark |
| white | #FFFFFF | Text on the blues, characters' accents, props |
| yellow-108 | #FFE300 | The highlight. See the yellow rules |
| status good/warning/bad | #1B8A6B #CC5E0E #DB3B45 | Only when the content is about status, and always with a word |
| marine-281 | #001F5B | Never. [Manual] |

Text pairings that pass (01-contrast): white on blue-301 (6.67:1) and on blue-deep (15.37:1). blue-deep on white, grey-tint, blue-wash or yellow. blue-tint on blue-deep (6.72:1). grey-sarens on blue-deep or blue-301 (4.93:1). **blue-tint on blue-301 fails** (about 2.6:1): never use it for text there.

### Yellow
- Only on blue-301 or blue-deep (or inside a dark shape such as a window). Never as a mark on white, grey or wash grounds (1.05–1.29:1). [Added]
- Never text in yellow, and never white text on yellow. [Manual role, Added rule]
- About one yellow element per scene. Keep it under roughly a tenth of the frame. [Pending] `check.py` warns when it covers more than 10 % for longer than 0.5 s.
- The hero is a natural home for it: the yellow dot is the scene's one yellow element. When the hero must fill the frame (an iris), switch its fill on the take-off frame, as the reference does.

### Illustration tones [Exception]
The system has no skin or hair colours. `SR.SKIN` (4 tones) and `SR.HAIR` are flat, muted and used only on characters. Vary the skin tones across the cast. Hi-vis cannot be yellow on a light ground, so use white or blue-tint stripes on a blue shirt (as in the reference), or put the scene on a dark ground.

### Forbidden in every frame
Gradients, glows, grain, blurred blobs, drop shadows and glass. [Pending] A flat contact-shadow ellipse in the ground's darker token is a shape, not a shadow effect [Exception].

## Type

Voice rule (README, Which typeface). Take the first that fits:
1. It leaves Sarens (customers, candidates, public, social) → Gotham
2. It speaks for the company (corporate announcements, policy, safety and operational instructions) → Gotham
3. It is a tool people work in → Gotham
4. It is a Group Talent learning or people product (e-learning, onboarding, leadership, learning campaign videos) → **Caslon**
5. Anything else from Group Talent → Caslon

Overrides: Romanian → Caslon. Non-Latin scripts → ask MarCom first. State the voice and rule number in the report.

Video sizes (09-video.md), via `SR.style(name)`:

| Style | Caslon | Gotham | Limit |
|---|---|---|---|
| figure | 320/290 | 280/260 Light | One number a scene |
| display | 170/160 | 150/140 Medium | Six words; title and end card |
| title | 84/92 | 72/80 Medium | Twelve words a scene |
| body | 46/60 | 40/52 Book | Two lines |
| caption | 42/56 | 40/52 Book | Subtitles: two lines of 42 characters |
| label | 32/40 | 28/36 Medium | **The floor**. Nothing smaller |
| eyebrow | 32/40 | 28/36 Medium | Sentence case, never uppercase |

Never mix the faces. Never use bold or fake bold in Caslon, italics anywhere, or uppercase for titles or labels. Large type takes negative tracking (built into the styles). Headlines are sentences. Address the viewer as "you".

## Frame and time (kept from 09-video.md)
- 1920×1080, 30 fps, H.264 MP4 at CRF ≤ 18 so Caslon's hairlines survive (the build uses CRF 14).
- Text and logos stay inside the 96 px margin. `export_sfx.cjs` checks resting text.
- Text rests at least 2 s, or 0.4 s per word + 1 s.
- Every spoken line appears as a caption: white on a blue-deep square block, bottom centre (`SR.captions`).
- Photosensitivity: no more than three flashes a second. Never strobe a full-frame colour change.
- No crossfade longer than 300 ms. The film opens with a title and closes with an end card.

## Graphic elements
Grid, glitch and wheels are allowed in video [Manual], but wheels and the logo come only from MarCom artwork files. Never redraw them. This skill does not draw wheels or glitch. If the user supplies wheel artwork, use it as an edge crop on a blue ground, never behind text. The Sarens measure (a dimension line or tick ruler with real units) is welcome wherever something is measured: time, counts, distances (`SR.ruler`).

## Logo
There is no logo file in the system. Use MarCom artwork if the user supplies it (SVG or PNG on the end card, inside the margin, on blue-301). Never type "Sarens" as a stand-in on anything that leaves Group Talent.

## [Exception] Motion: where this skill departs from 09-video.md
| 09-video.md says | This skill does | Why |
|---|---|---|
| Never a bounce, zoom or spin | Elastic overshoot, squash and stretch, small camera pushes, a rolling or spinning hero | These are the defining techniques of the style the user chose |
| Enter along the grid from the nearest edge, with a fade | Scale pops from an anchor point, arcs | Same reason. No fades on entrances |
| Scenes change by a cut or a straight block wipe | Iris, shape wipes, collapse-into-hero, plus block wipes (`k.blockWipe` is available) | Element-driven transitions are part of the style |
| Never a rounded corner in a frame | Rounded and organic shapes in illustrations (characters, bubbles, badges, props). Text blocks, caption blocks and the frame stay square | Flat-vector illustration is built from rounded primitives |
| 30 s max without a voice, 90 s with one | Up to about 120 s. Recommend VO for anything over 60 s | The user asked for 120 s explainers |
| Moves last at most 600 ms | Most moves are 300–600 ms. The hero projectile or collapse may run up to about 900 ms | Arcs need room |
