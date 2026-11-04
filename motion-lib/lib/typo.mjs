// Typographie animée : surtitre, titre en italique gras, mot géant, soulignement, numéro de section,
// compteur, bandeau nom et sous-titres karaoké.
import { clamp, lerp, eo, eio, expo, quint, prog, ressort, rnd } from "./anim.mjs";
import { texte, mesure, titreF, monoF, police, masque, ligne, rrect, point } from "./dessin.mjs";
import { TITRE, MONO } from "./tokens.mjs";

const BRUIT = "ABCDEFGHJKLMNPRSTUVXYZ0123456789/#+";

// petit libellé mono en capitales espacées, révélé lettre à lettre avec brouillage
export function surtitre(c, th, t, s, x, y, { col = th.acc, sz = 16, ls = 4, duree = 0.55, align = "left", puce = false } = {}) {
  if (t < 0) return; s = s.toUpperCase(); const f = monoF(sz, 600), n = s.length, k = clamp(t / duree) * n;
  let cx = align === "center" ? x - mesure(c, s, f, ls) / 2 : align === "right" ? x - mesure(c, s, f, ls) : x;
  if (puce) { point(c, cx - sz * 0.9, y - sz * 0.35, sz * 0.22, col, 8); }
  c.save(); c.font = f; c.textBaseline = "alphabetic";
  for (let i = 0; i < n; i++) { const ch = s[i]; const w = c.measureText(ch).width;
    if (i < Math.floor(k)) { c.fillStyle = col; c.fillText(ch, cx, y); }
    else if (i < k + 4 && ch !== " ") { c.fillStyle = th.dim; c.fillText(BRUIT[Math.floor(rnd(i * 7 + Math.floor(t * 24)) * BRUIT.length)], cx, y); }
    cx += w + ls; }
  c.restore(); }

// titre sur plusieurs lignes ; chaque ligne monte depuis un masque. lignes = [[["texte"], ["mot", "acc"]], ...]
export function titre(c, th, t, lignes, x, y, { sz = 72, w = 900, inter = 1.02, decalage = 0.09, align = "left", couleur = th.encre, italique = true } = {}) {
  const f = police(w, sz, TITRE, italique), ls = -sz * 0.035;
  lignes.forEach((segs, i) => { const k = quint(prog(t, i * decalage, 0.75)); if (k <= 0) return; const ly = y + i * sz * inter;
    const tw = segs.reduce((a, [s]) => a + mesure(c, s, f, ls), 0); let cx = align === "center" ? x - tw / 2 : align === "right" ? x - tw : x;
    masque(c, cx - sz, ly - sz * 1.05, tw + sz * 2, sz * 1.35, () => { const dy = (1 - k) * sz * 1.15;
      for (const [s, cle] of segs) cx += texte(c, s, cx, ly + dy, f, cle ? th[cle] ?? cle : couleur, { ls }); }); });
}

// très grand mot, lettre par lettre, avec point final optionnellement en accent
export function motGeant(c, th, t, s, x, y, { sz = 220, col = th.encre, pointAcc = false, align = "left", decalage = 0.035, flou = 0 } = {}) {
  if (t < 0) return; const f = titreF(sz, 900), ls = -sz * 0.045, tw = mesure(c, s, f, ls);
  let cx = align === "center" ? x - tw / 2 : align === "right" ? x - tw : x;
  // interlettrage ajouté à la main lettre par lettre : le contexte reste à 0 pour ne pas le compter deux fois
  c.save(); if (flou) c.filter = `blur(${flou}px)`; c.font = f; c.letterSpacing = "0px";
  masque(c, cx - sz, y - sz * 1.05, tw + sz * 2, sz * 1.38, () => {
    for (let i = 0; i < s.length; i++) { const ch = s[i], w = c.measureText(ch).width + ls, k = ressort(t, i * decalage, 2.2, 0.78);
      c.fillStyle = pointAcc && i === s.length - 1 && ".!?".includes(ch) ? th.acc : col; c.fillText(ch, cx, y + (1 - clamp(k, 0, 1.2)) * sz * 1.1); cx += w; } });
  c.restore(); }

