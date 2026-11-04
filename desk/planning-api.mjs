// Planificateur : posts Zernio (programmés et publiés), au format attendu par le planning.
// Lecture seule. La clé Zernio vient de ZERNIO_API_KEY ou de ~/.config/zernio/.env, jamais renvoyée au navigateur.
import {readFile, readdir, writeFile} from 'node:fs/promises';
import os from 'node:os';
import {versionInfo, confirmations, amorcer} from './versions-api.mjs';
import path from 'node:path';
import {config} from './config.mjs';

const ZERNIO = 'https://zernio.com/api/v1';
const cache = new Map();
// Dernière lecture réussie de chaque source, gardée sur disque : si une source tombe (réseau, panne), on affiche la précédente.
const fichierCache = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'planning-cache.json');
let disque = null;
const memo = async (key, ttl, fn) => {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < ttl) return hit.v;
  try {
    const v = await fn();
    cache.set(key, {t: Date.now(), v});
    disque ??= JSON.parse(await readFile(fichierCache, 'utf8').catch(() => '{}'));
    disque[key] = {t: Date.now(), v};
    await writeFile(fichierCache, JSON.stringify(disque));
    return v;
  } catch (e) {
    disque ??= JSON.parse(await readFile(fichierCache, 'utf8').catch(() => '{}'));
    const vieux = hit || disque[key];
    if (!vieux) throw e;
    const quand = new Date(vieux.t).toLocaleString('fr-FR', {timeZone: config.fuseau, dateStyle: 'short', timeStyle: 'short'});
    throw Object.assign(Error(`${e.message} (données du ${quand})`), {vieux: vieux.v});
  }
};

