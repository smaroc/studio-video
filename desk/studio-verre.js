// Habillage du studio : identité lue dans la config, ambiance par écran, bandeau de production et vues Suivi et File.
// Lit les mêmes API que le reste du studio et rebranche les clics sur l'événement existant suivi:ouvrir.
import {config} from './config.js';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>new Intl.NumberFormat('fr-FR').format(Math.round(n||0));
const court=n=>new Intl.NumberFormat('fr-FR',{notation:'compact',maximumFractionDigits:1}).format(n||0);
const pl=(n,mot)=>`${n} ${mot}${Math.abs(n)>=2?'s':''}`;
const dateCourte=s=>s?new Date(s).toLocaleDateString('fr-FR',{day:'numeric',month:'short'}):'';

// Les piliers ne sont pas stockés : ils sont déduits du titre.
const PILIERS=(config.piliers||[]).map((p,i)=>({id:`p${i}`,nom:p.nom,c:p.couleur,re:new RegExp(p.motifs,'i')}));
const AUTRE={id:'autre',nom:'Contenu',c:'#d3c7b8'};
const pilier=t=>PILIERS.find(p=>p.re.test(t||''))||AUTRE;

// Identité du studio dans la page.
const initiale=(config.nom||'s')[0].toLowerCase();
document.title=config.nom;
$('#brandMark').textContent=`${initiale}.`;
$('#brandNom').textContent=config.nom;
if(config.plateforme!=='darwin')$('#openRecorder').style.display='none';

const ETAPES={'à tourner':{n:1,nom:'À tourner',cl:'sable'},'tourné, pas monté':{n:2,nom:'Au montage',cl:'corail'},'monté, pas programmé':{n:3,nom:'À relire',cl:'ambre'},'programmé':{n:4,nom:'Programmé',cl:'ambre'},'en partie publié':{n:4,nom:'En partie publié',cl:'ambre'},'échec':{n:4,nom:'Échec',cl:'corail'},'publié':{n:5,nom:'Publié',cl:'vert'}};
const etape=e=>ETAPES[e]||{n:1,nom:e||'Sans étape',cl:'sable'};
const ORDRE=['monté, pas programmé','tourné, pas monté','échec','en partie publié','programmé','à tourner','publié'];

const etat={recherche:'',filtre:'',groupe:true};
const data={suivi:[],stats:[],whisper:false,charge:0};
const ouvrir=(id,vue)=>document.dispatchEvent(new CustomEvent('suivi:ouvrir',{detail:{id,vue}}));
const json=u=>fetch(u).then(r=>r.ok?r.json():null).catch(()=>null);
const vuesDe=id=>data.stats.find(r=>r.projet===id)?.total?.vues??null;

async function charger(force){
 if(!force&&Date.now()-data.charge<30000)return;
 data.charge=Date.now();
 const [suivi,stats,whisper]=await Promise.all([json('/api/suivi'),json('/api/stats'),fetch('/api/transcribe').then(r=>r.ok).catch(()=>false)]);
 data.suivi=(suivi||[]).filter(v=>!v.archive);
 data.stats=stats?.reels||[];
 data.whisper=whisper;
}

function bandeau(){
 const c=e=>data.suivi.filter(v=>v.etape===e).length,total=data.suivi.length||1,auj=new Date();
 const mois=data.suivi.filter(v=>v.etape==='publié'&&v.date&&new Date(v.date).getMonth()===auj.getMonth()&&new Date(v.date).getFullYear()===auj.getFullYear()).length;
 const retours=data.suivi.reduce((n,v)=>n+(v.retours||0),0);
 const pct=n=>`${n/total*100}%`;
 $('#vdCompte').textContent=(c('tourné, pas monté')+c('monté, pas programmé'))||'';
 $('#vdBandeau').innerHTML=`<span class="titre">Production</span><div class="jauge" aria-hidden="true"><i class="j-pub" style="width:${pct(c('publié'))}"></i><i class="j-mont" style="width:${pct(c('monté, pas programmé'))}"></i><i class="j-tour" style="width:${pct(c('tourné, pas monté'))}"></i><i style="width:${pct(c('à tourner'))}"></i></div><div class="chiffres"><span>À tourner<b>${c('à tourner')}</b></span><span>Au montage<b>${c('tourné, pas monté')}</b></span><span>À relire<b>${c('monté, pas programmé')}</b></span><span>Retours ouverts<b>${retours}</b></span><span>Publiés ce mois<b>${mois}</b></span></div>`;
}