// trait d'accent qui se dessine, légèrement incurvé, bouts arrondis
export function soulignement(c, th, t, x, y, w, { col = th.acc, lw = 7, duree = 0.55, courbe = 6 } = {}) {
  const p = eio(t / duree); if (p <= 0) return; c.save(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = "round"; c.beginPath();
  for (let i = 0; i <= 40 * p; i++) { const u = i / 40, px = x + w * u, py = y + Math.sin(u * Math.PI) * -courbe + u * 2; i ? c.lineTo(px, py) : c.moveTo(px, py); }
  c.stroke(); c.restore(); }

// numéro de section « 03 » en italique + libellé mono, filets qui s'étirent de part et d'autre
export function section(c, th, t, num, libelle, cx, y, { sz = 54 } = {}) { if (t < 0) return;
  const fN = titreF(sz, 900), fL = monoF(16, 600), wN = mesure(c, num, fN, -2), wL = mesure(c, libelle.toUpperCase(), fL, 5), tw = wN + 22 + wL, x = cx - tw / 2;
  const k = quint(prog(t, 0, 0.7)); c.save(); c.globalAlpha = clamp(k * 2);
  masque(c, x - 10, y - sz, wN + 20, sz * 1.3, () => texte(c, num, x, y + (1 - k) * sz, fN, th.encre, { ls: -2 })); c.restore();
  surtitre(c, th, t - 0.15, libelle, x + wN + 22, y - sz * 0.18, { col: th.encre, sz: 16, ls: 5 });
  const L = 260 * eio(prog(t, 0.2, 0.8)); ligne(c, x - 30 - L, y - sz * 0.3, x - 30, y - sz * 0.3, th.trait, 1); ligne(c, x + tw + 30, y - sz * 0.3, x + tw + 30 + L, y - sz * 0.3, th.trait, 1); }

const fr = (v, dec) => v.toLocaleString("fr-FR", { minimumFractionDigits: dec, maximumFractionDigits: dec }).replace(/ | /g, " ");

// chiffre qui défile jusqu'à sa valeur, suffixe plus petit, libellé dessous
export function compteur(c, th, t, { de = 0, a = 100, dec = 0, prefixe = "", suffixe = "", x, y, sz = 200, duree = 1.4, libelle = "", align = "left", col = th.encre, colSuffixe = th.encre } = {}) {
  if (t < 0) return; const v = lerp(de, a, expo(t / duree)), s = prefixe + fr(v, dec), f = titreF(sz, 900), fs = titreF(sz * 0.42, 800), ls = -sz * 0.04;
  const w1 = mesure(c, s, f, ls), w2 = suffixe ? mesure(c, suffixe, fs, -1) + sz * 0.08 : 0, tw = w1 + w2, k = quint(prog(t, 0, 0.6));
  let x0 = align === "center" ? x - tw / 2 : align === "right" ? x - tw : x;
  masque(c, x0 - sz, y - sz * 1.05, tw + sz * 2, sz * 1.3, () => { const dy = (1 - k) * sz;
    texte(c, s, x0, y + dy, f, col, { ls }); if (suffixe) texte(c, suffixe, x0 + w1 + sz * 0.08, y + dy, fs, colSuffixe, { ls: -1 }); });
  if (libelle) surtitre(c, th, t - 0.4, libelle, align === "center" ? x : x0, y + sz * 0.32, { col: th.mut, sz: 18, ls: 5, align: align === "center" ? "center" : "left" }); }

// bandeau nom : barre d'accent qui pousse, nom en italique, rôle en mono
export function bandeauNom(c, th, t, nom, role, x, y, { sz = 44, fondCarte = true } = {}) { if (t < 0) return;
  const fN = titreF(sz, 800), fR = monoF(15, 600), w = Math.max(mesure(c, nom, fN, -1), mesure(c, role.toUpperCase(), fR, 4)) + 70;
  const k = expo(prog(t, 0, 0.7)), h = sz * 2.3;
  if (fondCarte) { c.save(); c.globalAlpha = 0.92 * k; c.shadowColor = "rgba(0,0,0,0.25)"; c.shadowBlur = 30; rrect(c, x, y - h / 2, w * k, h, 14); c.fillStyle = th.carte; c.fill(); c.restore(); }
  c.fillStyle = th.acc; c.fillRect(x, y - h / 2 + (1 - k) * h / 2, 6, h * k);
  masque(c, x + 6, y - h / 2, w, h, () => { const q = quint(prog(t, 0.2, 0.7));
    texte(c, nom, x + 34, y + 4 + (1 - q) * sz, fN, th.encre, { ls: -1 }); });
  surtitre(c, th, t - 0.45, role, x + 34, y + sz * 0.78, { col: th.mut, sz: 15, ls: 4 }); }

// sous-titres façon karaoké : mots passés en encre, mots clés en accent, mots à venir estompés
// mots = [{ s, t0, acc? }] ; t0 relatifs au début du composant
export function sousTitre(c, th, t, mots, cx, y, { sz = 40, w = 700, maxW = 1300 } = {}) { if (t < 0) return;
  const f = police(w, sz, TITRE), esp = sz * 0.26, ls = -0.5; let lignes = [[]], lw = [0];
  for (const m of mots) { const mw = mesure(c, m.s, f, ls); if (lw.at(-1) + mw > maxW && lignes.at(-1).length) { lignes.push([]); lw.push(0); }
    lignes.at(-1).push({ ...m, mw }); lw[lw.length - 1] += mw + esp; }
  lignes.forEach((L, j) => { let x = cx - (lw[j] - esp) / 2; const ly = y + j * sz * 1.25;
    for (const m of L) { const k = eo(prog(t, m.t0 - 0.06, 0.18)), dit = t >= m.t0;
      const col = m.acc && dit ? th.acc : dit ? th.encre : th.mut; c.save(); c.globalAlpha = dit ? 1 : 0.45 + 0.1 * k;
      const sc = 1 + 0.06 * Math.sin(clamp((t - m.t0) / 0.22) * Math.PI); c.translate(x + m.mw / 2, ly); c.scale(sc, sc);
      texte(c, m.s, -m.mw / 2, 0, f, col, { ls }); c.restore();
      if (m.acc && dit) ligne(c, x, ly + sz * 0.22, x + m.mw * eo(prog(t, m.t0, 0.3)), ly + sz * 0.22, th.acc, 3);
      x += m.mw + esp; } }); }

// découpe une phrase en mots minutés régulièrement ; *mot* = mot en accent
export function minuter(phrase, t0 = 0, cadence = 0.28) { return phrase.split(" ").map((s, i) => { const acc = /^\*.*\*[,.!?]?$/.test(s);
  return { s: s.replace(/\*/g, ""), t0: t0 + i * cadence, acc }; }); }
