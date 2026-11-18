# Structure and pacing

## 120 s explainer (default)

| Chapter | Time | Job | Typical scenes |
|---|---|---|---|
| 1 Hook | 0–6 s | The hero appears within 0.5 s and lands the question | Drop + squash, title question with the hero as a glyph |
| 2 Context | 6–22 s | Why it matters, when it happens | Timeline or ruler (Sarens measure), a figure counting up |
| 3 What it is | 22–45 s | The core definition, with people | Character scene (two people, turn-taking), one caption sentence |
| 4 How it works | 45–80 s | 3–4 steps, about 9–10 s each | Badges with icons building one by one, each step with its own micro-payoff |
| 5 Hero moment | ~78–90 s (65–75 %) | The single biggest move: the idea clicking | A projectile hit, a crane lifting the final piece, everything snapping into place |
| 6 What you do | 90–108 s | The action for the viewer, concrete | Checklist drawing, a calendar with the date, a "before you go in" list |
| 7 End lockup | 108–120 s | The title and the one-line takeaway, logo if supplied, hold ≥ 1.5 s with micro-motion | Everything collapses into the hero, which lands as punctuation |

The hero carries every chapter boundary. Plan each transition as "object X does Y and becomes Z", and never "cut to". Vary the transition type: iris, bubble wipe, collapse, block wipe, roll-through. Do not use the same one twice in a row.

## 60 s and shorter

Hook (0–4), what it is (4–20), three steps (20–45, with the hero moment at about 40), end lockup (45–60). The 24 s reference film is this structure compressed.

## Pacing rules

- Text needs reading time: 0.4 s per word + 1 s, and never less than 2 s at rest (`SR.readTime`). A 10-word caption needs 5 s.
- With VO, text supports the voice. Show key words or a short headline, not the sentence being spoken. Every spoken line still goes in a caption block.
- A scene runs 3–8 s. If a beat needs more, add a secondary action halfway.
- Energy follows the music. Use the intro for the hook, the groove for context, the build before the hero moment, the drop on the hero moment, and the break into the end card. Set `music.sections` and `music.end` to match the chapters.
- Busy and calm alternate. After a dense badge build, give 1–2 s where only micro-motion runs.

## Cue sheet discipline

Every hit time is a named entry in `cues.json → t`. Picture code uses `T.name` and sound cues are registered at the same `T.name`, so a retime moves picture and sound together. When a VO exists, derive the times from `analyze_audio.py --vo` segments (sentence starts) rather than inventing them.
