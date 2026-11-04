#!/bin/bash
# rendu complet d'un reel par le moteur maison
#   moteur/rendu-reel.sh <dossier du montage> [sortie.mp4]   (défaut : <dossier>/render.mp4)
# segments en parallèle, assemblage, mixage voix + bruitages ; FPS=30 ou K=8 pour changer la cadence ou le nombre de segments
set -e
ICI="$(cd "$(dirname "$0")" && pwd)"; D="$(cd "${1:?dossier du montage}" && pwd)"; SORTIE="${2:-$D/render.mp4}"
FPS=${FPS:-60}; K=${K:-5}
( cd "$D" && sh src/build.sh > /dev/null )
DUREE=$(grep -o 'data-duration="[0-9.]*"' "$D/src/head.part" | head -1 | grep -o '[0-9.]*')
N=$(python3 -c "import math; print(math.ceil($DUREE * $FPS))"); PAS=$(( (N + K - 1) / K ))
TMP="$D/render-moteur"; mkdir -p "$TMP"; : > "$TMP/liste.txt"; T0=$(date +%s)
for i in $(seq 0 $((K - 1))); do de=$((i * PAS)); a=$(( de + PAS > N ? N : de + PAS ))
  FPS=$FPS node "$ICI/reel.mjs" --edit "$D" --de $de --a $a --sortie "$TMP/seg-$i.mp4" > "$TMP/seg-$i.log" 2>&1 &
  echo "file 'seg-$i.mp4'" >> "$TMP/liste.txt"; done
wait
ffmpeg -v error -y -f concat -safe 0 -i "$TMP/liste.txt" -c copy "$TMP/image.mp4"
ffmpeg -v error -y -i "$TMP/image.mp4" -i "$D/assets/voice.wav" -i "$D/assets/sfx.wav" \
  -filter_complex "[1:a][2:a]amix=inputs=2:normalize=0[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest "$SORTIE"
echo "$N images à $FPS i/s rendues en $(( $(date +%s) - T0 )) s : $SORTIE"
