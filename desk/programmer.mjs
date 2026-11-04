// Programmation d'un montage sur Zernio depuis le studio : upload vidéo + couverture, post IG/FB/TikTok,
// post YouTube séparé, automatisations commentaire → DM. La clé Zernio reste côté serveur.
// Chaque réponse est écrite dans edits/<projet>/fiche/ au fil de l'eau, pour ne jamais créer deux fois le même post.
import {readFile, writeFile, readdir, stat, mkdir, rename} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {config} from './config.mjs';

const ZERNIO = 'https://zernio.com/api/v1';
const PROFIL = config.zernio.profil, COMPTES = config.zernio.comptes;
const VIDEO = /^[a-zA-Z0-9_.-]+\.(mp4|mov|m4v)$/i;

async function cle() {
  if (process.env.ZERNIO_API_KEY) return process.env.ZERNIO_API_KEY;
  const env = await readFile(path.join(os.homedir(), '.config', 'zernio', '.env'), 'utf8').catch(() => '');
  const k = /^ZERNIO_API_KEY=["']?([^"'\n]+)/m.exec(env)?.[1];
  if (!k) throw Error('Clé Zernio introuvable (~/.config/zernio/.env)');
  return k;
}
async function zernio(route, body) {
  const r = await fetch(ZERNIO + route, {method: 'POST', headers: {Authorization: `Bearer ${await cle()}`, 'Content-Type': 'application/json'}, body: JSON.stringify(body), signal: AbortSignal.timeout(60000)});
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Error(`Zernio ${route} : ${j.error || j.message || r.status}`);
  return j;
}
async function envoyer(file, contentType) {
  const {uploadUrl, publicUrl} = await zernio('/media/presign', {filename: path.basename(file), contentType});
  const r = await fetch(uploadUrl, {method: 'PUT', headers: {'Content-Type': contentType}, body: await readFile(file), signal: AbortSignal.timeout(600000)});
  if (!r.ok) throw Error(`Upload ${path.basename(file)} refusé (${r.status})`);
  return publicUrl;
}

const lireJson = f => readFile(f, 'utf8').then(JSON.parse, () => null);
const existe = f => stat(f).then(s => s.isFile() && s.size > 0, () => false);

// "2026-10-21T18:00" lu dans le fuseau du studio → Date UTC (gère l'heure d'été).
function heureLocale(local) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local || '');
  if (!m) throw Error('Date ou heure invalide');
  const voulu = Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5]);
  const fmt = new Intl.DateTimeFormat('en-GB', {timeZone: config.fuseau, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'});
  let t = voulu;
  for (let i = 0; i < 2; i++) {
    const p = Object.fromEntries(fmt.formatToParts(new Date(t)).map(x => [x.type, x.value]));
    t += voulu - Date.UTC(+p.year, p.month - 1, +p.day, +p.hour, +p.minute);
  }
  return new Date(t);
}

async function videos(base) {
  const out = [];
  for (const sous of ['', 'renders']) {
    const noms = await readdir(path.join(base, sous)).catch(() => []);
    for (const n of noms.filter(n => VIDEO.test(n) && !n.startsWith('.'))) {
      const rel = sous ? `${sous}/${n}` : n, s = await stat(path.join(base, rel));
      if (s.isFile() && s.size > 0) out.push({rel, mtime: s.mtimeMs, size: s.size});
    }
  }
  return out.sort((a, b) => b.mtime - a.mtime);
}

export async function etat(root, id) {
  const base = path.join(root, 'edits', id), fiche = path.join(base, 'fiche');
  const liste = await videos(base);
  if (!liste.length) throw Error('Aucun montage livré dans edits/' + id);
  const caption = (await readFile(path.join(fiche, 'caption.txt'), 'utf8').catch(() => '')).trim();
  const post = await lireJson(path.join(fiche, 'zernio-post.json')), yt = await lireJson(path.join(fiche, 'zernio-youtube-post.json'));
  const dm = await lireJson(path.join(fiche, 'zernio-dm-automations.json')), page = await lireJson(path.join(fiche, 'post-response.json'));
  const meta = await lireJson(path.join(base, 'meta.json'));
  const motCle = dm?.instagram?.keywords?.[0] || /Commente\s+[«"]?\s*([A-ZÀ-Ý0-9]{2,})/.exec(caption)?.[1] || '';
  return {
    nom: meta?.name || id,
    videos: liste.map(v => v.rel),
    video: liste.find(v => v.rel === 'final.mp4') ? 'final.mp4' : liste[0].rel,
    cover: await existe(path.join(base, 'cover.jpg')),
    caption, motCle,
    fiche: page?.url || '',
    messageDm: dm?.instagram?.dmMessage || (page?.url ? config.dm.message.replace('{url}', page.url) : ''),
    titreYoutube: yt?.post?.title || '',
    deja: post?.post ? {id: post.post._id, scheduledFor: post.post.scheduledFor, statut: post.post.status} : null,
  };
}

export async function programmer(root, id, d) {
  const base = path.join(root, 'edits', id), fiche = path.join(base, 'fiche');
  // Réseaux publiables : ceux listés dans studio.config.json.
  const reseaux = config.reseaux.filter(r => d.reseaux?.includes(r));
  if (!reseaux.length) throw Error('Choisis au moins un réseau');
  const manquants = reseaux.filter(r => !COMPTES[r]);
  if (manquants.length) throw Error(`Compte Zernio manquant pour ${manquants.join(', ')} : renseigne zernio.comptes dans studio.config.json puis relance le studio`);
  if (!(await videos(base)).some(v => v.rel === d.video)) throw Error('Vidéo introuvable dans ce montage');
  const cover = path.join(base, 'cover.jpg');
  if (!(await existe(cover))) throw Error('cover.jpg manquante : la couverture est obligatoire');
  const caption = String(d.caption || '').trim();
  if (!caption || caption.length > 2200) throw Error('Légende vide ou trop longue (2200 caractères maximum)');
  const quand = heureLocale(d.date);
  if (quand - Date.now() < 5 * 60e3) throw Error('L’heure doit être au moins 5 minutes dans le futur');
  let titre = String(d.titreYoutube || '').trim();
  if (reseaux.includes('youtube')) {
    if (!titre) throw Error('Titre YouTube manquant');
    if (!/#Shorts$/i.test(titre)) titre += ' #Shorts';
    if (titre.length > 100) throw Error(`Titre YouTube trop long (${titre.length}/100)`);
  }
  const motCle = String(d.motCle || '').trim().replace(/\s+/g, '');
  const messageDm = String(d.messageDm || '').trim();
  if (motCle && !/https?:\/\//.test(messageDm)) throw Error('Le message DM doit contenir un lien');

  await mkdir(fiche, {recursive: true});
  const ecrire = (n, j) => writeFile(path.join(fiche, n), JSON.stringify(j, null, 1));
  if (await existe(path.join(fiche, 'zernio-post.json'))) {
    if (!d.remplacer) { const e = Error('Ce montage est déjà programmé'); e.code = 409; throw e; }
    const t = Date.now();
    for (const n of ['zernio-post.json', 'zernio-youtube-post.json', 'zernio-media.json', 'zernio-dm-automations.json', 'zernio-dm-response.json'])
      if (await existe(path.join(fiche, n))) await rename(path.join(fiche, n), path.join(fiche, n.replace('.json', `-avant-${t}.json`)));
  }
  await writeFile(path.join(fiche, 'caption.txt'), caption + '\n');

  const mp4 = path.join(base, d.video);
  const media = {[d.video]: await envoyer(mp4, mp4.endsWith('.mov') ? 'video/quicktime' : 'video/mp4'), 'cover.jpg': await envoyer(cover, 'image/jpeg')};
  await ecrire('zernio-media.json', media);
  const item = {url: media[d.video], type: 'video', thumbnail: media['cover.jpg'], instagramThumbnail: media['cover.jpg']};
  const commun = {mediaItems: [item], scheduledFor: quand.toISOString(), timezone: config.fuseau, visibility: 'public'};
  const resultat = {scheduledFor: quand.toISOString()};

  const principaux = reseaux.filter(r => r !== 'youtube');
  if (principaux.length) {
    const platforms = principaux.map(r => r === 'tiktok'
      ? {platform: r, accountId: COMPTES[r], platformSpecificData: {tiktokSettings: {allow_duet: true, allow_stitch: true, allow_comment: true, privacy_level: 'PUBLIC_TO_EVERYONE', express_consent_given: true, content_preview_confirmed: true}}}
      // Reel d'essai : montré d'abord aux non-abonnés, publié sur le profil s'il performe.
      : r === 'instagram' && d.essai ? {platform: r, accountId: COMPTES[r], platformSpecificData: {trialParams: {graduationStrategy: 'SS_PERFORMANCE'}}}
      : {platform: r, accountId: COMPTES[r]});
    const post = await zernio('/posts', {content: caption, ...commun, platforms});
    await ecrire('zernio-post.json', post);
    resultat.post = post.post?._id;
    if (!post.post?.mediaItems?.[0]?.thumbnail) resultat.alerte = 'Zernio n’a pas renvoyé la couverture : vérifie le post.';
  }
  if (reseaux.includes('youtube')) {
    const yt = await zernio('/posts', {title: titre, content: `${titre}\n\n${caption}`, ...commun, platforms: [{platform: 'youtube', accountId: COMPTES.youtube, platformSpecificData: {title: titre, visibility: 'public', madeForKids: false}}]});
    await ecrire('zernio-youtube-post.json', yt);
    resultat.youtube = yt.post?._id;
  }

  // Automatisations commentaire → DM : Instagram lié au post Zernio, Facebook sur tout le compte s'il est renseigné
  // (le mot-clé propre à la vidéo suffit à cibler). Il faut l'identifiant de profil Zernio.
  const dmReseaux = !PROFIL || !principaux.includes('instagram') ? [] : ['instagram', 'facebook'].filter(r => COMPTES[r]);
  if (motCle && !PROFIL) resultat.alerte = 'Automatisation DM ignorée : renseigne zernio.profil dans studio.config.json.';
  if (motCle && resultat.post && dmReseaux.length) {
    const majuscule = motCle.toUpperCase(), variantes = [...new Set([majuscule, motCle.toLowerCase(), majuscule[0] + motCle.slice(1).toLowerCase()])];
    const sujet = String(d.nom || '').replace(/[-_]+/g, ' ').trim().slice(0, 50);
    const regle = {profileId: PROFIL, postId: resultat.post, trigger: 'comment', name: `Comment ${majuscule}${sujet ? ' · ' + sujet : ''}`, keywords: variantes, matchMode: 'word', repeatPolicy: {mode: 'once'}, linkTracking: true, publicReplyPolicy: 'after_dm', dmMessage: messageDm};
    const corps = {
      instagram: {...regle, platform: 'instagram', accountId: COMPTES.instagram, commentReply: config.dm.reponseInstagram, commentReplyVariations: config.dm.variantes,
        ...(config.dm.abonnementRequis ? {audience: {followerStatus: 'follower', whenUnknown: 'verify', tapToUnlock: false},
          followGate: {message: config.dm.messageAbonnement.replaceAll('{pseudo}', config.pseudo), buttonLabel: config.dm.bouton, notFollowingMessage: config.dm.messageNonAbonne.replaceAll('{pseudo}', config.pseudo)}}
          : {audience: {followerStatus: 'any', whenUnknown: 'send'}})},
      facebook: {...regle, postId: undefined, platform: 'facebook', accountId: COMPTES.facebook, commentReply: config.dm.reponseFacebook, audience: {followerStatus: 'any', whenUnknown: 'send'}},
    };
    const envoyes = Object.fromEntries(dmReseaux.map(r => [r, corps[r]])), reponses = {};
    await ecrire('zernio-dm-automations.json', envoyes);
    for (const r of dmReseaux) {
      try { reponses[r] = await zernio('/comment-automations', envoyes[r]); } catch (e) { reponses[r] = {error: e.message}; resultat.alerte = `Automatisation ${r} refusée : ${e.message}`; }
    }
    await ecrire('zernio-dm-response.json', reponses);
    resultat.automatisations = Object.fromEntries(Object.entries(reponses).map(([r, j]) => [r, j.automation?.id || null]));
  }
  return resultat;
}