/* ---------- Suivi des vidéos ---------- */
const COCHE='<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2.5 6.4 2.4 2.4 4.6-5.3"/></svg>';
function caseReseau(v,pf){
 const r=(v.reseaux||[]).find(x=>x.plateforme===pf);
 if(!r)return `<div class="vReseau" aria-label="${pf} : rien de prévu"></div>`;
 const s=(r.statut||'').toLowerCase();
 if(r.erreur||/err|échec|echec/.test(s))return `<div class="vReseau err" title="${esc(r.erreur||s)}" aria-label="${pf} : erreur">!</div>`;
 if(/publi/.test(s))return `<a class="vReseau pub" ${r.url?`href="${esc(r.url)}" target="_blank" rel="noopener"`:''} aria-label="${pf} : publié">${COCHE}</a>`;
 return `<div class="vReseau prevu" title="${esc(s)}" aria-label="${pf} : ${esc(s)}">${COCHE}</div>`;
}
function vueVideos(){
 const m=$('.videos');
 m.innerHTML=`<div class="outilsSuivi"><input id="vdChSuivi" type="search" placeholder="Chercher une vidéo" aria-label="Chercher une vidéo" value="${esc(etat.recherche)}"><select id="vdFiltre" aria-label="Filtrer par étape"><option value="">Toutes les étapes</option>${ORDRE.filter(e=>data.suivi.some(v=>v.etape===e)).map(e=>`<option value="${esc(e)}" ${etat.filtre===e?'selected':''}>${etape(e).nom}</option>`).join('')}</select><button id="vdGroupe" class="pilule ${etat.groupe?'sel':''}">Grouper par étape</button><span class="muet" id="vdCompteSuivi"></span></div><div class="tableau"><table><thead><tr><th></th><th>Vidéo</th><th>Pilier</th><th>Étape</th><th>Prises</th><th>Retours</th><th>Version</th><th>Instagram</th><th>TikTok</th><th>YouTube</th><th>Vues</th><th>Lien</th></tr></thead><tbody id="vdCorps"></tbody></table></div>`;
 lignes();
 $('#vdChSuivi').oninput=e=>{etat.recherche=e.target.value;lignes();};
 $('#vdFiltre').onchange=e=>{etat.filtre=e.target.value;lignes();};
 $('#vdGroupe').onclick=e=>{etat.groupe=!etat.groupe;e.target.classList.toggle('sel',etat.groupe);lignes();};
 $('#vdCorps').onclick=e=>{const b=e.target.closest('[data-ouvrir]');if(b)ouvrir(b.dataset.ouvrir);};
}
function ligne(v){
 const e=etape(v.etape),p=pilier(v.titre),vues=vuesDe(v.id),url=(v.reseaux||[]).find(r=>r.plateforme==='instagram'&&r.url)?.url||(v.reseaux||[]).find(r=>r.url)?.url;
 const cover=v.etape==='à tourner'?'<div class="vignVide"></div>':`<img class="vign" loading="lazy" alt="" src="/api/programmation/${encodeURIComponent(v.id)}/cover.jpg" onerror="this.outerHTML='<div class=&quot;vignVide&quot;></div>'">`;
 return `<tr class="vLigne"><td>${cover}</td><td><button class="titreV" data-ouvrir="${esc(v.id)}" title="Ouvrir dans le studio">${esc(v.titre||'Sans titre')}</button></td><td class="teinte"><span class="etiq" style="--pil:${p.c};color:var(--pil)"><i></i>${p.nom}</span></td><td><span class="etiq ${e.cl}"><i></i>${e.nom}</span></td><td class="num">${v.prises||0}</td><td class="num teinte">${v.retours||0}</td><td class="num">${v.version?.n?`v${v.version.n}`:'<span class="muet">·</span>'}</td><td>${caseReseau(v,'instagram')}</td><td>${caseReseau(v,'tiktok')}</td><td>${caseReseau(v,'youtube')}</td><td class="num">${vues==null?'<span class="muet">·</span>':num(vues)}</td><td>${url?`<a class="ouvrirLien" href="${esc(url)}" target="_blank" rel="noopener">Voir ↗</a>`:'<span class="muet">·</span>'}</td></tr>`;
}
function lignes(){
 const q=etat.recherche.trim().toLowerCase();
 const l=data.suivi.filter(v=>(!etat.filtre||v.etape===etat.filtre)&&(!q||(v.titre||'').toLowerCase().includes(q)));
 $('#vdCompteSuivi').textContent=pl(l.length,'vidéo');
 const recent=(a,b)=>new Date(b.date||b.version?.date||b.dernierePrise||b.cree)-new Date(a.date||a.version?.date||a.dernierePrise||a.cree);
 const c=$('#vdCorps');
 if(!l.length){c.innerHTML='<tr><td colspan="12" class="muet">Aucune vidéo trouvée.</td></tr>';return;}
 if(!etat.groupe){c.innerHTML=[...l].sort(recent).map(ligne).join('');return;}
 const etapes=[...ORDRE,...new Set(l.map(v=>v.etape).filter(e=>!ORDRE.includes(e)))];
 c.innerHTML=etapes.map(e=>{const g=l.filter(v=>v.etape===e).sort(recent);if(!g.length)return '';const t=etape(e);return `<tr class="groupeLigne"><td colspan="12"><span class="etiq ${t.cl}"><i></i>${t.nom}</span>${pl(g.length,'vidéo')}</td></tr>${g.map(ligne).join('')}`;}).join('');
}

