// Courbes de temps. Toutes les fonctions prennent un temps local t (secondes depuis l'apparition).
export const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, p) => a + (b - a) * p;
export const prog = (t, t0, d) => clamp((t - t0) / d);

export const eo = (p) => 1 - Math.pow(1 - clamp(p), 3);
export const eio = (p) => { p = clamp(p); return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
export const expo = (p) => { p = clamp(p); return p === 1 ? 1 : 1 - Math.pow(2, -10 * p); };
export const quint = (p) => 1 - Math.pow(1 - clamp(p), 5);
export const back = (p, s = 1.5) => { p = clamp(p) - 1; return 1 + p * p * ((s + 1) * p + s); };

// ressort amorti : 0 avant t0, tend vers 1
export function ressort(t, t0 = 0, f = 2.6, z = 0.7) { const tau = t - t0; if (tau <= 0) return 0; const w = 2 * Math.PI * f;
  if (z >= 1) return 1 - Math.exp(-w * tau) * (1 + w * tau);
  const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + (z * w / wd) * Math.sin(wd * tau)); }

// bruit pseudo aléatoire déterministe
export const rnd = (i) => { const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };
// bruit lisse 1D
export function bruit(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(rnd(i), rnd(i + 1), u) * 2 - 1; }

// opacité d'entrée et de sortie d'un bloc qui vit de 0 à duree
export function vie(t, duree, entree = 0.35, sortie = 0.3) {
  if (t < 0) return 0; const a = eo(t / entree); return duree ? a * (1 - eio((t - (duree - sortie)) / sortie)) : a; }
