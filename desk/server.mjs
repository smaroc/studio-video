import http from 'node:http';
import {readFile,writeFile,mkdir,readdir,stat,rename} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {config} from './config.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)), root=path.resolve(here,'..'), port=Number(process.env.PORT||4318);
await mkdir(path.join(root,'projects'),{recursive:true});
const valid=s=>/^[a-zA-Z0-9_-]{1,90}$/.test(s);
const send=(res,n,data)=>{res.writeHead(n,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
// Lecture vidéo avec Range, pour pouvoir avancer image par image.
async function lire(req,res,file){const s=await stat(file),r=req.headers.range;let start=0,end=s.size-1;if(r){const m=/^bytes=(\d+)-(\d*)$/.exec(r);if(!m)return send(res,416,{error:'Range'});start=+m[1];end=m[2]?Math.min(+m[2],end):end;if(start>end)return send(res,416,{error:'Range'});}res.writeHead(r?206:200,{'Content-Type':file.endsWith('.webm')?'video/webm':file.endsWith('.mov')?'video/quicktime':'video/mp4','Accept-Ranges':'bytes','Content-Length':end-start+1,'Cache-Control':'no-cache',...(r?{'Content-Range':`bytes ${start}-${end}/${s.size}`}:{})});createReadStream(file,{start,end}).pipe(res);}
(await import('./versions-api.mjs')).surveiller(root);
http.createServer(async(req,res)=>{try{
const u=new URL(req.url,'http://localhost'), p=u.pathname.split('/').filter(Boolean);
if(req.method!=='GET'&&req.headers.origin && ![`http://localhost:${port}`,`http://127.0.0.1:${port}`].includes(req.headers.origin))return send(res,403,{error:'Origine refusée'});
// Reconnaissance locale (whisper.cpp sur :4319): the browser sends a short 16 kHz WAV window.
if(u.pathname==='/api/transcribe'){const whisper=process.env.WHISPER_URL||'http://127.0.0.1:4319';if(req.method==='GET'){try{await fetch(whisper,{signal:AbortSignal.timeout(1500)});return send(res,200,{ok:true});}catch{return send(res,503,{error:'Reconnaissance locale arrêtée : lance whisper-server (voir README)'});}}
 if(req.method==='POST'){const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>4e6)return send(res,413,{error:'Audio trop long'});chunks.push(c);}const form=new FormData();form.append('file',new Blob([Buffer.concat(chunks)],{type:'audio/wav'}),'voix.wav');form.append('response_format','json');form.append('language',config.langue);form.append('temperature','0');try{const r=await fetch(whisper+'/inference',{method:'POST',body:form,signal:AbortSignal.timeout(8000)});const j=await r.json();return send(res,200,{text:(j.text||'').trim()});}catch{return send(res,503,{error:'Reconnaissance locale indisponible'});}}}
if(u.pathname==='/api/open-recorder'&&req.method==='POST'){if(process.platform!=='darwin')return send(res,501,{error:'Ouverture dans Safari réservée à macOS'});const {execFile}=await import('node:child_process');const {promisify}=await import('node:util');await promisify(execFile)('open',['-a','Safari',`http://localhost:${port}/?view=record`]);return send(res,200,{ok:true});}
// Statistiques des reels programmés depuis le studio (Zernio), lecture seule (?frais vide le cache).
if(p[0]==='api'&&p[1]==='stats'&&req.method==='GET'){const {stats,viderCache}=await import('./stats-api.mjs');if(u.searchParams.has('frais'))viderCache();try{return send(res,200,await stats(root));}catch(e){return send(res,502,{error:e.message});}}
// Confirmation d'une version relue, gardée dans versions-vues.json.
if(p[0]==='api'&&p[1]==='versions'&&valid(p[2]||'')&&p[3]==='confirmer'&&req.method==='POST'){let b='';for await(const c of req)b+=c;const {confirmer}=await import('./versions-api.mjs');return send(res,200,{confirme:await confirmer(root,p[2],JSON.parse(b||'{}').date)});}
if(u.pathname==='/api/suivi'&&req.method==='GET'){const m=await import('./planning-api.mjs');if(u.searchParams.has('frais'))m.viderCache();return send(res,200,await m.suivi(root));}
if(p[0]==='api'&&p[1]==='planning'&&req.method==='GET'){const {planning,viderCache}=await import('./planning-api.mjs');if(u.searchParams.has('frais'))viderCache();return send(res,200,await planning(root));}
if(p[0]==='api'&&p[1]==='projects'){
if(p.length===2&&req.method==='GET'){const names=await readdir(path.join(root,'projects'));const items=await Promise.all(names.filter(n=>n.endsWith('.json')).map(async n=>JSON.parse(await readFile(path.join(root,'projects',n),'utf8'))));return send(res,200,items);}
const archives=path.join(root,'projects','archives');
// Archives : le JSON part dans projects/archives/, le studio ne le charge plus. Les vidéos restent sur le disque.
if(p[2]==='archives'&&p.length===3&&req.method==='GET'){let names=[];try{names=await readdir(archives);}catch{}const items=await Promise.all(names.filter(n=>n.endsWith('.json')).map(async n=>{const d=JSON.parse(await readFile(path.join(archives,n),'utf8'));return {id:d.id,title:d.title,created:d.created,archivedAt:d.archivedAt,takes:d.takes?.length||0};}));return send(res,200,items.sort((a,b)=>(b.archivedAt||'').localeCompare(a.archivedAt||'')));}
if(!valid(p[2]||''))return send(res,400,{error:'Identifiant invalide'});
if(req.method==='POST'&&(p[3]==='archive'||p[3]==='restore')){const actif=path.join(root,'projects',p[2]+'.json'),range=path.join(archives,p[2]+'.json');const [de,vers]=p[3]==='archive'?[actif,range]:[range,actif];await mkdir(archives,{recursive:true});const d=JSON.parse(await readFile(de,'utf8'));if(p[3]==='archive')d.archivedAt=new Date().toISOString();else delete d.archivedAt;await writeFile(vers,JSON.stringify(d,null,2));const {unlink}=await import('node:fs/promises');await unlink(de);return send(res,200,p[3]==='archive'?{ok:true}:d);}
// Supprimer : le JSON part dans projects/corbeille/ (récupérable à la main), le projet disparaît du studio et des archives.
if(req.method==='DELETE'&&p.length===3){const corbeille=path.join(root,'projects','corbeille');await mkdir(corbeille,{recursive:true});const {rename}=await import('node:fs/promises');for(const de of [path.join(root,'projects',p[2]+'.json'),path.join(archives,p[2]+'.json')]){try{await rename(de,path.join(corbeille,p[2]+'.json'));return send(res,200,{ok:true});}catch{}}return send(res,404,{error:'Projet introuvable'});}
if(req.method==='PUT'){let chunks=[],size=0;for await(const c of req){size+=c.length;if(size>2e6)return send(res,413,{error:'Projet trop volumineux'});chunks.push(c);}const data=JSON.parse(Buffer.concat(chunks));if(data.id!==p[2])return send(res,400,{error:'Identifiant incohérent'});await writeFile(path.join(root,'projects',p[2]+'.json'),JSON.stringify(data,null,2));return send(res,200,{ok:true});}
}
// Captures annotées de l'onglet retours : PNG rangés par projet, chemin absolu renvoyé pour le prompt.
if(p[0]==='api'&&p[1]==='captures'&&valid(p[2]||'')&&/^[a-zA-Z0-9_-]{1,90}\.png$/.test(p[3]||'')){
const dir=path.join(root,'captures',p[2]),file=path.join(dir,p[3]);
if(req.method==='PUT'){let chunks=[],size=0;for await(const c of req){size+=c.length;if(size>15e6)return send(res,413,{error:'Capture trop lourde'});chunks.push(c);}await mkdir(dir,{recursive:true});await writeFile(file,Buffer.concat(chunks));return send(res,200,{url:u.pathname,path:file});}
if(req.method==='GET'){res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'no-cache'});createReadStream(file).on('error',()=>res.end()).pipe(res);return;}
}
// Programmation Zernio d'un montage (edits/<projet>/) : lecture de la fiche, puis upload et posts au clic de confirmation.
if(p[0]==='api'&&p[1]==='programmation'&&valid(p[2]||'')){const prog=await import('./programmer.mjs');
if(p[3]==='cover.jpg'&&p.length===4&&req.method==='GET'){res.writeHead(200,{'Content-Type':'image/jpeg','Cache-Control':'no-cache'});createReadStream(path.join(root,'edits',p[2],'cover.jpg')).on('error',()=>res.end()).pipe(res);return;}
if(p.length===3&&req.method==='GET'){try{return send(res,200,await prog.etat(root,p[2]));}catch(e){return send(res,404,{error:e.message});}}
if(p.length===3&&req.method==='POST'){let chunks=[],size=0;for await(const c of req){size+=c.length;if(size>1e5)return send(res,413,{error:'Requête trop longue'});chunks.push(c);}try{const r=await prog.programmer(root,p[2],JSON.parse(Buffer.concat(chunks)));(await import('./planning-api.mjs')).viderCache();return send(res,200,r);}catch(e){return send(res,e.code===409?409:422,{error:e.message});}}
}
// Montages livrés dans edits/<projet>/ (racine, renders/ et versions archivées versions/vN/) : proposés comme versions à relire.
if(p[0]==='api'&&p[1]==='montages'&&valid(p[2]||'')){
const base=path.join(root,'edits',p[2]),video=/^[a-zA-Z0-9_.-]+\.(mp4|mov|m4v|webm)$/i;
if(p.length===3&&req.method==='GET'){const out=[];let vs=[];try{vs=(await readdir(path.join(base,'versions'))).filter(d=>/^v\d+$/.test(d)).map(d=>`versions/${d}`);}catch{}for(const sous of ['','renders',...vs]){let names=[];try{names=await readdir(path.join(base,sous));}catch{}for(const n of names.filter(n=>video.test(n)&&!n.startsWith('.'))){const rel=sous?`${sous}/${n}`:n,s=await stat(path.join(base,rel));if(s.isFile()&&s.size>0)out.push({rel,name:n,mtime:s.mtimeMs,size:s.size,url:`/api/montages/${p[2]}/${rel}`,path:`edits/${p[2]}/${rel}`});}}return send(res,200,out.sort((a,b)=>a.mtime-b.mtime));}
const rel=p.slice(3);if(req.method==='GET'&&(rel.length===1||(rel.length===2&&rel[0]==='renders')||(rel.length===3&&rel[0]==='versions'&&/^v\d+$/.test(rel[1])))&&video.test(rel.at(-1)))return await lire(req,res,path.join(base,...rel));
}
if(p[0]==='api'&&p[1]==='media'&&valid(p[2]||'')&&/^[a-zA-Z0-9_.-]+\.(webm|mp4|mov|m4v)$/i.test(p[3]||'')){
const dir=path.join(root,'takes',p[2]),file=path.join(dir,p[3]);
if(req.method==='PUT'){await mkdir(dir,{recursive:true});const {createWriteStream}=await import('node:fs');const {pipeline}=await import('node:stream/promises');await pipeline(req,createWriteStream(file));if(file.endsWith('.webm')){const {execFile}=await import('node:child_process');const {promisify}=await import('node:util');const fixed=file+'.fixed.webm';await promisify(execFile)('ffmpeg',['-v','error','-y','-i',file,'-c','copy',fixed]);await rename(fixed,file);}let audio=null;try{const {verifierAudio}=await import('./audio-check.mjs');audio=await verifierAudio(file);}catch(e){console.error('Vérification audio impossible :',e.message);}return send(res,200,{url:u.pathname,audio});}
if(req.method==='GET')return await lire(req,res,file);
}
// Configuration publique pour l'interface : tout sauf les identifiants Zernio.
if(req.method==='GET'&&u.pathname==='/config.js'){const {zernio,...pub}=config;res.writeHead(200,{'Cache-Control':'no-cache','Content-Type':'text/javascript'});res.end(`export const config=${JSON.stringify({...pub,zernioConfigure:Object.values(zernio.comptes).some(Boolean),racine:root,plateforme:process.platform})};`);return;}
if(req.method==='GET'&&['/','/studio-verre.js','/studio-verre.css','/refonte.css','/theme-clair.css','/app.js','/voice-follow.js','/local-recognition.js','/planning.js','/stats.js','/monitor.js','/review.js','/suivi.js','/accueil.js','/resultats.js','/versions.js','/programmer.js','/style.css'].includes(u.pathname)){const f=u.pathname==='/'?'index.html':u.pathname.slice(1);res.writeHead(200,{'Cache-Control':'no-cache','Content-Type':f.endsWith('.html')?'text/html; charset=utf-8':f.endsWith('.js')?'text/javascript':'text/css'});res.end(await readFile(path.join(here,f)));return;}
send(res,404,{error:'Introuvable'});
}catch(e){send(res,500,{error:e.message});}}).listen(port,'127.0.0.1',()=>console.log(`Studio : http://localhost:${port}`));
