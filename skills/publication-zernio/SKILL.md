---
name: publication-zernio
description: Programme une vidéo finie sur les réseaux par l'API Zernio, avec couverture et automatisations de commentaires. À utiliser quand l'utilisateur veut publier, programmer ou mettre en ligne un montage.
---

# Publication par Zernio

La voie normale est le bouton **Programmer** de l'onglet retours : il préremplit tout depuis `edits/<id>/fiche/`, affiche un récapitulatif et demande une confirmation. Propose-le d'abord.

## Si l'utilisateur veut passer par toi

Tu passes par le serveur local, qui gère les envois, les posts et les automatisations (`desk/programmer.mjs`).

1. Vérifie : `final.mp4` et `cover.jpg` présents dans `edits/<id>/`, `zernio` rempli dans `studio.config.json`, clé dans `ZERNIO_API_KEY` ou `~/.config/zernio/.env`.
2. Lis l'état avec `GET /api/programmation/<id>`. Si `deja` est renseigné, signale que le post existe déjà.
3. Montre à l'utilisateur la vidéo, la date avec le fuseau, les réseaux, la légende et le mot-clé. **Attends un oui explicite.**
4. Envoie `POST /api/programmation/<id>` avec `video`, `date`, `reseaux`, `caption`, `titreYoutube`, `motCle`, `messageDm`, `nom`, `remplacer`.
5. Donne les identifiants renvoyés, et toute `alerte` telle quelle.

## Sans Zernio

Donne le chemin de `final.mp4`, de `cover.jpg` et la légende : l'utilisateur publie à la main.

N'écris jamais la clé dans un fichier versionné ni dans la conversation.