async function zernioKey() {
  if (process.env.ZERNIO_API_KEY) return process.env.ZERNIO_API_KEY;
  try {
    const env = await readFile(path.join(os.homedir(), '.config/zernio/.env'), 'utf8');
    return /^ZERNIO_API_KEY=["']?([^"'\n]+)/m.exec(env)?.[1];
  } catch { return null; }
}

// Sans profil ni compte dans studio.config.json, le studio n'appelle jamais Zernio, même si une clé traîne sur la machine.
const comptes = () => Object.values(config.zernio?.comptes || {}).filter(Boolean);
export const zernioActif = () => !!config.zernio?.profil || comptes().length > 0;
const aMoi = post => (post.platforms || []).some(x => {
  const profil = x.profileId?._id || x.profileId || x.accountId?.profileId;
  return (config.zernio?.profil && String(profil) === config.zernio.profil) || comptes().includes(String(x.accountId?._id || x.accountId));
});

async function zernio() {
  if (!zernioActif()) return [];
  const key = await zernioKey();
  if (!key) throw Error('clé Zernio introuvable : renseigne ZERNIO_API_KEY (voir README)');
  const posts = [];
  for (let page = 1; page <= 10; page++) {
    const r = await fetch(`${ZERNIO}/posts?limit=100&page=${page}`, {headers: {Authorization: `Bearer ${key}`}, signal: AbortSignal.timeout(15000)});
    if (!r.ok) throw Error(`Zernio ${r.status}`);
    const d = await r.json();
    posts.push(...d.posts.filter(aMoi));
    if (page >= (d.pagination?.pages || 1)) break;
  }
  return posts.map(p => {
    const plateformes = (p.platforms || []).map(x => ({
      plateforme: x.platform,
      compte: x.accountId?.username || '',
      statut: x.status,
      url: x.platformPostUrl || '',
      erreur: x.errorMessage || x.error || '',
      date: x.publishedAt || x.scheduledFor || p.scheduledFor,
    }));
    const echec = p.status === 'failed' || plateformes.some(x => x.statut === 'failed' || x.erreur);
    return {
      source: 'zernio', id: p._id,
      date: p.scheduledFor || p.publishedAt || p.createdAt,
      statut: echec ? 'échec' : p.status === 'published' ? 'publié' : p.status === 'scheduled' ? 'programmé' : p.status,
      titre: (p.title || p.content || '').split('\n').find(l => l.trim()) || 'Sans texte',
      contenu: p.content || '',
      media: p.mediaItems?.[0] ? {url: p.mediaItems[0].url, type: p.mediaItems[0].type} : null,
      motCle: /commente\s+[«"“]?\s*([A-ZÀ-Ü0-9]{3,})/i.exec(p.content || '')?.[1] || '',
      plateformes,
    };
  });
}

export async function planning(root, jours = 30) {
  if (!zernioActif()) return {maj: new Date().toISOString(), items: [], erreurs: {}, inactif: true};
  const sources = {zernio: () => memo('zernio', 60e3, zernio)};
  const resultats = await Promise.allSettled(Object.values(sources).map(f => f()));
  const items = [], erreurs = {};
  Object.keys(sources).forEach((k, i) => {
    const r = resultats[i];
    if (r.status === 'fulfilled') items.push(...r.value);
    else { erreurs[k] = r.reason.message; if (r.reason.vieux) items.push(...r.reason.vieux.map(x => ({...x, ancien: true}))); }
  });
  items.sort((a, b) => new Date(a.date) - new Date(b.date));
  return {maj: new Date().toISOString(), items, erreurs};
}

export const viderCache = () => cache.clear();

// Suivi par projet pour le studio : tourné (prises), monté (vidéo dans edits/), programmé puis publié (post Zernio, statut réel).
export async function suivi(root) {
  const lire = f => readFile(f, 'utf8').then(JSON.parse, () => null);
  const posts = new Map((await memo('zernio', 60e3, zernio).catch(e => e.vieux || [])).map(p => [p.id, p]));
  const dossiers = [[path.join(root, 'projects'), false], [path.join(root, 'projects', 'archives'), true]];
  const out = [], vues = await confirmations(root);
  for (const [dir, archive] of dossiers) for (const n of (await readdir(dir).catch(() => [])).filter(n => n.endsWith('.json'))) {
    const p = await lire(path.join(dir, n));
    if (!p?.id) continue;
    const base = path.join(root, 'edits', p.id);
    // Dernière version livrée (vN, date, retour traité) : voir versions-api.mjs.
    const {montages, version} = await versionInfo(root, p);
    const fiche = path.join(base, 'fiche');
    const local = (await lire(path.join(fiche, 'zernio-post.json')))?.post, yt = (await lire(path.join(fiche, 'zernio-youtube-post.json')))?.post;
    const reseaux = [];
    for (const lp of [local, yt].filter(Boolean)) {
      const live = posts.get(lp._id);
      for (const x of live?.plateformes || (lp.platforms || []).map(x => ({plateforme: x.platform, statut: x.status, url: '', erreur: ''})))
        reseaux.push({plateforme: x.plateforme, statut: x.erreur || x.statut === 'failed' ? 'échec' : x.statut === 'published' ? 'publié' : 'programmé', url: x.url, date: x.date || lp.scheduledFor, erreur: x.erreur});
    }
    const date = local?.scheduledFor || yt?.scheduledFor || null;
    const etape = reseaux.some(r => r.statut === 'échec') ? 'échec' : reseaux.length && reseaux.every(r => r.statut === 'publié') ? 'publié'
      : reseaux.some(r => r.statut === 'publié') ? 'en partie publié' : reseaux.length ? 'programmé' : montages ? 'monté, pas programmé' : p.takes?.length ? 'tourné, pas monté' : 'à tourner';
    const dernier = (p.takes || []).filter(t => t.kind === 'montage').at(-1);
    const stamps = (p.takes || []).filter(t => t.kind !== 'montage').map(t => +(t.name.match(/\d{13}/)?.[0] || 0)).filter(Boolean);
    out.push({id: p.id, titre: p.title || 'Vidéo sans titre', archive, cree: p.created, prises: p.takes?.length || 0, montages, date, etape, reseaux,
      script: Boolean(p.script?.trim()), retours: (p.notes || []).filter(n => !n.done && (!dernier || n.takeId === dernier.id)).length, dernierePrise: stamps.length ? new Date(Math.max(...stamps)).toISOString() : null,
      version, confirme: vues[p.id] || null});
  }
  await amorcer(root, out);
  return out.sort((a, b) => new Date(b.date || b.cree || 0) - new Date(a.date || a.cree || 0));
}
