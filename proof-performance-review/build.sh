#!/usr/bin/env bash
# Full build: cues -> audio -> parallel frame render (4 workers, 4-sample motion blur) -> master -> video.mp4
set -euo pipefail
cd "$(dirname "$0")"
WORK=${WORK:-./build}; mkdir -p "$WORK"
echo "window.CUES=$(cat cues.json);" > cues.js
python3 audio.py
FPS=30; DUR=$(python3 -c "import json;print(json.load(open('cues.json'))['duration'])")
FRAMES=$(python3 -c "print(round($DUR*$FPS))"); W=4; SUB=${SUB:-4}
CH=$(( (FRAMES + W - 1) / W ))
rm -f "$WORK"/chunk*.mkv "$WORK"/list.txt
for i in $(seq 0 $((W-1))); do
  s=$((i*CH)); e=$(( (i+1)*CH < FRAMES ? (i+1)*CH : FRAMES ))
  node render.js $s $e $SUB "$WORK/chunk$i.mkv" & echo "file 'chunk$i.mkv'" >> "$WORK/list.txt"
done
wait
# two-pass loudnorm to -14 LUFS / -1 dBTP
M=$(ffmpeg -hide_banner -i mix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g(){ echo "$M" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -loglevel error -y -i mix.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" -c:a pcm_s24le "$WORK/master.wav"
ffmpeg -loglevel error -y -f concat -safe 0 -i "$WORK/list.txt" -i "$WORK/master.wav" \
  -map 0:v -map 1:a -c:v libx264 -preset slow -crf 14 -tune animation -pix_fmt yuv420p -profile:v high -r 30 \
  -c:a aac -b:a 256k -ar 48000 -ac 2 -t "$DUR" -movflags +faststart video.mp4
echo done
