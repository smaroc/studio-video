---
name: studio-video
description: Point d'entrée de tout travail vidéo dans le studio. Aiguille vers installation-studio, montage-reel ou publication-zernio, et reprend le projet en cours. À utiliser quand l'utilisateur parle de montage, prise, reel, short, couverture ou programmation.
---

# Aiguillage

1. Si la conversation porte déjà sur un montage, continue-le avec le skill en cours : applique la demande sans repartir de zéro.
2. Sinon, choisis un seul skill :
   - première fois, outils, voix, compte Zernio, `studio.config.json` ou `voice.md` manquant : `installation-studio` ;
   - prise à monter, modification, rendu, couverture : `montage-reel` ;
   - publier ou programmer une vidéo finie : `publication-zernio`.
3. Si la demande reste ambiguë, pose une seule question.

Annonce en une ligne le skill choisi, puis suis-le.
