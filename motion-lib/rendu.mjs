// Rendu de la bobine de démonstration.
//   node rendu.mjs --planche                     planche de toutes les scènes (rendus/planche.jpg)
//   node rendu.mjs --scene ouverture --t 0.5,1,4  images d'une scène (rendus/qa/)
//   node rendu.mjs --video [--de 0 --a 52]        vidéo (rendus/demo.mp4), temps en secondes
import { Canvas, FontLibrary, loadImage } from "skia-canvas";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { W, H, FPS, polices, texte, monoF, titreF, CLAIR } from "./index.mjs";
import { SCENES, DEBUTS, TOTAL, dessiner, dessinerScene } from "./demo/scenes.mjs";

const ICI = path.dirname(fileURLToPath(import.meta.url)), R = path.join(ICI, "rendus");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] ?? true : d; };
polices(FontLibrary); fs.mkdirSync(path.join(R, "qa"), { recursive: true });
const M = await Promise.all(["media-1", "media-2", "media-3", "media-4"].map((n) => loadImage(path.join(ICI, "demo/medias", n + ".jpg"))));

const cv = new Canvas(W, H); cv.gpu = process.env.GPU === "1"; const c = cv.getContext("2d");
// skia-canvas empile les opérations tant que le canvas n'est pas réinitialisé : on le remet à zéro à chaque image
const neuf = () => { cv.width = W; };

if (arg("planche")) {
  const tw = 640, th = 360, cols = 3, rows = Math.ceil(SCENES.length / cols), P = new Canvas(tw * cols + 40 * (cols + 1), (th + 70) * rows + 140), p = P.getContext("2d");
  p.fillStyle = "#E4E1D9"; p.fillRect(0, 0, P.width, P.height);
  texte(p, "Bibliothèque motion éditoriale", 40, 80, titreF(48, 900), "#0B0B0B", { ls: -1.5 });
  for (const [i, S] of SCENES.entries()) { neuf(); dessinerScene(c, S.nom, S.duree - 0.9, M); const x = 40 + (i % cols) * (tw + 40), y = 130 + Math.floor(i / cols) * (th + 70);
    p.drawImage(cv, x, y, tw, th); texte(p, `${String(i + 1).padStart(2, "0")}  ${S.nom.toUpperCase()}`, x, y + th + 32, monoF(16, 600), "#6C675E", { ls: 3 }); }
  await P.saveAs(path.join(R, "planche.jpg"), { quality: 0.9 }); console.log(path.join(R, "planche.jpg"));
} else if (arg("scene")) {
  for (const t of String(arg("t", "1,3")).split(",").map(Number)) { neuf(); dessinerScene(c, arg("scene"), t, M);
    const f = path.join(R, "qa", `${arg("scene")}-${t.toFixed(2)}.jpg`); await cv.saveAs(f, { quality: 0.9 }); console.log(f); }
} else if (arg("video")) {
  const de = Math.round(+arg("de", 0) * FPS), a = Math.round(+arg("a", TOTAL) * FPS), sortie = arg("sortie", path.join(R, "demo.mp4"));
  const enc = spawn("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-r", String(FPS), "-i", "-",
    "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", sortie], { stdio: ["pipe", "inherit", "inherit"] });
  const t0 = Date.now();
  for (let n = de; n < a; n++) { neuf(); dessiner(c, n / FPS, M); const px = c.getImageData(0, 0, W, H).data;
    if (!enc.stdin.write(Buffer.from(px.buffer, px.byteOffset, px.byteLength))) await new Promise((r) => enc.stdin.once("drain", r));
    if ((n - de) % 90 === 0) console.log(`${n - de}/${a - de} images, ${((n - de + 1) / ((Date.now() - t0) / 1000)).toFixed(1)} i/s`); }
  enc.stdin.end(); await new Promise((r) => enc.on("close", r)); console.log(sortie);
}
