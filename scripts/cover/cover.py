#!/usr/bin/env python3
"""Couverture de reel : fond uni, sans split. Couleurs et signature viennent de studio.config.json.
L'ancien gabarit C « bandeau encre » reste accessible avec "mise": "bandeau".

Écrit edits/<id>/cover.jpg (1080x1920), le fichier que desk/programmer.mjs envoie à Zernio
en thumbnail + instagramThumbnail. Tout se règle dans edits/<id>/cover.json :

  {
    "titre": ["1 700 $ volés", "sur ta *clé IA*"],   2 lignes max, 17 caractères max, un groupe *orange*
    "tag": "SÉCURITÉ",                                 étiquette de catégorie, 16 caractères max
    "logo": "monlogo",                                 nom d'un PNG déposé dans scripts/cover/logos, ou null
    "image_t": 10,                                     seconde de final.mp4 pour l'image clé
    "image_box": [60, 200, 1020, 850],                 optionnel, sinon recadrage automatique du visuel
    "visage_t": 14,                                    seconde de assets/head.webm (bouche fermée, regard caméra)
    "visage": "/chemin/visage.png",                    optionnel, remplace visage_t (PNG détouré)
    "logo_app": "monapp",                              optionnel, remplace l'image clé par le grand logo de l'app
    "barre": true,                                     optionnel avec logo_app, croix orange sur le logo
    "fond": "encre"                                    optionnel, fond encre au lieu du crème
  }

usage :
  cover.py <id ou dossier>              génère cover.jpg (l'ancienne est gardée en cover-avant-<date>.jpg)
  cover.py <id> --planche               planches pour choisir image_t et visage_t, + cover.json modèle
  cover.py <id> --sortie f.jpg --config c.json   écrit ailleurs, avec une autre config (tests)
"""
import argparse, json, re, subprocess, sys, tempfile, time
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ICI = Path(__file__).resolve().parent
EDITS = ICI.parent.parent / "edits"
W, H = 1080, 1920
SAFE_TOP, SAFE_BOT = 240, 1680  # zone visible dans la grille du profil (recadrage 3:4 centré)

def lire_config():
    """Fusionne studio.config.json (racine du studio) sur les valeurs par défaut."""
    charte = {"fond": "#F0EDE6", "encre": "#1F1B16", "accent": "#D9643A", "gris": "#B9AFA3", "signature": "#7A6F63"}
    pseudo = ""
    fichier = ICI.parent.parent / "studio.config.json"
    if fichier.exists():
        donnees = json.loads(fichier.read_text(encoding="utf-8"))
        charte.update(donnees.get("couverture") or {})
        pseudo = donnees.get("pseudo") or ""
    return charte, pseudo


_CHARTE, SIGNATURE = lire_config()
CREME, ENCRE, ORANGE, GRIS_CLAIR = _CHARTE["fond"], _CHARTE["encre"], _CHARTE["accent"], _CHARTE["gris"]
M, BANDE, CORPS = 70, 1000, 100  # marge, haut du bandeau encre, corps du titre (fixe sur toute la série)
MAX_CAR, MAX_TAG = 17, 16

F_TITRE = ICI / "fonts/ArchivoBlack-Regular.ttf"
F_MONT = ICI / "fonts/Montserrat-VariableFont_wght.ttf"
F_MONO = ICI / "fonts/IBMPlexMono-SemiBold.ttf"


class Refus(Exception):
    pass


def font(path, size, var=None):
    f = ImageFont.truetype(str(path), size)
    if var:
        f.set_variation_by_name(var)
    return f


# ---------- entrées ----------

def dossier(arg):
    p = Path(arg)
    if p.is_dir():
        return p.resolve()
    hits = sorted(EDITS.glob(arg + "*"))
    if len(hits) != 1:
        raise Refus(f"montage introuvable ou ambigu : {arg} ({len(hits)} résultats dans {EDITS})")
    return hits[0]


