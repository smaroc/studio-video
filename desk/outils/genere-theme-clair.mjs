#!/usr/bin/env node
// Génère theme-clair.css à partir des feuilles du studio : reprend toutes les déclarations de couleur (littérales,
// var(), transparent, none...) pour préserver la cascade, et transforme les littérales comme invert(.96) hue-rotate(180deg).
// Les règles déjà écrites pour le clair (html[data-theme=light] ...) sont reprises telles quelles.
// À relancer après toute modification de couleur : node outils/genere-theme-clair.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dossier = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const FEUILLES = ['style.css', 'studio-verre.css', 'hooks.css', 'cycle.css', 'refonte.css'].filter(f => fs.existsSync(path.join(dossier, f)));
const CLAIR = 'html[data-theme=light]';
const CLAIR_SCOPE = `${CLAIR}[data-theme]`;

const PROPS = /^(color|background(-color|-image)?|border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-color)?|outline(-color)?|fill|stroke|accent-color|caret-color|text-decoration(-color)?|column-rule(-color)?|scrollbar-color|-webkit-text-fill-color|-webkit-text-stroke(-color)?|--[\w-]+)$/;
const COULEUR = /#[0-9a-f]{3,8}\b|\brgba?\([^)]*\)|\b(?:white|black)\b/gi;

