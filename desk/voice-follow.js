import {config} from './config.js';
// Pure alignment: conservative local matching, never search the entire script.
export function words(text){return (text.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().match(/[a-z0-9]+/g)||[]);}
// Transcription tolerance: same word, shared prefix (plural, conjugation) or one typo.
function close(a,b){
 if(a===b)return true;if(a.length<4||b.length<4)return false;
 if(a.startsWith(b)||b.startsWith(a))return true;
 if(Math.abs(a.length-b.length)>1)return false;
 let i=0,j=0,edits=0;
 while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++edits>1)return false;if(a.length>b.length)i++;else if(b.length>a.length)j++;else{i++;j++;}}
 return edits+(a.length-i)+(b.length-j)<=1;
}
export function locate(script,transcript,anchor,cursor){
 const all=words(transcript).slice(-12);if(!all.length)return cursor;
 let best=cursor,bestScore=-Infinity;
 const start=Math.max(0,anchor-2),end=Math.min(script.length,cursor+30);
 // The last interim words are often wrong: also try ending the match one or two words earlier.
 for(let tail=0;tail<Math.min(3,all.length);tail++){
  const heard=all.slice(0,all.length-tail);
  for(let i=start;i<end;i++){
   if(!close(script[i],heard.at(-1)))continue;
   let a=i,b=heard.length-1,matches=0,misses=0;
   while(a>=start&&b>=0){
    if(close(script[a],heard[b])){matches++;a--;b--;}
    else if(b>0&&close(script[a],heard[b-1])){b--;misses++;}
    else if(a>start&&close(script[a-1],heard[b])){a--;misses++;}
    else break;
    if(misses>2)break;
   }
   const next=i+1;
   if(next<cursor||misses>matches)continue;
   const ok=matches>=3||(matches===2&&next-cursor<=8)||(matches===1&&i-cursor<=1&&(script[i].length>=4||heard.length===1));
   if(!ok)continue;
   const score=matches*5-misses*3-tail*4-Math.abs(next-cursor)*.12;
   if(score>bestScore){best=next;bestScore=score;}
  }
 }
 return best;
}

