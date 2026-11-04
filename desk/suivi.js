import {config} from './config.js';
// Suivi des vidéos : pour chaque projet, tourné, monté, programmé ou publié (statut réel lu sur Zernio).
const $ = s => document.getElementById(s);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const cles = {'à tourner': 'tourner', 'tourné, pas monté': 'monter', 'monté, pas programmé': 'oubli', 'programmé': 'programme', 'en partie publié': 'partiel', 'publié': 'publie', 'échec': 'echec'};
const filtres = {
  tous: ['Tout', () => true],
  oublis: ['À programmer', x => x.etape === 'monté, pas programmé' || x.etape === 'échec' || x.etape === 'en partie publié'],
  production: ['En production', x => x.etape === 'à tourner' || x.etape === 'tourné, pas monté'],
  programme: ['Programmé', x => x.etape === 'programmé'],
  publie: ['Publié', x => x.etape === 'publié'],
};
let items = [], filtre = (() => { try { return localStorage.getItem('suiviFiltre') || 'tous'; } catch { return 'tous'; } })(), archives = false;
const quand = d => d ? new Date(d).toLocaleString('fr-FR', {timeZone: config.fuseau, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}) : '';
const reseau = {instagram: 'IG', facebook: 'FB', tiktok: 'TT', youtube: 'YT'};