def video(base):
    for n in ("final.mp4", "renders/final.mp4"):
        if (base / n).exists():
            return base / n
    mp4 = sorted(base.glob("*.mp4"), key=lambda p: p.stat().st_mtime)
    if not mp4:
        raise Refus(f"aucune vidéo dans {base}")
    return mp4[-1]


def image_a(src, t, alpha=False):
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "f.png"
        cmd = ["ffmpeg", "-nostdin", "-loglevel", "error", "-y"]
        if alpha:
            cmd += ["-c:v", "libvpx-vp9"]  # garde la couche alpha du webm
        cmd += ["-ss", str(t), "-i", str(src), "-frames:v", "1", str(out)]
        subprocess.run(cmd, check=True)
        if not out.exists():
            raise Refus(f"aucune image à {t} s dans {src.name} (vidéo plus courte ?)")
        return Image.open(out).convert("RGBA")


def valider(cfg):
    titre = cfg.get("titre")
    if not isinstance(titre, list) or not 1 <= len(titre) <= 2:
        raise Refus("titre : 1 ou 2 lignes")
    for l in titre:
        if len(l.replace("*", "")) > MAX_CAR:
            raise Refus(f"titre : « {l.replace('*', '')} » dépasse {MAX_CAR} caractères, raccourcis-le")
    if "".join(titre).count("*") != 2:
        raise Refus("titre : un seul groupe orange, entouré de *")
    if len(cfg.get("tag", "")) > MAX_TAG:
        raise Refus(f"tag : {MAX_TAG} caractères max")
    if cfg.get("logo") and not (ICI / "logos" / f"{cfg['logo']}.png").exists():
        raise Refus(f"logo inconnu : {cfg['logo']} (voir {ICI / 'logos'})")
    if cfg.get("logo_app") and not (ICI / "logos" / f"{cfg['logo_app']}.png").exists():
        raise Refus(f"logo_app inconnu : {cfg['logo_app']} (voir {ICI / 'logos'})")
    if "image_t" not in cfg and not cfg.get("logo_app"):
        raise Refus("image_t manquant : lance --planche pour le choisir")
    if "visage" not in cfg and "visage_t" not in cfg:
        raise Refus("visage_t ou visage manquant")


# ---------- visuel et visage ----------

def boite_auto(frame):
    """boîte du visuel dans la zone animée (haut de l'image, au-dessus des sous-titres)"""
    zone = frame.convert("RGB").crop((0, 0, W, 880))
    fond = Image.new("RGB", zone.size, CREME)
    diff = ImageChops.difference(zone, fond).convert("L").point(lambda v: 255 if v > 40 else 0)
    bbox = diff.getbbox()
    if not bbox:
        return (0, 120, W, 880)
    x0, y0, x1, y1 = bbox
    return (max(0, x0 - 30), max(0, y0 - 30), min(W, x1 + 30), min(880, y1 + 30))


def carte_visuel(frame, box, larg, haut_max, marge=22):
    src = frame.crop(tuple(box))
    iw = larg - 2 * marge
    s = min(iw / src.width, (haut_max - 2 * marge) / src.height)
    src = src.resize((int(src.width * s), int(src.height * s)), Image.LANCZOS)
    carte = Image.new("RGBA", (src.width + 2 * marge, src.height + 2 * marge), (0, 0, 0, 0))
    ImageDraw.Draw(carte).rounded_rectangle((0, 0, carte.width - 1, carte.height - 1), 36, fill="white")
    masque = Image.new("L", src.size, 0)
    ImageDraw.Draw(masque).rounded_rectangle((0, 0, src.width - 1, src.height - 1), 22, fill=255)
    carte.paste(src, (marge, marge), masque)
    return carte


