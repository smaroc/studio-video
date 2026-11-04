// Cartes et médias : carte outil, pastilles, éventail de photos, panneau vidéo, étapes.
import { clamp, lerp, eo, eio, expo, quint, prog, ressort } from "./anim.mjs";
import { texte, mesure, monoF, titreF, police, rrect, point, ligne, masque, couvrir } from "./dessin.mjs";
import { surtitre } from "./typo.mjs";
import { TITRE } from "./tokens.mjs";

function surface(c, th, x, y, w, h, r = 16) { c.save(); c.shadowColor = th.nom === "sombre" ? "rgba(0,0,0,0.5)" : "rgba(60,50,35,0.12)"; c.shadowBlur = 36; c.shadowOffsetY = 10;
  rrect(c, x, y, w, h, r); c.fillStyle = th.carte; c.fill(); c.restore(); rrect(c, x + 0.5, y + 0.5, w - 1, h - 1, r); c.lineWidth = 1; c.strokeStyle = th.carteBord; c.stroke(); }

// carte d'outil : pictogramme carré, nom, sous-titre mono, badge à droite
export function carteOutil(c, th, t, { x, y, w = 430, h = 108, nom, sous = "", badge = "", lettre, coul } = {}) { if (t < 0) return;
  const k = ressort(t, 0, 2.2, 0.75); c.save(); c.globalAlpha = clamp(k * 2); c.translate(0, (1 - clamp(k)) * 40); surface(c, th, x, y, w, h, 18);
  rrect(c, x + 22, y + h / 2 - 28, 56, 56, 14); c.fillStyle = coul ?? th.acc; c.fill();
  texte(c, lettre ?? nom[0], x + 50, y + h / 2 + 10, police(800, 28, TITRE), "#fff", { align: "center" });
  texte(c, nom, x + 98, y + h / 2 - 2, police(700, 27, TITRE), th.encre, { ls: -0.5 }); if (sous) texte(c, sous, x + 98, y + h / 2 + 26, monoF(14, 500), th.mut, { ls: 1 });
  if (badge) { const f = monoF(12, 700), bw = mesure(c, badge, f, 2) + 24; rrect(c, x + w - bw - 20, y + h / 2 - 15, bw, 30, 15); c.lineWidth = 1.5; c.strokeStyle = th.acc; c.stroke();
    texte(c, badge, x + w - bw / 2 - 20, y + h / 2 + 5, f, th.acc, { align: "center", ls: 2 }); }
  c.restore(); }

// nuage de pastilles en flux, avec titre de rubrique et compteur
export function pastilles(c, th, t, { x, y, w, items, titre = "", sz = 19, decalage = 0.035 } = {}) { if (t < 0) return;
  if (titre) { surtitre(c, th, t, titre, x, y, { col: th.mut, sz: 13, ls: 4 }); const tw = mesure(c, titre.toUpperCase(), monoF(13, 600), 4);
    const k = ressort(t, 0.2, 3, 0.6); point(c, x + tw + 22, y - 5, 11 * clamp(k), th.accDoux); texte(c, String(items.length), x + tw + 22, y, monoF(11, 700), th.acc, { align: "center" }); }
  const f = police(600, sz, TITRE), hh = sz * 2.1; let cx = x, cy = y + 26;
  items.forEach((s, i) => { const pw = mesure(c, s, f) + sz * 2.6; if (cx + pw > x + w) { cx = x; cy += hh + 12; }
    const k = ressort(t, 0.15 + i * decalage, 3, 0.62); if (k > 0) { c.save(); c.globalAlpha = clamp(k * 2); c.translate(cx + pw / 2, cy + hh / 2); c.scale(lerp(0.7, 1, clamp(k)), lerp(0.7, 1, clamp(k)));
      rrect(c, -pw / 2, -hh / 2, pw, hh, hh / 2); c.fillStyle = th.carte; c.fill(); c.lineWidth = 1; c.strokeStyle = th.carteBord; c.stroke();
      point(c, -pw / 2 + sz * 1.05, 0, sz * 0.28, th.acc); texte(c, s, -pw / 2 + sz * 1.7, sz * 0.36, f, th.encre); c.restore(); }
    cx += pw + 10; }); }

