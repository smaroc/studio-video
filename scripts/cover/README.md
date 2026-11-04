# Couverture de reel : cover.py

Le script écrit `edits/<id>/cover.jpg` (1080 × 1920). C'est ce fichier que le bouton Programmer envoie à Zernio. Il n'appelle jamais Zernio lui-même et ne publie rien.

Il demande Python 3 et Pillow, et `ffmpeg` pour extraire les images.

## Personnaliser

Les couleurs viennent de `couverture` et la signature de `pseudo` dans `studio.config.json`.

Aucun logo n'est fourni. Dépose tes PNG dans `logos/` (`logos/monapp.png`), puis appelle-les par leur nom. Vérifie que tu as le droit d'utiliser les marques que tu y mets.

## Étapes

1. `python3 scripts/cover/cover.py <id> --planche` crée les planches `edits/<id>/cover-choix/images.jpg` et `visages.jpg`, ainsi qu'un modèle `edits/<id>/cover.json`.
2. Remplis `cover.json` :
   - `titre` : 2 lignes, 17 caractères maximum par ligne, un seul groupe entre `*` passe en couleur d'accent ;
   - `tag` : catégorie en capitales, 16 caractères maximum ;
   - `logo` : nom d'un fichier de `logos/`, ou `null` ;
   - `image_t` : seconde de `final.mp4` où le visuel clé est complet ;
   - `image_box` (facultatif) : `[x0, y0, x1, y1]` dans l'image, sinon recadrage automatique ;
   - `visage_t` : seconde de `assets/head.webm`, yeux ouverts et regard caméra, ou `visage` avec un PNG détouré ;
   - `logo_app` (facultatif) : un grand logo remplace l'image clé, et `image_t` devient facultatif ;
   - `barre` (facultatif, avec `logo_app`) : `true` pose une croix sur le logo.
3. `python3 scripts/cover/cover.py <id>` : l'ancienne couverture est gardée en `cover-avant-<date>.jpg`.

Le titre, le groupe coloré et le logo sont vérifiés : un titre trop long ou un logo inconnu est refusé. L'essentiel tient entre y 240 et y 1680, la zone visible dans la grille du profil.
