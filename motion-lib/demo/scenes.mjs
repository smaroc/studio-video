// Bobine de démonstration : chaque scène montre un ou plusieurs composants de la bibliothèque.
import { CLAIR, SOMBRE, W, H, fond, finition, onde, hud, volet, surtitre, titre, motGeant, soulignement, section, compteur, bandeauNom, sousTitre, minuter,
  courbeCroissance, courbeEasing, comparatif, barres, chrono, reseau, carteOutil, pastilles, eventailPhotos, panneauVideo, etapes } from "../index.mjs";

const pied = (th, t, hg, bd = "") => hud(c_, th, t, { hg, bg: "PRÉNOM NOM", bd });
let c_; // contexte courant, posé par dessiner()

export const SCENES = [
  { nom: "ouverture", th: CLAIR, duree: 5, f(c, th, t) {
    onde(c, th, t, { y: 600, amp: 120, alpha: 0.8 }); pied(th, t, "IA · GÉNÉRATIVE", "ÉPISODE 01");
    surtitre(c, th, t - 0.2, "Qualité de l'IA générative", 130, 372, { puce: true });
    titre(c, th, t - 0.3, [[["Quelque chose de"]]], 128, 460, { sz: 64 });
    motGeant(c, th, t - 0.5, "massif.", 118, 668, { sz: 236, pointAcc: true });
    titre(c, th, t - 0.95, [[["ces "], ["6", "acc"], [" derniers mois."]]], 128, 760, { sz: 50 });
    courbeCroissance(c, th, t - 0.6, { x: 1080, y: 250, w: 680, h: 540, valeurs: [0.04, 0.06, 0.09, 0.12, 0.14, 0.18, 0.22, 0.27, 0.5, 1],
      xs: ["2022", "2023", "2024", "2025", "2026"], titre: "Réalisme", etiquette: "AUJOURD'HUI", libBande: "6 derniers mois" }); } },

  { nom: "easing", th: SOMBRE, duree: 5, f(c, th, t) { pied(th, t, "IA · ANIMATION", "1 PROMPT");
    section(c, th, t, "03", "Animations", W / 2, 190);
    courbeEasing(c, th, t - 0.3, { x: 560, y: 290, w: 800, h: 400 });
    sousTitre(c, th, t - 0.6, minuter("les animations, ce *montage* *entier* a été codé.", 0, 0.32), W / 2, 930); } },

  { nom: "chrono", th: CLAIR, duree: 5, f(c, th, t) { pied(th, t, "MONTAGE · DURÉE", "CODE + OPUS");
    surtitre(c, th, t - 0.1, "Temps de montage", 130, 350, { puce: true });
    compteur(c, th, t - 0.3, { a: 30, suffixe: "minutes.", x: 124, y: 570, sz: 220, libelle: "au lieu de 3 jours", colSuffixe: CLAIR.encre });
    soulignement(c, th, t - 1.5, 132, 600, 380, { lw: 8 });
    chrono(c, th, t - 0.2, { x: 1420, y: 560, r: 220, fraction: 0.5 }); } },

  { nom: "photos", th: SOMBRE, duree: 5, f(c, th, t, M) { pied(th, t, "IA · IMAGE ET VIDÉO", "16:9");
    eventailPhotos(c, th, t, { cx: 560, cy: 500, images: [M[0], M[2], M[3]], libelle: "Photo-réaliste", foyers: [[0.5, 0.35], [0.5, 0.35], [0.5, 0.35]] });
    panneauVideo(c, th, t - 0.3, { x: 1010, y: 210, w: 790, h: 444, image: M[1], libelle: "EN DIRECT", repere: "16:9 · 30 FPS" });
    motGeant(c, th, t - 0.9, "cinématiques.", 1405, 820, { sz: 112, align: "center", pointAcc: true }); } },

  { nom: "comparatif", th: CLAIR, duree: 5, f(c, th, t) { onde(c, th, t, { y: 470, amp: 150, alpha: 0.55 }); pied(th, t, "L'ÉCART DE SAVOIR", "SEMAINES");
    surtitre(c, th, t - 0.1, "L'écart se creuse", 130, 240, { puce: true });
    titre(c, th, t - 0.2, [[["Ceux qui savent"]], [["utiliser l'IA…"]]], 128, 330, { sz: 66 });
    comparatif(c, th, t - 0.5, { x: 560, y: 520, w: 1220, h: 300, a: [0.04, 0.07, 0.13, 0.21, 0.32, 0.44, 0.57, 0.69, 0.79, 0.87, 0.94, 1],
      b: [0.04, 0.05, 0.05, 0.06, 0.06, 0.07, 0.07, 0.08, 0.08, 0.08, 0.09, 0.09] }); } },

  { nom: "outils", th: SOMBRE, duree: 5.5, f(c, th, t) { pied(th, t, "LA BOÎTE À OUTILS", "INCLUS DANS LE PROGRAMME");
    surtitre(c, th, t - 0.1, "En plus de la formation", 130, 210, { puce: true });
    titre(c, th, t - 0.2, [[["Tous les outils IA"]]], 128, 300, { sz: 84 });
    titre(c, th, t - 0.4, [[["à une fraction du prix."]]], 130, 376, { sz: 54, w: 800, couleur: th.acc });
    [["Claude Pro", "Texte · code · agents"], ["ChatGPT Plus", "Texte · images · voix"], ["Nano Banana 2", "Images IA"], ["Kling 3.0", "Vidéos IA"]].forEach(([nom, sous], i) =>
      carteOutil(c, th, t - 0.6 - i * 0.1, { x: 130 + (i % 2) * 460, y: 470 + Math.floor(i / 2) * 130, nom, sous, badge: "INCLUS" }));
    pastilles(c, th, t - 0.5, { x: 1110, y: 230, w: 700, titre: "Image", items: ["Midjourney", "GPT Image", "Ideogram", "Flux", "Recraft", "Magnific", "Canva Pro"] });
    pastilles(c, th, t - 0.8, { x: 1110, y: 480, w: 700, titre: "Vidéo", items: ["Veo 3.1", "Kling 3.0", "Runway", "Hailuo", "Seedance"] });
    pastilles(c, th, t - 1.1, { x: 1110, y: 680, w: 700, titre: "Son", items: ["ElevenLabs", "Suno", "Changeur de voix"] }); } },

  { nom: "reseau", th: SOMBRE, duree: 5, f(c, th, t) { pied(th, t, "LA COMMUNAUTÉ", "FRANCE · BELGIQUE · SUISSE · AFRIQUE");
    reseau(c, th, t, { x: 140, y: 120, w: 1640, h: 620, noeuds: [[1000, 300], [560, 260], [1220, 470], [880, 560], [1060, 660], [1500, 360], [720, 420], [1380, 600]] });
    surtitre(c, th, t - 0.6, "Une communauté de", 150, 820, { col: th.mut });
    titre(c, th, t - 0.7, [[["créateurs francophones."]]], 148, 905, { sz: 76 }); } },

  { nom: "barres", th: CLAIR, duree: 5, f(c, th, t) { pied(th, t, "RÉSULTATS", "HEURES PAR SEMAINE");
    surtitre(c, th, t - 0.1, "Résultats", 130, 300, { puce: true });
    titre(c, th, t - 0.2, [[["Le temps gagné"]], [["par semaine."]]], 128, 390, { sz: 72 });
    barres(c, th, t - 0.3, { x: 920, y: 250, w: 860, h: 520, valeurs: [2, 3, 5, 8, 14], libelles: ["S1", "S2", "S3", "S4", "S5"], fort: 4, unite: " h" }); } },

  { nom: "etapes", th: CLAIR, duree: 5.5, f(c, th, t) { pied(th, t, "LA MÉTHODE", "90 JOURS");
    surtitre(c, th, t - 0.1, "La méthode", 130, 210, { puce: true });
    titre(c, th, t - 0.2, [[["6 étapes, "], ["90 jours.", "acc"]]], 128, 300, { sz: 74 });
    etapes(c, th, t - 0.4, { x: 140, y: 430, pas: 112, actif: Math.max(-1, Math.min(4, Math.floor((t - 1.8) / 0.6))),
      items: [["Comprendre l'IA", "Les bases en 7 jours"], ["Choisir sa niche", "Ton métier + l'IA"], ["Créer son offre", "Prix et promesse"], ["Trouver ses clients", "Prospection guidée"], ["Livrer et encaisser", "Premiers contrats"]] });
    compteur(c, th, t - 0.6, { a: 90, suffixe: "jours", x: 1440, y: 640, sz: 260, align: "center", libelle: "d'accompagnement" }); } },

  { nom: "facecam", th: SOMBRE, duree: 6, f(c, th, t, M) { pied(th, t, "PRÉNOM NOM", "4K · 30 FPS");
    panneauVideo(c, th, t, { x: 80, y: 80, w: 1760, h: 920, image: M[1], libelle: "EN DIRECT", repere: "PASSERELLE MÉTIER → IA", fy: 0.4 });
    bandeauNom(c, th, t - 0.8, "Prénom Nom", "Ton métier en une ligne", 150, 760);
    sousTitre(c, th, t - 1.2, minuter("Je vais te montrer *exactement* comment faire.", 0, 0.3), W / 2, 930, { sz: 44 }); } },
];

export const TRANS = 0.35; // demi-durée du volet entre deux scènes
export const DEBUTS = SCENES.reduce((a, s) => (a.push(a.at(-1) + s.duree), a), [0]);
export const TOTAL = DEBUTS.at(-1);

// dessine l'image du temps global T
export function dessiner(c, T, M) { c_ = c;
  let i = DEBUTS.findIndex((d, k) => T >= d && T < DEBUTS[k + 1]); if (i < 0) i = SCENES.length - 1;
  const S = SCENES[i], t = T - DEBUTS[i]; fond(c, S.th, t); S.f(c, S.th, t, M);
  const fin = DEBUTS[i + 1], suiv = SCENES[i + 1];
  if (suiv && T > fin - TRANS) volet(c, suiv.th, (T - (fin - TRANS)) / TRANS);
  if (i > 0 && t < TRANS) volet(c, S.th, 1 + t / TRANS);
  finition(c, S.th, t); }

// dessine une scène isolée au temps local t
export function dessinerScene(c, nom, t, M) { c_ = c; const S = SCENES.find((s) => s.nom === nom); fond(c, S.th, t); S.f(c, S.th, t, M); finition(c, S.th, t); }