function rendre() {
  const vus = items.filter(x => archives || !x.archive);
  $('suiviFiltres').replaceChildren(...Object.entries(filtres).map(([k, [nom, f]]) => {
    const b = el('button', 'funnelChip' + (k === filtre ? ' selected' : ''), `${nom} · ${vus.filter(f).length}`);
    b.onclick = () => { filtre = k; try { localStorage.setItem('suiviFiltre', k); } catch {} rendre(); };
    return b;
  }), Object.assign(el('label', 'suiviArchives'), {innerHTML: ''}));
  const lab = $('suiviFiltres').lastChild, cb = Object.assign(el('input'), {type: 'checkbox', checked: archives});
  cb.onchange = () => { archives = cb.checked; rendre(); };
  lab.append(cb, document.createTextNode(' archives'));
  const oublis = vus.filter(filtres.oublis[1]).length;
  $('suiviResume').textContent = oublis ? `· ${oublis} à programmer` : '· rien d’oublié';
  const liste = vus.filter(filtres[filtre][1]);
  const table = el('div', 'suiviTable');
  for (const x of liste) {
    const row = el('div', 'suiviRow');
    const titre = el('button', 'suiviTitre', x.titre + (x.archive ? ' (archivé)' : ''));
    titre.disabled = x.archive;
    titre.onclick = () => document.dispatchEvent(new CustomEvent('suivi:ouvrir', {detail: x.id}));
    const res = el('div', 'suiviReseaux');
    for (const r of x.reseaux) {
      const tag = el(r.url ? 'a' : 'span', `suiviReseau suivi-${cles[r.statut] === 'publie' ? 'publie' : cles[r.statut] || 'programme'}`, reseau[r.plateforme] || r.plateforme);
      if (r.url) { tag.href = r.url; tag.target = '_blank'; tag.rel = 'noopener'; }
      tag.title = `${r.plateforme} ${r.statut}${r.erreur ? ` : ${r.erreur}` : ` · ${quand(r.date)}`}`;
      res.append(tag);
    }
    row.append(el('span', `suiviEtape suivi-${cles[x.etape]}`, x.etape), titre,
      el('span', 'suiviInfo', [x.prises ? `${x.prises} prise${x.prises > 1 ? 's' : ''}` : '', x.montages ? `${x.montages} montage${x.montages > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ')),
      el('span', 'suiviInfo', quand(x.date)), res);
    table.append(row);
  }
  $('suiviListe').replaceChildren(liste.length ? table : el('p', 'muted', filtre === 'oublis' ? 'Aucune vidéo montée en attente de programmation.' : 'Aucune vidéo ici.'));
}

async function charger(frais) {
  try {
    items = await (await fetch('/api/suivi' + (frais ? '?frais' : ''))).json();
    window.suiviItems = items;
    window.suiviEtapes = Object.fromEntries(items.map(x => [x.id, {etape: x.etape, cle: cles[x.etape]}]));
    document.dispatchEvent(new Event('suivi:maj'));
    rendre();
    publication();
  } catch (e) { $('suiviListe').replaceChildren(el('p', 'muted', `Suivi indisponible : ${e.message}`)); }
}

// Étape Publication du projet ouvert : statut par réseau et action suivante.
let actif = null;
const nomReseau = {instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', youtube: 'YouTube'};
function publication() {
  const x = items.find(i => i.id === actif), box = $('pubContenu');
  if (!x) return box.replaceChildren(el('p', 'muted', 'Statut de publication en cours de chargement…'));
  const tete = el('div', 'pubTete');
  tete.append(el('span', `suiviEtape suivi-${cles[x.etape]}`, x.etape), el('span', 'muted', [x.prises && `${x.prises} prise${x.prises > 1 ? 's' : ''}`, x.montages && `${x.montages} montage${x.montages > 1 ? 's' : ''}`].filter(Boolean).join(' · ')));
  const action = el('div', 'pubAction');
  const bouton = (txt, cls, f) => Object.assign(el('button', cls, txt), {onclick: f});
  const programmer = () => document.getElementById('programmer').click();
  const montage = () => document.querySelector('[data-view=review]').click();
  const msg = {
    'à tourner': ['Rien n’est tourné pour l’instant.', [bouton('Aller au tournage', 'accent', () => document.querySelector('[data-view=record]').click())]],
    'tourné, pas monté': ['Pas encore de montage : demande-le dans le chat, puis importe-le dans Montage.', [bouton('Voir le montage', 'accent', montage)]],
    'monté, pas programmé': ['Le montage est prêt, il n’est programmé nulle part.', [bouton('Programmer', 'accent', programmer), bouton('Revoir le montage', '', montage)]],
    'échec': ['Une publication a échoué : reprogramme le réseau en erreur.', [bouton('Reprogrammer', 'accent', programmer)]],
    'en partie publié': ['Publié sur une partie des réseaux, le reste est encore en attente.', [bouton('Programmer à nouveau', '', programmer)]],
    'programmé': ['Programmé, rien à faire.', [bouton('Modifier la programmation', '', programmer)]],
    'publié': ['Publié partout. Pense au partage Facebook depuis l’app Instagram.', []],
  }[x.etape];
  action.append(el('p', 'pubMsg', msg[0]), Object.assign(el('div', 'pubBoutons'), {}));
  action.lastChild.append(...msg[1]);
  const liste = el('div', 'pubReseaux');
  for (const r of x.reseaux) {
    const ligne = el('div', 'pubLigne');
    const lien = r.url ? Object.assign(el('a', '', 'voir le post ↗'), {href: r.url, target: '_blank', rel: 'noopener'}) : el('span', 'muted', r.erreur || '');
    ligne.append(el('b', '', nomReseau[r.plateforme] || r.plateforme), el('span', `suiviEtape suivi-${cles[r.statut] || 'programme'}`, r.statut), el('span', 'muted', quand(r.date)), lien);
    liste.append(ligne);
  }
  if (!x.reseaux.length) liste.append(el('p', 'muted', 'Aucun réseau programmé.'));
  box.replaceChildren(tete, action, el('div', 'accLabel', 'Réseaux'), liste);
}
document.addEventListener('projet:actif', e => { actif = e.detail; if (items.length) publication(); });
document.addEventListener('suivi:rafraichir', () => charger());

charger();
setInterval(charger, 120e3);
window.addEventListener('focus', () => charger());
$('suivi').addEventListener('toggle', () => $('suivi').open && charger(true));
