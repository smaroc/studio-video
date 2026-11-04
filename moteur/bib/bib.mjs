// bibliothèque d'objets partagés des reels : un fichier par objet dans objets/, ajoutés au montage après _helpers.js
// un objet déclaré par le montage lui-même (function, const, let) gagne toujours : sa version de la bibliothèque est retirée
//   node moteur/bib/bib.mjs <dossier du montage>   (écrit le code retenu sur la sortie standard)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OBJETS = path.join(path.dirname(fileURLToPath(import.meta.url)), "objets");

export function bib(dir) {
  const local = ["head.part", "_helpers.js", "scenes.part"].map((f) => { try { return fs.readFileSync(path.join(dir, "src", f), "utf8"); } catch { return ""; } }).join("\n");
  const declare = (n) => new RegExp(`(function|const|let|var)\\s+${n}\\b|[,{]\\s*${n}\\s*=[^=]`).test(local);
  return fs.readdirSync(OBJETS).filter((f) => f.endsWith(".js")).sort()
    .map((f) => [path.basename(f, ".js"), fs.readFileSync(path.join(OBJETS, f), "utf8")])
    .filter(([n]) => !declare(n)).map(([n, code]) => `// bib : ${n}\n${code}`).join("");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.stdout.write(bib(path.resolve(process.argv[2] || ".")));
