// Jetons du style « éditorial » : deux thèmes (clair crème, sombre noir chaud), un seul accent orange ambré.
import path from "node:path";
import { fileURLToPath } from "node:url";

export const W = 1920, H = 1080, FPS = 30;
export const TITRE = "Geist", MONO = "Geist Mono";

const commun = { acc: "#F0882A", acc2: "#F6B04A", accFort: "#E2701A" };

export const CLAIR = { ...commun, nom: "clair",
  bg: "#EDEBE5", bg2: "#E4E1D9", grille: "rgba(11,11,11,0.05)", encre: "#0B0B0B", mut: "#8C877D", dim: "#BEB9AE",
  carte: "#F7F6F2", carteBord: "rgba(11,11,11,0.08)", trait: "rgba(11,11,11,0.14)", accDoux: "rgba(240,136,42,0.13)",
  vignette: "rgba(105,95,80,0.22)", grain: 0.05, inverse: "#F4F2EC" };

export const SOMBRE = { ...commun, nom: "sombre",
  bg: "#0C0C0B", bg2: "#151513", grille: "rgba(255,255,255,0.035)", encre: "#F4F2EC", mut: "#8A867E", dim: "#45433F",
  carte: "#171715", carteBord: "rgba(255,255,255,0.08)", trait: "rgba(255,255,255,0.14)", accDoux: "rgba(240,136,42,0.16)",
  vignette: "rgba(0,0,0,0.6)", grain: 0.07, inverse: "#0B0B0B" };

// enregistre les polices statiques (générées depuis Geist variable) auprès de skia-canvas
export function polices(FontLibrary) {
  const d = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "fonts"), f = (n) => path.join(d, n + ".ttf");
  FontLibrary.use(TITRE, [400, 500, 600, 700, 800, 900].flatMap((w) => [f(`geist-${w}`), f(`geist-italic-${w}`)]));
  FontLibrary.use(MONO, [400, 500, 600, 700].map((w) => f(`geistmono-${w}`)));
}
