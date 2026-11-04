// Visualisations animées : courbe de croissance, courbe d'easing, comparatif, barres, chronomètre, réseau.
import { clamp, lerp, eo, eio, expo, quint, prog, ressort, rnd } from "./anim.mjs";
import { texte, mesure, monoF, titreF, police, ligne, lisser, longueurs, surChemin, tracer, point, cercle, rrect, masque } from "./dessin.mjs";
import { surtitre } from "./typo.mjs";
import { TITRE } from "./tokens.mjs";

// halo pulsé autour d'un point final
function pastilleFinale(c, th, x, y, t, r = 9) { const q = (t % 1.6) / 1.6;
  cercle(c, x, y, r + q * 26, `rgba(240,136,42,${0.5 * (1 - q)})`, 2); point(c, x, y, r, th.acc, 24); point(c, x, y, r * 0.4, "#fff"); }

// courbe de croissance : axes, années, trait qui se dessine, bande de mise en avant et étiquette sur le dernier point
// valeurs entre 0 et 1, xs = libellés de l'axe horizontal
export function courbeCroissance(c, th, t, { x, y, w, h, valeurs, xs = [], titre = "", etiquette = "", bande = 0.12, libBande = "", duree = 1.8 } = {}) {
  if (t < 0) return; const a = eo(t / 0.5); c.save(); c.globalAlpha = a;
  ligne(c, x, y, x, y + h, th.trait, 1.5); ligne(c, x, y + h, x + w * eo(t / 0.7), y + h, th.trait, 1.5);
  if (titre) surtitre(c, th, t, titre, x, y - 22, { col: th.mut, sz: 14, ls: 4 });
  xs.forEach((s, i) => { const px = x + (w * i) / (xs.length - 1); ligne(c, px, y + h, px, y + h + 8, th.trait, 1.5);
    texte(c, s, px, y + h + 36, monoF(15, 500), th.mut, { align: "center", ls: 1 }); });
  // bande de mise en avant sur la fin de la période
  const kb = eo(prog(t, duree * 0.7, 0.6)); if (kb > 0 && bande) { const bx = x + w * (1 - bande);
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, th.accDoux); g.addColorStop(1, "rgba(240,136,42,0.02)");
    c.fillStyle = g; c.fillRect(bx, y + h * (1 - kb), w * bande, h * kb); ligne(c, bx, y, bx, y + h, th.acc, 1, [4, 6]);
    if (libBande) surtitre(c, th, t - duree * 0.75, libBande, x + w, y - 22, { sz: 13, ls: 3, align: "right" }); }
  const pts = lisser(valeurs.map((v, i) => [x + (w * i) / (valeurs.length - 1), y + h - v * h * 0.92]), 16), L = longueurs(pts);
  const p = eio(t / duree), [ex, ey] = tracer(c, pts, p, { col: th.encre, lw: 3.5, L });
  c.restore(); if (p > 0.02) pastilleFinale(c, th, ex, ey, t, p >= 1 ? 9 : 6);
  if (etiquette && p >= 1) { const k = ressort(t, duree, 2.4, 0.6), f = monoF(15, 700), tw = mesure(c, etiquette, f, 2) + 32;
    c.save(); c.globalAlpha = clamp(k * 2); c.translate(ex - 20, ey - 8); c.scale(lerp(0.6, 1, clamp(k)), lerp(0.6, 1, clamp(k)));
    rrect(c, -tw, -18, tw, 36, 18); c.fillStyle = th.encre; c.fill(); texte(c, etiquette, -tw / 2, 6, f, th.inverse, { align: "center", ls: 2 }); c.restore(); }
}

