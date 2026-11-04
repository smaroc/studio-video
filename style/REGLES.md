# Mes règles de montage

Ce fichier est à toi. L'agent le lit avant chaque montage, et ce qui est écrit ici prime sur tout le reste. Les valeurs ci-dessous sont un point de départ qui fonctionne : garde, change ou supprime ce que tu veux.

## Ma charte

- Fond : `#F0EDE6`
- Encre : `#1F1B16`
- Accent (un seul) : `#D9643A`
- Gris : `#7A6F63`
- Polices : Archivo Black pour les titres et les chiffres, Montserrat 600 à 800 pour le texte, IBM Plex Mono pour les étiquettes.

Pour une autre police, dépose le `.ttf` dans `moteur/fonts/perso/` : le nom du fichier devient le nom de la famille. La couverture lit ses couleurs dans `couverture` de `studio.config.json`.

## Mon style

Décris ici ce que tu aimes, avec des exemples concrets. Exemple : « fond clair, beaucoup d'interfaces réalistes, jamais de néon, humour pince-sans-rire ».

- À faire :
- À éviter :
- Vidéos de référence :

## Voix : à refaire à chaque modification

1. Retranscrire en fenêtres de 6 s qui se chevauchent, comparer au script.
2. Couper les redites, les faux départs et les blancs. Garder une respiration de 0,10 à 0,20 s.
3. Couper au creux de l'énergie (blocs de 40 ms), avec un micro fondu de 10 à 20 ms.
4. Retranscrire pour valider, puis recaler les animations.

Livrer un aperçu rapide (facecam et voix) après chaque nouvelle liste de coupes, et attendre la validation avant le rendu complet.

## Mise en scène

- Chaque phrase a sa métaphore, calée sur le mot. On garde le style d'une vidéo à l'autre, jamais les scènes.
- Aucune coupure à l'intérieur d'une animation.
- Trois états d'écran : plein visage, plein animation, split (animation en haut, carte visage en bas). Passage glissé d'environ 0,55 s.
- Un événement visuel toutes les 0,5 s dans le hook, pas de temps mort de plus de 0,8 s ensuite.
- La frame 0 sert de couverture : titre choc, visuel, visage.
- Sorties en douceur (ease out) et ressorts. Pas de rebond gratuit ni de fondu générique.
- Toute interface montrée utilise des données fictives, et tout chiffre affiché doit être vrai.

## Zones sûres (vertical 1080 × 1920)

- Infos clés sous y 280. Une couche secondaire reste permise de y 90 à 280.
- Bas recouvert au-delà de y 1400.
- Droite recouverte au-delà de x 915, de y 1000 à 1750.

## Sous-titres

1 à 3 mots, sans bandeau, mot actif dans la couleur d'accent, jamais sur le visage.

## Son

- Viser -15 LUFS à la livraison.
- Bruitages discrets, sous la voix, sur une action réelle : `sfx-kit/` et `sons-openverse/`.
- Musique : à toi de décider.

Accélération de livraison (mets 1.00 pour ne rien changer) : `1.05`

```bash
ffmpeg -i renders/final.mp4 -i assets/voice.wav -i assets/sfx.wav -filter_complex "[0:v]setpts=PTS/1.05,fps=60[v];[1:a][2:a]amix=inputs=2:normalize=0:duration=first,atempo=1.05,loudnorm=I=-15:TP=-1.5:LRA=11,aresample=48000[a]" -map "[v]" -map "[a]" -c:v libx264 -crf 17 -pix_fmt yuv420p -c:a aac -b:a 256k final.mp4
```

## Méthode

1. Storyboard en tableau : temps, phrase, état d'écran, métaphore.
2. Une image de contrôle par scène avant tout rendu complet.
3. Rendu, puis critique par un agent sans contexte (P0, P1, P2). Corriger tous les P0.

## Contrôles avant de livrer

Frame 0, chevauchements, planche contact, `silencedetect`, `ffprobe`, loudness, honnêteté des chiffres, zones sûres.
