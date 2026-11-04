// Moteur maison des reels (vertical 1080 × 1920 par défaut, ou le format data-width / data-height de head.part, par exemple 1920 × 1080) : rejoue les scènes du gabarit (src/head.part, _helpers.js, scenes.part, tail.part) avec skia-canvas, sans navigateur ni HyperFrames.
// Calques : monde (canvas), facecam détourée en carte, tête détourée (head.webm, alpha), sous-titres.
//   node reel.mjs --edit <dossier du montage> --images 3.2,45            (images de contrôle dans qa/moteur)
//   FPS=60 node reel.mjs --edit <dossier> --de 0 --a 900 --sortie seg.mp4 (un segment, en images)
// Le rendu complet passe par rendu-reel.sh.
import { Canvas, Path2D, FontLibrary, loadImage } from "skia-canvas";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { bib } from "./bib/bib.mjs";

const ICI = path.dirname(fileURLToPath(import.meta.url)), FPS = +(process.env.FPS || 30);
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const D = path.resolve(arg("edit", "."));

const F = path.join(ICI, "fonts");
FontLibrary.use("Archivo Black", [path.join(F, "archivoblack.ttf")]);
FontLibrary.use("Montserrat", [path.join(F, "Montserrat-VariableFont_wght.ttf"), path.join(F, "Montserrat-Italic-VariableFont_wght.ttf")]);
FontLibrary.use("IBM Plex Mono", ["plexmono-500", "plexmono-600", "plexmono-700"].map((n) => path.join(F, n + ".ttf")));
// tes polices : dépose un .ttf ou .otf dans moteur/fonts/perso, son nom de fichier devient le nom de famille
const PERSO = path.join(F, "perso");
if (fs.existsSync(PERSO)) for (const f of fs.readdirSync(PERSO).filter((n) => /\.(ttf|otf)$/i.test(n))) FontLibrary.use(path.parse(f).name, [path.join(PERSO, f)]);

