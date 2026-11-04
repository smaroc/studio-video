# Studio vidéo

Ce dépôt contient un studio local de tournage et de montage de reels. La page web sert à tourner, relire et programmer. Le montage lui-même est fait par un agent de code (Claude Code ou Codex) à partir des prompts que la page copie.

## À lire avant de monter

1. `voice.md` : la voix du créateur, créée à l'installation.
2. `style/REGLES.md` : ses règles de montage et sa charte. Elles priment sur tes habitudes.
3. `moteur/bib/README.md` et `moteur/bib/catalogue.jpg` : les objets déjà dessinés.
4. `studio.config.json` : identité, réseaux et Zernio.

Si `voice.md` ou `studio.config.json` manque, lance d'abord le skill `installation-studio`.

## Où sont les choses

| dossier | contenu |
|---|---|
| `desk/` | le serveur local et la page, sans dépendance |
| `moteur/` | le moteur de rendu (skia-canvas, ffmpeg), le gabarit de montage (`moteur/gabarit/`) et la bibliothèque d'objets |
| `motion-lib/` | une seconde bibliothèque de scènes pour le format horizontal |
| `sfx-kit/`, `sons-openverse/` | bruitages sous licence CC0 |
| `scripts/cover/` | le générateur de couvertures |
| `scripts/preparer-montage.py` | crée `edits/<id>/` à partir d'une prise et du gabarit |
| `skills/` | les skills de l'agent, installés par `scripts/installer-skills.sh` |
| `projects/`, `takes/`, `edits/`, `captures/` | les données locales, jamais versionnées |

## Règles fixes

- Ne jamais écraser une vidéo ni un projet : regarder d'abord, puis créer une nouvelle version.
- Ne jamais publier ni programmer sans accord explicite de l'utilisateur.
- Tout le montage passe par le moteur : `node moteur/reel.mjs --edit <dossier> --images 3.2,12` pour contrôler, `moteur/rendu-reel.sh <dossier> renders/raw.mp4` pour rendre.
- Ne jamais écrire une clé d'API dans un fichier versionné.
