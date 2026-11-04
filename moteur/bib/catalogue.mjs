// planche catalogue de la bibliothèque : chaque objet dessiné une fois avec un exemple d'appel, sur la charte du gabarit
//   node moteur/bib/catalogue.mjs   (écrit moteur/bib/catalogue.jpg)
import { Canvas, Path2D, FontLibrary } from "skia-canvas";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url)), REF = path.resolve(ICI, "../gabarit/src");
const F = path.resolve(ICI, "../fonts");
FontLibrary.use("Archivo Black", [path.join(F, "archivoblack.ttf")]);
FontLibrary.use("Montserrat", [path.join(F, "Montserrat-VariableFont_wght.ttf"), path.join(F, "Montserrat-Italic-VariableFont_wght.ttf")]);
FontLibrary.use("IBM Plex Mono", ["plexmono-500", "plexmono-600", "plexmono-700"].map((n) => path.join(F, n + ".ttf")));

// exemples : [titre, appel] ; l'appel dessine dans une case de 480 × 420 dont l'origine est en haut à gauche
const EX = [
  ["fenetre", `fenetre(c, 20, 40, 440, 320, "github.com/nom/repo")`],
  ["fenetre sombre", `fenetre(c, 20, 40, 440, 320, "vercel.com", true)`],
  ["terminal", `terminal(c, 10, 20, 460, 390, [["> npm run build", "#fff", 0], ["✓ compilé en 2,1 s", "#4ADE80", 0]], 9, "~/boutique")`],
  ["iphone", `iphone(c, 120, 10, 240, 400)`],
  ["badge claude", `badge(c, 150, 210, 140, "claude"); badge(c, 330, 210, 140, "ig")`],
  ["popBadge (entrée)", `popBadge(c, 0.25, 0, 240, 210, 150, "claude")`],
  ["personne", `personne(c, 140, 230, 140, C.ink); personne(c, 340, 230, 140, C.org)`],
  ["pointe, croix, cadenas", `pointe(c, 100, 210, 0, C.org, 50); croix(c, 240, 210, 90, C.red); cadenas(c, 380, 220, 120, C.ink)`],
  ["compte", `txt(c, compte(1284567), 240, 240, font(400, 70, TITLE), C.ink, "center")`],
  ["batiment", `batiment(c, 160, 380, 150, 280, C.ink); batiment(c, 350, 380, 130, 200, C.org)`],
  ["camion + roue", `camion(c, 240, 260, 300, C.org, 0)`],
  ["ombreSol, rond, teinte", `ombreSol(c, 240, 330, 140, 22); rond(c, 160, 210, 60, teinte(C.org, 0.4)); rond(c, 320, 210, 60, teinte(C.org, -0.4))`],
  ["tweet", `tweet(c, 10, 30, 460, { nom: "Camille", pseudo: "@camille_demo", date: "20 oct.", lignes: ["Claude Code marche en local,", "casse en production."], surligne: [1], stats: "48 j'aime · 4 211 vues" }, 2, 0)`],
  ["notifIOS", `notifIOS(c, 10, 60, 460, { app: "claude", titre: "Claude", texte: "Ton site est en ligne." }); notifIOS(c, 10, 230, 460, { app: "gmail", titre: "Stripe", texte: "Paiement reçu : 34,00 €", quand: "il y a 2 min" })`],
  ["gmail", `gmail(c, 10, 20, 460, 390, [{ de: "Stripe", objet: "Paiement reçu", extrait: "34,00 €", heure: "09:41", nonLu: true }, { de: "Vercel", objet: "Déploiement réussi", heure: "09:12" }, { de: "GitHub", objet: "PR fusionnée", heure: "hier" }], 9)`],
  ["courbe (vues)", `courbe(c, 40, 110, 400, 260, [800, 1200, 1100, 3400, 9800, 24000, 61000], 1, 0, 1)`],
  ["editeur", `editeur(c, 10, 30, 460, "app.js", [[["const ", "#C792EA"], ["cle", "#fff"], [" = ", "#fff"], ['"sk_live_1234"', "#C3E88D", true]], [["fetch", "#82AAFF"], ["(url)", "#fff"]]], 9, 0, 1)`],
  ["chrono", `chrono(c, 240, 190, 130, 0.5, { temps: "30:00" })`],
  ["revenus (sombre)", `c.scale(0.5, 0.5); revenus(c, 0, 40, 960, 700, { titre: "Ceux qui ont compris en premier", a: 8450, paiements: [["Paiement reçu", "Spot produit", "+640,00 €"], ["Paiement reçu", "UGC", "+1 200,00 €"], ["Paiement reçu", "", "+380,00 €"]] }, 1, 0, 1)`],
  ["devis", `c.scale(0.8, 0.8); devis(c, 70, 0, 440, { titre: "Spot produit", sous: "Pub de 30 s", lignes: [["Studio & tournage", "1 850 €"], ["Équipe technique", "1 400 €"], ["Décor", "950 €"], ["Post-production", "800 €"]], total: "5 000 €" }, 9)`],
  ["polaroid", `polaroid(c, 160, 210, 200, null, "FIG. 1 · MAINS", -0.08, 9); polaroid(c, 330, 220, 200, null, "FIG. 2 · VISAGE", 0.07, 9)`],
  ["neon", `c.fillStyle = "#121212"; c.fillRect(0, 0, 480, 420); neon(c, "intelligence", 240, 180, 64, 3); neon(c, "artificielle", 240, 260, 64, 3)`],
  ["promptBar", `c.fillStyle = "#2A2A2E"; c.fillRect(0, 0, 480, 420); promptBar(c, 20, 170, 440, "Une seule phrase.", 9, 0, 1)`],
  ["titreEdito", `titreEdito(c, 30, 90, { kicker: "Aujourd'hui", amorce: "Quelque chose de", gros: "massif.", sous: "et ça ne fait que commencer", accent: "commencer", taille: 100 }, 9)`],
  ["statCarte", `statCarte(c, 140, 40, [["AVANT", "1,4K", "ABONNÉS"], ["APRÈS", "1,6K", "+14 %", C.org]], 9)`],
  ["vague", `vague(c, 0, 140, 480, 40, 0); vague(c, 0, 280, 480, 25, 1, { col: C.ink, epaisseur: 2, alpha: 0.3 })`],
  ["timeline", `timeline(c, 10, 60, 460, 300, [{ nom: "V1", col: "#E8913A", clips: [[0, 0.3], [0.35, 0.7]] }, { nom: "V2", col: "#4ADE80", clips: [[0.1, 0.5], [0.6, 0.95]] }, { nom: "A1", col: "#6B6B70", clips: [[0, 1]] }], 9, { tete: 0.55, titre: "MONTAGE" })`],
  ["toastSombre", `c.fillStyle = "#2A2A2E"; c.fillRect(0, 0, 480, 420); toastSombre(c, 30, 100, { sur: "CAMPAGNE", titre: "Campagne UGC IA", detail: "PUB PRODUIT · 3 VIDÉOS" }, 9); toastSombre(c, 30, 240, { titre: "Pub produit · 3 vidéos", icone: "▶" }, 9)`],
];

