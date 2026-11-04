// Statistiques des reels programmés depuis le studio : uniquement les posts dont l'id est rangé dans edits/<projet>/fiche/zernio-*.json.
// Lecture seule. Totaux par réseau (/analytics) et évolution jour par jour (/analytics/post-timeline, valeurs cumulées).
import {readFile, readdir, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {zernioActif} from './planning-api.mjs';

const ZERNIO = 'https://zernio.com/api/v1';
const RESEAUX = ['instagram', 'facebook', 'tiktok', 'youtube'];
const cache = new Map();
// Dernière lecture réussie de chaque post gardée sur disque : si Zernio tombe, on affiche la précédente.
const fichierCache = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'stats-cache.json');
let disque = null;
const memo = async (key, ttl, fn) => {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < ttl) return hit.v;
  disque ??= JSON.parse(await readFile(fichierCache, 'utf8').catch(() => '{}'));
  try {
    const v = await fn();
    cache.set(key, {t: Date.now(), v});
    disque[key] = {t: Date.now(), v};
    return v;
  } catch (e) {
    const vieux = hit || disque[key];
    if (!vieux) throw e;
    return Object.assign(structuredClone(vieux.v), {ancien: vieux.t});
  }
};

async function zernioKey() {
  if (process.env.ZERNIO_API_KEY) return process.env.ZERNIO_API_KEY;
  try {
    const env = await readFile(path.join(os.homedir(), '.config/zernio/.env'), 'utf8');
    return /^ZERNIO_API_KEY=["']?([^"'\n]+)/m.exec(env)?.[1];
  } catch { return null; }
}

const lireJson = f => readFile(f, 'utf8').then(JSON.parse).catch(() => null);

// Un projet du studio compte s'il a au moins un post Zernio enregistré par la programmation.
async function projets(root) {
  const dir = path.join(root, 'edits');
  const out = [];
  for (const id of await readdir(dir).catch(() => [])) {
    const fiche = path.join(dir, id, 'fiche');
    const posts = [];
    for (const n of ['zernio-post.json', 'zernio-youtube-post.json']) {
      const j = await lireJson(path.join(fiche, n));
      const p = j?.post || j;
      if (p?._id) posts.push({id: p._id, date: p.scheduledFor || p.publishedAt, reseaux: (p.platforms || []).map(x => x.platform)});
    }
    if (!posts.length) continue;
    const meta = await lireJson(path.join(dir, id, 'meta.json'));
    const caption = await readFile(path.join(fiche, 'caption.txt'), 'utf8').catch(() => '');
    const cover = await readFile(path.join(dir, id, 'cover.jpg')).then(() => true, () => false);
    out.push({
      projet: id, nom: meta?.name || id.slice(0, 8), cover,
      titre: caption.split('\n').find(l => l.trim())?.trim() || meta?.name || id.slice(0, 8),
      motCle: /commente\s+[«"“]?\s*([A-ZÀ-Ü0-9]{3,})/i.exec(caption)?.[1] || '',
      date: posts.map(p => p.date).sort()[0], posts,
    });
  }
  return out;
}

const chiffres = a => ({
  vues: a?.views || 0, likes: a?.likes || 0, commentaires: a?.comments || 0, partages: a?.shares || 0,
  enregistrements: a?.saves || 0, abonnes: a?.follows || 0,
});

async function lirePost(key, id) {
  // Zernio limite à une dizaine d'appels par seconde : on réessaie après la fenêtre quand il répond 429.
  const get = async route => {
    for (let essai = 0; ; essai++) {
      const r = await fetch(`${ZERNIO}${route}`, {headers: {Authorization: `Bearer ${key}`}, signal: AbortSignal.timeout(20000)});
      if (r.status === 429 && essai < 5) { await new Promise(ok => setTimeout(ok, 1100 * (essai + 1))); continue; }
      if (!r.ok) throw Error(`Zernio ${r.status}`);
      return r.json();
    }
  };
  const a = await get(`/analytics?postId=${id}`), t = await get(`/analytics/post-timeline?postId=${id}`);
  return {
    statut: a.status,
    reseaux: (a.platformAnalytics || []).map(x => ({
      plateforme: x.platform, statut: x.status, url: x.platformPostUrl || '',
      ...chiffres(x.analytics), engagement: x.analytics?.engagementRate || 0,
      tempsMoyen: x.analytics?.igReelsAvgWatchTime ? x.analytics.igReelsAvgWatchTime / 1000 : 0,
      maj: x.analytics?.lastUpdated || '',
    })),
    timeline: (t.timeline || []).map(r => ({date: r.date, plateforme: r.platform, ...chiffres(r)})),
  };
}

// Série jour par jour depuis la publication : chaque réseau garde sa dernière valeur cumulée tant qu'aucune nouvelle ligne n'arrive.
function serie(lignes) {
  if (!lignes.length) return [];
  const parJour = {};
  for (const l of lignes) (parJour[l.date] ??= {})[l.plateforme] = l;
  const jours = Object.keys(parJour).sort();
  const out = [], dernier = {};
  for (let d = new Date(jours[0] + 'T12:00Z'); d.toISOString().slice(0, 10) <= jours.at(-1); d.setUTCDate(d.getUTCDate() + 1)) {
    const j = d.toISOString().slice(0, 10);
    Object.assign(dernier, parJour[j] || {});
    const ligne = {date: j};
    for (const r of RESEAUX) if (dernier[r]) { const {date, plateforme, ...c} = dernier[r]; ligne[r] = c; }
    out.push(ligne);
  }
  return out;
}

export async function stats(root) {
  if (!zernioActif()) return {maj: new Date().toISOString(), reels: [], erreurs: {}, inactif: true};
  const key = await zernioKey();
  if (!key) throw Error('clé Zernio introuvable (~/.config/zernio/.env)');
  const liste = await projets(root);
  const erreurs = {};
  // Trois projets à la fois au plus, pour rester sous la limite de Zernio.
  const file = [...liste], reels = [];
  await Promise.all(Array.from({length: 3}, async () => { for (let p; (p = file.shift());) reels.push(await reel(p)); }));
  async function reel(p) {
    const aVenir = new Date(p.date) > Date.now();
    const lus = [];
    if (!aVenir) for (const x of p.posts) lus.push(await memo(x.id, 10 * 60e3, () => lirePost(key, x.id)).catch(e => { erreurs[p.projet] = e.message; return null; }));
    const reseaux = lus.flatMap(l => l?.reseaux || []).sort((a, b) => RESEAUX.indexOf(a.plateforme) - RESEAUX.indexOf(b.plateforme));
    const total = Object.fromEntries(Object.keys(chiffres()).map(k => [k, reseaux.reduce((s, r) => s + r[k], 0)]));
    const ancien = lus.map(l => l?.ancien).filter(Boolean).sort()[0];
    return {
      projet: p.projet, nom: p.nom, titre: p.titre, motCle: p.motCle, date: p.date, cover: p.cover,
      statut: aVenir ? 'programmé' : lus.some(l => l?.statut === 'published') ? 'publié' : (lus[0]?.statut || 'inconnu'),
      prevus: [...new Set(p.posts.flatMap(x => x.reseaux))], reseaux, total,
      serie: serie(lus.flatMap(l => l?.timeline || [])), ancien: ancien || null,
    };
  }
  await writeFile(fichierCache, JSON.stringify(disque || {})).catch(() => {});
  reels.sort((a, b) => new Date(b.date) - new Date(a.date));
  return {maj: new Date().toISOString(), reels, erreurs};
}

export const viderCache = () => cache.clear();
