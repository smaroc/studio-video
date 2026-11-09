import {config} from './config.js';
// Onglet « Planning » : uniquement les vidéos programmées ou publiées, une carte par reel avec les réseaux où il est validé.
const $ = s => document.getElementById(s);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const svg = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
const TZ = config.fuseau;
const jourDe = d => new Date(d).toLocaleDateString('sv-SE', {timeZone: TZ});
const heure = d => new Date(d).toLocaleTimeString('fr-FR', {timeZone: TZ, hour: '2-digit', minute: '2-digit'});
const ORDRE = ['instagram', 'facebook', 'tiktok', 'youtube'];
const NOMS = {instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', youtube: 'YouTube'};
const LOGOS = {
  instagram: '<svg viewBox="0 0 24 24"><defs><radialGradient id="ig" cx="30%" cy="107%" r="150%"><stop offset="0" stop-color="#fdf497"/><stop offset=".1" stop-color="#fdf497"/><stop offset=".5" stop-color="#fd5949"/><stop offset=".68" stop-color="#d6249f"/><stop offset="1" stop-color="#285AEB"/></radialGradient></defs><rect width="24" height="24" rx="6" fill="url(#ig)"/><rect x="5" y="5" width="14" height="14" rx="4" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="16.3" cy="7.7" r="1.1" fill="#fff"/></svg>',
  facebook: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#1877F2"/><path fill="#fff" d="M13.4 24v-8.4h2.8l.4-3.3h-3.2v-2.1c0-.9.3-1.6 1.6-1.6h1.7V5.7c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.2v3.3H10V24z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#111"/><g transform="translate(4.5 4.2) scale(.62)"><path fill="#25F4EE" transform="translate(-.8 -.6)" d="M12.5.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/><path fill="#FE2C55" transform="translate(.8 .6)" d="M12.5.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.890-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.920-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.020.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/><path fill="#fff" d="M12.5.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></g></svg>',
  youtube: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#FF0000"/><path fill="#fff" d="M9.6 7.8v8.4l7-4.2z"/></svg>',
};

const VUES = ['jour', 'semaine', 'mois'];
const lireVue = () => { try { const v = localStorage.getItem('studio.planningVue'); return VUES.includes(v) ? v : 'semaine'; } catch { return 'semaine'; } };
let donnees = null, vue = lireVue(), curseur = midi(new Date());

function midi(d) { return new Date(jourDe(d) + 'T12:00'); }
function lundi(d) { const x = new Date(jourDe(d) + 'T12:00'); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return x; }
const decale = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const estVideo = i => i.plateformes && (i.media?.type === 'video' || i.id.startsWith('yt-'));

// Une carte = une vidéo un jour donné : même fichier envoyé à Zernio, ou un Short YouTube à moins de 20 minutes.
function reels(items) {
  const groupes = [];
  for (const i of items.filter(estVideo).sort((a, b) => new Date(a.date) - new Date(b.date))) {
    const j = jourDe(i.date), t = new Date(i.date);
    const g = groupes.find(g => g.jour === j && ((i.media?.url && g.medias.has(i.media.url)) || (!i.media && Math.abs(t - g.t) <= 20 * 60e3) || (!g.medias.size && i.media && Math.abs(t - g.t) <= 20 * 60e3)));
    const reseaux = i.plateformes.map(p => ({...p, date: p.date || i.date}));
    if (g) { g.posts.push(i); g.reseaux.push(...reseaux); if (i.media?.url) g.medias.add(i.media.url); if (i.media && !g.media) { g.media = i.media; g.titre = i.titre; } }
    else groupes.push({jour: j, t, date: i.date, titre: i.titre, media: i.media, medias: new Set(i.media?.url ? [i.media.url] : []), posts: [i], reseaux, motCle: i.motCle, contenu: i.contenu, ancien: i.ancien});
  }
  for (const g of groupes) {
    const parReseau = {};
    for (const r of g.reseaux) (parReseau[r.plateforme] ??= []).push(r);
    g.parReseau = parReseau;
    g.doublons = Object.entries(parReseau).filter(([, l]) => l.length > 1).map(([p, l]) => [p, l.length]);
    g.echec = g.reseaux.some(r => r.statut === 'failed' || r.erreur);
    g.programme = g.reseaux.some(r => r.statut === 'pending');
  }
  return groupes;
}


function logo(plateforme, liste) {
  const r = liste[0], statut = liste.some(x => x.statut === 'failed' || x.erreur) ? 'failed' : liste.every(x => x.statut === 'published') ? 'published' : 'pending';
  const lien = liste.find(x => x.url)?.url;
  const b = el(lien ? 'a' : 'span', `reseau st-${statut}`);
  b.append(svg(LOGOS[plateforme] || `<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#888"/></svg>`));
  b.append(el('i', 'reseauEtat', statut === 'published' ? '✓' : statut === 'failed' ? '!' : ''));
  if (liste.length > 1) b.append(el('b', 'reseauNombre', `×${liste.length}`));
  b.title = `${NOMS[plateforme] || plateforme} · ${statut === 'published' ? 'publié' : statut === 'failed' ? 'échec' : 'programmé'} à ${heure(r.date)}${liste.length > 1 ? ` · ${liste.length} envois` : ''}${r.erreur ? ' · ' + r.erreur : ''}`;
  if (lien) { b.href = lien; b.target = '_blank'; b.rel = 'noopener'; b.onclick = e => e.stopPropagation(); }
  return b;
}

function carte(g, large = false) {
  const c = el('details', `reel${large ? ' large' : ''}${g.programme ? ' aVenir' : ' publie'}${g.doublons.length || g.echec ? ' alerte' : ''}${g.ancien ? ' ancien' : ''}`);
  const s = el('summary');
  const vignette = el('div', 'reelVignette');
  if (g.media?.url) { const v = el('video'); v.src = `${g.media.url}#t=1.5`; v.muted = true; v.preload = 'metadata'; v.playsInline = true; vignette.append(v); }
  else vignette.append(svg(LOGOS.youtube));
  const infos = el('div', 'reelInfos');
  const ligne = el('div', 'reelLigne');
  ligne.append(el('span', 'reelHeure', heure(g.date)), el('span', `reelStatut ${g.programme ? 'aVenir' : 'publie'}`, g.echec ? 'Échec' : g.programme ? 'Programmé' : 'Publié'));
  const reseaux = el('div', 'reelReseaux');
  for (const p of [...ORDRE, ...Object.keys(g.parReseau).filter(p => !ORDRE.includes(p))]) if (g.parReseau[p]) reseaux.append(logo(p, g.parReseau[p]));
  infos.append(ligne, el('p', 'reelTitre', g.titre.replace(/\s*[\u{1F300}-\u{1FAFF}☀-➿]+\s*$/u, '')), reseaux);
  s.append(vignette, infos);
  c.append(s);
  const corps = el('div', 'reelCorps');
  if (g.motCle) corps.append(el('p', 'muted', `Mot-clé : ${g.motCle}`));
  if (g.contenu) corps.append(el('pre', null, g.contenu));
  if (g.media?.url) { const a = el('a', null, 'Ouvrir la vidéo'); a.href = g.media.url; a.target = '_blank'; a.rel = 'noopener'; corps.append(a); }
  c.append(corps);
  if (large && (g.motCle || g.contenu)) c.open = true;
  c.addEventListener('mouseenter', () => c.querySelector('video')?.play().catch(() => {}));
  c.addEventListener('mouseleave', () => { const v = c.querySelector('video'); if (v) { v.pause(); v.currentTime = 1.5; } });
  return c;
}

const statutDe = g => (g.echec || g.doublons.length ? 'echec' : g.programme ? 'aVenir' : 'publie');
const STATUTS = {aVenir: 'programmé', publie: 'publié', echec: 'à corriger'};
const sansEmoji = t => (t || '').replace(/\s*[\u{1F300}-\u{1FAFF}☀-➿]+\s*$/u, '');
const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;
const capital = t => t.charAt(0).toUpperCase() + t.slice(1);

function tuile(valeur, legende, cls = '') {
  const t = el('div', `planStat ${cls}`);
  t.append(el('strong', null, valeur), el('span', null, legende));
  return t;
}
function compter(liste) {
  const n = {aVenir: 0, publie: 0, echec: 0};
  for (const g of liste) n[statutDe(g)]++;
  return n;
}
function aller(d, v = vue) { curseur = midi(d); changerVue(v); }

// Semaine : 7 colonnes, une carte par reel. Le titre d'un jour ouvre sa vue détaillée.
function vueSemaine(groupes) {
  const grille = el('div', 'planGrille'), auj = jourDe(new Date()), debut = lundi(curseur);
  for (let n = 0; n < 7; n++) {
    const d = decale(debut, n), j = jourDe(d);
    const col = el('section', `planJour${j === auj ? ' aujourdhui' : ''}${j < auj ? ' passe' : ''}`);
    const titre = el('h3');
    titre.append(el('span', null, d.toLocaleDateString('fr-FR', {weekday: 'long'})), el('strong', null, d.getDate()));
    titre.title = 'Voir la journée';
    titre.onclick = () => aller(d, 'jour');
    col.append(titre);
    const jour = groupes.filter(g => g.jour === j);
    if (!jour.length) col.append(el('p', 'planVide', j >= auj ? 'Rien de programmé' : ''));
    jour.forEach(g => col.append(carte(g)));
    grille.append(col);
  }
  return grille;
}

// Jour : en-tête éditorial, bande de la semaine, puis une frise horaire avec la ligne de l'heure courante.
function vueJour(groupes) {
  const j = jourDe(curseur), auj = jourDe(new Date()), jour = groupes.filter(g => g.jour === j);
  const n = compter(jour), envois = jour.reduce((s, g) => s + g.reseaux.length, 0);
  const vueJ = el('div', `vueJour${j === auj ? ' estAujourdhui' : ''}${j < auj ? ' estPasse' : ''}`);

  const tete = el('header', 'jourTete');
  const date = el('div', 'jourDate');
  date.append(el('strong', 'jourNum', curseur.getDate()));
  const lib = el('div', 'jourLib');
  lib.append(el('span', 'jourSemaine', capital(curseur.toLocaleDateString('fr-FR', {weekday: 'long'}))), el('span', 'jourMois', curseur.toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'})));
  if (j === auj) lib.append(el('b', 'jourBadge', 'aujourd\'hui'));
  date.append(lib);
  const stats = el('div', 'planStats');
  stats.append(tuile(jour.length, jour.length > 1 ? 'reels' : 'reel'), tuile(n.publie, 'publiés', 'publie'), tuile(n.aVenir, 'programmés', 'aVenir'), tuile(envois, 'envois réseaux'));
  if (n.echec) stats.append(tuile(n.echec, 'à corriger', 'echec'));
  tete.append(date, stats);

  // Bande de la semaine : un point par reel, coloré par statut.
  const bande = el('nav', 'jourBande'), debut = lundi(curseur);
  for (let k = 0; k < 7; k++) {
    const d = decale(debut, k), jj = jourDe(d), liste = groupes.filter(g => g.jour === jj);
    const b = el('button', `bandeJour${jj === j ? ' on' : ''}${jj === auj ? ' auj' : ''}${jj < auj ? ' passe' : ''}`);
    b.append(el('span', 'bandeNom', d.toLocaleDateString('fr-FR', {weekday: 'short'}).replace('.', '')), el('strong', null, d.getDate()));
    const points = el('span', 'bandePoints');
    liste.slice(0, 4).forEach(g => points.append(el('i', statutDe(g))));
    if (!liste.length) points.append(el('i', 'vide'));
    b.append(points);
    b.title = liste.length ? pluriel(liste.length, 'reel') : 'Aucun reel';
    b.onclick = () => aller(d);
    bande.append(b);
  }

  // Frise horaire : 7 h à 23 h, élargie si un reel tombe en dehors.
  const heures = jour.map(g => Number(heure(g.date).slice(0, 2)));
  const de = Math.min(7, ...heures), a = Math.max(23, ...heures);
  const [hc, mc] = heure(new Date()).split(':').map(Number);
  const frise = el('div', 'jourFrise');
  for (let h = de; h <= a; h++) {
    const ici = jour.filter(g => Number(heure(g.date).slice(0, 2)) === h);
    const ligne = el('div', `heureLigne${ici.length ? ' pleine' : ''}${j === auj && h < hc ? ' passee' : ''}`);
    ligne.append(el('span', 'heureLib', `${String(h).padStart(2, '0')}:00`));
    const creneau = el('div', 'heureCreneau');
    ici.forEach(g => creneau.append(carte(g, true)));
    ligne.append(creneau);
    if (j === auj && h === hc) {
      const m = el('i', 'maintenant');
      m.style.top = `${(mc / 60) * 100}%`;
      m.append(el('b', null, heure(new Date())));
      ligne.append(m);
    }
    frise.append(ligne);
  }
  if (!jour.length) {
    const vide = el('div', 'jourVide');
    vide.append(el('strong', null, j >= auj ? 'Aucun reel programmé ce jour' : 'Aucun reel publié ce jour'), el('span', null, j >= auj ? 'Journée libre, rien n\'est encore parti vers Zernio.' : 'Journée sans publication.'));
    frise.prepend(vide);
  }
  vueJ.append(tete, bande, frise);
  return vueJ;
}

// Mois : calendrier lundi en tête, intensité de la case selon le nombre de reels, clic pour ouvrir la journée.
function vueMois(groupes) {
  const an = curseur.getFullYear(), m = curseur.getMonth(), cle = `${an}-${String(m + 1).padStart(2, '0')}`;
  const premier = new Date(an, m, 1, 12), dernier = new Date(an, m + 1, 0, 12), depart = lundi(premier);
  const semaines = Math.ceil((Math.round((dernier - depart) / 864e5) + 1) / 7);
  const auj = jourDe(new Date()), duMois = groupes.filter(g => g.jour.startsWith(cle));
  const n = compter(duMois), couverts = new Set(duMois.map(g => g.jour)).size, total = dernier.getDate();
  const vueM = el('div', 'vueMois');

  const tete = el('header', 'moisTete');
  const titre = el('div', 'moisTitre');
  titre.append(el('strong', null, capital(premier.toLocaleDateString('fr-FR', {month: 'long'}))), el('span', null, an));
  const couverture = el('div', 'moisCouverture');
  const barre = el('div', 'moisBarre'), rempli = el('i');
  rempli.style.width = `${(couverts / total) * 100}%`;
  barre.append(rempli);
  couverture.append(el('span', null, `${couverts} jours couverts sur ${total}`), barre);
  titre.append(couverture);
  const stats = el('div', 'planStats');
  stats.append(tuile(duMois.length, duMois.length > 1 ? 'reels' : 'reel'), tuile(n.publie, 'publiés', 'publie'), tuile(n.aVenir, 'programmés', 'aVenir'));
  if (n.echec) stats.append(tuile(n.echec, 'à corriger', 'echec'));
  const parReseau = el('div', 'moisReseaux');
  for (const p of ORDRE) {
    const nb = duMois.filter(g => g.parReseau[p]).length;
    if (!nb) continue;
    const r = el('span', 'moisReseau');
    r.append(svg(LOGOS[p]), el('b', null, nb));
    r.title = `${nb} reels sur ${NOMS[p]}`;
    parReseau.append(r);
  }
  stats.append(parReseau);
  tete.append(titre, stats);

  const grille = el('div', 'moisGrille');
  for (const nom of ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']) grille.append(el('span', 'moisEntete', nom));
  for (let k = 0; k < semaines * 7; k++) {
    const d = decale(depart, k), j = jourDe(d), liste = groupes.filter(g => g.jour === j);
    const hors = !j.startsWith(cle);
    const c = el('button', `moisCase${hors ? ' hors' : ''}${j === auj ? ' auj' : ''}${j < auj ? ' passe' : ''}${liste.length ? '' : ' vide'}${k % 7 > 4 ? ' weekend' : ''}`);
    c.style.setProperty('--n', Math.min(liste.length, 4));
    const haut = el('span', 'moisHaut');
    haut.append(el('b', 'moisNum', d.getDate()));
    if (liste.length > 1) haut.append(el('span', 'moisCompte', liste.length));
    c.append(haut);
    const pile = el('span', 'moisPile');
    for (const g of liste.slice(0, 3)) {
      const r = el('span', `moisReel ${statutDe(g)}`);
      r.append(el('i'), el('time', null, heure(g.date)), el('span', null, sansEmoji(g.titre)));
      pile.append(r);
    }
    if (liste.length > 3) pile.append(el('span', 'moisPlus', `+${liste.length - 3}`));
    if (!liste.length && !hors && j >= auj) pile.append(el('span', 'moisLibre', 'libre'));
    c.append(pile);
    c.title = `${d.toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'})} : ${liste.length ? liste.map(g => `${heure(g.date)} ${sansEmoji(g.titre)} (${STATUTS[statutDe(g)]})`).join(', ') : 'aucun reel'}`;
    c.onclick = () => aller(d, 'jour');
    grille.append(c);
  }
  const legende = el('div', 'moisLegende');
  for (const [cls, nom] of [['publie', 'publié'], ['aVenir', 'programmé'], ['echec', 'à corriger']]) { const l = el('span'); l.append(el('i', cls), nom); legende.append(l); }
  legende.append(el('span', 'muted', 'Clique un jour pour l\'ouvrir.'));
  vueM.append(tete, grille, legende);
  return vueM;
}

function libelle() {
  if (vue === 'jour') return capital(curseur.toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'}));
  if (vue === 'mois') return capital(curseur.toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'}));
  const debut = lundi(curseur);
  return `${debut.toLocaleDateString('fr-FR', {day: 'numeric', month: 'long'})} au ${decale(debut, 6).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long'})}`;
}

function afficher() {
  document.querySelectorAll('[data-vue]').forEach(b => { b.classList.toggle('on', b.dataset.vue === vue); b.setAttribute('aria-selected', String(b.dataset.vue === vue)); });
  $('planningSemaine').textContent = libelle();
  if (!donnees) return;
  const groupes = reels(donnees.items);
  const sources = el('div', 'planSources');
  for (const [k, nom] of [['zernio', 'Zernio']]) {
    const err = donnees.erreurs[k], chip = el('span', `sourceChip ${donnees.inactif ? 'off' : err ? 'ko' : 'ok'}`, donnees.inactif ? `${nom} non connecté` : nom);
    chip.title = donnees.inactif ? 'clé d’API absente' : err || 'à jour';
    sources.append(chip);
    if (donnees.inactif) sources.append(el('span', 'muted', 'La programmation et le planning s’activent quand Zernio est connecté. Les étapes sont dans le README.'));
    if (err) sources.append(el('span', 'muted', err));
  }
  const corps = vue === 'jour' ? vueJour(groupes) : vue === 'mois' ? vueMois(groupes) : vueSemaine(groupes);
  corps.classList.add('planVue');
  $('planningContenu').replaceChildren(sources, corps);
}

function changerVue(v) {
  vue = v;
  try { localStorage.setItem('studio.planningVue', v); } catch {}
  afficher();
}
function deplacer(sens) {
  if (vue === 'mois') curseur = new Date(curseur.getFullYear(), curseur.getMonth() + sens, 1, 12);
  else curseur = decale(curseur, sens * (vue === 'jour' ? 1 : 7));
  afficher();
}

export async function chargerPlanning(frais = false) {
  $('planningMaj').textContent = 'lecture zernio…';
  try {
    const r = await fetch(`/api/planning${frais ? '?frais=1' : ''}`);
    if (!r.ok) throw Error((await r.json()).error || r.statusText);
    donnees = await r.json();
    $('planningMaj').textContent = donnees.inactif ? 'zernio non connecté' : `zernio · maj ${heure(donnees.maj)}`;
    afficher();
  } catch (e) { $('planningMaj').textContent = ''; $('planningContenu').replaceChildren(el('p', 'muted', `Erreur : ${e.message}`)); }
}

$('planningPrec').onclick = () => deplacer(-1);
$('planningSuiv').onclick = () => deplacer(1);
$('planningAuj').onclick = () => { curseur = midi(new Date()); afficher(); };
$('planningActualiser').onclick = () => chargerPlanning(true);
document.querySelectorAll('[data-vue]').forEach(b => (b.onclick = () => changerVue(b.dataset.vue)));

// Raccourcis quand le planning est affiché : J, S, M pour la vue, flèches pour naviguer, T pour aujourd'hui.
window.addEventListener('keydown', e => {
  if (document.querySelector('.planning').hidden || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target.closest?.('input,textarea,select,[contenteditable]')) return;
  const actions = {KeyJ: () => changerVue('jour'), KeyS: () => changerVue('semaine'), KeyM: () => changerVue('mois'), KeyT: () => $('planningAuj').click(), ArrowLeft: () => deplacer(-1), ArrowRight: () => deplacer(1)};
  if (!actions[e.code]) return;
  e.preventDefault();
  actions[e.code]();
});
afficher();
