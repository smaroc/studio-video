// Versions de montage : numéro (vN), date, dernier retour traité, confirmation enregistrée sur le disque
// et notification système (macOS) envoyée par le serveur dès qu'un nouveau final.mp4 est posé (même onglet fermé).
import {readFile, readdir, writeFile, stat} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import path from 'node:path';
import {config} from './config.mjs';

const video = /\.(mp4|mov|m4v)$/i;
const lire = f => readFile(f, 'utf8').then(JSON.parse, () => null);

// Version livrée d'un projet : le final*.mp4 le plus récent à la racine de edits/<id>/ (à défaut, n'importe quel rendu).
// Numéro = versions archivées dans versions/vN/ + 1.
export async function versionInfo(root, p) {
  const base = path.join(root, 'edits', p.id);
  let version = null, montages = 0, finals = 0;
  for (const sous of ['', 'renders']) for (const v of (await readdir(path.join(base, sous)).catch(() => [])).filter(v => video.test(v) && !v.startsWith('.'))) {
    montages++;
    const s = await stat(path.join(base, sous, v)).catch(() => null);
    if (!s?.size) continue;
    const final = !sous && v.startsWith('final');
    if (final) finals++;
    if (!version || (final && !version.final) || (final === version.final && s.mtimeMs > version.ms)) version = {fichier: sous ? `${sous}/${v}` : v, ms: s.mtimeMs, taille: s.size, final};
  }
  if (!version) return {montages, version: null};
  const archives = (await readdir(path.join(base, 'versions')).catch(() => [])).filter(d => /^v\d+$/.test(d));
  const n = version.final ? Math.max(0, ...archives.map(d => +d.slice(1))) + 1 : null;
  // Dernier retour résolu : celui que cette version vient corriger.
  const traite = (p.notes || []).filter(x => x.done && x.text).at(-1)?.text || null;
  return {montages, version: {fichier: version.fichier, date: new Date(version.ms).toISOString(), taille: version.taille, n, traite}};
}

const fichierVues = root => path.join(root, 'versions-vues.json');
export const confirmations = async root => (await lire(fichierVues(root))) || {};
export async function confirmer(root, id, date) {
  const vues = await confirmations(root);
  vues[id] = date || new Date().toISOString();
  await writeFile(fichierVues(root), JSON.stringify(vues, null, 1));
  return vues[id];
}

// Premier lancement : les versions de plus de 48 h sont considérées comme déjà confirmées.
export async function amorcer(root, items) {
  if (await lire(fichierVues(root))) return;
  const vues = {};
  for (const x of items) if (x.version && Date.now() - new Date(x.version.date) > 48 * 3600e3) vues[x.id] = x.version.date;
  await writeFile(fichierVues(root), JSON.stringify(vues, null, 1));
}

const echapper = s => String(s).replace(/[\\"]/g, ' ');
const notifier = (titre, texte, sous) => process.platform === 'darwin' && execFile('osascript', ['-e',
  `display notification "${echapper(texte)}" with title "${echapper(titre)}" subtitle "${echapper(sous)}" sound name "Glass"`], () => {});

// Surveillance toutes les 30 s des projets actifs. Une version n'est annoncée qu'une fois sa taille stable
// entre deux passages (rendu terminé). Au tout premier passage, on mémorise l'existant sans notifier.
export function surveiller(root) {
  const etat = path.join(root, 'versions-notifiees.json'), attente = new Map();
  const passe = async () => {
    const connu = await lire(etat), neuf = !connu, vu = connu || {};
    const dir = path.join(root, 'projects');
    let change = neuf;
    for (const n of (await readdir(dir).catch(() => [])).filter(n => n.endsWith('.json'))) {
      const p = await lire(path.join(dir, n));
      if (!p?.id) continue;
      const {version: v} = await versionInfo(root, p);
      if (!v?.n || vu[p.id] === v.date) { attente.delete(p.id); continue; }
      if (!neuf && attente.get(p.id) !== `${v.date}:${v.taille}`) { attente.set(p.id, `${v.date}:${v.taille}`); continue; }
      attente.delete(p.id); vu[p.id] = v.date; change = true;
      if (!neuf) notifier('Nouvelle version à confirmer', `${p.title || 'Vidéo'} · v${v.n}`,
        new Date(v.date).toLocaleString('fr-FR', {timeZone: config.fuseau, weekday: 'short', hour: '2-digit', minute: '2-digit'}) + (v.traite ? ` · ${v.traite.slice(0, 60)}` : ''));
    }
    if (change) await writeFile(etat, JSON.stringify(vu, null, 1));
  };
  const tour = () => passe().catch(e => console.error('surveillance des versions :', e.message));
  tour();
  return setInterval(tour, 30e3);
}
