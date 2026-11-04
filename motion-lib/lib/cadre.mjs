// Fond, onde d'ambiance, repères HUD et transitions.
// Convention de tous les composants : fn(c, th, t, options), t = secondes depuis l'apparition du composant.
import { W, H, FPS } from "./tokens.mjs";
import { clamp, lerp, eo, eio, expo, prog, bruit } from "./anim.mjs";
import { texte, monoF, ligne, grain, point } from "./dessin.mjs";

// fond uni, grille fine, vignette ; le grain se pose à la fin avec finition()
export function fond(c, th, t, { grille = 64, vignette = true } = {}) {
  c.fillStyle = th.bg; c.fillRect(0, 0, W, H);
  if (grille) { c.save(); c.strokeStyle = th.grille; c.lineWidth = 1; c.beginPath();
    for (let x = (W / 2) % grille; x < W; x += grille) { c.moveTo(x + 0.5, 0); c.lineTo(x + 0.5, H); }
    for (let y = (H / 2) % grille; y < H; y += grille) { c.moveTo(0, y + 0.5); c.lineTo(W, y + 0.5); } c.stroke(); c.restore(); }
  if (vignette) { const g = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, th.vignette);
    c.fillStyle = g; c.fillRect(0, 0, W, H); }
}

export function finition(c, th, t) { grain(c, Math.floor(t * FPS), th.grain, W, H); }

// longue onde ambrée qui ondule lentement derrière le contenu
export function onde(c, th, t, { y = H * 0.5, amp = 120, alpha = 0.85, entree = 1.2, epaisseur = 3 } = {}) {
  const p = eio(t / entree); if (p <= 0) return; const pts = [];
  for (let x = -20; x <= W + 20; x += 12) { const u = x / W; pts.push([x, y - amp * Math.sin(u * Math.PI * 1.15 + 0.4 + t * 0.25) * (0.75 + 0.25 * bruit(u * 3 + t * 0.4))]); }
  const n = Math.max(2, Math.floor(pts.length * p)); c.save(); c.globalAlpha = alpha; c.lineCap = "round";
  const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, th.acc2); g.addColorStop(0.5, th.acc); g.addColorStop(1, th.acc2);
  c.strokeStyle = g; c.lineWidth = epaisseur; c.shadowColor = th.acc; c.shadowBlur = 14; c.beginPath(); c.moveTo(...pts[0]); for (let i = 1; i < n; i++) c.lineTo(...pts[i]); c.stroke();
  // doublure fine décalée, effet ruban
  c.globalAlpha = alpha * 0.35; c.shadowBlur = 0; c.lineWidth = 1.2; c.beginPath(); c.moveTo(pts[0][0], pts[0][1] + 10);
  for (let i = 1; i < n; i++) c.lineTo(pts[i][0], pts[i][1] + 10 + 6 * Math.sin(i * 0.15 + t)); c.stroke(); c.restore();
  // particule qui glisse le long de l'onde
  const k = pts[Math.floor(((t * 0.08) % 1) * (n - 1))]; if (k && p >= 1) point(c, k[0], k[1], 4, th.acc2, 16);
}

// repères aux quatre coins : libellés mono et petites équerres ; tc = timecode qui défile
export function hud(c, th, t, { hg = "", hd = null, bg = "", bd = "", marge = 48, tc0 = 0 } = {}) {
  const a = eo(t / 0.6); if (a <= 0) return; c.save(); c.globalAlpha = a;
  const f = monoF(14, 500), col = th.mut, ls = 3, y0 = marge + 10, y1 = H - marge;
  const s = Math.floor(tc0 + t), fr = Math.floor((tc0 + t) * FPS) % FPS, z = (n) => String(n).padStart(2, "0");
  texte(c, hg, marge, y0, f, col, { ls }); texte(c, hd ?? `00:${z(Math.floor(s / 60))}:${z(s % 60)}:${z(fr)}`, W - marge, y0, f, col, { ls, align: "right" });
  texte(c, bg, marge, y1, f, col, { ls }); texte(c, bd, W - marge, y1, f, col, { ls, align: "right" });
  c.restore();
}

// volet : un panneau de la couleur du thème suivant balaie l'écran, bord d'attaque orange
// p de 0 à 1 couvre l'écran, de 1 à 2 le découvre
export function volet(c, th, p, { sens = 1 } = {}) { if (p <= 0 || p >= 2) return;
  const a = p < 1 ? expo(p) : 1, b = p < 1 ? 0 : expo(p - 1), x0 = lerp(0, W, b), x1 = lerp(0, W, a);
  const X = (x) => (sens > 0 ? W - x : x); c.save(); c.fillStyle = th.bg;
  c.fillRect(Math.min(X(x0), X(x1)), 0, Math.abs(X(x1) - X(x0)), H);
  const bord = p < 1 ? X(x1) : X(x0); c.fillStyle = th.acc; c.fillRect(bord - 3, 0, 6, H); c.restore(); }