export function createVoiceFollow({text,box,mode,info,onScroll,onPause,lines=()=>2,Recognition=window.SpeechRecognition||window.webkitSpeechRecognition}){
 let tokens=[],nodes=[],sentences=[],sentenceOf=[],cursor=0,recognition=null,wanted=false,retry=null,watchdog=null,failures=0,previous='';
 const say=s=>info.textContent=s;
 let browseUntil=0,anim=0,snap=0;
 const monter=top=>{cancelAnimationFrame(anim);clearTimeout(snap);const from=box.scrollTop,t0=performance.now();const step=now=>{const k=Math.min(1,(now-t0)/300),e=1-(1-k)**3;box.scrollTop=from+(top-from)*e;if(k<1)anim=requestAnimationFrame(step);};anim=requestAnimationFrame(step);snap=setTimeout(()=>{cancelAnimationFrame(anim);box.scrollTop=top;},320);};box.addEventListener('wheel',()=>{if(box.classList.contains('list'))browseUntil=performance.now()+2500;},{passive:true});
 const active=()=>mode.value==='voice';
 // Sentences on screen: the one holding the next word to say, then as many following ones as the prompter setting asks.
 function position(){
  nodes.forEach((n,i)=>{n.classList.toggle('spoken',i<cursor-1);n.classList.toggle('currentWord',i===cursor-1);});
  const current=sentenceOf[Math.min(cursor,tokens.length-1)]??0;
  const shown=Math.max(1,lines());sentences.forEach((n,i)=>{n.classList.toggle('currentSentence',i===current);n.classList.toggle('pastSentence',i<current);n.classList.toggle('nextSentence',i>current&&i<current+shown);});
  // Colonne : la phrase à dire monte et se cale en haut (300 ms), sauf si on vient de parcourir le script à la molette.
  if(box.classList.contains('list')&&sentences[current]&&performance.now()>browseUntil){const top=Math.max(0,sentences[current].offsetTop-16);if(Math.abs(box.scrollTop-top)>2)monter(top);}
  onScroll?.(current);
 }
 function goto(word){cursor=Math.max(0,Math.min(tokens.length,word));position();}
 function sentenceStart(index){return sentenceOf.indexOf(index);}
 function jump(step){
  const resume=wanted;stop();
  const current=sentenceOf[Math.min(cursor,tokens.length-1)]??0;
  const target=Math.max(0,Math.min(sentences.length-1,current+step));
  goto(sentenceStart(target));if(resume)start();return cursor;
 }
 function stop(message='Suivi vocal en pause · démarre avec la prise'){
  wanted=false;clearTimeout(retry);clearTimeout(watchdog);
  const r=recognition;recognition=null;if(r){r.onend=null;r.onresult=null;try{r.abort();}catch{}}
  if(active())say(message);
 }
 function rebuild(value){
  if(value===previous)return;previous=value;stop();onPause();cursor=0;tokens=[];nodes=[];sentences=[];sentenceOf=[];text.replaceChildren();
  if(!value){text.textContent='Ton script s’affichera ici.';return;}
  let sentence=null;
  const open=()=>{if(!sentence){sentence=document.createElement('span');sentence.className='sentence';sentences.push(sentence);text.append(sentence);}return sentence;};
  for(const part of value.split(/(\p{L}[\p{L}\p{M}\p{N}]*|\p{N}+)/u)){
   const normalized=words(part);
   if(normalized.length){const span=document.createElement('span');span.textContent=part;span.dataset.word=nodes.length;span.title='Reprendre ici';span.onclick=()=>{const resume=wanted;stop();goto(Number(span.dataset.word));if(resume)start();};tokens.push(normalized[0]);nodes.push(span);open().append(span);sentenceOf.push(sentences.length-1);}
   else if(/[.!?…]|\n/.test(part)){const end=part.replace(/\s+$/,'');if(end.trim())open().append(document.createTextNode(sentence?end:end.trimStart()));sentence=null;}
   else if(sentence||part.trim())open().append(document.createTextNode(sentence?part:part.trimStart()));
  }
  position();
 }
 function start(){
  if(!active())return;
  if(!Recognition){say('Suivi vocal indisponible dans ce navigateur. Choisis Défilement régulier.');onPause();return;}
  if(!tokens.length){say('Ajoute un script avant de lancer le suivi vocal.');onPause();return;}
  if(wanted)return;wanted=true;failures=0;listen();
 }
 function listen(){
  if(!wanted)return;
  const r=new Recognition();recognition=r;r.lang=config.langue==='fr'?'fr-FR':config.langue;r.continuous=true;r.interimResults=true;
  const anchors=new Map();let accepted=false;
  if(!failures)say('Connexion au suivi vocal…');
  watchdog=setTimeout(()=>{if(wanted){stop('Reconnaissance sans réponse. Vérifie l’autorisation ou utilise le défilement régulier.');onPause();}},12000);
  r.onstart=()=>{clearTimeout(watchdog);if(!cursor)say(r.windowed?'À l’écoute · whisper local':'À l’écoute · reconnaissance du navigateur');};
  r.onresult=e=>{
   if(!wanted||recognition!==r)return;
   for(let i=e.resultIndex;i<e.results.length;i++){
    if(!anchors.has(i))anchors.set(i,r.windowed?Math.max(0,cursor-8):cursor);
    const next=locate(tokens,e.results[i][0].transcript,anchors.get(i),cursor);
    if(next>cursor){cursor=next;accepted=true;position();say(`Suivi vocal · ${cursor} / ${tokens.length} mots`);}
   }
   if(cursor>=tokens.length){stop('Script terminé');onPause();}
  };
  r.onerror=e=>{
   if(e.error==='no-speech')return;
   if(e.error==='aborted'&&!wanted)return;
   const messages={'not-allowed':'Autorise le micro pour localhost dans ton navigateur.','service-not-allowed':'Reconnaissance vocale non autorisée par ce navigateur.','audio-capture':'Microphone indisponible pour le suivi vocal.','network':'Connexion au service vocal interrompue.','local-down':'Reconnaissance locale arrêtée. Lance portly start studio-whisper.'};
   if(e.error==='network'){say(messages.network+' Reconnexion…');return;}
   if(e.error==='aborted')return;
   stop(messages[e.error]||`Suivi vocal arrêté : ${e.error}`);onPause();
  };
  r.onend=()=>{clearTimeout(watchdog);if(!wanted||recognition!==r)return;failures=accepted?0:failures+1;if(failures>=30){stop('Écoute interrompue. Relance le prompteur ou utilise le défilement régulier.');onPause();return;}retry=setTimeout(listen,failures>3?600:120);};
  try{r.start();}catch{stop('Impossible de lancer la reconnaissance. Relance depuis le bouton lecture.');onPause();}
 }
 function reset(){const resume=wanted;stop();cursor=0;position();if(resume)start();}
 mode.onchange=()=>{stop();text.classList.toggle('voiceMode',active());say(active()?(Recognition?'Prêt · lance la lecture pour suivre ta voix':'Reconnaissance indisponible dans ce navigateur'):'Défilement à vitesse constante');onPause();};
 window.addEventListener('pagehide',()=>stop());
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();onPause();}});
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{if(active())position();}).observe(box);
 text.classList.toggle('voiceMode',active());
 return {active,start,stop,rebuild,reset,position,goto,next:()=>jump(1),previous:()=>jump(-1),snapshot:()=>({word:cursor,listening:wanted})};
}
