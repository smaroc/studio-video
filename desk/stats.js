import {config} from './config.js';
// Onglet « Statistiques » : uniquement les reels programmés depuis le studio, et leur évolution jour par jour (Zernio).
const $ = s => document.getElementById(s);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
const TZ = config.fuseau;
const RESEAUX = ['instagram', 'facebook', 'tiktok', 'youtube'];
const NOMS = {instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', youtube: 'YouTube'};
const MESURES = [['vues', 'Vues'], ['likes', 'Likes'], ['commentaires', 'Commentaires'], ['enregistrements', 'Enregistrements'], ['partages', 'Partages'], ['abonnes', 'Abonnés']];
const MODES = [['cumul', 'Σ cumul'], ['jour', 'Δ par jour']];
const FENETRES = [['7', '7 j'], ['14', '14 j'], ['30', '30 j'], ['tout', 'tout']];
const nf = new Intl.NumberFormat('fr-FR');
const court = new Intl.NumberFormat('fr-FR', {notation: 'compact', maximumFractionDigits: 1});
const dateCourte = d => new Date(d + (d.length === 10 ? 'T12:00' : '')).toLocaleDateString('fr-FR', {timeZone: TZ, day: 'numeric', month: 'short'});
const dateHeure = d => new Date(d).toLocaleString('fr-FR', {timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'});
const lire = (k, ok, def) => { try { const v = localStorage.getItem(k); return ok.includes(v) ? v : def; } catch { return def; } };
const ecrire = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

let donnees = null, charge = null, choisi = null;
let mesure = lire('studio.statsMesure', MESURES.map(m => m[0]), 'vues');
let mode = lire('studio.statsMode', MODES.map(m => m[0]), 'cumul');
let fenetre = lire('studio.statsFenetre', FENETRES.map(m => m[0]), 'tout');
const nomMesure = () => MESURES.find(m => m[0] === mesure)[1].toLowerCase();

// Une valeur cumulée par jour et par réseau, prolongée jusqu'à la dernière date connue ; « Par jour » = écart avec la veille.
function jours(debut, fin) { const out = []; for (let d = new Date(debut + 'T12:00Z'); d.toISOString().slice(0, 10) <= fin; d.setUTCDate(d.getUTCDate() + 1)) out.push(d.toISOString().slice(0, 10)); return out; }
function cumul(reel, reseau, axe, k = mesure) {
  const parJour = Object.fromEntries(reel.serie.map(l => [l.date, l[reseau]?.[k]]));
  let dernier = null;
  return axe.map(j => { if (parJour[j] != null) dernier = parJour[j]; return j < reel.serie[0]?.date ? null : dernier; });
}
const enJour = v => v.map((x, i) => x == null ? null : Math.max(0, x - (v[i - 1] ?? 0)));
const lecture = v => mode === 'jour' ? enJour(v) : v;
// La fenêtre coupe l'axe après calcul, pour que le « par jour » du premier jour affiché reste un vrai écart.
const couper = (axe, series) => { const d = fenetre === 'tout' ? 0 : Math.max(0, axe.length - Number(fenetre)); return d ? [axe.slice(d), series.map(s => ({...s, valeurs: s.valeurs.slice(d)}))] : [axe, series]; };
const somme = listes => listes[0].map((_, i) => { const l = listes.map(v => v[i]).filter(x => x != null); return l.length ? l.reduce((a, b) => a + b, 0) : null; });

function graduations(max) {
  if (max <= 0) return [0, 1];
  const brut = max / 4, p = 10 ** Math.floor(Math.log10(brut)), pas = [1, 2, 2.5, 5, 10].map(x => x * p).find(x => x >= brut);
  return Array.from({length: Math.ceil(max / pas) + 1}, (_, i) => i * pas);
}

// Courbe SVG : séries en lignes (ou aires empilées), axe Y unique, réticule et bulle au survol.
function courbe(hote, {x, series, empile = false, etiquette, survol, hauteur = 240}) {
  hote.replaceChildren();
  const largeur = Math.max(320, hote.clientWidth || 640), m = {h: 14, d: 16, b: 26, g: 44};
  const iw = largeur - m.g - m.d, ih = hauteur - m.h - m.b;
  const piles = empile ? series.reduce((acc, s, k) => [...acc, s.valeurs.map((v, i) => (v ?? 0) + (k ? acc[k - 1][i] : 0))], []) : null;
  const max = Math.max(1, ...(empile ? piles.at(-1) : series.flatMap(s => s.valeurs.filter(v => v != null))));
  const ticks = graduations(max), haut = ticks.at(-1);
  const px = i => m.g + (x.length < 2 ? iw / 2 : i * iw / (x.length - 1)), py = v => m.h + ih - v / haut * ih;
  const svg = sv('svg', {viewBox: `0 0 ${largeur} ${hauteur}`, width: largeur, height: hauteur, class: 'statsSvg', role: 'img'});
  for (const t of ticks) {
    svg.append(sv('line', {x1: m.g, x2: largeur - m.d, y1: py(t), y2: py(t), class: t ? 'grille' : 'base'}));
    const lbl = sv('text', {x: m.g - 8, y: py(t) + 3, 'text-anchor': 'end', class: 'axe'}); lbl.textContent = court.format(t); svg.append(lbl);
  }
  const pasX = Math.max(1, Math.ceil(x.length / Math.floor(iw / 64)));
  x.forEach((v, i) => { if (i % pasX && i !== x.length - 1) return; const t = sv('text', {x: px(i), y: hauteur - 8, 'text-anchor': i === 0 ? 'start' : i === x.length - 1 ? 'end' : 'middle', class: 'axe'}); t.textContent = etiquette(v, i); svg.append(t); });
  const trace = (v, base) => {
    const pts = v.map((y, i) => y == null ? null : [px(i), py(y)]);
    let d = '', ouvert = false;
    pts.forEach((p, i) => { if (!p) { ouvert = false; return; } d += `${ouvert ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`; ouvert = true; });
    if (!base) return d;
    const idx = pts.map((p, i) => p ? i : -1).filter(i => i >= 0);
    return d + idx.reverse().map(i => `L${px(i).toFixed(1)},${py(base[i]).toFixed(1)}`).join('') + 'Z';
  };
  series.forEach((s, k) => {
    if (empile) {
      const bas = k ? piles[k - 1] : x.map(() => 0);
      svg.append(sv('path', {d: trace(piles[k], bas), fill: s.couleur, class: 'aire'}));
      svg.append(sv('path', {d: trace(piles[k]), class: 'joint'}));
    } else svg.append(sv('path', {d: trace(s.valeurs), stroke: s.couleur, class: 'ligne' + (s.classe ? ' ' + s.classe : '')}));
  });
  for (const s of series.filter(s => s.etiquette)) {
    const i = s.valeurs.findLastIndex(v => v != null); if (i < 0) continue;
    const y = empile ? piles[series.indexOf(s)][i] : s.valeurs[i];
    svg.append(sv('circle', {cx: px(i), cy: py(y), r: 4, fill: s.couleur, class: 'point'}));
  }
  const reticule = sv('line', {y1: m.h, y2: m.h + ih, class: 'reticule', visibility: 'hidden'}), points = sv('g');
  const zone = sv('rect', {x: m.g, y: 0, width: iw, height: hauteur, fill: 'transparent'});
  svg.append(reticule, points, zone);
  const bulle = el('div', 'statsBulle'); bulle.hidden = true;
  const montrer = ev => {
    const r = svg.getBoundingClientRect(), mx = (ev.clientX - r.left) * largeur / r.width;
    const i = Math.max(0, Math.min(x.length - 1, Math.round((mx - m.g) / (iw / Math.max(1, x.length - 1)))));
    reticule.setAttribute('x1', px(i)); reticule.setAttribute('x2', px(i)); reticule.setAttribute('visibility', 'visible');
    points.replaceChildren(...series.map((s, k) => { const v = empile ? piles[k][i] : s.valeurs[i]; return v == null || (empile && s.valeurs[i] == null) ? null : sv('circle', {cx: px(i), cy: py(v), r: 4, fill: s.couleur, class: 'point'}); }).filter(Boolean));
    bulle.replaceChildren(survol(i)); bulle.hidden = false;
    const gauche = px(i) * r.width / largeur;
    bulle.style.left = `${Math.min(gauche + 14, r.width - bulle.offsetWidth - 4)}px`;
    if (gauche + 14 + bulle.offsetWidth > r.width) bulle.style.left = `${Math.max(0, gauche - bulle.offsetWidth - 14)}px`;
  };
  zone.addEventListener('pointermove', montrer);
  zone.addEventListener('pointerleave', () => { bulle.hidden = true; reticule.setAttribute('visibility', 'hidden'); points.replaceChildren(); });
  hote.append(svg, bulle);
}

const ligneBulle = (couleur, nom, valeur) => { const l = el('div', 'bulleLigne'); const c = el('i'); if (couleur) c.style.background = couleur; else c.className = 'vide'; l.append(c, el('span', '', nom), el('b', '', valeur == null ? '–' : nf.format(valeur))); return l; };
const couleur = r => `var(--s-${r})`;

function legende(reseaux) {
  const l = el('div', 'statsLegende');
  for (const r of reseaux) { const x = el('span'); const c = el('i'); c.style.background = couleur(r); x.append(c, NOMS[r]); l.append(x); }
  return l;
}

function tuiles(publies) {
  const t = el('div', 'statsTuiles');
  const axe = axeGlobal(publies), hier = axe.length > 1;
  for (const [k, nom] of MESURES) {
    const total = publies.reduce((s, r) => s + r.total[k], 0);
    const tuile = el('button', 'statsTuile' + (k === mesure ? ' on' : ''));
    tuile.type = 'button'; tuile.onclick = () => choisirMesure(k);
    tuile.append(el('span', '', nom), el('strong', '', nf.format(total)));
    if (hier) {
      const v = somme(publies.flatMap(r => RESEAUX.map(n => cumul(r, n, axe, k))).filter(v => v.some(x => x != null)));
      const delta = (v.at(-1) ?? 0) - (v.at(-2) ?? 0);
      tuile.append(el('em', '', `${delta >= 0 ? '+' : ''}${nf.format(delta)} le ${dateCourte(axe.at(-1))}`));
    }
    t.append(tuile);
  }
  return t;
}

function axeGlobal(publies) {
  const dates = publies.flatMap(r => r.serie.map(l => l.date)).sort();
  return dates.length ? jours(dates[0], dates.at(-1)) : [];
}

function global(publies) {
  const carte = el('section', 'card statsCarte');
  const tete = el('div', 'statsTete');
  tete.append(el('h2', '', `Évolution de toutes les ${nomMesure()}`), legende(RESEAUX));
  const hote = el('div', 'statsCourbe');
  carte.append(tete, hote);
  const complet = axeGlobal(publies);
  if (!complet.length) { hote.append(el('p', 'muted', 'Pas encore de données Zernio.')); return carte; }
  const [axe, series] = couper(complet, RESEAUX.map(n => {
    const listes = publies.map(r => cumul(r, n, complet)).filter(v => v.some(x => x != null));
    return {id: n, nom: NOMS[n], couleur: couleur(n), valeurs: listes.length ? lecture(somme(listes)) : complet.map(() => null)};
  }).filter(s => s.valeurs.some(v => v != null)));
  const dessiner = () => courbe(hote, {
    x: axe, series, empile: true, etiquette: v => dateCourte(v),
    survol: i => {
      const f = document.createDocumentFragment();
      f.append(el('div', 'bulleTitre', `${dateCourte(axe[i])} · ${mode === 'jour' ? 'gagnées ce jour' : 'cumul'}`));
      for (const s of [...series].reverse()) f.append(ligneBulle(s.couleur, s.nom, s.valeurs[i]));
      f.append(ligneBulle('', 'Total', series.reduce((a, s) => a + (s.valeurs[i] ?? 0), 0)));
      return f;
    },
  });
  requestAnimationFrame(dessiner); observer(hote, dessiner);
  return carte;
}

// Trajectoires comparées : jour 0 = jour de publication, le reel sélectionné ressort, les autres restent en gris.
function trajectoires(publies) {
  const carte = el('section', 'card statsCarte');
  const tete = el('div', 'statsTete');
  tete.append(el('h2', '', `Trajectoire de chaque reel depuis sa publication`), el('span', 'muted', 'clique un reel dans le tableau pour le mettre en avant'));
  const hote = el('div', 'statsCourbe');
  carte.append(tete, hote);
  const longueur = Math.max(1, ...publies.map(r => r.serie.length));
  const x = Array.from({length: longueur}, (_, i) => i);
  const series = publies.map(r => {
    const axe = r.serie.length ? jours(r.serie[0].date, r.serie.at(-1).date) : [];
    const v = lecture(somme(RESEAUX.map(n => cumul(r, n, axe)).filter(v => v.some(y => y != null))) || []);
    return {id: r.projet, nom: r.titre, couleur: r.projet === choisi ? 'var(--s-instagram)' : 'var(--neutre)', classe: r.projet === choisi ? 'avant' : 'fond', etiquette: r.projet === choisi, valeurs: x.map(i => v[i] ?? null)};
  }).sort((a, b) => (a.id === choisi) - (b.id === choisi));
  const dessiner = () => courbe(hote, {
    x, series, etiquette: i => i === 0 ? 'publication' : `J+${i}`,
    survol: i => {
      const f = document.createDocumentFragment();
      f.append(el('div', 'bulleTitre', `${i === 0 ? 'Jour de publication' : `J+${i}`} · ${nomMesure()}`));
      for (const s of series.filter(s => s.valeurs[i] != null).sort((a, b) => b.valeurs[i] - a.valeurs[i])) {
        const l = ligneBulle(s.id === choisi ? s.couleur : 'var(--neutre)', s.nom.length > 46 ? s.nom.slice(0, 45) + '…' : s.nom, s.valeurs[i]);
        if (s.id === choisi) l.classList.add('avant'); f.append(l);
      }
      return f;
    },
  });
  requestAnimationFrame(dessiner); observer(hote, dessiner);
  return carte;
}

function sparkline(r) {
  const axe = r.serie.length ? jours(r.serie[0].date, r.serie.at(-1).date) : [];
  const listes = RESEAUX.map(n => cumul(r, n, axe)).filter(v => v.some(y => y != null));
  const v = listes.length ? lecture(somme(listes)) : [];
  const s = sv('svg', {viewBox: '0 0 90 26', width: 90, height: 26, class: 'spark'});
  if (v.length < 2) return s;
  const max = Math.max(1, ...v.filter(y => y != null));
  s.append(sv('path', {d: v.map((y, i) => `${i ? 'L' : 'M'}${(2 + i * 86 / (v.length - 1)).toFixed(1)},${(23 - (y ?? 0) / max * 20).toFixed(1)}`).join('')}));
  return s;
}

function tableau(reels) {
  const carte = el('section', 'card statsCarte');
  const tete = el('div', 'statsTete');
  tete.append(el('h2', '', `${reels.length} reels programmés depuis le studio`));
  const wrap = el('div', 'statsTableWrap');
  const t = el('table', 'statsTable');
  const th = el('tr');
  for (const [c, cls] of [['Reel', ''], ['Publication', ''], ['Réseaux', ''], [`Évolution (${nomMesure()})`, ''], ...MESURES.map(m => [m[1], 'num']), ['Engagement', 'num']]) th.append(el('th', cls, c));
  { const thead = el('thead'); thead.append(th); t.append(thead); }
  const corps = el('tbody');
  for (const r of reels) {
    const tr = el('tr', r.projet === choisi ? 'choisi' : '');
    if (r.statut !== 'programmé') { tr.tabIndex = 0; tr.onclick = () => choisir(r.projet); tr.onkeydown = e => { if (e.key === 'Enter') choisir(r.projet); }; }
    const reel = el('td', 'statsReel');
    if (r.cover) { const img = el('img'); img.src = `/api/programmation/${r.projet}/cover.jpg`; img.alt = ''; img.loading = 'lazy'; reel.append(img); } else reel.append(el('span', 'statsSansCover'));
    const txt = el('div'); txt.append(el('strong', '', r.titre), el('span', 'muted', [r.nom, r.motCle && `mot-clé ${r.motCle}`].filter(Boolean).join(' · '))); reel.append(txt);
    const date = el('td', 'statsDate'); date.append(el('span', `statsStatut ${r.statut === 'programmé' ? 'prog' : 'pub'}`, r.statut), el('div', 'muted', dateHeure(r.date)));
    const res = el('td', 'statsReseaux');
    for (const n of RESEAUX.filter(n => r.prevus.includes(n) || r.reseaux.some(x => x.plateforme === n))) {
      const x = r.reseaux.find(x => x.plateforme === n);
      const a = el(x?.url ? 'a' : 'span', 'statsPuce'); if (x?.url) { a.href = x.url; a.target = '_blank'; a.rel = 'noopener'; a.onclick = e => e.stopPropagation(); }
      const c = el('i'); c.style.background = couleur(n); a.append(c, x ? court.format(x[mesure]) : NOMS[n]); a.title = x ? `${NOMS[n]} : ${nf.format(x[mesure])} ${nomMesure()}` : `${NOMS[n]} : programmé`;
      res.append(a);
    }
    const evo = el('td'); if (r.statut !== 'programmé') evo.append(sparkline(r));
    tr.append(reel, date, res, evo);
    for (const [k] of MESURES) tr.append(el('td', 'num' + (k === mesure ? ' fort' : ''), r.statut === 'programmé' ? '–' : nf.format(r.total[k])));
    const vues = r.reseaux.reduce((s, x) => s + x.vues, 0);
    tr.append(el('td', 'num', vues ? `${(r.reseaux.reduce((s, x) => s + x.engagement * x.vues, 0) / vues).toFixed(1)} %` : '–'));
    corps.append(tr);
  }
  t.append(corps); wrap.append(t); carte.append(tete, wrap);
  return carte;
}

// Détail d'un reel : une courbe par réseau, et le tableau réseau par réseau (liens, temps de visionnage moyen).
function detail(r) {
  const carte = el('section', 'card statsCarte');
  const tete = el('div', 'statsTete');
  const presents = RESEAUX.filter(n => r.serie.some(l => l[n]));
  tete.append(el('h2', '', r.titre), legende(presents));
  const hote = el('div', 'statsCourbe');
  const complet = r.serie.length ? jours(r.serie[0].date, r.serie.at(-1).date) : [];
  const [axe, series] = couper(complet, presents.map(n => ({id: n, nom: NOMS[n], couleur: couleur(n), etiquette: true, valeurs: lecture(cumul(r, n, complet))})));
  const dessiner = () => courbe(hote, {
    x: axe, series, etiquette: v => dateCourte(v), hauteur: 220,
    survol: i => { const f = document.createDocumentFragment(); f.append(el('div', 'bulleTitre', `${dateCourte(axe[i])} · ${nomMesure()}${mode === 'jour' ? ' gagnées' : ''}`)); for (const s of series) f.append(ligneBulle(s.couleur, s.nom, s.valeurs[i])); return f; },
  });
  const t = el('table', 'statsTable compact');
  const th = el('tr'); for (const [c, cls] of [['Réseau', ''], ...MESURES.map(m => [m[1], 'num']), ['Temps moyen', 'num'], ['Engagement', 'num'], ['', '']]) th.append(el('th', cls, c));
  { const thead = el('thead'); thead.append(th); t.append(thead); }
  const corps = el('tbody');
  for (const x of r.reseaux) {
    const tr = el('tr'); const nom = el('td', 'statsNomReseau'); const c = el('i'); c.style.background = couleur(x.plateforme); nom.append(c, NOMS[x.plateforme] || x.plateforme);
    tr.append(nom); for (const [k] of MESURES) tr.append(el('td', 'num' + (k === mesure ? ' fort' : ''), nf.format(x[k])));
    tr.append(el('td', 'num', x.tempsMoyen ? `${x.tempsMoyen.toFixed(1)} s` : '–'), el('td', 'num', `${x.engagement.toFixed(1)} %`));
    const lien = el('td'); if (x.url) { const a = el('a', 'statsLien', 'ouvrir'); a.href = x.url; a.target = '_blank'; a.rel = 'noopener'; lien.append(a); } tr.append(lien);
    corps.append(tr);
  }
  t.append(corps);
  const wrap = el('div', 'statsTableWrap'); wrap.append(t);
  carte.append(tete, hote, wrap);
  requestAnimationFrame(dessiner); observer(hote, dessiner);
  return carte;
}

const observateurs = [];
function observer(hote, fn) {
  let l = hote.clientWidth, t = null;
  const o = new ResizeObserver(() => { if (Math.abs(hote.clientWidth - l) < 8) return; l = hote.clientWidth; clearTimeout(t); t = setTimeout(fn, 120); });
  o.observe(hote); observateurs.push(o);
}

function switches() {
  const remplir = (hote, liste, actif, fn, index) => hote.replaceChildren(...liste.map(([k, nom], i) => {
    const b = el('button', k === actif ? 'on' : ''); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(k === actif)); b.onclick = () => fn(k);
    if (index) { b.append(el('sup', '', String(i + 1))); b.title = `${nom} (${i + 1})`; }
    b.append(nom.replace(/^\p{Lu}(?=\p{Ll})/u, c => c.toLowerCase())); return b;
  }));
  remplir($('statsMesure'), MESURES, mesure, choisirMesure, true);
  remplir($('statsMode'), MODES, mode, choisirMode);
  remplir($('statsFenetre'), FENETRES, fenetre, k => { fenetre = k; ecrire('studio.statsFenetre', k); rendre(); });
}
function choisirMode(k) { mode = k; ecrire('studio.statsMode', k); rendre(); }
function choisirMesure(k) { mesure = k; ecrire('studio.statsMesure', k); rendre(); }
function choisir(id) { choisi = id; rendre(); document.querySelector('.statsDetail')?.scrollIntoView({behavior: 'smooth', block: 'nearest'}); }

function rendre() {
  switches();
  const box = $('statsContenu');
  observateurs.splice(0).forEach(o => o.disconnect());
  if (!donnees) return;
  const publies = donnees.reels.filter(r => r.statut !== 'programmé' && r.serie.length);
  if (!choisi || !publies.some(r => r.projet === choisi)) choisi = [...publies].sort((a, b) => b.total.vues - a.total.vues)[0]?.projet || null;
  const enfants = [];
  const erreurs = Object.keys(donnees.erreurs || {}).length, anciens = donnees.reels.filter(r => r.ancien).length;
  if (erreurs || anciens) enfants.push(el('div', 'statsAlerte', `${erreurs ? `${erreurs} reel${erreurs > 1 ? 's' : ''} sans réponse de Zernio. ` : ''}${anciens ? `${anciens} affiché${anciens > 1 ? 's' : ''} avec la dernière lecture enregistrée.` : ''}`));
  if (!donnees.reels.length) { box.replaceChildren(el('p', 'muted', 'Aucun reel programmé depuis le studio pour l’instant.')); return; }
  enfants.push(tuiles(publies));
  const duo = el('div', 'statsDuo'); duo.append(global(publies), trajectoires(publies)); enfants.push(duo);
  const sel = publies.find(r => r.projet === choisi);
  if (sel) { const d = detail(sel); d.classList.add('statsDetail'); enfants.push(d); }
  enfants.push(tableau(donnees.reels));
  box.replaceChildren(...enfants);
}

export async function chargerStats(frais = false) {
  switches();
  if (donnees && !frais) { rendre(); return; }
  if (charge) return charge;
  $('statsMaj').textContent = 'lecture zernio…'; $('statsVoyant').className = 'statsVoyant lecture';
  if (!donnees) $('statsContenu').replaceChildren(el('p', 'muted', 'Chargement des statistiques…'));
  charge = fetch('/api/stats' + (frais ? '?frais' : '')).then(r => r.json()).then(d => {
    if (d.error) throw Error(d.error);
    donnees = d;
    const n = d.reels.filter(r => r.statut !== 'programmé').length, p = d.reels.length - n;
    $('statsMaj').textContent = `${n} publié${n > 1 ? 's' : ''} · ${p} programmé${p > 1 ? 's' : ''} · zernio ${new Date(d.maj).toLocaleTimeString('fr-FR', {timeZone: TZ})}`;
    $('statsVoyant').className = 'statsVoyant' + (Object.keys(d.erreurs || {}).length || d.reels.some(r => r.ancien) ? ' ancien' : '');
    rendre();
  }).catch(e => { $('statsMaj').textContent = e.message; $('statsVoyant').className = 'statsVoyant panne'; if (!donnees) $('statsContenu').replaceChildren(el('p', 'muted', `Statistiques indisponibles : ${e.message}`)); }).finally(() => { charge = null; });
  return charge;
}

$('statsActualiser').onclick = () => chargerStats(true);
// Raccourcis de l'onglet : 1 à 6 pour la métrique, C / J pour l'échelle, R pour relire Zernio.
document.addEventListener('keydown', e => {
  if (document.querySelector('.stats').hidden || e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input,textarea,select,[contenteditable]')) return;
  const k = e.key.toLowerCase(), i = Number(k) - 1;
  if (MESURES[i]) choisirMesure(MESURES[i][0]);
  else if (k === 'c') choisirMode('cumul');
  else if (k === 'j') choisirMode('jour');
  else if (k === 'r') chargerStats(true);
  else return;
  e.preventDefault();
});
