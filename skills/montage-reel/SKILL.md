---
name: montage-reel
description: Chaîne de montage d'un reel dans le studio : nettoyage de la voix, aperçu, storyboard, animations dans le moteur canvas, rendu, critique, couverture et contrôles. À utiliser pour monter, remonter, corriger ou rendre une vidéo, ou générer sa couverture.
---

# Montage d'un reel

Lis `AGENTS.md`, `voice.md` et `style/REGLES.md`. En cas de conflit, `style/REGLES.md` gagne sur ce skill.

La prise est dans `takes/<id>/`, le projet dans `projects/<id>.json`, le montage dans `edits/<id>/`. Regarde ce qui existe avant d'écrire : on ne remplace jamais une vidéo, on crée une version suivante.

## Déroulé

1. **Nettoyer la voix**, au début et à chaque modification, selon `style/REGLES.md`.
2. **Aperçu rapide** facecam et voix après chaque nouvelle liste de coupes. Donne le chemin et attends la validation avant de continuer.
3. **Préparer** : `python3 scripts/preparer-montage.py <id> <prise nettoyée> --mots mots.json` crée `edits/<id>/assets/` et copie le gabarit dans `src/` (`head.part`, `_helpers.js`, `scenes.part`, `tail.part`). `head.webm` (tête détourée) est optionnel. Le moteur attend les noms `H`, `STATES`, `FULL`, `FC`, `finale`, `glitch`, `scene` dans `scenes.part`, garde-les.
4. **Storyboard** en tableau. Consulte `moteur/bib/catalogue.jpg` et `moteur/bib/README.md` avant d'écrire une scène. Un objet nouveau s'écrit dans le montage ; s'il resert, promeus-le dans `moteur/bib/objets/`.
5. **Images de contrôle** par scène : `node moteur/reel.mjs --edit edits/<id> --images 3.2,12,45` (sortie dans `qa/moteur`).
6. **Rendu** : `moteur/rendu-reel.sh edits/<id> renders/raw.mp4`.
7. **Critique** par un sous-agent sans contexte (P0, P1, P2). Corrige tous les P0.
8. **Mixage de livraison** avec la commande de `style/REGLES.md`, puis vérifie la durée avec `ffprobe`.
9. **Couverture** : `python3 scripts/cover/cover.py <id> --planche`, remplis `edits/<id>/cover.json`, relance sans `--planche` (voir `scripts/cover/README.md`).
10. **Contrôles** de `style/REGLES.md`, puis livre le chemin de `final.mp4`. N'annonce pas un retour résolu sans avoir regardé le rendu.

## Technique

- Tout se dessine dans le canvas : pas de DOM, CSS, SVG ni GSAP en scène. Les images passent par `new Image()`.
- Polices fournies : Archivo Black, Montserrat, IBM Plex Mono, plus celles de `moteur/fonts/perso/`.
- Le moteur remet le canvas à zéro à chaque image (`width`), sinon skia-canvas empile les opérations.

## Après

Ne publie rien sans accord explicite. Pour programmer : skill `publication-zernio`.
