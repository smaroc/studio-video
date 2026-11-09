---
name: installation-studio
description: Installe, met à jour et personnalise le studio vidéo : téléchargement de la dernière version, outils, dépendances du moteur, transcription locale, config, voix et style. À utiliser à la première installation, quand l'utilisateur veut mettre à jour le studio, ou changer son identité, sa voix, sa charte ou son compte Zernio.
---

# Installation

Avance une étape à la fois, à partir de la racine du studio. Saute ce qui est déjà en place. Ne demande jamais à l'utilisateur de coller une clé d'un service tiers dans la conversation. La seule exception est sa clé d'accès au studio (étape 0), qui ne sert qu'au téléchargement.

## 0. Récupérer le studio

Le studio est là si le dossier courant, ou `~/studio-video`, contient `desk/server.mjs`. Dans ce cas, place-toi dedans et passe à l'étape 1.

Sinon, demande la clé d'accès reçue dans le mail d'achat, puis lance :

```bash
curl -fsSL https://go.sophieneia.com/studio/installer.sh | bash -s <clé>
```

Place-toi ensuite dans `~/studio-video` et continue. La clé est gardée sur la machine, il n'y aura plus à la donner. Si elle est refusée, demande à l'utilisateur de vérifier son mail d'achat et de contacter le support s'il ne la trouve pas.

## Mettre à jour

Quand l'utilisateur demande une mise à jour, lance cette ligne, sans clé :

```bash
curl -fsSL https://go.sophieneia.com/studio/installer.sh | bash
```

La mise à jour ne touche jamais aux prises, aux projets, à `studio.config.json` ni à `voice.md`, et ne remplace aucun fichier modifié par l'utilisateur. Pour chaque fichier gardé, la version neuve est posée dans `.studio/nouveautes/` : compare les deux, propose la fusion, applique-la seulement avec son accord, puis supprime la copie. Relance `cd moteur && npm install` si `moteur/package.json` a changé, puis le serveur du studio.

## 1. Outils

Vérifie `node -v` (20 ou plus), `ffmpeg -version`, `ffprobe -version`, `python3 --version`. Propose d'installer ce qui manque avec le gestionnaire de paquets de la machine. Puis :

```bash
cd moteur && npm install
python3 -m pip install pillow
```

Pour `scripts/cover/cover.py`, le détourage du visage demande aussi un fichier `assets/head.webm` dans le montage.

## 2. Transcription locale (facultative)

Le prompteur suit la voix par la reconnaissance du navigateur (Chrome). Sur Safari, le studio passe par whisper.cpp :

```bash
whisper-server -m <modèle ggml> -l fr --host 127.0.0.1 --port 4319 -t 6 -nt
```

L'adresse se change avec la variable `WHISPER_URL`.

## 3. Identité

Copie `studio.config.example.json` en `studio.config.json` (fichier ignoré par git), puis demande et remplis : nom du studio, prénom, pseudo, langue, fuseau, réseaux visés, piliers de contenu, couleurs de couverture.

## 4. Voix

Demande 3 à 5 textes écrits ou transcriptions du créateur. Écris `voice.md` : ton, longueur de phrase, tics à garder, mots à éviter, façon d'accrocher, façon de conclure, 3 extraits types. Fais-le relire et corriger.

## 5. Style

Parcours `style/REGLES.md` avec l'utilisateur et remplace les valeurs par défaut : charte, polices (`moteur/fonts/perso/`), vidéos de référence, ce qu'il faut éviter, accélération.

## 6. Zernio (facultatif)

Sans Zernio, tout marche sauf la programmation, le planning et les statistiques.

1. L'utilisateur crée un compte sur zernio.com, connecte ses réseaux et génère une clé.
2. Il écrit lui-même sa clé dans `~/.config/zernio/.env` (`ZERNIO_API_KEY=...`).
3. Récupère les identifiants avec `GET https://zernio.com/api/v1/accounts` et `GET https://zernio.com/api/v1/profiles` (en-tête `Authorization: Bearer`), puis remplis `zernio.profil` et `zernio.comptes` dans `studio.config.json`.
4. Remplis `dm` si l'utilisateur veut des automatisations commentaire vers message privé.

## 7. Lancement

```bash
scripts/installer-skills.sh
node desk/server.mjs
```

La page s'ouvre sur http://127.0.0.1:4318. Fais une prise de test de 10 secondes pour valider caméra et micro.