/* ---------- File de montage ---------- */
const activite=v=>new Date(v.version?.date||v.dernierePrise||v.cree||0);
function vueFile(){
 const m=$('.chantiers');
 const encours=data.suivi.filter(v=>['tourné, pas monté','monté, pas programmé'].includes(v.etape)).sort((a,b)=>(b.version?1:0)-(a.version?1:0)||activite(b)-activite(a));
 const table=encours.slice(0,3),ensuite=encours.slice(3,9);
 const pub=data.suivi.filter(v=>v.etape==='publié'&&v.date).sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,6);
 m.innerHTML=`<div class="fileGrille"><div><div class="titreSec">Sur la table de montage</div>${table.map(chantier).join('')||'<p class="vVide">Rien en cours de montage.</p>'}<div class="titreSec">Ensuite</div><div class="listeFile">${ensuite.map(v=>`<button class="rangee" data-ouvrir="${esc(v.id)}" data-vue-cible="review"><strong title="${esc(v.titre)}">${esc(v.titre||'Sans titre')}</strong><span class="etiq ${etape(v.etape).cl}"><i></i>${etape(v.etape).nom}</span><span>${esc(dateCourte(activite(v)))}</span></button>`).join('')||'<p class="vVide">Rien en attente.</p>'}</div></div><div><div class="titreSec">Postes</div><div class="poste"><i></i><b>Cette machine</b><span>studio en ligne · fichiers en local</span></div><div class="poste ${data.whisper?'':'eteint'}"><i></i><b>Whisper</b><span>${data.whisper?'transcription locale prête':'transcription arrêtée'}</span></div><div class="titreSec">Derniers publiés</div><div class="listeFile">${pub.map(v=>{const n=vuesDe(v.id);return `<button class="rangee" data-ouvrir="${esc(v.id)}" data-vue-cible="resultats"><strong title="${esc(v.titre)}">${esc(v.titre)}</strong><span>${n==null?esc(dateCourte(v.date)):`${court(n)} vues`}</span></button>`;}).join('')||'<p class="vVide">Rien de publié pour l\'instant.</p>'}</div></div></div>`;
 m.onclick=e=>{const b=e.target.closest('[data-ouvrir]');if(b)ouvrir(b.dataset.ouvrir,b.dataset.vueCible);};
}
function chantier(v){
 const e=etape(v.etape);
 const barres=[1,2,3,4,5].map(n=>`<i class="${n<e.n+1?'passe':n===e.n+1?'encours':''}"></i>`).join('');
 const note=v.etape==='monté, pas programmé'?(v.retours?`${pl(v.retours,'retour')} à traiter`:'Montage prêt, en attente de relecture'):`${pl(v.prises||0,'prise')} ${(v.prises||0)>=2?'tournées':'tournée'}, à monter`;
 return `<button class="verre chantier" data-ouvrir="${esc(v.id)}" data-vue-cible="review"><img alt="" src="/api/programmation/${encodeURIComponent(v.id)}/cover.jpg" onerror="this.outerHTML='<div class=&quot;place&quot;>${esc(initiale)}.</div>'"><div><h3>${esc(v.titre||'Sans titre')}</h3><div class="etiqs"><span class="etiq ${e.cl}"><i></i>${e.nom}</span>${v.version?.n?`<span class="etiq">v${v.version.n}</span>`:''}<span class="etiq">${pl(v.montages||0,'montage')}</span></div><div class="chNote"><b>${esc(dateCourte(activite(v)))}</b><span>${esc(note)}</span></div><div class="etapes" role="img" aria-label="Étape ${e.n+1} sur 5">${barres}</div></div></button>`;
}

/* ---------- Écran courant : ambiance, fil d'Ariane, vues à remplir ---------- */
const NOMS={accueil:'accueil',planning:'planning',stats:'statistiques',videos:'suivi des vidéos',chantiers:'file',script:'script',record:'tournage',review:'montage',publication:'publication',resultats:'résultats'};
const PLEINES=['accueil','planning','stats','videos','chantiers'];
let ecran=null;
async function majEcran(force){
 const vue=$('[data-view].active')?.dataset.view||'script';
 if(vue===ecran&&!force)return;
 ecran=vue;
 document.body.dataset.ecran=vue;
 const onglet=$('.workspaceTabs [data-view].active'),rail=onglet?.parentElement;
 if(rail&&rail.scrollWidth>rail.clientWidth)rail.scrollLeft=onglet.offsetLeft-(rail.clientWidth-onglet.offsetWidth)/2;
 $('.breadcrumb').innerHTML=`${esc(config.nom)} <span>/</span> <b>${NOMS[vue]||vue}</b>`;
 $('#vdBandeau').hidden=!PLEINES.includes(vue);
 if(!PLEINES.includes(vue))return;
 await charger(force);
 if(vue!==ecran)return;
 bandeau();
 if(vue==='videos')vueVideos();
 if(vue==='chantiers')vueFile();
}
new MutationObserver(()=>majEcran()).observe(document.querySelector('main'),{subtree:true,attributes:true,attributeFilter:['class'],attributeOldValue:false});
document.addEventListener('suivi:rafraichir',()=>{data.charge=0;});
majEcran(true);
charger().then(bandeau);
