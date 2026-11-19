#!/usr/bin/env bash
# Usage: new_project.sh <projectDir> [exampleName]
# Copies the engine (stage, library, fonts, GSAP) into a fresh project folder, plus a film to start from.
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"; P="$1"; EX="${2:-}"
mkdir -p "$P/build"
cp -r "$SKILL/assets/engine/." "$P/"
if [ -n "$EX" ]; then cp "$SKILL/examples/$EX/film.js" "$SKILL/examples/$EX/cues.json" "$P/";
else cp "$SKILL/assets/film-template.js" "$P/film.js"; cp "$SKILL/assets/cues-template.json" "$P/cues.json"; fi
echo "project ready: $P  (edit film.js + cues.json, then scripts/build.sh $P)"