// éventail de photos inclinées, liseré accent, entrée en ressort
export function eventailPhotos(c, th, t, { cx, cy, images, w = 320, h = 430, angles = [-9, 0, 8], ecart = 230, libelle = "", foyers = [] } = {}) { if (t < 0) return;
  const n = images.length, ordre = [...images.keys()].sort((a, b) => Math.abs(b - (n - 1) / 2) - Math.abs(a - (n - 1) / 2));
  for (const i of ordre) { const k = ressort(t, 0.08 * Math.abs(i - (n - 1) / 2), 1.9, 0.68), off = (i - (n - 1) / 2) * ecart * clamp(k, 0, 1.1);
    c.save(); c.globalAlpha = clamp(k * 2.5); c.translate(cx + off, cy + (1 - clamp(k)) * 200); c.rotate((angles[i] ?? 0) * Math.PI / 180 * clamp(k, 0, 1.1));
    c.shadowColor = "rgba(0,0,0,0.35)"; c.shadowBlur = 40; c.shadowOffsetY = 18; rrect(c, -w / 2, -h / 2, w, h, 18); c.fillStyle = "#222"; c.fill(); c.shadowColor = "transparent";
    c.save(); rrect(c, -w / 2, -h / 2, w, h, 18); c.clip(); couvrir(c, images[i], -w / 2, -h / 2, w, h, { zoom: 1.05 + 0.03 * Math.sin(t * 0.5 + i), fx: foyers[i]?.[0] ?? 0.5, fy: foyers[i]?.[1] ?? 0.4 }); c.restore();
    rrect(c, -w / 2, -h / 2, w, h, 18); c.lineWidth = 2; c.strokeStyle = i === (n - 1) >> 1 ? th.acc : "rgba(240,136,42,0.45)"; c.stroke(); c.restore(); }
  if (libelle) surtitre(c, th, t - 0.5, libelle, cx, cy + h / 2 + 70, { col: th.mut, sz: 14, ls: 5, align: "center" }); }

// panneau vidéo arrondi : révélation par l'intérieur, zoom lent, pastille « en direct » et repère technique
export function panneauVideo(c, th, t, { x, y, w, h, image, r = 22, libelle = "", repere = "", zoom = 0.06, fx = 0.5, fy = 0.45 } = {}) { if (t < 0) return;
  const k = expo(prog(t, 0, 0.9)), ix = (1 - k) * w * 0.08, iy = (1 - k) * h * 0.08; c.save(); c.globalAlpha = clamp(k * 1.5);
  c.shadowColor = "rgba(0,0,0,0.4)"; c.shadowBlur = 50; c.shadowOffsetY = 20; rrect(c, x + ix, y + iy, w - 2 * ix, h - 2 * iy, r); c.fillStyle = "#111"; c.fill(); c.shadowColor = "transparent";
  c.save(); rrect(c, x + ix, y + iy, w - 2 * ix, h - 2 * iy, r); c.clip(); if (image) couvrir(c, image, x, y, w, h, { zoom: 1 + zoom * Math.min(1, t / 8) + (1 - k) * 0.15, fx, fy });
  const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, "rgba(0,0,0,0.25)"); g.addColorStop(0.3, "rgba(0,0,0,0)"); g.addColorStop(0.75, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.45)");
  c.fillStyle = g; c.fillRect(x, y, w, h); c.restore();
  rrect(c, x + ix, y + iy, w - 2 * ix, h - 2 * iy, r); c.lineWidth = 1; c.strokeStyle = "rgba(255,255,255,0.12)"; c.stroke(); c.restore();
  if (k > 0.8) { const a = eo(prog(t, 0.6, 0.4)); c.save(); c.globalAlpha = a;
    if (libelle) { const f = monoF(13, 700), lw = mesure(c, libelle, f, 3) + 46; rrect(c, x + 22, y + 22, lw, 32, 16); c.fillStyle = "rgba(0,0,0,0.55)"; c.fill();
      point(c, x + 40, y + 38, 5, th.acc, 10 + 8 * Math.sin(t * 5)); texte(c, libelle, x + 54, y + 43, f, "#fff", { ls: 3 }); }
    if (repere) texte(c, repere, x + w - 24, y + 44, monoF(13, 600), "rgba(255,255,255,0.75)", { align: "right", ls: 3 }); c.restore(); } }

// étapes numérotées verticales reliées par un fil qui progresse ; actif = index mis en avant
export function etapes(c, th, t, { x, y, items, pas = 120, actif = -1, decalage = 0.18 } = {}) { if (t < 0) return;
  const fil = eio(prog(t, 0.1, decalage * items.length + 0.4)); ligne(c, x + 26, y, x + 26, y + pas * (items.length - 1) * fil, th.trait, 2);
  items.forEach(([titre, sous], i) => { const k = quint(prog(t, 0.1 + i * decalage, 0.6)); if (k <= 0) return; const iy = y + i * pas, on = i === actif;
    c.save(); c.globalAlpha = k * (actif < 0 || on ? 1 : 0.45); point(c, x + 26, iy, 26, on ? th.acc : th.carte, on ? 24 : 0);
    c.beginPath(); c.arc(x + 26, iy, 26, 0, 7); c.lineWidth = 1.5; c.strokeStyle = on ? th.acc : th.trait; c.stroke();
    texte(c, String(i + 1).padStart(2, "0"), x + 26, iy + 7, titreF(20, 800), on ? "#fff" : th.encre, { align: "center" });
    masque(c, x + 70, iy - 50, 1200, 100, () => { const dy = (1 - k) * 40; texte(c, titre, x + 76, iy + 6 + dy, titreF(40, 800), th.encre, { ls: -1 });
      if (sous) texte(c, sous.toUpperCase(), x + 78, iy + 38 + dy, monoF(14, 500), th.mut, { ls: 3 }); }); c.restore(); }); }
