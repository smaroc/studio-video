// Habillage du moniteur : vu-mètre du micro, résolution et cadence, voyant REC, cadre du format.
// Lecture seule sur le flux posé par app.js dans <video id="camera"> : rien ici ne pilote la prise.
const $ = id => document.getElementById(id);
const video = $('camera'), stage = $('stage'), panel = document.querySelector('.recorderPanel');

// Vu-mètre : un analyseur branché sur la piste audio du flux caméra, sans la consommer.
let audio, analyser, source, data, spectre, raf;
function brancherMicro(stream) {
  source?.disconnect();
  source = null;
  if (!stream?.getAudioTracks().length) return;
  audio ??= new AudioContext();
  audio.resume().catch(() => {});
  analyser ??= Object.assign(audio.createAnalyser(), {fftSize: 1024, smoothingTimeConstant: 0});
  data ??= new Float32Array(analyser.fftSize);
  spectre ??= new Float32Array(analyser.frequencyBinCount);
  source = audio.createMediaStreamSource(stream);
  source.connect(analyser);
}
let niveau = 0;
function mesurer() {
  raf = requestAnimationFrame(mesurer);
  if (!source) { niveau = 0; $('meterFill').style.transform = 'scaleX(0)'; return; }
  analyser.getFloatTimeDomainData(data);
  let pic = 0;
  for (const v of data) pic = Math.max(pic, Math.abs(v));
  const db = 20 * Math.log10(pic || 1e-6);
  const cible = Math.min(1, Math.max(0, (db + 60) / 60));
  niveau = cible > niveau ? cible : niveau * 0.92 + cible * 0.08;
  const fill = $('meterFill');
  fill.style.transform = `scaleX(${niveau.toFixed(3)})`;
  fill.dataset.zone = db > -3 ? 'clip' : db > -12 ? 'chaud' : 'ok';
  analyserVoix(db);
}

// Preuve du micro : nom réel donné par le navigateur, réglages appliqués, clarté de la voix mesurée en direct.
// Mêmes repères que audio-check.mjs : la part d'énergie entre 6 et 8 kHz, seulement quand la voix est présente.
// CALAGE aligne la mesure en direct sur celle du fichier : écart relevé sur de vraies prises (-8 et -10 dB).
const VOIX_DB = -40, FENETRE = 20, CALAGE = -9;
let hauteur = 0, total = 0, voixS = 0, dernier = 0, dernierSon = 0, pisteId = '';
function analyserVoix(db) {
  const maintenant = performance.now(), dt = Math.min(0.1, (maintenant - dernier) / 1000 || 0);
  dernier = maintenant;
  if (db > -70) dernierSon = maintenant;
  if (db <= VOIX_DB) return;
  analyser.getFloatFrequencyData(spectre);
  const parBin = audio.sampleRate / analyser.fftSize, oubli = Math.exp(-dt / FENETRE);
  let h = 0, t = 0;
  spectre.forEach((v, i) => {
    const f = i * parBin;
    if (f < 80 || !Number.isFinite(v)) return;
    const p = 10 ** (v / 10);
    t += p;
    if (f >= 6000 && f <= 8000) h += p;
  });
  hauteur = hauteur * oubli + h * (1 - oubli);
  total = total * oubli + t * (1 - oubli);
  voixS += dt;
}
function afficherPreuve() {
  const piste = video.srcObject?.getAudioTracks?.()[0], boite = $('micProof');
  boite.hidden = !piste;
  if (!piste) return;
  if (piste.id !== pisteId) { pisteId = piste.id; hauteur = total = voixS = 0; dernierSon = performance.now(); }
  const r = piste.getSettings?.() || {}, traitement = r.echoCancellation || r.noiseSuppression || r.autoGainControl;
  const details = [r.sampleRate && `${Math.round(r.sampleRate / 1000)} kHz`, r.channelCount && (r.channelCount === 1 ? 'mono' : 'stéréo')].filter(Boolean).join(', ');
  $('micProofName').textContent = piste.label || 'Micro sans nom';
  let texte, ton;
  if (piste.readyState !== 'live' || piste.muted) { texte = 'Micro coupé'; ton = 'mauvais'; }
  else if (performance.now() - dernierSon > 4000) { texte = 'Aucun son ne sort de ce micro'; ton = 'mauvais'; }
  else if (traitement) { texte = 'Le navigateur retraite la voix'; ton = 'moyen'; }
  else if (voixS < 1.5) { texte = 'Parle pour mesurer la clarté'; ton = 'attente'; }
  else {
    const clarte = 10 * Math.log10(hauteur / total) + CALAGE;
    ton = clarte >= -27 ? 'bon' : clarte >= -32 ? 'moyen' : 'mauvais';
    texte = `Clarté ${Math.round(clarte)} dB, ${ton === 'bon' ? 'claire' : ton === 'moyen' ? 'moyenne' : 'étouffée'}`;
  }
  $('micProofSound').textContent = texte;
  $('micProofSound').dataset.ton = ton;
  boite.title = `${piste.label}${details ? `\n${details}` : ''}\nTraitements du navigateur : ${traitement ? 'actifs' : 'coupés'}\nClarté : part de la voix entre 6 et 8 kHz, repère -27 dB ou plus.`;
}
setInterval(afficherPreuve, 300);
mesurer();

// Résolution et cadence réelles de la piste vidéo.
function specs() {
  const piste = video.srcObject?.getVideoTracks?.()[0];
  const r = piste?.getSettings?.() || {};
  const h = video.videoHeight || r.height;
  $('specRes').textContent = h ? `${h >= 2160 ? '4K' : h + 'p'} · ${video.videoWidth || r.width}×${h}` : '--';
  $('specFps').textContent = r.frameRate ? `${Math.round(r.frameRate)} i/s` : '--';
}

