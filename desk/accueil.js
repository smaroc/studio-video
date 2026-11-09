// Accueil : ce qui attend une action, trié par urgence, et la semaine de publication.
import {config} from './config.js';
const $ = s => document.getElementById(s);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const cles = {'à tourner': 'tourner', 'tourné, pas monté': 'monter', 'monté, pas programmé': 'oubli', 'programmé': 'programme', 'en partie publié': 'partiel', 'publié': 'publie', 'échec': 'echec'};
const jourLocal = d => new Date(d).toLocaleDateString('sv-SE', {timeZone: config.fuseau});
const ouvrir = (id, vue) => document.dispatchEvent(new CustomEvent('suivi:ouvrir', {detail: {id, vue}}));
const jours = ms => Math.floor((Date.now() - ms) / 864e5);

function carte(n, couleur, titre, detail, bouton, action) {
  const c = el('div', 'accTodo');
  const b = Object.assign(el('button', couleur === 'oubli' ? 'accent' : '', bouton), {onclick: action});
  const texte = el('div', 'accTexte');
  texte.append(el('b', '', titre), el('div', 'muted', detail));
  c.append(el('div', `accNombre acc-${couleur}`, String(n)), texte, b);
  return c;
}

function rendre() {
  $('accBonjour').textContent = config.prenom ? `Bonjour ${config.prenom}` : 'Bonjour';
  const items = (window.suiviItems || []).filter(x => !x.archive);
  $('accDate').textContent = new Date().toLocaleDateString('fr-FR', {timeZone: config.fuseau, weekday: 'long', day: 'numeric', month: 'long'});
  const noms = l => l.slice(0, 3).map(x => x.titre.length > 42 ? x.titre.slice(0, 40) + '…' : x.titre).join(' · ') + (l.length > 3 ? ` · +${l.length - 3}` : '');
  const todo = [];
  const aRevoir = window.versionsARevoir?.() || [];
  if (aRevoir.length) todo.push(carte(aRevoir.length, 'programme', aRevoir.length > 1 ? 'Nouvelles versions à revoir' : 'Nouvelle version à revoir', noms(aRevoir), 'Revoir', () => document.dispatchEvent(new CustomEvent('suivi:ouvrir', {detail: {id: aRevoir[0].id, vue: 'review', derniere: true}}))));
  const aProg = items.filter(x => ['monté, pas programmé', 'échec', 'en partie publié'].includes(x.etape));
  if (aProg.length) todo.push(carte(aProg.length, 'oubli', aProg.length > 1 ? 'Vidéos montées à programmer' : 'Vidéo montée à programmer', noms(aProg), 'Programmer', () => ouvrir(aProg[0].id, 'publication')));
  // Chaque vidéo à programmer se glisse sur un jour de la semaine pour préremplir la date.
  if (aProg.length) {
    const puces = el('div', 'accPuces');
    puces.append(el('span', 'muted', 'glisse sur un jour :'), ...aProg.map(x => {
      const p = el('button', `suiviEtape suivi-${cles[x.etape]} accPuce`, x.titre.length > 34 ? x.titre.slice(0, 32) + '…' : x.titre);
      p.draggable = true; p.title = `${x.titre} · glisse sur un jour de la semaine pour le programmer`;
      p.ondragstart = e => { e.dataTransfer.setData('text/plain', x.id); e.dataTransfer.effectAllowed = 'move'; document.body.classList.add('accGlisse'); };
      p.ondragend = () => document.body.classList.remove('accGlisse');
      p.onclick = () => ouvrir(x.id, 'publication');
      return p;
    }));
    todo.push(puces);
  }
  const retours = items.filter(x => x.retours && ['tourné, pas monté', 'monté, pas programmé'].includes(x.etape));
  const nbRetours = retours.reduce((a, x) => a + x.retours, 0);
  if (nbRetours) todo.push(carte(nbRetours, 'echec', nbRetours > 1 ? 'Retours non résolus' : 'Retour non résolu', noms(retours), 'Ouvrir', () => ouvrir(retours[0].id, 'review')));
  const aMonter = items.filter(x => x.etape === 'tourné, pas monté').sort((a, b) => new Date(a.dernierePrise || a.cree) - new Date(b.dernierePrise || b.cree));
  if (aMonter.length) { const age = jours(new Date(aMonter[0].dernierePrise || aMonter[0].cree)); todo.push(carte(aMonter.length, 'monter', aMonter.length > 1 ? 'Vidéos tournées, pas montées' : 'Vidéo tournée, pas montée', age > 1 ? `la plus ancienne attend depuis ${age} jours` : noms(aMonter), 'Voir', () => ouvrir(aMonter[0].id, 'review'))); }
  const aTourner = items.filter(x => x.etape === 'à tourner' && x.script);
  if (aTourner.length) todo.push(carte(aTourner.length, 'tourner', aTourner.length > 1 ? 'Scripts prêts à tourner' : 'Script prêt à tourner', noms(aTourner), 'Tourner', () => ouvrir(aTourner[0].id, 'record')));
  // Reels au-dessus de deux fois la médiane sur les 30 derniers jours : candidats à une suite ou à une pub.
  const st = window.statsVideos, forts = st?.mediane ? Object.entries(st.par).filter(([, r]) => r.vues >= 2 * st.mediane && Date.now() - new Date(r.date) < 30 * 864e5).sort((a, b) => b[1].vues - a[1].vues) : [];
  if (forts.length) {
    const titre = id => items.find(x => x.id === id)?.titre || st.par[id].titre || '';
    const c = carte(forts.length, 'publie', forts.length > 1 ? 'Reels à relancer' : 'Reel à relancer', forts.slice(0, 3).map(([id, r]) => `${titre(id).slice(0, 34)}${titre(id).length > 34 ? '…' : ''} (${(r.vues / st.mediane).toLocaleString('fr-FR', {maximumFractionDigits: 1})} ×)`).join(' · ') + ' : une suite ou une pub', 'Voir', () => ouvrir(forts[0][0], 'resultats'));
    todo.push(c);
  }
  $('accTodo').replaceChildren(...(todo.length ? todo : [el('p', 'muted', 'Rien en attente. Tout est programmé.')]));

  // Semaine du lundi au dimanche, heure locale du studio.
  const auj = new Date(jourLocal(Date.now()) + 'T12:00'), lundi = new Date(auj); lundi.setDate(auj.getDate() - (auj.getDay() + 6) % 7);
  const vides = [], cases = [];
  for (let i = 0; i < 7; i++) {
    const j = new Date(lundi); j.setDate(lundi.getDate() + i);
    const cle = jourLocal(j), du = items.filter(x => x.date && jourLocal(x.date) === cle).sort((a, b) => new Date(a.date) - new Date(b.date));
    const c = el('div', 'accJour' + (cle === jourLocal(Date.now()) ? ' auj' : ''));
    c.append(el('b', '', j.toLocaleDateString('fr-FR', {weekday: 'short', day: 'numeric'})));
    const heure = d => new Date(d).toLocaleTimeString('fr-FR', {timeZone: config.fuseau, hour: '2-digit', minute: '2-digit'});
    if (du.length) c.append(el('span', 'accPris', `pris : ${du.map(x => heure(x.date)).join(', ')}`));
    for (const x of du) {
      const t = el('button', `suiviEtape suivi-${cles[x.etape]}`, x.titre);
      t.title = `${x.titre} · ${x.etape} · ${new Date(x.date).toLocaleTimeString('fr-FR', {timeZone: config.fuseau, hour: '2-digit', minute: '2-digit'})}`;
      t.onclick = () => ouvrir(x.id, 'publication');
      c.append(t);
    }
    if (!du.length && j >= auj) vides.push(j.toLocaleDateString('fr-FR', {weekday: 'long'}));
    if (j >= auj) {
      c.classList.add('accCible');
      c.ondragover = e => { e.preventDefault(); c.classList.add('survol'); };
      c.ondragleave = () => c.classList.remove('survol');
      c.ondrop = e => {
        e.preventDefault(); c.classList.remove('survol'); document.body.classList.remove('accGlisse');
        const id = e.dataTransfer.getData('text/plain');
        // 17:30 par défaut ; si l'heure est passée ou qu'un reel est déjà à moins de deux heures, on essaie 12:30, 20:30 puis 9:00.
        const pris = du.map(x => new Date(x.date).getTime());
        const libre = ['17:30', '12:30', '20:30', '09:00'].find(h => new Date(`${cle}T${h}`) > Date.now() + 15 * 60e3 && pris.every(t => Math.abs(t - new Date(`${cle}T${h}`)) >= 2 * 3600e3)) || '17:30';
        if (id) document.dispatchEvent(new CustomEvent('suivi:ouvrir', {detail: {id, vue: 'publication', programmer: `${cle}T${libre}`}}));
      };
    }
    cases.push(c);
  }
  $('accSemaine').replaceChildren(...cases);
  $('accTrous').textContent = vides.length === 7 ? 'Rien de prévu cette semaine.' : vides.length ? `Rien de prévu ${vides.length > 1 ? vides.slice(0, -1).join(', ') + ' et ' + vides.at(-1) : vides[0]}.` : 'Chaque jour restant a sa vidéo.';
}

document.addEventListener('suivi:maj', rendre);
document.addEventListener('stats:maj', rendre);
document.addEventListener('versions:maj', rendre);
