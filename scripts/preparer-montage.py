#!/usr/bin/env python3
"""Prépare edits/<id>/ à partir d'une prise : gabarit, facecam 1920 x 1080, voix, piste de bruitages vide, mots, suivi.

  python3 scripts/preparer-montage.py <id> <prise.mp4> [--mots mots.json]

mots.json : [{"w": "Bonjour", "start": 0.1, "end": 0.4}, ...]. Sans ce fichier, pas de sous-titres.
Une prise verticale est recadrée sur son haut : ajuste le crop si la tête sort du cadre.
"""
import argparse
import json
import shutil
import subprocess
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent


def ff(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def sonde(video):
    sortie = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration",
                             "-of", "json", str(video)], check=True, capture_output=True, text=True).stdout
    d = json.loads(sortie)
    return d["streams"][0]["width"], d["streams"][0]["height"], float(d["format"]["duration"])


def groupes(mots, maxi=3):
    out = []
    for i in range(0, len(mots), maxi):
        lot = mots[i:i + maxi]
        out.append({"start": lot[0]["start"], "end": lot[-1]["end"], "mots": [{"w": m["w"], "start": m["start"]} for m in lot]})
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("id")
    ap.add_argument("prise", type=Path)
    ap.add_argument("--mots", type=Path)
    a = ap.parse_args()

    dossier = RACINE / "edits" / a.id
    if (dossier / "src").exists():
        raise SystemExit(f"{dossier / 'src'} existe déjà : rien n'est écrasé.")
    (dossier / "assets").mkdir(parents=True, exist_ok=True)
    shutil.copytree(RACINE / "moteur" / "gabarit" / "src", dossier / "src")

    w, h, duree = sonde(a.prise)
    cadre = "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" if w >= h else "scale=1920:-2,crop=1920:1080:0:ih*0.08"
    ff("-i", str(a.prise), "-vf", f"{cadre},fps=30", "-an", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", str(dossier / "assets" / "facecam.mp4"))
    ff("-i", str(a.prise), "-vn", "-ac", "2", "-ar", "48000", str(dossier / "assets" / "voice.wav"))
    ff("-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", f"{duree:.3f}", str(dossier / "assets" / "sfx.wav"))

    mots = json.loads(a.mots.read_text(encoding="utf-8")) if a.mots else []
    (dossier / "assets" / "words.js").write_text(
        f"window.WORDS = {json.dumps(mots, ensure_ascii=False)};\nwindow.GROUPS = {json.dumps(groupes(mots), ensure_ascii=False)};\n", encoding="utf-8")
    # position horizontale de la tête, une valeur par demi-seconde : centre par défaut
    (dossier / "assets" / "track.js").write_text("window.CXR = [960];\n", encoding="utf-8")

    tete = dossier / "src" / "head.part"
    tete.write_text(tete.read_text(encoding="utf-8").replace('data-duration="10"', f'data-duration="{duree:.2f}"').replace("const TOTAL = 10;", f"const TOTAL = {duree:.2f};"), encoding="utf-8")
    print(f"{dossier} prêt, {duree:.2f} s. Écris tes scènes dans src/scenes.part, puis lance moteur/rendu-reel.sh edits/{a.id}")


if __name__ == "__main__":
    main()