const head = fs.readFileSync(path.join(REF, "head.part"), "utf8"), i0 = head.indexOf("const TOTAL"), i1 = head.indexOf("const cv = document");
const objets = fs.readdirSync(path.join(ICI, "objets")).sort().map((f) => fs.readFileSync(path.join(ICI, "objets", f), "utf8")).join("\n");
const COL = 3, CW = 480, CH = 470, PAD = 24, LIG = Math.ceil(EX.length / COL);
const planche = new Canvas(COL * CW + (COL + 1) * PAD, LIG * CH + (LIG + 1) * PAD + 90), p = planche.getContext("2d");
const corps = head.slice(i0, i1) + fs.readFileSync(path.join(REF, "_helpers.js"), "utf8") + objets +
  `\nreturn (c, i) => { switch (i) { ${EX.map(([, a], k) => `case ${k}: ${a}; break;`).join(" ")} } };`;
const dessine = new Function("Path2D", corps)(Path2D);

p.fillStyle = "#F0EDE6"; p.fillRect(0, 0, planche.width, planche.height);
p.font = '40px "Archivo Black"'; p.fillStyle = "#1F1B16"; p.fillText("bibliothèque moteur : objets partagés", PAD, 64);
EX.forEach(([titre, appel], k) => {
  const x = PAD + (k % COL) * (CW + PAD), y = 90 + PAD + Math.floor(k / COL) * (CH + PAD), cv = new Canvas(CW, 420), c = cv.getContext("2d");
  try { dessine(c, k); } catch (e) { c.fillStyle = "red"; c.font = "20px Montserrat"; c.fillText(e.message, 10, 40); }
  p.fillStyle = "#FFFFFF"; p.beginPath(); p.roundRect(x, y, CW, CH, 18); p.fill(); p.drawImage(cv, x, y);
  p.font = '700 22px "IBM Plex Mono"'; p.fillStyle = "#D9541E"; p.fillText(titre, x + 16, y + 445);
});
const sortie = path.join(ICI, "catalogue.jpg"); await planche.saveAs(sortie, { quality: 0.88 }); console.log(sortie);
