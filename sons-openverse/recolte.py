"""récolte de vrais bruitages sur Openverse (licence CC0 uniquement, donc sans attribution) pour remplacer les sons synthétiques de sfx.py.
pour chaque famille de son : quelques recherches, on garde les fichiers courts, on télécharge, on coupe le silence de tête
(l'attaque tombe ainsi pile sur le repère), on raccourcit avec un fondu, on normalise. sortie : <famille>/<n>.wav + catalogue.json.
musique : quelques nappes CC0 pour tester, à part (le style actuel reste sans musique)."""
import json, pathlib, subprocess, time, urllib.parse, urllib.request
import numpy as np, soundfile as sf

D = pathlib.Path(__file__).resolve().parent
SR = 48000
API = "https://api.openverse.org/v1/audio/?"
# famille : (recherches, durée max du fichier source en ms, longueur gardée en s)
FAMILLES = {
    "swish": (["whoosh", "swoosh short", "swipe whoosh"], 4000, 0.45),
    "pop": (["pop ui", "bubble pop", "mouth pop"], 2500, 0.2),
    "tick": (["tick", "clock tick single"], 2500, 0.08),
    "click": (["mouse click", "button click"], 2500, 0.1),
    "ping": (["notification ding", "ding bell", "chime notification"], 4000, 0.9),
    "key": (["keyboard key press", "typing single key"], 2500, 0.12),
    "thud": (["impact thud", "low boom hit", "punch thud"], 4000, 0.45),
    "flip": (["paper flip", "card flip", "page turn"], 3000, 0.18),
    "alarme": (["alarm beep", "alert siren short"], 5000, 0.3),
}
MUSIQUE = ["lofi beat", "ambient electronic loop", "corporate tech background"]
PAR_FAMILLE = 4

def cherche(q, extra=""):
    for essai in range(4):
        try: return _cherche(q, extra)
        except Exception as e: print("  reprise", q, e); time.sleep(5 * (essai + 1))
    return []

def _cherche(q, extra=""):
    url = API + urllib.parse.urlencode({"q": q, "license": "cc0", "page_size": 20}) + extra
    req = urllib.request.Request(url, headers={"User-Agent": "studio-video/1.0"})
    return json.load(urllib.request.urlopen(req, timeout=60))["results"]

def charge(url):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", url, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, timeout=60)
    return np.frombuffer(r.stdout, np.float32).astype(np.float64)

def prepare(x, garde):
    if len(x) < SR * 0.02: return None
    seuil = np.abs(x).max() * 0.08
    i = int(np.argmax(np.abs(x) > seuil)); i = max(0, i - int(0.002 * SR))  # 2 ms avant l'attaque
    x = x[i:i + int(garde * SR)]
    f = min(len(x) // 3, int(0.04 * SR)); x[-f:] *= np.linspace(1, 0, f) ** 2
    return x / (np.abs(x).max() + 1e-9) * 0.9

catalogue = {}
for fam, (recherches, dmax, garde) in FAMILLES.items():
    (D / fam).mkdir(exist_ok=True); vus, pris = set(), []
    for q in recherches:
        if len(pris) >= PAR_FAMILLE: break
        for r in cherche(q):
            if len(pris) >= PAR_FAMILLE: break
            if r["id"] in vus or not r.get("duration") or r["duration"] > dmax: continue
            vus.add(r["id"]); x = prepare(charge(r["url"]), garde)
            if x is None: continue
            n = len(pris) + 1; sf.write(D / fam / f"{n}.wav", x, SR)
            pris.append({"n": n, "titre": r["title"], "source": r["foreign_landing_url"], "licence": r["license"], "auteur": r.get("creator")})
            print(fam, n, r["title"])
    catalogue[fam] = pris

(D / "musique").mkdir(exist_ok=True); pris = []
for q in MUSIQUE:
    for r in cherche(q, "&category=music"):
        if len([p for p in pris if p["q"] == q]) >= 2: break
        if not r.get("duration") or not 40000 < r["duration"] < 400000: continue
        n = len(pris) + 1
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", r["url"], "-t", "60", "-ac", "2", "-ar", str(SR),
                        "-af", "loudnorm=I=-20", str(D / "musique" / f"{n}.wav")], timeout=120)
        pris.append({"n": n, "q": q, "titre": r["title"], "source": r["foreign_landing_url"], "licence": r["license"], "auteur": r.get("creator")})
        print("musique", n, r["title"])
catalogue["musique"] = pris
json.dump(catalogue, open(D / "catalogue.json", "w"), indent=1, ensure_ascii=False)
