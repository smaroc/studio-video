// Bouton Programmer de l'onglet retours : prérempli depuis edits/<projet>/fiche/, deux clics (récap puis confirmation)
// avant tout envoi à Zernio. Le serveur fait l'upload, les posts et les automatisations DM.
import {config} from './config.js';
const $ = id => document.getElementById(id);
const dialog = $('planDialog'), go = $('pdGo');
let etat = null, id = null, confirme = false;

const deux = n => String(n).padStart(2, '0');
const local = d => `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}T${deux(d.getHours())}:${deux(d.getMinutes())}`;
const reseaux = () => [...dialog.querySelectorAll('input[name=reseau]:checked')].map(i => i.value);
const noms = {instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', youtube: 'YouTube'};
const lisible = v => new Date(v).toLocaleString('fr-FR', {weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'});

$('pdFuseau').textContent = config.fuseau;
$('pdReseaux').append(...config.reseaux.map(r => {
  const l = document.createElement('label'), i = Object.assign(document.createElement('input'), {type: 'checkbox', name: 'reseau', value: r, checked: true});
  l.append(i, noms[r] || r);
  return l;
}));

function info(el, texte, classe = '') { el.textContent = texte; el.className = 'pdInfo ' + classe; el.hidden = !texte; }
function annulerConfirmation() { confirme = false; go.textContent = 'Programmer'; $('pdResume').textContent = ''; }

function titreParDefaut(caption) {
  const phrase = (caption.split(/(?<=[.!?])\s|\n/)[0] || '').trim().replace(/[.!?]$/, '');
  return (phrase.length > 90 ? phrase.slice(0, 89).replace(/\s+\S*$/, '') : phrase) + ' #Shorts';
}
function majYoutube() {
  $('pdYoutube').hidden = !reseaux().includes('youtube');
  $('pdTitreCompte').textContent = `${$('pdTitre').value.length}/100`;
}

async function ouvrir() {
  const projet = window.studioProjet?.();
  if (!projet) return;
  id = projet.id;
  info($('pdEtat'), 'Lecture de la fiche…');
  annulerConfirmation();
  dialog.showModal();
  try {
    const r = await fetch(`/api/programmation/${id}`);
    etat = await r.json();
    if (!r.ok) throw Error(etat.error);
  } catch (e) { etat = null; go.disabled = true; return info($('pdEtat'), e.message, 'ko'); }
  $('pdVideo').replaceChildren(...etat.videos.map(v => new Option(v, v)));
  $('pdVideo').value = etat.video;
  const demain = new Date(); demain.setDate(demain.getDate() + 1); demain.setHours(18, 0, 0, 0);
  $('pdDate').value = local(demain);
  $('pdDate').min = local(new Date());
  $('pdCaption').value = etat.caption;
  $('pdTitre').value = etat.titreYoutube || (etat.caption ? titreParDefaut(etat.caption) : '');
  $('pdMot').value = etat.motCle;
  $('pdFiche').value = etat.fiche;
  $('pdDm').value = etat.messageDm;
  $('pdCoverImg').hidden = !etat.cover;
  if (etat.cover) $('pdCoverImg').src = `/api/programmation/${id}/cover.jpg?v=${Date.now()}`;
  $('pdCoverInfo').textContent = etat.cover ? 'cover.jpg envoyée en miniature Instagram et vignette des autres réseaux.' : 'cover.jpg manquante dans le dossier du montage : la programmation est bloquée.';
  info($('pdDeja'), etat.deja ? `Déjà programmé sur Zernio pour le ${lisible(etat.deja.scheduledFor)} (post ${etat.deja.id}, ${etat.deja.statut}). Reprogrammer crée un nouveau post : supprime l'ancien dans Zernio.` : '', 'warn');
  info($('pdEtat'), etat.fiche ? '' : 'Aucune fiche publiée (url dans fiche/post-response.json) : sans lien dans le message, pas d\'automatisation DM.', etat.fiche ? '' : 'warn');
  go.disabled = !etat.cover || !config.zernioConfigure;
  if (!config.zernioConfigure) info($('pdEtat'), 'Zernio n\'est pas configuré : renseigne zernio dans studio.config.json puis relance le studio (voir README).', 'warn');
  majYoutube();
}

async function lancer() {
  const date = $('pdDate').value, choix = reseaux();
  if (!date) return info($('pdEtat'), 'Choisis une date et une heure.', 'ko');
  if (!choix.length) return info($('pdEtat'), 'Coche au moins un réseau.', 'ko');
  if (!confirme) {
    confirme = true;
    go.textContent = 'Confirmer la programmation';
    const dm = $('pdMot').value.trim() ? ` · DM sur « ${$('pdMot').value.trim().toUpperCase()} »` : '';
    $('pdResume').textContent = `${$('pdVideo').value} le ${lisible(date)} sur ${choix.map(r => noms[r]).join(', ')}${dm}`;
    return info($('pdEtat'), 'Vérifie le récapitulatif en bas, puis confirme : le post part sur Zernio.', 'warn');
  }
  go.disabled = true; go.textContent = 'Envoi en cours…';
  info($('pdEtat'), 'Upload de la vidéo et de la couverture, puis création des posts. Ne ferme pas la fenêtre.');
  try {
    const r = await fetch(`/api/programmation/${id}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
      video: $('pdVideo').value, date, reseaux: choix, caption: $('pdCaption').value, titreYoutube: $('pdTitre').value,
      motCle: $('pdMot').value, messageDm: $('pdDm').value, nom: etat.nom, remplacer: !!etat.deja,
    })});
    const j = await r.json();
    if (!r.ok) throw Error(j.error);
    const ids = [j.post && `post ${j.post}`, j.youtube && `YouTube ${j.youtube}`, j.automatisations && `DM ${Object.keys(j.automatisations).join(' + ')}`].filter(Boolean).join(' · ');
    info($('pdEtat'), `Programmé pour le ${lisible(j.scheduledFor)}. ${ids}${j.alerte ? `. Attention : ${j.alerte}` : ''}`, j.alerte ? 'warn' : 'ok');
    etat.deja = {id: j.post || j.youtube, scheduledFor: j.scheduledFor, statut: 'scheduled'};
    go.textContent = 'Programmé';
    document.getElementById('status').textContent = `Programmé sur Zernio pour le ${lisible(j.scheduledFor)}`;
  } catch (e) {
    info($('pdEtat'), e.message, 'ko');
    annulerConfirmation(); go.disabled = false;
  }
}

$('programmer').onclick = ouvrir;
// Depuis la semaine de l'accueil : la vidéo glissée sur un jour ouvre la programmation à cette date.
document.addEventListener('programmer:ouvrir', async e => {
  await ouvrir();
  const d = e.detail?.date && new Date(e.detail.date);
  if (d && d > new Date()) { $('pdDate').value = local(d); annulerConfirmation(); }
});
dialog.querySelector('form').addEventListener('submit', e => { if (e.submitter?.value === 'go') { e.preventDefault(); lancer(); } });
dialog.addEventListener('input', e => { if (go.textContent !== 'Programmé' && go.textContent !== 'Envoi en cours…') annulerConfirmation(); majYoutube(); });
dialog.addEventListener('close', () => { go.disabled = false; annulerConfirmation(); });