function etat() {
  const stream = video.srcObject;
  panel.classList.toggle('connected', Boolean(stream));
  brancherMicro(stream);
  specs();
  cadre();
}
video.addEventListener('loadedmetadata', etat);
video.addEventListener('emptied', etat);
new MutationObserver(etat).observe(document.querySelector('.monitorBadge'), {childList: true, characterData: true, subtree: true});

// Voyant REC sur l'image, calé sur le chrono d'app.js.
const rec = $('record'), timer = $('timer');
new MutationObserver(() => {
  const on = rec.classList.contains('recording');
  panel.classList.toggle('isRecording', on);
  $('recBadge').hidden = !on;
  $('recTime').textContent = timer.textContent;
}).observe(rec, {attributes: true, attributeFilter: ['class']});
new MutationObserver(() => { $('recTime').textContent = timer.textContent; })
  .observe(timer, {childList: true, characterData: true, subtree: true});

// Cadre du format : 9:16 ou 16:9 posé sur la zone réellement occupée par l'image.
const format = $('format'), guide = $('guideToggle');
let cadreActif = (() => { try { return localStorage.getItem('studio.cadre') !== '0'; } catch { return true; } })();
function cadre() {
  const ratio = format.value === 'long' ? 16 / 9 : 9 / 16;
  $('formatChip').textContent = format.value === 'long' ? '16:9' : '9:16';
  guide.setAttribute('aria-pressed', String(cadreActif));
  guide.classList.toggle('on', cadreActif);
  const visible = cadreActif && video.videoWidth > 0;
  $('frameGuide').hidden = !visible;
  $('stageChips').hidden = !video.videoWidth;
  if (!visible) return;
  const W = stage.clientWidth, H = stage.clientHeight, vr = video.videoWidth / video.videoHeight;
  const iw = W / H > vr ? H * vr : W, ih = W / H > vr ? H : W / vr;
  const fw = iw / ih > ratio ? ih * ratio : iw, fh = iw / ih > ratio ? ih : iw / ratio;
  Object.assign($('frameGuide').querySelector('.frameBox').style, {
    width: `${fw}px`, height: `${fh}px`, left: `${(W - fw) / 2}px`, top: `${(H - fh) / 2}px`,
  });
}
guide.onclick = () => {
  cadreActif = !cadreActif;
  try { localStorage.setItem('studio.cadre', cadreActif ? '1' : '0'); } catch {}
  cadre();
};
format.addEventListener('change', cadre);
new ResizeObserver(cadre).observe(stage);
etat();

// Plein écran : tout le moniteur (en-tête, image, barre de commandes) passe en plein écran.
const plein = () => document.fullscreenElement === panel;
document.addEventListener('fullscreenchange', () => {
  $('fullscreen').classList.toggle('on', plein());
  $('fullscreen').title = plein() ? 'Quitter le plein écran (F ou Échap)' : 'Plein écran (F)';
  cadre();
});

// Aide des raccourcis, affichée sur l'image pour rester visible en plein écran.
const aide = $('keysHelp');
function basculerAide(force) {
  aide.hidden = !(force ?? aide.hidden);
  $('keysToggle').setAttribute('aria-expanded', String(!aide.hidden));
}
$('keysToggle').onclick = () => basculerAide();
$('keysClose').onclick = () => basculerAide(false);

// Raccourcis clavier. Les flèches restent gérées par app.js.
const cliquer = id => { const b = $(id); if (b && !b.disabled) b.click(); };
function taille(pas) {
  const r = $('fontSize');
  r.value = Number(r.value) + pas * 3;
  r.dispatchEvent(new Event('input', {bubbles: true}));
}
// Mode caméra : la page se réduit au moniteur, commandes en haut, texte centré sous l'objectif.
$('camMode').onclick = () => {
  const on = document.body.classList.toggle('modeCamera');
  $('camMode').setAttribute('aria-pressed', String(on));
  window.scrollTo(0, 0);
  $('cueLines').dispatchEvent(new Event('change')); // recale le prompteur sur sa nouvelle taille
};
// Un menu ou un curseur qui garde le focus couperait R et Espace : on le relâche dès le choix fait.
panel.querySelector('.transport').addEventListener('change', e => {
  if (e.target.matches('select,input[type=range]')) e.target.blur();
});
window.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
  if (panel.closest('[hidden]')) return; // onglet tournage masqué : l'onglet retours a ses propres raccourcis
  if (e.target.closest?.('input,textarea,select,[contenteditable]')) return;
  const actions = {
    Space: () => cliquer('promptPlay'),
    KeyR: () => cliquer('record'),
    KeyF: () => cliquer('fullscreen'),
    KeyM: () => cliquer('camMode'),
    KeyG: () => cliquer('guideToggle'),
    KeyC: () => cliquer(video.srcObject ? 'cameraOff' : 'cameraOn'),
    Digit0: () => cliquer('resetCue'),
    Numpad0: () => cliquer('resetCue'),
    Home: () => cliquer('resetCue'),
    Equal: () => taille(1),
    NumpadAdd: () => taille(1),
    Minus: () => taille(-1),
    NumpadSubtract: () => taille(-1),
    Escape: () => (!$('cancelRec').hidden ? cliquer('cancelRec') : aide.hidden || basculerAide(false)),
  };
  const action = e.key === '?' ? () => basculerAide() : actions[e.code];
  if (!action) return;
  e.preventDefault();
  // Un bouton qui garde le focus serait réactivé par la barre d'espace au relâchement.
  if (document.activeElement?.matches?.('button,summary')) document.activeElement.blur();
  action();
});
