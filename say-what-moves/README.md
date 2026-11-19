# Say what moves: explainer film

Recap film for the *Say what moves* e-learning. 88 s, 1920x1080, 30 fps, Caslon voice (Group Talent learning piece).

- `video.mp4`: the finished film
- `film.js` + `cues.json`: the source; every hit time lives in `cues.json -> t`
- `src/make_audio.py`: cuts the single VO read at its pauses and re-places each line on the script's timecodes (`vo_lines`), and writes the pizzicato score (`score`)
- `src/script.md`, `src/vo_source.mp3`: the inputs

Rebuild (needs the sarens-explainer-video skill, which supplies the fonts):

```bash
bash <skill>/scripts/new_project.sh /tmp/x && cp -rn /tmp/x/fonts .
python3 src/make_audio.py .
bash <skill>/scripts/build.sh .
```