// courbe d'easing valeur / temps, poignées de Bézier, point qui parcourt la courbe, rangée de points de vitesse
export function courbeEasing(c, th, t, { x, y, w, h, c1 = [0.42, 0], c2 = [0.58, 1], duree = 1.6 } = {}) { if (t < 0) return;
  const a = eo(t / 0.5); c.save(); c.globalAlpha = a;
  ligne(c, x, y, x, y + h, th.trait, 1.5); ligne(c, x, y + h, x + w, y + h, th.trait, 1.5);
  texte(c, "VALEUR", x - 4, y - 18, monoF(13, 600), th.mut, { ls: 3 }); texte(c, "TEMPS · EASE IN-OUT", x + w, y + h + 40, monoF(13, 600), th.mut, { ls: 3, align: "right" });
  const B = (u) => { const m = 1 - u, P = [[0, 0], c1, c2, [1, 1]], bx = m * m * m * P[0][0] + 3 * m * m * u * P[1][0] + 3 * m * u * u * P[2][0] + u * u * u * P[3][0],
    by = m * m * m * P[0][1] + 3 * m * m * u * P[1][1] + 3 * m * u * u * P[2][1] + u * u * u * P[3][1]; return [x + bx * w, y + h - by * h]; };
  const pts = Array.from({ length: 121 }, (_, i) => B(i / 120)), L = longueurs(pts), p = eio(t / duree);
  // poignées
  const kp = eo(prog(t, duree * 0.6, 0.5)), P1 = [x + c1[0] * w, y + h - c1[1] * h], P2 = [x + c2[0] * w, y + h - c2[1] * h];
  if (kp > 0) { ligne(c, x, y + h, lerp(x, P1[0], kp), lerp(y + h, P1[1], kp), th.mut, 1.5); ligne(c, x + w, y, lerp(x + w, P2[0], kp), lerp(y, P2[1], kp), th.mut, 1.5);
    cercle(c, P1[0], P1[1], 7 * kp, th.encre, 2, th.bg); cercle(c, P2[0], P2[1], 7 * kp, th.encre, 2, th.bg); }
  tracer(c, pts, p, { col: th.encre, lw: 3.5, L }); c.restore();
  if (p >= 1) { pastilleFinale(c, th, x + w, y, t, 8); const u = ((t - duree) * 0.45) % 1, [mx, my] = surChemin(pts, L, eio(u)); point(c, mx, my, 7, th.acc2, 18); }
  // vitesse : 5 points qui s'allument
  for (let i = 0; i < 5; i++) { const k = eo(prog(t, 0.4 + i * 0.08, 0.3)); point(c, x + w - 150 + i * 32, y + h + 80, 11 * k, `rgba(${th.nom === "sombre" ? "244,242,236" : "11,11,11"},${0.15 + i * 0.18})`); }
}

// deux trajectoires qui divergent sur un axe de semaines ; la première finit sur un point accent
export function comparatif(c, th, t, { x, y, w, h, n = 12, a = [], b = [], jusque = 1, libelle = "SEMAINE", duree = 2 } = {}) { if (t < 0) return;
  const k0 = eo(t / 0.5); c.save(); c.globalAlpha = k0; ligne(c, x, y + h, x + w, y + h, th.encre, 2);
  for (let i = 0; i < n; i++) { const px = x + (w * i) / (n - 1); ligne(c, px, y + h - 8, px, y + h + 8, th.encre, 1.5);
    texte(c, String(i + 1).padStart(2, "0"), px, y + h + 38, monoF(14, 600), th.mut, { align: "center", ls: 1 }); }
  const P = (vs) => lisser(vs.map((v, i) => [x + (w * i) / (n - 1), y + h - v * h]), 14), pa = P(a), pb = P(b);
  const p = eio(t / duree) * jusque, fa = tracer(c, pa, p, { col: th.encre, lw: 5 }), fb = tracer(c, pb, p, { col: th.dim, lw: 4 }); c.restore();
  if (p > 0.01) { point(c, fb[0], fb[1], 7, th.mut); pastilleFinale(c, th, fa[0], fa[1], t, 9); }
  const sem = Math.max(1, Math.round(p * (n - 1)) + 1); texte(c, `${libelle} ${sem}`, x + w, y - 30, monoF(15, 700), th.mut, { align: "right", ls: 4 }); }

// histogramme : barres qui montent en cascade, valeur au-dessus, barre mise en avant en accent
export function barres(c, th, t, { x, y, w, h, valeurs, libelles = [], max, fort = -1, unite = "" } = {}) { if (t < 0) return;
  const n = valeurs.length, gap = w / n, bw = gap * 0.56, M = max ?? Math.max(...valeurs);
  ligne(c, x, y + h, x + w * eo(t / 0.5), y + h, th.trait, 2);
  valeurs.forEach((v, i) => { const k = ressort(t, 0.15 + i * 0.09, 1.8, 0.75), bh = (v / M) * h * k, bx = x + gap * i + (gap - bw) / 2;
    if (bh <= 0) return; rrect(c, bx, y + h - bh, bw, bh, 8); c.fillStyle = i === fort ? th.acc : th.nom === "sombre" ? "#2A2926" : "#D9D5CC"; c.fill();
    if (i === fort) { c.save(); c.shadowColor = th.acc; c.shadowBlur = 30; c.fill(); c.restore(); }
    const vk = clamp(k); texte(c, Math.round(v * vk) + unite, bx + bw / 2, y + h - bh - 16, titreF(30, 800), i === fort ? th.acc : th.encre, { align: "center", ls: -1 });
    if (libelles[i]) texte(c, libelles[i], bx + bw / 2, y + h + 34, monoF(14, 600), th.mut, { align: "center", ls: 2 }); }); }