function borne(v) { return Math.max(0, Math.min(1, v)); }
function transforme([r, g, b]) {
  const i = c => c * -0.92 + 0.96;
  const [R, G, B] = [i(r), i(g), i(b)];
  return [borne(-0.574 * R + 1.43 * G + 0.144 * B), borne(0.426 * R + 0.43 * G + 0.144 * B), borne(0.426 * R + 1.43 * G - 0.856 * B)];
}
function hexa(rgb, a) {
  const h = v => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${rgb.map(h).join('')}${a < 1 ? h(a) : ''}`;
}
function litHexa(x) {
  let t = x.slice(1);
  if (t.length === 3 || t.length === 4) t = [...t].map(c => c + c).join('');
  if (t.length !== 6 && t.length !== 8) return null;
  return { rgb: [0, 2, 4].map(i => parseInt(t.slice(i, i + 2), 16) / 255), a: t.length === 8 ? parseInt(t.slice(6), 16) / 255 : 1 };
}
function litRgb(x) {
  const n = x.match(/[\d.]+%?/g)?.map(v => (v.endsWith('%') ? parseFloat(v) * 2.55 : parseFloat(v)));
  if (!n || n.length < 3) return null;
  return { rgb: n.slice(0, 3).map(v => v / 255), a: n[3] ?? 1 };
}
function convertit(x) {
  const l = x.toLowerCase();
  const c = l === 'white' ? { rgb: [1, 1, 1], a: 1 } : l === 'black' ? { rgb: [0, 0, 0], a: 1 } : l.startsWith('#') ? litHexa(l) : litRgb(l);
  return c ? hexa(transforme(c.rgb), c.a) : x;
}
// Les url() et les chaînes ne sont jamais touchées.
function valeurClaire(v) {
  return v.split(/(url\([^)]*\)|"[^"]*"|'[^']*')/).map((b, i) => (i % 2 ? b : b.replace(COULEUR, convertit))).join('');
}
function aCouleur(v) {
  return v.split(/url\([^)]*\)|"[^"]*"|'[^']*'/).some(b => { COULEUR.lastIndex = 0; return COULEUR.test(b); });
}

function analyse(src) {
  let i = 0;
  const bloc = () => {
    const items = [];
    while (i < src.length) {
      let tampon = '', prof = 0, q = null, fin = null;
      for (; i < src.length; i++) {
        const c = src[i];
        if (q) { tampon += c; if (c === '\\') tampon += src[++i]; else if (c === q) q = null; continue; }
        if (c === '/' && src[i + 1] === '*') { const f = src.indexOf('*/', i + 2); i = f < 0 ? src.length : f + 1; continue; }
        if (c === '"' || c === "'") { q = c; tampon += c; continue; }
        if (c === '(') prof++;
        if (c === ')') prof--;
        if (prof === 0 && (c === ';' || c === '{' || c === '}')) { fin = c; break; }
        tampon += c;
      }
      const t = tampon.trim();
      if (fin === '{') { i++; const enfants = bloc(); items.push({ prelude: t, enfants }); continue; }
      if (fin === ';') { i++; if (t) items.push({ decl: t }); continue; }
      if (fin === '}') { i++; if (t) items.push({ decl: t }); return items; }
      if (t) items.push({ decl: t });
      return items;
    }
    return items;
  };
  return bloc();
}

function decoupe(liste) {
  const parts = []; let cur = '', p = 0;
  for (const c of liste) {
    if ('([' .includes(c)) p++;
    if (')]'.includes(c)) p--;
    if (c === ',' && p === 0) { parts.push(cur.trim()); cur = ''; } else cur += c;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}
function prefixe(s) {
  if (s.startsWith(CLAIR)) return CLAIR_SCOPE + s.slice(CLAIR.length);
  if (/^(:root|html)$/.test(s)) return CLAIR;
  let m;
  if ((m = s.match(/^html\[data-theme(?:=dark)?\](.*)$/s))) return CLAIR_SCOPE + m[1];
  if ((m = s.match(/^(?:html|:root)(\s.*)$/s))) return CLAIR + m[1];
  return `${CLAIR} ${s}`;
}
function rend(items, haut, brut = false) {
  const sortie = [];
  for (const it of items) {
    if (it.decl) {
      const k = it.decl.indexOf(':');
      if (k < 0) continue;
      const prop = it.decl.slice(0, k).trim().toLowerCase();
      const val = it.decl.slice(k + 1).trim();
      if (!PROPS.test(prop)) continue;
      if (prop.startsWith('--') && !aCouleur(val) && !val.includes('var(')) continue;
      sortie.push(`${prop}:${brut ? val : valeurClaire(val)}`);
      continue;
    }
    const p = it.prelude;
    if (p.startsWith('@')) {
      if (!/^@(media|supports|container)/.test(p)) continue;
      const dedans = rend(it.enfants, haut, brut);
      if (dedans) sortie.push(`${p}{${dedans}}`);
      continue;
    }
    if (!haut) {
      const dedans = rend(it.enfants, false, brut);
      if (dedans) sortie.push(`${p}{${dedans}}`);
      continue;
    }
    const selecteurs = decoupe(p);
    const groupes = [[selecteurs.filter(s => !s.startsWith(CLAIR)), false], [selecteurs.filter(s => s.startsWith(CLAIR)), true]];
    for (const [liste, estClair] of groupes) {
      if (!liste.length) continue;
      const dedans = rend(it.enfants, false, estClair);
      if (dedans) sortie.push(`${liste.map(prefixe).join(',')}{${dedans}}`);
    }
  }
  return sortie.join(haut ? '\n' : ';');
}

const FINITIONS = `
/* Finitions écrites à la main : surfaces blanches sur fond crème, palette sans bleu. */
html[data-theme=light][data-theme][data-theme]{--texte:#1c1a18;--doux:#1c1a18b8;--pale:#1c1a1880;--filet:#1c1a1816;--filetFort:#1c1a1829;--verre:#fff;--verreFort:#1c1a180d;--line:#1c1a1816;--line2:#1c1a1829;--bg2:#fff;--bg3:#1c1a180a;--hover:#1c1a180d;--plein:#1c1a18;--surPlein:#fff;--pop:#fff;--saisie:#fff;--fond:#f7f5f1;--bg:#f7f5f1;--txt:#1c1a18;--txt2:#1c1a18b8;--dim:#1c1a1880;--muted:#1c1a1899;--accent:#1c1a18;background:#f7f5f1}
html[data-theme=light][data-theme][data-theme] body{background:#f7f5f1}
html[data-theme=light][data-theme][data-theme] .stats{--s-instagram:#c96f3e;--s-facebook:#8d7660;--s-tiktok:#2f9a80;--s-youtube:#c98f1e;--neutre:#1c1a1840}
html[data-theme=light][data-theme][data-theme] aside{background:#fff;border-right:1px solid var(--filet)}
html[data-theme=light][data-theme][data-theme] .vd th{background:#fff}
html[data-theme=light][data-theme][data-theme] .reel.alerte .reelStatut{color:#b3261e}
html[data-theme=light][data-theme][data-theme]{--vert:#2f7d4f;--ambre:#a8761c;--corail:#c4503a;--sarcelle:#2f9a80;--sable:#8d7660}
html[data-theme=light][data-theme][data-theme] .tableau{background:#fff;border:1px solid var(--filet)}
html[data-theme=light][data-theme][data-theme] .vd tr.groupeLigne td{background:#1c1a1808}
html[data-theme=light][data-theme][data-theme] .vBanque{background:#1c1a1806;border:1px solid var(--filet)}
html[data-theme=light][data-theme][data-theme] .vd :is(input,select):not([type=checkbox]){background-color:#fff;border:1px solid var(--filetFort);color:var(--texte)}
html[data-theme=light][data-theme][data-theme] .vd .etiq[style*="--pil"]{color:color-mix(in srgb,var(--pil) 58%,#1c1a18)!important;background:color-mix(in srgb,var(--pil) 15%,#fff)}
html[data-theme=light][data-theme][data-theme] .suiviPanel{background:#fff;border:1px solid var(--filet)}
html[data-theme=light][data-theme][data-theme] :not(.accJour)>.suiviEtape{background:var(--verreFort);color:var(--texte)}
html[data-theme=light][data-theme][data-theme] .suiviTitre{background:none}
html[data-theme=light][data-theme][data-theme] .suiviReseau.suivi-programme{background:#d9a441;color:#1c1a18}
html[data-theme=light][data-theme][data-theme] :is(.settingsPopover,.plusPop,.clochePop,dialog),html[data-theme=light][data-theme][data-theme] .recorderPanel .settingsPopover{background:#fff;border:1px solid var(--filet);color:var(--texte);box-shadow:0 12px 40px #1c1a1826}
html[data-theme=light][data-theme][data-theme] .cycleBar{box-shadow:0 12px 0 var(--fond),0 -6px 18px #1c1a1812}
html[data-theme=light][data-theme][data-theme] .recorderPanel .transport{background:#fff;border-bottom:1px solid var(--filet)}
html[data-theme=light][data-theme][data-theme] .recorderPanel .transport select{background-color:#fff;border-color:var(--filetFort)}
html[data-theme=light][data-theme][data-theme] #stage{background:#f7f5f1}
html[data-theme=light][data-theme][data-theme] #cue,html[data-theme=light][data-theme][data-theme] #stage:fullscreen #cue{background:#fffffff2;border:1px solid var(--filet);box-shadow:0 8px 30px #1c1a1814}
html[data-theme=light][data-theme][data-theme] #cameraHint{background:none}
html[data-theme=light][data-theme][data-theme] #cameraHint strong{color:var(--texte)}
html[data-theme=light][data-theme][data-theme] #cameraHint button:not(.hintPrimary){background:#fff;border:1px solid var(--filetFort);color:var(--texte)}
`;

const corps = FEUILLES.map(f => `/* ${f} */\n${rend(analyse(fs.readFileSync(path.join(dossier, f), 'utf8')), true)}`).join('\n');
const entete = '/* Fichier généré par outils/genere-theme-clair.mjs : ne pas modifier à la main. */\n';
fs.writeFileSync(path.join(dossier, 'theme-clair.css'), entete + corps + '\n' + FINITIONS);
console.log(FEUILLES.join(', '), '->', 'theme-clair.css', fs.statSync(path.join(dossier, 'theme-clair.css')).size, 'octets');