def carte_logo(nom, larg, haut, barre=False):
    """grand logo officiel de l'app dans la carte blanche, barré d'une croix orange si barre"""
    carte = Image.new("RGBA", (larg, haut), (0, 0, 0, 0))
    d = ImageDraw.Draw(carte)
    d.rounded_rectangle((0, 0, larg - 1, haut - 1), 36, fill="white")
    lg = Image.open(ICI / "logos" / f"{nom}.png").convert("RGBA")
    lg.thumbnail((int(larg * 0.62), int(haut * 0.68)), Image.LANCZOS)
    x, y = (larg - lg.width) // 2, (haut - lg.height) // 2
    carte.alpha_composite(lg, (x, y))
    if barre:
        e, m = 34, 40
        for a, b in (((x - m, y - m), (x + lg.width + m, y + lg.height + m)),
                     ((x + lg.width + m, y - m), (x - m, y + lg.height + m))):
            d.line([a, b], fill=ORANGE, width=e)
            for c in (a, b):
                d.ellipse((c[0] - e // 2, c[1] - e // 2, c[0] + e // 2, c[1] + e // 2), fill=ORANGE)
    return carte


def detourer_visage(im, ratio=1.0):
    """tête et épaules à partir d'une image détourée (alpha) ; ratio = hauteur / largeur du cadre"""
    a = im.split()[3]
    bbox = a.point(lambda v: 255 if v > 128 else 0).getbbox()
    if not bbox:
        raise Refus("visage : aucune silhouette dans l'image (alpha vide)")
    y0 = bbox[1]
    ligne = a.crop((0, y0 + 110, im.width, y0 + 111)).point(lambda v: 255 if v > 128 else 0).getbbox()
    if not ligne:
        raise Refus("visage : silhouette trop petite")
    hw, cx = ligne[2] - ligne[0], (ligne[2] + ligne[0]) // 2
    cote = int(hw * 3.0)
    haut = max(0, y0 - int(hw * 0.15))
    return im.crop((cx - cote // 2, haut, cx + cote // 2, haut + int(cote * ratio)))


def visage(base, cfg, ratio=1.0):
    if cfg.get("visage"):
        v = Image.open(cfg["visage"]).convert("RGBA")
        return detourer_visage(v, ratio)
    head = base / "assets" / "head.webm"
    if not head.exists():
        raise Refus(f"pas de {head} : donne un PNG détouré dans \"visage\"")
    return detourer_visage(image_a(head, cfg["visage_t"], alpha=True), ratio)


# ---------- composition ----------

def fond_quadrille(couleur=CREME, trait=(31, 27, 22, 14)):
    im = Image.new("RGBA", (W, H), couleur)
    d = ImageDraw.Draw(im, "RGBA")
    for x in range(0, W, 45):
        d.line([(x, 0), (x, H)], fill=trait)
    for y in range(0, H, 45):
        d.line([(0, y), (W, y)], fill=trait)
    return im


def poser(im, carte, x, y):
    # l'alpha est flouté sur toute l'image, sinon l'ombre s'arrête net au bord du calque (rectangle gris)
    m = Image.new("L", im.size, 0)
    m.paste(carte.split()[3], (x, y + 20))
    m = m.filter(ImageFilter.GaussianBlur(26)).point(lambda v: int(v * 0.22))
    ombre = Image.new("RGBA", im.size, (31, 27, 22, 255))
    ombre.putalpha(m)
    im.alpha_composite(ombre)
    im.alpha_composite(carte, (x, y))


def puce_logo(im, nom, x, y, taille=88):
    lg = Image.open(ICI / "logos" / f"{nom}.png").convert("RGBA")
    lg.thumbnail((int(taille * 0.62),) * 2, Image.LANCZOS)
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((x, y, x + taille, y + taille), 26, fill="white", outline=(31, 27, 22, 30), width=2)
    im.alpha_composite(lg, (x + (taille - lg.width) // 2, y + (taille - lg.height) // 2))


def ecrire_titre(im, lignes, x, y, couleur=CREME):
    f = font(F_TITRE, CORPS)
    d = ImageDraw.Draw(im)
    for i, l in enumerate(lignes):
        if f.getlength(l.replace("*", "")) > W - 2 * M:
            raise Refus(f"titre : « {l.replace('*', '')} » ne tient pas en largeur")
        cx = x
        for j, morceau in enumerate(l.split("*")):
            d.text((cx, y + i * CORPS * 1.04), morceau, font=f, fill=ORANGE if j % 2 else couleur)
            cx += f.getlength(morceau)
    return y + len(lignes) * CORPS * 1.04


def composer_plein(base, cfg):
    """gabarit par défaut : fond crème uni, titre en haut, carte à gauche, grand visage à droite"""
    encre = cfg.get("fond") == "encre"
    texte = CREME if encre else ENCRE
    im = Image.new("RGBA", (W, H), ENCRE if encre else CREME)
    d = ImageDraw.Draw(im)
    px = 32
    d.ellipse((M, 282 + px * .32, M + px * .5, 282 + px * .82), fill=ORANGE)
    d.text((M + px * .85, 282), cfg.get("tag", "").upper(), font=font(F_MONO, px), fill=texte)
    if cfg.get("logo"):
        puce_logo(im, cfg["logo"], W - M - 88, 262)
    bas = ecrire_titre(im, cfg["titre"], M, 360, texte)

    if cfg.get("logo_app"):
        carte = carte_logo(cfg["logo_app"], 540, 440, cfg.get("barre"))
    else:
        frame = image_a(video(base), cfg["image_t"])
        if frame.size != (W, H):
            frame = frame.resize((W, H), Image.LANCZOS)
        carte = carte_visuel(frame, cfg.get("image_box") or boite_auto(frame), 560, 560)
    carte = carte.rotate(4, Image.BICUBIC, expand=True)
    cy = int(bas) + 70
    poser(im, carte, M - 20, cy)

    # grand visage coupé aux épaules et fondu vers le bas (ni bord net, ni mains), fini avant y 1680
    vw = 800
    v = visage(base, cfg, ratio=1.0).resize((vw, vw), Image.LANCZOS)
    fondu = Image.linear_gradient("L").resize((vw, int(vw * 0.32))).point(lambda a: 255 - a)
    masque = Image.new("L", v.size, 255)
    masque.paste(fondu, (0, vw - fondu.height))
    v.putalpha(ImageChops.multiply(v.split()[3], masque))
    im.alpha_composite(v, (W - vw + 170, SAFE_BOT - vw + 60))
    d = ImageDraw.Draw(im)
    d.text((M, SAFE_BOT - 70), SIGNATURE, font=font(F_MONT, 30, "Bold"), fill=GRIS_CLAIR if encre else _CHARTE["signature"])
    return im.convert("RGB")


def composer(base, cfg):
    if cfg.get("mise") != "bandeau":
        return composer_plein(base, cfg)
    im = fond_quadrille()
    d = ImageDraw.Draw(im)
    px = 32
    d.ellipse((M, 282 + px * .32, M + px * .5, 282 + px * .82), fill=ORANGE)
    d.text((M + px * .85, 282), cfg.get("tag", "").upper(), font=font(F_MONO, px), fill=ENCRE)
    if cfg.get("logo"):
        puce_logo(im, cfg["logo"], W - M - 88, 262)

    if cfg.get("logo_app"):
        carte = carte_logo(cfg["logo_app"], W - 2 * M, BANDE - 360 - 80, cfg.get("barre"))
    else:
        frame = image_a(video(base), cfg["image_t"])
        if frame.size != (W, H):
            frame = frame.resize((W, H), Image.LANCZOS)
        carte = carte_visuel(frame, cfg.get("image_box") or boite_auto(frame), W - 2 * M, BANDE - 360 - 40)
    poser(im, carte, (W - carte.width) // 2, 356 + (BANDE - 400 - carte.height) // 2)

    d.rectangle((0, BANDE, W, H), fill=ENCRE)
    d.rectangle((0, BANDE, W, BANDE + 10), fill=ORANGE)
    bas = ecrire_titre(im, cfg["titre"], M, BANDE + 48)
    # visage collé sous le titre : tête et menton dans la zone visible de la grille (avant y 1680)
    vy, vw = int(bas) + 6, 560
    v = visage(base, cfg, ratio=(H - vy) / vw)
    v = v.resize((vw, int(v.height * vw / v.width)), Image.LANCZOS)
    im.alpha_composite(v, (W - v.width + 120, vy))
    f = font(F_MONT, 30, "Bold")
    d = ImageDraw.Draw(im)
    d.text((M, SAFE_BOT - 70), SIGNATURE, font=f, fill=GRIS_CLAIR)
    return im.convert("RGB")


# ---------- aide au choix ----------

def planche(base):
    out = base / "cover-choix"
    out.mkdir(exist_ok=True)
    mp4 = video(base)
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp4)],
                               capture_output=True, text=True, check=True).stdout)
    pas = 2.5
    subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-i", str(mp4), "-vf",
                    f"fps=1/{pas},scale=270:480,drawtext=text='%{{pts\\:hms}}':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6,tile=8x{int(dur // pas // 8) + 1}",
                    "-frames:v", "1", str(out / "images.jpg")], check=True)
    head = base / "assets" / "head.webm"
    if head.exists():
        vignettes = []
        for t in range(0, int(dur), 2):
            try:
                v = detourer_visage(image_a(head, t, alpha=True)).resize((220, 220))
            except Refus:
                continue
            fond = Image.new("RGBA", v.size, ENCRE)
            fond.alpha_composite(v)
            ImageDraw.Draw(fond).text((6, 4), f"{t}s", fill="white", font=font(F_MONO, 22))
            vignettes.append(fond)
        if vignettes:
            cols = 8
            pl = Image.new("RGB", (cols * 224, ((len(vignettes) - 1) // cols + 1) * 224), "white")
            for i, v in enumerate(vignettes):
                pl.paste(v.convert("RGB"), ((i % cols) * 224, (i // cols) * 224))
            pl.save(out / "visages.jpg", quality=88)
    modele = base / "cover.json"
    if not modele.exists():
        modele.write_text(json.dumps({"titre": ["Ligne une", "ligne *deux*"], "tag": "CATÉGORIE", "logo": None,
                                      "image_t": 10, "visage_t": 4}, ensure_ascii=False, indent=1) + "\n")
    print(f"planches : {out}/images.jpg (horodatage en haut à gauche) et {out}/visages.jpg")
    print(f"remplis {modele} puis relance sans --planche")


def main():
    ap = argparse.ArgumentParser(description="couverture de reel, direction C")
    ap.add_argument("montage")
    ap.add_argument("--planche", action="store_true")
    ap.add_argument("--sortie")
    ap.add_argument("--config", help="autre cover.json (tests)")
    a = ap.parse_args()
    try:
        base = dossier(a.montage)
        if a.planche:
            return planche(base)
        cfg_path = Path(a.config) if a.config else base / "cover.json"
        if not cfg_path.exists():
            raise Refus(f"{cfg_path} manquant : lance d'abord --planche")
        cfg = json.loads(cfg_path.read_text())
        valider(cfg)
        im = composer(base, cfg)
        cible = Path(a.sortie) if a.sortie else base / "cover.jpg"
        if not a.sortie and cible.exists():
            cible.rename(base / f"cover-avant-{time.strftime('%Y%m%d-%H%M%S')}.jpg")
        im.save(cible, quality=92)
        print(cible)
    except (Refus, subprocess.CalledProcessError) as e:
        sys.exit(f"cover.py : {e}")


if __name__ == "__main__":
    main()
