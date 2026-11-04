// Nouvelles versions de montage : cloche dans l'en-tête et bandeau dans Montage. Chaque version (vN, heure, retour traité)
// reste signalée tant qu'elle n'est pas confirmée ; la confirmation est gardée sur le disque (versions-vues.json).
// La notification système est envoyée par le serveur (versions-api.mjs), même onglet fermé.
const $ = id => document.getElementById(id);
let actif = null;
const DEJA_PARTIES = ['publié', 'en partie publié', 'programmé'];

const heure = iso => new Date(iso).toLocaleString('fr-FR', {weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'});
const nom = x => x.version.n ? `v${x.version.n}` : x.version.fichier.split('/').pop();
const detail = x => `${nom(x)} · livrée ${heure(x.version.date)}` + (x.version.traite ? ` · retour traité : ${x.version.traite}` : '');
const ouvrir = id => { $('cloche').open = false; document.dispatchEvent(new CustomEvent('suivi:ouvrir', {detail: {id, vue: 'review', derniere: true}})); };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

window.versionsARevoir = () => (window.suiviItems || [])
  // Seules les vidéos qui attendent encore une relecture : rien de publié ni de déjà programmé.
  .filter(x => !x.archive && x.version && !DEJA_PARTIES.includes(x.etape) && (!x.confirme || x.confirme < x.version.date))
  .sort((a, b) => b.version.date.localeCompare(a.version.date));

async function confirmer(x) {
  const r = await fetch(`/api/versions/${x.id}/confirmer`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({date: x.version.date})});
  if (r.ok) x.confirme = (await r.json()).confirme;
  rendre();
}

function bandeau(liste) {
  const b = $('versionBandeau');
  if (!b) return;
  const x = liste.find(v => v.id === actif);
  b.hidden = !x;
  if (!x) return;
  const ok = el('button', 'versionConfirmer', `Confirmer la ${nom(x)}`);
  ok.type = 'button';
  ok.onclick = () => confirmer(x);
  b.replaceChildren(el('span', 'versionPastille', 'Nouvelle version'), el('span', 'versionTexte', detail(x)), ok);
}

function rendre() {
  const liste = window.versionsARevoir();
  $('clocheNb').hidden = !liste.length;
  $('clocheNb').textContent = liste.length;
  $('cloche').classList.toggle('active', !!liste.length);
  $('clocheListe').replaceChildren(...(liste.length ? liste.map(x => {
    const ligne = el('div', 'clocheItem');
    const voir = el('button', 'clocheVoir');
    voir.type = 'button';
    voir.append(el('span', null, x.titre), el('small', null, detail(x)));
    voir.onclick = () => ouvrir(x.id);
    const ok = el('button', 'clocheOk', 'Confirmer');
    ok.type = 'button';
    ok.title = `Confirmer que la ${nom(x)} est relue`;
    ok.onclick = () => confirmer(x);
    ligne.append(voir, ok);
    return ligne;
  }) : [el('p', 'muted', 'Rien de neuf, toutes les versions sont confirmées.')]));
  $('clocheTout').hidden = liste.length < 2;
  bandeau(liste);
  document.dispatchEvent(new Event('versions:maj'));
}

document.addEventListener('suivi:maj', rendre);
document.addEventListener('projet:actif', e => { actif = e.detail; rendre(); });
setInterval(() => { if (!document.hidden) document.dispatchEvent(new Event('suivi:rafraichir')); }, 30000);
$('clocheTout').onclick = async () => { for (const x of window.versionsARevoir()) await confirmer(x); };
document.addEventListener('click', e => { if (!$('cloche').contains(e.target)) $('cloche').open = false; });
