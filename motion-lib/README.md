# Bibliothèque motion éditoriale

Composants de motion design pour les vidéos YouTube en 1920×1080 à 30 images/s. Le style est éditorial et épuré :

- fond papier clair ou noir profond ;
- titres en Geist italique très gras, libellés en Geist Mono espacé ;
- un seul accent ambré (`#F0882A`) ;
- grille discrète, grain léger, mouvements en ressort.

Le dessin repose sur skia-canvas, et les images sont envoyées directement à ffmpeg.

## Démarrage

```bash
cd motion-lib
node rendu.mjs --planche                      # rendus/planche.jpg : une vignette par scène
node rendu.mjs --scene photos --t 1,2.5,4     # rendus/qa/photos-1.00.jpg, etc.
node rendu.mjs --video                        # rendus/demo.mp4 (bobine complète, environ 52 s)
node rendu.mjs --video --de 10 --a 20 --sortie extrait.mp4
```

Le rendu tourne sur le CPU par défaut. `GPU=1 node rendu.mjs --video` active le GPU de skia-canvas.

## Principes

- **Signature commune :** chaque composant s'appelle `fn(c, th, t, options)`.
  - `c` est le contexte 2D ;
  - `th` est le thème (`CLAIR` ou `SOMBRE`) ;
  - `t` est le temps local en secondes depuis l'apparition du composant.
- **Décaler une apparition :** passer `t - 0.4` fait entrer le composant 0,4 s plus tard. Un temps négatif ne dessine rien.
- **Ordre d'une image :** `fond` → composants → `volet` éventuel → `finition` (grain).
- **Remise à zéro :** remettre le canvas à zéro à chaque image (`cv.width = W`). Sans cela, skia-canvas accumule les opérations et ralentit.

## Thèmes et jetons (`lib/tokens.mjs`)

| Jeton | CLAIR | SOMBRE |
|---|---|---|
| `bg` | `#EDEBE5` | `#0C0C0B` |
| `encre` | `#0B0B0B` | `#F4F2EC` |
| `mut` (texte secondaire) | `#8C877D` | `#8A867E` |
| `dim` (estompé) | `#BEB9AE` | `#45433F` |
| `carte` | `#F7F6F2` | `#171715` |
| `acc` / `acc2` / `accFort` | `#F0882A` / `#F6B04A` / `#E2701A` | idem |

Autres constantes : `W = 1920`, `H = 1080`, `FPS = 30`, `TITRE = "Geist"`, `MONO = "Geist Mono"`. `polices(FontLibrary)` enregistre les polices du dossier `fonts/`.

## Catalogue

### Cadre (`lib/cadre.mjs`)

| Composant | Rôle |
|---|---|
| `fond(c, th, t, { grille, vignette })` | Fond du thème, grille de 64 px, vignette. |
| `finition(c, th, t)` | Grain animé, à appeler en dernier. |
| `onde(c, th, t, { y, amp, alpha, entree, epaisseur })` | Ruban ambré ondulant en arrière-plan, avec halo et particule. |
| `hud(c, th, t, { hg, hd, bg, bd, marge, tc0 })` | Libellés mono dans les quatre coins ; timecode automatique en haut à droite. |
| `volet(c, th, p, { sens })` | Transition : `p` de 0 à 1 couvre l'écran, de 1 à 2 le découvre. |

### Typographie (`lib/typo.mjs`)

| Composant | Rôle |
|---|---|
| `surtitre(c, th, t, s, x, y, { col, sz, ls, duree, align, puce })` | Petit libellé en capitales, révélé lettre à lettre avec brouillage. |
| `titre(c, th, t, lignes, x, y, { sz, w, inter, decalage, align, couleur, italique })` | Titre multiligne qui monte depuis un masque. Format : `[[["Texte "], ["mot", "acc"]], ...]`. |
| `motGeant(c, th, t, s, x, y, { sz, col, pointAcc, align, decalage, flou })` | Très grand mot lettre par lettre ; `pointAcc` colore la ponctuation finale. |
| `soulignement(c, th, t, x, y, w, { col, lw, duree, courbe })` | Trait d'accent légèrement incurvé qui se dessine. |
| `section(c, th, t, num, libelle, cx, y, { sz })` | Numéro de chapitre « 03 » avec libellé et filets. |
| `compteur(c, th, t, { de, a, dec, prefixe, suffixe, x, y, sz, duree, libelle, align, col, colSuffixe })` | Chiffre qui défile jusqu'à sa valeur, au format français. |
| `bandeauNom(c, th, t, nom, role, x, y, { sz, fondCarte })` | Bandeau nom et rôle avec barre d'accent. |
| `sousTitre(c, th, t, mots, cx, y, { sz, w, maxW })` | Sous-titres karaoké : mots dits en encre, mots clés en accent soulignés. |
| `minuter(phrase, t0, cadence)` | Prépare les mots de `sousTitre` ; `*mot*` marque un accent. |

