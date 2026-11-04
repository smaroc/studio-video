# bibliothèque du moteur

Les objets de `objets/` (un fichier par fonction) sont ajoutés automatiquement à chaque montage, après `_helpers.js`, par `reel.mjs` et par `src/build.sh`. Planche visuelle : `catalogue.jpg` (régénérer avec `node moteur/bib/catalogue.mjs`).

## règles

- Avant d'écrire une scène, regarder `catalogue.jpg` et appeler les objets existants plutôt que les redessiner.
- Rien n'oblige à s'en servir : un objet complètement nouveau s'écrit directement dans `src/_helpers.js` ou `src/scenes.part` du montage, comme avant.
- Le montage gagne toujours : s'il déclare une fonction du même nom (function, const, let), la version de la bibliothèque est retirée pour ce montage. On peut donc redéfinir `fenetre` ou `terminal` localement sans rien casser.
- Un objet nouveau qui sert dans un deuxième reel est promu : on le copie dans `objets/<nom>.js` (paramétrable, sans texte propre à un reel), puis on ajoute son exemple dans `catalogue.mjs`.
- La mise en scène reste sur mesure : la bibliothèque fournit des objets, jamais des scènes entières.

## objets

| objet | appel |
|---|---|
| fenetre | `fenetre(c, x, y, w, h, url, sombre)` ; contenu à partir de y + 58 |
| terminal | `terminal(c, x, y, w, h, [[texte, couleur, t0]], t, dossier)` |
| iphone | `iphone(c, x, y, w, h)` |
| badge, popBadge | `badge(c, x, y, s, "claude" \| "ig" \| autre = github)`, `popBadge(c, t, t0, x, y, s, kind)` |
| personne | `personne(c, x, y, s, col)` |
| pointe, croix, cadenas | `pointe(c, x, y, angle, col, s)`, `croix(c, x, y, s, col)`, `cadenas(c, x, y, s, col)` |
| compte | `compte(1284567)` donne « 1 284 567 » |
| batiment, camion, roue | `batiment(c, x, sol, w, h, col)`, `camion(c, x, y, s, col, rotationRoues)` ; illustré réaliste |
| ombreSol, rond, teinte | `ombreSol(c, x, y, rx, ry, alpha)`, `rond(c, x, y, r, col)`, `teinte(hex, k)` (k > 0 éclaircit) |
| tweet | `tweet(c, x, y, w, { nom, pseudo, date, img, lignes, surligne, stats }, t, t0)` ; surlignage ligne par ligne ; renvoie la hauteur |
| notifIOS | `notifIOS(c, x, y, w, { app, titre, texte, quand }, t, t0)` ; descend du haut à t0 ; app : claude, ig, gmail |
| gmail, gmailM | `gmail(c, x, y, w, h, [{ de, objet, extrait, heure, nonLu, t0 }], t)` ; `gmailM(c, s)` = logo seul |
| courbe | `courbe(c, x, y, w, h, valeurs, t, t0, t1, { col, max, etiquette })` ; se trace avec bulle de valeur |
| editeur | `editeur(c, x, y, w, "fichier", [[[texte, couleur, flou]]], t, ligneRouge, p, numDebut)` ; renvoie la hauteur |

## lot 3 (style @nicolas_ia_lab_club, reel De48GiYg6tm)
| objet | signature | rôle |
|---|---|---|
| chrono | `chrono(c, x, y, r, p, { col, temps, max })` | chronomètre, secteur orange rempli selon p |
| revenus | `revenus(c, x, y, w, h, { titre, sous, de, a, pts, paiements, devise }, t, t0, t1)` | tableau sombre : montant qui compte, aire, paiements qui tombent |
| devis | `devis(c, x, y, w, { numero, titre, sous, lignes, total, angle }, t, t0)` | ticket de devis penché, lignes une à une |
| polaroid | `polaroid(c, x, y, w, img, legende, angle, t, t0)` | photo instantanée « FIG. 1 · … » qui tombe |
| neon | `neon(c, s, x, y, sz, t, { col, t0, italique, police })` | texte néon qui s'allume en clignotant |
| promptBar | `promptBar(c, x, y, w, texte, t, t0, t1, { clair })` | barre de prompt tapée, bouton d'envoi |
| titreEdito | `titreEdito(c, x, y, { kicker, amorce, gros, sous, accent, taille }, t, t0)` | bloc titre éditorial ferré à gauche |
| statCarte | `statCarte(c, x, y, [[sur, valeur, légende, col]], t, t0)` | carte de chiffres avant / après |
| vague | `vague(c, x, y, w, amp, t, { col, epaisseur, longueur, vitesse, alpha })` | ligne ondulante de décor |
| timeline | `timeline(c, x, y, w, h, pistes, t, { tete, titre, t0 })` | timeline de montage, clips colorés |
| toastSombre | `toastSombre(c, x, y, { sur, titre, detail, icone }, t, t0)` | pastille sombre posée sur la vidéo |
