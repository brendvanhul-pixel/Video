#!/usr/bin/env bash
# Usage: build.sh <projectDir> [--preview]
# cues -> sound cues + text QA -> soundtrack -> parallel render (4-sample motion blur) -> master -> video.mp4 -> QC
# --preview: no motion blur, half the work; use while iterating on motion.
set -euo pipefail
S="$(cd "$(dirname "$0")" && pwd)"; P="$(cd "$1" && pwd)"; SUB=4; [ "${2:-}" = "--preview" ] && SUB=1
command -v ffmpeg >/dev/null || { echo "ffmpeg missing: see SKILL.md, Setup"; exit 1; }
node -e "require('playwright')" 2>/dev/null || { echo "playwright missing: see SKILL.md, Setup"; exit 1; }
mkdir -p "$P/build"; cd "$P"
echo "window.CUES=$(cat cues.json);" > cues.js
node "$S/export_sfx.cjs" "$P"
python3 "$S/audio.py" "$P"
DUR=$(python3 -c "import json;print(json.load(open('cues.json'))['duration'])")
FRAMES=$(python3 -c "print(round($DUR*30))")
W=$(python3 -c "import os;print(max(1,min(6,(os.cpu_count() or 2))))")
CH=$(( (FRAMES + W - 1) / W )); rm -f build/chunk*.mkv build/list.txt
pids=()
for i in $(seq 0 $((W-1))); do
  s=$((i*CH)); e=$(( (i+1)*CH < FRAMES ? (i+1)*CH : FRAMES )); [ $s -ge $e ] && continue
  node "$S/render.cjs" "$P" $s $e $SUB "build/chunk$i.mkv" & pids+=($!); echo "file 'chunk$i.mkv'" >> build/list.txt
done
for pid in "${pids[@]}"; do wait $pid || { echo "a render worker failed"; exit 1; }; done
M=$(ffmpeg -hide_banner -i build/mix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g(){ echo "$M" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -loglevel error -y -i build/mix.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" -c:a pcm_s24le build/master.wav
ffmpeg -loglevel error -y -f concat -safe 0 -i build/list.txt -i build/master.wav -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 14 -tune animation -pix_fmt yuv420p -profile:v high -r 30 \
  -c:a aac -b:a 256k -ar 48000 -ac 2 -t "$DUR" -movflags +faststart video.mp4
python3 "$S/check.py" "$P"
