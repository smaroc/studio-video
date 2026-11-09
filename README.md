# Studio vidéo

Un studio local pour tourner et monter des reels avec un agent de code. Tu tournes dans la page avec le prompteur, tu relis, et Claude Code ou Codex monte en code. Rien ne part sur un serveur tiers, sauf si tu branches Zernio pour programmer tes posts.

L'interface est en français. Le studio n'a été testé que sur macOS : Linux devrait suivre, avec quelques ajustements possibles (notifications, micro, polices).

## Ce que ça fait

- **Tournage** : caméra et micro dans le navigateur, prompteur qui suit la voix, prises enregistrées en local.
- **Relecture** : retours horodatés sur chaque version, comparaison des versions.
- **Montage** : la page copie un prompt à coller dans ton agent. Il nettoie la voix, anime en code, puis rend la vidéo.
- **Moteur** : rendu canvas (skia-canvas et ffmpeg) à 60 i/s, avec une bibliothèque d'objets réutilisables.
- **Couverture** : générateur `scripts/cover/cover.py`.
- **Programmation** (facultative) : Zernio pour les posts, la couverture et les automatisations commentaire vers message privé, plus le planning et les statistiques.
- **Bruitages** : environ 320 sons sous licence CC0.

## Démarrage

Il faut Node 20 ou plus, ffmpeg, Python 3 et Chrome. Ensuite :

```bash
curl -fsSL https://raw.githubusercontent.com/smaroc/studio-video/main/installer.sh | bash
```

Ouvre `~/studio-video` dans ton agent et tape `/installation-studio` : il vérifie les outils et t'aide à créer ta voix, ton style et ta config.

Pour récupérer la dernière version plus tard, sans perdre tes vidéos ni tes réglages, relance la même ligne.

Si tu préfères tout faire à la main, depuis `~/studio-video` :

```bash
cd moteur && npm install && cd ..
```

```bash
cp studio.config.example.json studio.config.json
```

```bash
scripts/installer-skills.sh
```

```bash
node desk/server.mjs
```

Ouvre http://127.0.0.1:4318. Le port se change avec la variable `PORT`.

## Personnaliser

| quoi | où |
|---|---|
| nom, pseudo, fuseau, réseaux, piliers, couleurs de couverture | `studio.config.json` |
| ta façon de parler | `voice.md`, créé à l'installation |
| tes règles de montage, ta charte, ton accélération | `style/REGLES.md` |
| tes objets animés | `moteur/bib/objets/` (voir `moteur/bib/README.md`) |
| tes polices | `moteur/fonts/perso/` |
| tes logos de couverture | `scripts/cover/logos/` |
| le comportement de l'agent | `skills/` et `AGENTS.md` |

`studio.config.json`, `voice.md` et tes vidéos sont ignorés par git : ils restent sur ta machine, même si tu versionnes le studio dans un dépôt privé.

## Connecter Zernio

Sans Zernio, le tournage et le montage marchent normalement. La programmation, le planning et les statistiques restent inactifs.

1. Crée un compte sur [zernio.com](https://zernio.com), connecte tes réseaux et génère une clé d'API.
2. Mets la clé dans `~/.config/zernio/.env`, jamais dans le dépôt :

   ```
   ZERNIO_API_KEY=ta_cle
   ```

3. Renseigne les identifiants dans `studio.config.json` :

   ```json
   "zernio": {
     "profil": "id du profil",
     "comptes": {"instagram": "id", "tiktok": "id", "youtube": "id"}
   }
   ```

4. Relance le studio. Pour les automatisations de messages privés, remplis aussi le bloc `dm`.

Le bouton Programmer affiche toujours un récapitulatif et demande une confirmation avant l'envoi.

## Structure

```
desk/            serveur local et page, sans dépendance
moteur/          moteur de rendu, gabarit de montage (moteur/gabarit) et bibliothèque d'objets
motion-lib/      scènes pour le format horizontal
sfx-kit/         bruitages CC0
sons-openverse/  bruitages CC0 (provenance dans le dossier)
scripts/cover/   générateur de couvertures
scripts/preparer-montage.py  crée edits/<id>/ à partir d'une prise et du gabarit
skills/          skills de l'agent
style/           tes règles de montage
```

## Sécurité

Le serveur écoute uniquement sur 127.0.0.1 et n'a pas d'authentification. Ne l'expose pas sur un réseau.

## Licences

Le studio est vendu sous licence d'utilisation : tu peux le modifier pour ton usage et exploiter librement tes vidéos, mais pas le revendre ni le partager. Voir [LICENSE](LICENSE), et [NOTICE.md](NOTICE.md) pour les polices, les sons et les marques.
