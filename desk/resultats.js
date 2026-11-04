import {config} from './config.js';
// Étape Résultats du projet ouvert : vues totales, par réseau, et vues à 24 h puis à 7 jours (lues dans /api/stats).
const $ = s => document.getElementById(s);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const nomReseau = {instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', youtube: 'YouTube'};
const nb = n => n == null ? '–' : n.toLocaleString('fr-FR');
const jourLocal = d => new Date(d).toLocaleDateString('sv-SE', {timeZone: config.fuseau});
let stats = null, actif = null, charge = 0;

// Les stats viennent de Zernio et d'Instagram : on garde la réponse dix minutes côté page,
// et on la partage avec la barre latérale et l'accueil (window.statsVideos, événement stats:maj).
async function lire() {
  if (stats && Date.now() - charge < 10 * 60e3) return stats;
  stats = await (await fetch('/api/stats')).json(); charge = Date.now();
  const vues = stats.reels.filter(r => r.total?.vues).map(r => r.total.vues).sort((a, b) => a - b);
  const a24 = stats.reels.map(r => vuesA(r, 1)).filter(v => v).sort((a, b) => a - b);
  window.statsVideos = {mediane: vues.length ? vues[Math.floor(vues.length / 2)] : 0, mediane24: a24.length ? a24[Math.floor(a24.length / 2)] : 0,
    par: Object.fromEntries(stats.reels.filter(r => r.projet).map(r => [r.projet, {titre: r.titre, date: r.date, vues: r.total?.vues || 0, a24: vuesA(r, 1)}]))};
  document.dispatchEvent(new Event('stats:maj'));
  return stats;
}
async function charger() {
  try { await lire(); }
  catch (e) { return $('resContenu').replaceChildren(el('p', 'muted', `Statistiques indisponibles : ${e.message}`)); }
  rendre();
}

// La série est un relevé cumulé par jour : la valeur du jour J + n donne les vues après n jours.
const total = point => Object.entries(point).filter(([k]) => k !== 'date').reduce((a, [, v]) => a + (v?.vues || 0), 0);
const ecart = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);
function vuesA(reel, n) {
  const point = reel.serie?.find(s => ecart(jourLocal(reel.date), s.date) === n);
  return point ? total(point) : null;
}
const courbe = reel => (reel.serie || []).map(s => [ecart(jourLocal(reel.date), s.date), total(s)]).filter(([n]) => n >= 0).sort((a, b) => a[0] - b[0]);