### Données (`lib/donnees.mjs`)

| Composant | Rôle |
|---|---|
| `courbeCroissance(c, th, t, { x, y, w, h, valeurs, xs, titre, etiquette, bande, libBande, duree })` | Courbe qui se trace, bande de période et pastille finale pulsée. |
| `courbeEasing(c, th, t, { x, y, w, h, c1, c2, duree })` | Courbe de Bézier façon éditeur d'animation, avec poignées. |
| `comparatif(c, th, t, { x, y, w, h, n, a, b, jusque, libelle, duree })` | Deux courbes qui divergent, avec écart surligné. |
| `barres(c, th, t, { x, y, w, h, valeurs, libelles, max, fort, unite })` | Histogramme en ressort ; `fort` met une barre en accent. |
| `chrono(c, th, t, { x, y, r, fraction, duree })` | Cadran de montre avec arc de progression. |
| `reseau(c, th, t, { x, y, w, h, noeuds, source, pas, duree })` | Points reliés qui s'allument de proche en proche. |

### Cartes et médias (`lib/cartes.mjs`)

| Composant | Rôle |
|---|---|
| `carteOutil(c, th, t, { x, y, w, h, nom, sous, badge, lettre, coul })` | Carte d'outil avec pictogramme, nom, sous-titre et badge. |
| `pastilles(c, th, t, { x, y, w, items, titre, sz, decalage })` | Nuage de pastilles en flux, avec rubrique et compteur. |
| `eventailPhotos(c, th, t, { cx, cy, images, w, h, angles, ecart, libelle, foyers })` | Photos inclinées en éventail, entrée en ressort. |
| `panneauVideo(c, th, t, { x, y, w, h, image, r, libelle, repere, zoom, fx, fy })` | Cadre vidéo arrondi, zoom lent, pastille « en direct ». |
| `etapes(c, th, t, { x, y, items, pas, actif, decalage })` | Étapes numérotées reliées par un fil ; `actif` met une étape en avant. |

### Outils bas niveau

- **`lib/anim.mjs` :** `clamp`, `lerp`, `prog(t, t0, d)`, courbes `eo`, `eio`, `expo`, `quint`, `back`, ressort amorti `ressort(t, t0, f, z)`, `rnd`, `bruit`, `vie(t, duree, entree, sortie)`.
- **`lib/dessin.mjs` :** `texte` (renvoie la largeur), `mesure`, `titreF`, `monoF`, `police`, `rrect`, `point` (avec halo), `cercle`, `ligne`, `masque`, `couvrir` (image en mode cover), `lisser`, `tracer` (tracé partiel à vitesse constante), `grain`.

## Intégrer la bibliothèque dans une vidéo YouTube

1. **Importer** depuis un moteur de montage :
   ```js
   import { CLAIR, SOMBRE, polices, fond, finition, titre, motGeant } from "../motion-lib/index.mjs";
   ```
2. **Décrire chaque séquence** comme un objet `{ nom, th, duree, f(c, th, t, medias) }`. Voir `demo/scenes.mjs`, qui contient dix exemples.
3. **Alterner** les thèmes clair et sombre d'une séquence à l'autre. Le `volet` fait la liaison : 0,35 s pour couvrir, 0,35 s pour découvrir.
4. **Pour la facecam**, deux options :
   - placer la vidéo dans `panneauVideo` ;
   - superposer les graphismes avec un fond transparent (ne pas appeler `fond`), puis composer avec ffmpeg.
5. **Caler les sous-titres** avec `minuter`, ou passer directement les temps de mots issus d'une transcription (`[{ s, t0, acc }]`).

## Règles de style

- Un seul accent par écran : un mot, un point ou une courbe. Jamais de grands aplats orange.
- Marges de 128 à 150 px ; texte aligné à gauche, sauf pour les chiffres centrés.
- Hiérarchie de base : surtitre mono, titre italique, puis mot géant ou chiffre.
- Les entrées s'enchaînent toutes les 0,1 à 0,3 s. Pas de fondu seul : chaque élément monte, se trace ou rebondit.
