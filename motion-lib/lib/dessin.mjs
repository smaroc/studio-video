// Primitives de dessin partagées par tous les composants.
import { Canvas } from "skia-canvas";
import { TITRE, MONO } from "./tokens.mjs";
import { clamp, lerp, rnd } from "./anim.mjs";

export const police = (w, sz, fam = TITRE, it = false) => `${it ? "italic " : ""}${w} ${sz}px "${fam}"`;
export const titreF = (sz, w = 900) => police(w, sz, TITRE, true);
export const monoF = (sz, w = 500) => police(w, sz, MONO);

// texte avec interlettrage ; renvoie la largeur
export function texte(c, s, x, y, f, col, { align = "left", ls = 0, base = "alphabetic" } = {}) {
  c.save(); c.font = f; c.letterSpacing = `${ls}px`; c.fillStyle = col; c.textAlign = align; c.textBaseline = base; c.fillText(s, x, y);
  const w = c.measureText(s).width; c.restore(); return w; }
export function mesure(c, s, f, ls = 0) { c.save(); c.font = f; c.letterSpacing = `${ls}px`; const w = c.measureText(s).width; c.restore(); return w; }

export function rrect(c, x, y, w, h, r) { r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2)); c.beginPath(); c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

export function point(c, x, y, r, col, halo = 0) { c.save(); if (halo) { c.shadowColor = col; c.shadowBlur = halo; }
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = col; c.fill(); c.restore(); }
export function cercle(c, x, y, r, col, lw = 2, fond) { c.save(); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); if (fond) { c.fillStyle = fond; c.fill(); }
  c.lineWidth = lw; c.strokeStyle = col; c.stroke(); c.restore(); }

// courbe de Catmull-Rom échantillonnée en polyligne dense : [[x, y], ...]
export function lisser(pts, n = 18) { const out = [];
  for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) { const u = k / n, u2 = u * u, u3 = u2 * u;
      out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3))); } }
  out.push(pts[pts.length - 1]); return out; }

// longueurs cumulées d'une polyligne, pour tracer à vitesse constante
export function longueurs(pts) { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return L; }
export function surChemin(pts, L, p) { const d = clamp(p) * L[L.length - 1]; let i = 1; while (i < L.length - 1 && L[i] < d) i++;
  const u = (d - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]); return [lerp(pts[i - 1][0], pts[i][0], clamp(u)), lerp(pts[i - 1][1], pts[i][1], clamp(u)), i]; }

// trace une polyligne jusqu'à la fraction p ; renvoie le point d'arrivée
export function tracer(c, pts, p, { col, lw = 3, halo = 0, dash, L = longueurs(pts) } = {}) { if (p <= 0) return pts[0];
  const [ex, ey, i] = surChemin(pts, L, p); c.save(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = "round"; c.lineJoin = "round";
  if (dash) c.setLineDash(dash); if (halo) { c.shadowColor = col; c.shadowBlur = halo; }
  c.beginPath(); c.moveTo(...pts[0]); for (let k = 1; k < i; k++) c.lineTo(...pts[k]); c.lineTo(ex, ey); c.stroke(); c.restore(); return [ex, ey]; }

export function ligne(c, x0, y0, x1, y1, col, lw = 1, dash) { c.save(); c.strokeStyle = col; c.lineWidth = lw; if (dash) c.setLineDash(dash);
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.restore(); }

// masque rectangulaire le temps d'un dessin
export function masque(c, x, y, w, h, fn) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); fn(); c.restore(); }

// image recadrée façon « cover » dans une boîte, avec zoom et point focal
export function couvrir(c, img, x, y, w, h, { zoom = 1, fx = 0.5, fy = 0.5 } = {}) {
  const s = Math.max(w / img.width, h / img.height) * zoom, sw = w / s, sh = h / s;
  const sx = clamp(img.width * fx - sw / 2, 0, img.width - sw), sy = clamp(img.height * fy - sh / 2, 0, img.height - sh);
  c.drawImage(img, sx, sy, sw, sh, x, y, w, h); }

// pellicule de grain : 3 tuiles précalculées, alternées image par image
const tuiles = [];
export function grain(c, n, force, W, H) { if (!tuiles.length) for (let k = 0; k < 3; k++) { const T = new Canvas(256, 256), g = T.getContext("2d"), d = g.createImageData(256, 256);
    for (let i = 0; i < 256 * 256; i++) { const v = rnd(i * 3.1 + k * 977.7) * 255; d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; }
    g.putImageData(d, 0, 0); tuiles.push(T); }
  c.save(); c.globalAlpha = force; c.globalCompositeOperation = "overlay"; const T = tuiles[n % 3];
  for (let y = 0; y < H; y += 256) for (let x = 0; x < W; x += 256) c.drawImage(T, x, y); c.restore(); }