// chronomètre illustré : cadran, graduations, arc accent qui balaie la fraction, aiguille
export function chrono(c, th, t, { x, y, r = 170, fraction = 0.5, duree = 1.6 } = {}) { if (t < 0) return;
  const k = ressort(t, 0, 2, 0.7), p = eio(prog(t, 0.3, duree)) * fraction; c.save(); c.translate(x, y); c.scale(lerp(0.85, 1, clamp(k)), lerp(0.85, 1, clamp(k))); c.globalAlpha = clamp(k * 2);
  // couronne et boutons
  rrect(c, -22, -r - 46, 44, 26, 6); c.fillStyle = th.encre; c.fill(); c.fillRect(-8, -r - 22, 16, 22);
  c.save(); c.rotate(0.75); c.fillRect(-9, -r - 26, 18, 18); c.restore();
  cercle(c, 0, 0, r, th.encre, 10, th.carte); cercle(c, 0, 0, r - 26, th.trait, 1);
  for (let i = 0; i < 60; i++) { const an = (i / 60) * Math.PI * 2 - Math.PI / 2, gros = i % 5 === 0, r0 = r - (gros ? 34 : 24);
    ligne(c, Math.cos(an) * r0, Math.sin(an) * r0, Math.cos(an) * (r - 16), Math.sin(an) * (r - 16), gros ? th.encre : th.dim, gros ? 3 : 1.5); }
  if (p > 0) { c.save(); c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r - 40, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); c.closePath(); c.fillStyle = th.accDoux; c.fill();
    c.beginPath(); c.arc(0, 0, r - 40, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); c.lineWidth = 8; c.lineCap = "round"; c.strokeStyle = th.acc; c.shadowColor = th.acc; c.shadowBlur = 16; c.stroke(); c.restore(); }
  const an = -Math.PI / 2 + p * Math.PI * 2; ligne(c, 0, 0, Math.cos(an) * (r - 50), Math.sin(an) * (r - 50), th.encre, 5); point(c, 0, 0, 10, th.encre); point(c, 0, 0, 4, th.acc);
  c.restore(); }

// réseau : matrice de points, nœuds qui s'allument, arcs tracés d'une source vers chaque cible
export function reseau(c, th, t, { x, y, w, h, noeuds, source = 0, pas = 22, duree = 1.4 } = {}) { if (t < 0) return;
  const a = eo(t / 0.6); c.save(); c.globalAlpha = a; c.fillStyle = th.dim;
  for (let py = y; py <= y + h; py += pas) for (let px = x; px <= x + w; px += pas) { const v = rnd(px * 0.37 + py * 1.91); if (v < 0.55) continue; c.globalAlpha = a * (0.25 + 0.4 * v); c.fillRect(px - 1.5, py - 1.5, 3, 3); }
  c.restore(); const S = noeuds[source];
  noeuds.forEach(([nx, ny], i) => { if (i === source) return; const t0 = 0.4 + i * 0.12, dx = nx - S[0], m = [(S[0] + nx) / 2, Math.min(S[1], ny) - Math.abs(dx) * 0.35 - 40];
    const pts = Array.from({ length: 50 }, (_, j) => { const u = j / 49, v = 1 - u; return [v * v * S[0] + 2 * v * u * m[0] + u * u * nx, v * v * S[1] + 2 * v * u * m[1] + u * u * ny]; });
    const p = eio(prog(t, t0, duree)); if (p <= 0) return; const L = longueurs(pts);
    tracer(c, pts, p, { col: "rgba(240,136,42,0.75)", lw: 2, L }); if (p < 1) { const [qx, qy] = surChemin(pts, L, p); point(c, qx, qy, 5, th.acc2, 18); }
    else { const q = ((t - t0 - duree) * 0.6) % 1, [qx, qy] = surChemin(pts, L, q); point(c, qx, qy, 3.5, th.acc2, 12); point(c, nx, ny, 7, th.acc, 20); } });
  pastilleFinale(c, th, S[0], S[1], t, 10); }
