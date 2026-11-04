// Onglet retours : lecture image par image, capture de l'image courante, annotations dessinées
// (stylo, cercle, rectangle, flèche, texte) puis envoi du PNG au serveur pour le joindre au retour.
// app.js garde la main sur les notes : il lit la capture en attente via window.reviewCapture.
const $ = id => document.getElementById(id);
const player = $('player'), layer = $('drawLayer'), ctx = layer.getContext('2d'), section = document.querySelector('.review');
const FPS = 30;
const stamp = s => { s = Math.max(0, s || 0); const m = Math.floor(s / 60), r = s - m * 60; return `${String(m).padStart(2, '0')}:${r.toFixed(2).padStart(5, '0')}`; };

// Transport : lecture, image par image, timecode précis.
function timecode() {
  const d = Number.isFinite(player.duration) ? player.duration : 0;
  $('reviewTime').textContent = `${stamp(player.currentTime)} / ${stamp(d)}`;
  $('reviewPlay').classList.toggle('playing', !player.paused);
}
['timeupdate', 'play', 'pause', 'loadedmetadata', 'seeked'].forEach(t => player.addEventListener(t, timecode));
const pas = n => { player.pause(); player.currentTime = Math.min(player.duration || 0, Math.max(0, player.currentTime + n)); };
$('reviewPlay').onclick = () => (player.paused ? player.play() : player.pause());
$('frameBack').onclick = () => pas(-1 / FPS);
$('frameNext').onclick = () => pas(1 / FPS);
player.addEventListener('click', () => { if (!open) $('reviewPlay').click(); });

// Éditeur d'annotations.
let base, shapes = [], draft = null, tool = 'circle', color = '#ff5a4e', open = false, pending = null;
const trait = () => Math.max(3, Math.round(layer.width / 220));

function ouvrir() {
  if (!player.videoWidth) return note('Charge une version vidéo avant de capturer.');
  player.pause();
  base = document.createElement('canvas');
  base.width = player.videoWidth; base.height = player.videoHeight;
  base.getContext('2d').drawImage(player, 0, 0);
  layer.width = base.width; layer.height = base.height;
  shapes = []; draft = null; open = true;
  section.classList.add('annotating');
  layer.hidden = false; $('drawTools').hidden = false;
  $('drawTime').textContent = stamp(player.currentTime);
  dessiner();
}
function fermer() {
  open = false; draft = null; texte.hidden = true;
  section.classList.remove('annotating');
  layer.hidden = true; $('drawTools').hidden = true;
}

function forme(c, s) {
  c.strokeStyle = c.fillStyle = s.color; c.lineWidth = s.w; c.lineCap = c.lineJoin = 'round';
  c.shadowColor = '#0009'; c.shadowBlur = s.w * 1.5;
  const [x1, y1, x2, y2] = s.box || [];
  c.beginPath();
  if (s.tool === 'pen') { s.points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); }
  if (s.tool === 'circle') { c.ellipse((x1 + x2) / 2, (y1 + y2) / 2, Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2, 0, 0, Math.PI * 2); c.stroke(); }
  if (s.tool === 'rect') { c.roundRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1), s.w); c.stroke(); }
  if (s.tool === 'arrow') {
    const a = Math.atan2(y2 - y1, x2 - x1), h = s.w * 5;
    c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    c.beginPath(); c.moveTo(x2, y2);
    c.lineTo(x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45));
    c.lineTo(x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45));
    c.closePath(); c.fill();
  }
  if (s.tool === 'text') {
    const size = s.w * 7;
    c.font = `800 ${size}px Inter, -apple-system, sans-serif`; c.textBaseline = 'top';
    const pad = size * 0.3, w = c.measureText(s.text).width;
    // Le texte reste entier dans l'image, même cliqué près d'un bord.
    const x = Math.max(pad, Math.min(s.x, layer.width - w - pad)), y = Math.max(pad, Math.min(s.y - size / 2, layer.height - size - pad));
    c.shadowBlur = 0; c.fillStyle = '#000000c0';
    c.beginPath(); c.roundRect(x - pad, y - pad, w + pad * 2, size + pad * 2, pad); c.fill();
    c.fillStyle = s.color; c.fillText(s.text, x, y);
  }
  c.shadowBlur = 0;
}
function dessiner() {
  ctx.clearRect(0, 0, layer.width, layer.height);
  ctx.drawImage(base, 0, 0);
  [...shapes, draft].filter(Boolean).forEach(s => forme(ctx, s));
  $('drawUndo').disabled = !shapes.length;
  $('drawClear').disabled = !shapes.length;
}

// Coordonnées pointeur → pixels de l'image (le canvas est en object-fit: contain).
function point(e) {
  const r = layer.getBoundingClientRect(), k = Math.min(r.width / layer.width, r.height / layer.height);
  const ox = (r.width - layer.width * k) / 2, oy = (r.height - layer.height * k) / 2;
  return [(e.clientX - r.left - ox) / k, (e.clientY - r.top - oy) / k];
}
layer.addEventListener('pointerdown', e => {
  if (!open) return;
  const [x, y] = point(e);
  if (tool === 'text') return;
  layer.setPointerCapture(e.pointerId);
  draft = tool === 'pen' ? {tool, color, w: trait(), points: [[x, y]]} : {tool, color, w: trait(), box: [x, y, x, y]};
});
// Texte posé au clic (après le mousedown) pour que le champ garde bien le focus.
layer.addEventListener('click', e => { if (open && tool === 'text') { const [x, y] = point(e); saisir(e, x, y); } });
layer.addEventListener('pointermove', e => {
  if (!draft) return;
  const [x, y] = point(e);
  if (draft.tool === 'pen') draft.points.push([x, y]); else { draft.box[2] = x; draft.box[3] = y; }
  dessiner();
});
layer.addEventListener('pointerup', () => {
  if (!draft) return;
  const [x1, y1, x2, y2] = draft.box || [0, 0, 9, 9];
  if (draft.tool === 'pen' ? draft.points.length > 1 : Math.hypot(x2 - x1, y2 - y1) > 6) shapes.push(draft);
  draft = null; dessiner();
});

