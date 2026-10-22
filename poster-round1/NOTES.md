# Cornerstone app poster: round one

Four A3 directions (303 x 426 mm incl. 3 mm bleed). Open any `*.html` in Chromium; add `?guides` to see trim (magenta) and 12 mm safe line (cyan).

- `A1-language-photo.html`: Your language x photograph (crew in hall)
- `A2-language-marking.html`: Your language x container-side stencil marking
- `B1-proof-photo.html`: Proof x photograph (rigger walking to SPMT)
- `B2-proof-marking.html`: Proof x hi-vis vest / training record

All copy sits in the `COPY` object at the top of each file. `\n` in a headline is a line break the translator controls.
`fit.js` shrinks a headline only if a line overflows, and flags it red if it would drop below 40 mm cap height.

Render: `NODE_PATH=$(npm root -g) node render.js` writes `out/<name>.png` (with bleed), `-trim.png` and `-15.png` (distance check).
Check: `NODE_PATH=$(npm root -g) node check.js` runs the safe-area and German-length copy test.

Fonts: Barlow / Barlow Condensed and Big Shoulders Stencil Display, all SIL Open Font License (`fonts/OFL.txt`).
QR codes: `qr/android.svg`, `qr/ios.svg`, store URLs decoded from the approved instructional poster.
Colours `#2B6097` / `#F3E72A` are sampled from that poster and still need to be checked against the brand guidelines.