// Courbe cumulée du reel, avec en pointillé la médiane des autres reels au même âge (dès trois reels comparables).
function graphe(reel) {
  const moi = courbe(reel);
  if (moi.length < 2) return null;
  const autres = stats.reels.filter(r => r !== reel).map(courbe);
  const fin = Math.max(moi.at(-1)[0], 7), med = [];
  for (let n = 0; n <= fin; n++) {
    const v = autres.map(c => c.find(p => p[0] === n)?.[1]).filter(x => x != null).sort((a, b) => a - b);
    if (v.length >= 3) med.push([n, v[Math.floor(v.length / 2)]]);
  }
  const W = 640, H = 170, g = 34, haut = Math.max(...moi.map(p => p[1]), ...med.map(p => p[1]), 1);
  const x = n => g + n / fin * (W - g - 10), y = v => H - 22 - v / haut * (H - 34);
  const trace = pts => pts.map(([n, v], i) => `${i ? 'L' : 'M'}${x(n).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.classList.add('resGraphe');
  const add = (tag, at, txt) => { const e = document.createElementNS(ns, tag); for (const k in at) e.setAttribute(k, at[k]); if (txt != null) e.textContent = txt; svg.append(e); return e; };
  add('line', {x1: g, x2: W - 10, y1: H - 22, y2: H - 22, class: 'axe'});
  for (let n = 0; n <= fin; n++) add('text', {x: x(n), y: H - 6, class: 'graduation', 'text-anchor': 'middle'}, n ? `J+${n}` : 'J');
  add('text', {x: g - 6, y: y(haut) + 4, class: 'graduation', 'text-anchor': 'end'}, haut >= 1000 ? `${Math.round(haut / 100) / 10} k` : String(haut));
  if (med.length > 1) add('path', {d: trace(med), class: 'mediane'});
  add('path', {d: trace(moi), class: 'moi'});
  for (const [n, v] of moi) add('circle', {cx: x(n), cy: y(v), r: 3, class: 'moi'}).append(Object.assign(document.createElementNS(ns, 'title'), {textContent: `J+${n} : ${nb(v)} vues`}));
  const box = el('div', 'resCourbe');
  box.append(svg, el('div', 'muted resLegende', med.length > 1 ? 'trait plein : ce reel · pointillé : médiane des autres reels au même âge' : 'vues cumulées par jour'));
  return box;
}

function rendre() {
  const box = $('resContenu');
  if (!stats) return box.replaceChildren(el('p', 'muted', 'Chargement des statistiques…'));
  const reel = stats.reels.find(r => r.projet === actif);
  if (!reel) return box.replaceChildren(el('p', 'muted', 'Pas encore de statistiques pour cette vidéo : elles arrivent une fois le reel publié et relevé.'));
  const mediane = window.statsVideos?.mediane || 0;
  const tete = el('div', 'pubTete');
  tete.append(el('span', 'muted', `publié le ${new Date(reel.date).toLocaleDateString('fr-FR', {timeZone: config.fuseau, day: 'numeric', month: 'long'})}`));
  const chiffres = el('div', 'resChiffres');
  const tuile = (label, valeur, detail) => { const t = el('div', 'resTuile'); t.append(el('span', 'muted', label), el('b', '', valeur), el('span', 'muted', detail || '')); return t; };
  const age = Math.floor((Date.now() - new Date(reel.date)) / 864e5);
  const v1 = vuesA(reel, 1), v7 = vuesA(reel, 7);
  chiffres.append(
    tuile('Vues', nb(reel.total.vues), mediane ? `${(reel.total.vues / mediane).toLocaleString('fr-FR', {maximumFractionDigits: 1})} × la médiane` : ''),
    tuile('À 24 h', v1 == null ? (age < 1 ? 'demain' : 'non relevé') : nb(v1)),
    tuile('À 7 jours', v7 == null ? (age < 7 ? `dans ${7 - age} j` : 'non relevé') : nb(v7)),
    tuile('Engagement', nb((reel.total.likes || 0) + (reel.total.commentaires || 0) + (reel.total.partages || 0) + (reel.total.enregistrements || 0)),
      `${nb(reel.total.likes)} j’aime · ${nb(reel.total.commentaires)} comm. · ${nb(reel.total.partages)} partages · ${nb(reel.total.enregistrements)} enreg.`));
  const liste = el('div', 'pubReseaux');
  for (const r of reel.reseaux) {
    const ligne = el('div', 'pubLigne resLigne');
    const lien = r.url ? Object.assign(el('a', '', 'voir le post ↗'), {href: r.url, target: '_blank', rel: 'noopener'}) : el('span', 'muted', r.statut || '');
    ligne.append(el('b', '', nomReseau[r.plateforme] || r.plateforme), el('span', '', `${nb(r.vues)} vues`), el('span', 'muted', `${nb(r.likes)} j’aime · ${nb(r.commentaires)} comm. · ${nb(r.partages)} partages`), lien);
    liste.append(ligne);
  }
  box.replaceChildren(tete, chiffres, ...[graphe(reel)].filter(Boolean), el('div', 'accLabel', 'Par réseau'), liste, el('p', 'muted', `Relevé ${stats.maj ? new Date(stats.maj).toLocaleString('fr-FR', {timeZone: config.fuseau, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}) : ''}`));
}

// La vue peut s'afficher avant ou après projet:actif : on attend la fin du tour pour lire son état.
document.addEventListener('projet:actif', e => { actif = e.detail; setTimeout(() => { if (!document.querySelector('.resultats').hidden) charger(); }); });
document.addEventListener('resultats:charger', () => setTimeout(charger));
lire().catch(() => {});
setInterval(() => lire().catch(() => {}), 10 * 60e3 + 5e3);