// assemble la composition d'origine en remplaçant seulement ce qui touche au DOM ; chaque remplacement doit trouver sa cible
const lire = (f) => fs.readFileSync(path.join(D, "src", f), "utf8");
const remplace = (s, de, vers) => { if (!de.test(s)) throw new Error("motif absent : " + de); return s.replace(de, vers); };
let tete = lire("head.part"); const W = +(tete.match(/data-width="(\d+)"/) || [, 1080])[1], H = +(tete.match(/data-height="(\d+)"/) || [, 1920])[1]; const FOND = (tete.match(/html, body \{[^}]*background: (#[0-9A-Fa-f]+)/) || [, "#F0EDE6"])[1]; // taille de la caméra lue dans la règle .cam de head.part (1920 × 1080 par défaut, 1080 × 1920 pour une prise portrait)
const CAM = tete.match(/\.cam \{[^}]*width: (\d+)px; height: (\d+)px/), VW = CAM ? +CAM[1] : 1920, VH = CAM ? +CAM[2] : 1080;
tete = tete.slice(tete.indexOf("(function () {") + 14);
tete = remplace(tete, /const cv = document[\s\S]*?const a = acc\.getContext\("2d"\);/,
  'const g = env.MONDE.getContext("2d"), cg = env.CAP.getContext("2d"); const off = env.mk(), o = off.getContext("2d"); const acc = env.mk(), a = acc.getContext("2d");');
// les images des scènes (new Image() + src) sont chargées avant le rendu et servies déjà prêtes
const IMAGES = {}, RE_IMG = /new Image\(\); *(\w+)\.src = "([^"]+)";/g;
let scenes = lire("scenes.part").replace(/^.*@@HELPERS@@.*\n/, "");
for (const [, , f] of scenes.matchAll(RE_IMG)) { const im = await loadImage(path.join(D, f)); IMAGES[f] = Object.defineProperties(im, { naturalWidth: { value: im.width } }); }
scenes = scenes.replace(RE_IMG, (_, v, f) => `env.img(${JSON.stringify(f)});`);
let queue = lire("tail.part");
queue = remplace(queue, /const face = document\.getElementById[^\n]*\n/, "");
queue = remplace(queue, /cam\.style\.transform = tr; cam2\.style\.transform = tr;/, "LAY.tx = tx; LAY.ty = ty; LAY.S = S;");
queue = remplace(queue, /face\.style\.clipPath = [^\n]*\n/, "LAY.top = top; LAY.sd = sd; LAY.bot = bot; LAY.r = r;\n");
queue = remplace(queue, /head\.style\.clipPath = [^\n]*\n/, "");
queue = remplace(queue, /head\.style\.opacity = [^;]*;/, "LAY.p = p;");
// skia-canvas garde l'historique de dessin d'un canvas jusqu'à sa réinitialisation : on remet à zéro les tampons internes à chaque passe
queue = remplace(queue, /scene\(o, ts\);/, `off.width = ${W}; scene(o, ts);`);
queue = remplace(queue, /const fort = FOUETTES/, `acc.width = ${W}; g.canvas.width = ${W}; cg.canvas.width = ${W}; const fort = FOUETTES`);
queue = queue.slice(0, queue.indexOf("const tl = gsap")) + "return { render, LAY, FC };";
const win = {}; for (const f of ["words.js", "track.js"]) vm.runInNewContext(fs.readFileSync(path.join(D, "assets", f), "utf8"), { window: win });
const corps = "const { Path2D } = env; const window = env.window; const LAY = {};\n" + tete + "\n" + lire("_helpers.js") + "\n" + bib(D) + "\n" + scenes + "\n" + queue;

const MONDE = new Canvas(W, H), CAP = new Canvas(W, H);
const { render, LAY, FC } = new Function("env", corps)({ Path2D, window: win, MONDE, CAP, img: (f) => IMAGES[f], mk: () => new Canvas(W, H) });

const out = new Canvas(W, H), c = out.getContext("2d");
const calque = () => { const cv = new Canvas(VW, VH), x = cv.getContext("2d"); return { cv, x, img: x.createImageData(VW, VH) }; };
const visage = calque(), tete2 = calque(), TETE = fs.existsSync(path.join(D, "assets/head.webm"));
const sansTete = async () => null;

// décode un flux vidéo en RGBA à partir d'une image ; ffmpeg est mis en pause au-delà de 4 images d'avance
function lecteur(fichier, debut, n, alpha) {
  const p = spawn("ffmpeg", ["-v", "error", ...(alpha ? ["-c:v", "libvpx-vp9"] : []), "-ss", (debut / FPS).toFixed(4), "-i", path.join(D, "assets", fichier),
    "-vf", `fps=${FPS}`, "-frames:v", String(n), "-f", "rawvideo", "-pix_fmt", "rgba", "-"]);
  const taille = VW * VH * 4, image = Buffer.allocUnsafe(taille), MAX = 4 * taille; let morceaux = [], dispo = 0, attente = null, fini = false;
  const reveil = () => { if (attente) { const r = attente; attente = null; r(); } };
  p.stdout.on("data", (b) => { morceaux.push(b); dispo += b.length; if (dispo > MAX) p.stdout.pause(); if (dispo >= taille) reveil(); });
  p.stdout.on("end", () => { fini = true; reveil(); });
  return async () => { while (dispo < taille && !fini) await new Promise((r) => (attente = r)); if (dispo < taille) return null;
    for (let pos = 0; pos < taille; ) { const m = morceaux[0], k = Math.min(m.length, taille - pos); m.copy(image, pos, 0, k); pos += k;
      if (k === m.length) morceaux.shift(); else morceaux[0] = m.subarray(k); }
    dispo -= taille; if (dispo <= MAX && p.stdout.isPaused()) p.stdout.resume(); return image; };
}
async function poser(cl, lire) { cl.cv.width = VW; const b = await lire(); if (b) { cl.img.data.set(b); cl.x.putImageData(cl.img, 0, 0); } }

// même empilement que le DOM : monde, carte visage (clip-path inset arrondi), tête qui dépasse, sous-titres
function composer(t) {
  render(t); out.width = W;
  c.fillStyle = FOND; c.fillRect(0, 0, W, H); c.drawImage(MONDE, 0, 0);
  const gl = LAY.l ?? LAY.sd, gr = LAY.rr ?? LAY.sd;
  c.save(); c.beginPath(); c.roundRect(gl, LAY.top, W - gl - gr, H - LAY.top - LAY.bot, LAY.r); c.clip();
  c.translate(LAY.tx, LAY.ty); c.scale(LAY.S, LAY.S); c.drawImage(visage.cv, 0, 0); c.restore();
  if (TETE && LAY.p < 1) { c.save(); c.globalAlpha = 1 - LAY.p; c.beginPath(); c.rect(FC.x, 0, W - 2 * FC.x, FC.y); c.clip();
    c.translate(LAY.tx, LAY.ty); c.scale(LAY.S, LAY.S); c.drawImage(tete2.cv, 0, 0); c.restore(); }
  c.drawImage(CAP, 0, 0);
}

if (arg("images")) {
  const dossier = path.resolve(arg("dossier", path.join(D, "qa/moteur"))); fs.mkdirSync(dossier, { recursive: true });
  for (const s of arg("images").split(",").map(Number)) { const n = Math.round(s * FPS);
    await poser(visage, lecteur("facecam.mp4", n, 1)); if (TETE) await poser(tete2, lecteur("head.webm", n, 1, true)); composer(n / FPS);
    const f = path.join(dossier, `t${s.toFixed(2).padStart(6, "0")}.jpg`); await out.saveAs(f, { quality: 0.9 }); console.log(f); }
} else {
  const de = +arg("de"), a = +arg("a"), sortie = arg("sortie"), lv = lecteur("facecam.mp4", de, a - de), lt = TETE ? lecteur("head.webm", de, a - de, true) : sansTete;
  const enc = spawn("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-r", String(FPS), "-i", "-",
    "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", sortie], { stdio: ["pipe", "inherit", "inherit"] });
  const t0 = Date.now();
  for (let n = de; n < a; n++) { await Promise.all([poser(visage, lv), poser(tete2, lt)]); composer(n / FPS); const px = c.getImageData(0, 0, W, H).data;
    if (!enc.stdin.write(Buffer.from(px.buffer, px.byteOffset, px.byteLength))) await new Promise((r) => enc.stdin.once("drain", r));
    if ((n - de) % 300 === 0) console.log(`[${de}] ${n - de}/${a - de} images, ${((n - de + 1) / ((Date.now() - t0) / 1000)).toFixed(1)} i/s`); }
  enc.stdin.end(); await new Promise((r) => enc.on("close", r));
}