// Texte : champ posé à l'endroit cliqué, validé par Entrée.
const texte = $('drawText');
let ancre = null;
function saisir(e, x, y) {
  const r = section.querySelector('.playerWrap').getBoundingClientRect();
  ancre = {x, y};
  Object.assign(texte.style, {left: `${e.clientX - r.left}px`, top: `${e.clientY - r.top}px`, color});
  texte.value = ''; texte.hidden = false;
  texte.focus();
}
function poserTexte() {
  if (texte.hidden) return;
  const t = texte.value.trim();
  if (t && ancre) shapes.push({tool: 'text', color, w: trait(), text: t, ...ancre});
  texte.hidden = true; ancre = null; dessiner();
}
texte.addEventListener('keydown', e => {
  e.stopPropagation();
  if (e.key === 'Enter') { e.preventDefault(); poserTexte(); }
  if (e.key === 'Escape') { texte.hidden = true; ancre = null; }
});
texte.addEventListener('blur', poserTexte);

function choisirOutil(t) {
  tool = t;
  document.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
  layer.dataset.tool = t;
}
function choisirCouleur(c) {
  color = c;
  document.querySelectorAll('[data-color]').forEach(b => b.classList.toggle('on', b.dataset.color === c));
}
document.querySelectorAll('[data-tool]').forEach(b => (b.onclick = () => choisirOutil(b.dataset.tool)));
document.querySelectorAll('[data-color]').forEach(b => (b.onclick = () => choisirCouleur(b.dataset.color)));
$('drawUndo').onclick = () => { shapes.pop(); dessiner(); };
$('drawClear').onclick = () => { shapes = []; dessiner(); };
$('drawCancel').onclick = fermer;
$('captureFrame').onclick = ouvrir;

// Joindre : PNG envoyé au serveur, rangé dans captures/<projet>/.
const projet = () => decodeURIComponent(new URL(player.currentSrc || player.src, location.href).pathname.split('/')[3] || '');
$('drawAttach').onclick = async () => {
  poserTexte();
  const id = projet();
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return note('Version vidéo introuvable pour cette capture.');
  const time = player.currentTime, bouton = $('drawAttach');
  bouton.disabled = true; note('Envoi de la capture…');
  try {
    const blob = await new Promise(r => layer.toBlob(r, 'image/png'));
    const name = `capture-${String(time.toFixed(2)).replace('.', '-')}-${Date.now()}.png`;
    const res = await fetch(`/api/captures/${id}/${name}`, {method: 'PUT', headers: {'Content-Type': 'image/png'}, body: blob});
    const data = await res.json();
    if (!res.ok) throw Error(data.error || 'Envoi refusé');
    pending = {...data, time};
    $('pendingShot').src = data.url;
    $('pendingTime').textContent = stamp(time);
    $('pendingCapture').hidden = false;
    fermer();
    $('note').focus(); note('Capture jointe : écris le retour puis ajoute-le.');
  } catch (err) { note(err.message); } finally { bouton.disabled = false; }
};
$('pendingRemove').onclick = () => window.reviewCapture.clear();

// Agrandissement d'une capture déjà jointe.
const zoom = $('shotZoom');
zoom.onclick = () => (zoom.hidden = true);

window.reviewCapture = {
  pending: () => pending,
  clear() { pending = null; $('pendingCapture').hidden = true; $('pendingShot').removeAttribute('src'); },
  zoom(url) { zoom.querySelector('img').src = url; zoom.hidden = false; },
};

function note(t) { const s = $('status'); if (s) s.textContent = t; }

// Raccourcis de l'onglet retours.
const outils = {KeyP: 'pen', KeyO: 'circle', KeyR: 'rect', KeyF: 'arrow', KeyT: 'text'};
window.addEventListener('keydown', e => {
  if (section.hidden || e.target.closest?.('input,textarea,select,[contenteditable]')) return;
  if (!zoom.hidden && e.key === 'Escape') { zoom.hidden = true; return; }
  if (open) {
    if ((e.metaKey || e.ctrlKey) && e.code === 'KeyZ') { e.preventDefault(); $('drawUndo').click(); return; }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (outils[e.code]) { e.preventDefault(); choisirOutil(outils[e.code]); }
    if (e.key === 'Escape') { e.preventDefault(); fermer(); }
    if (e.key === 'Enter') { e.preventDefault(); $('drawAttach').click(); }
    return;
  }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const actions = {
    Space: () => $('reviewPlay').click(),
    KeyK: () => $('reviewPlay').click(),
    ArrowLeft: () => pas(e.shiftKey ? -1 : -1 / FPS),
    ArrowRight: () => pas(e.shiftKey ? 1 : 1 / FPS),
    KeyA: () => ouvrir(),
    KeyC: () => ouvrir(),
    KeyN: () => $('note').focus(),
  };
  if (!actions[e.code]) return;
  e.preventDefault();
  if (document.activeElement?.matches?.('button')) document.activeElement.blur();
  actions[e.code]();
});

choisirOutil('circle');
choisirCouleur(color);
timecode();
