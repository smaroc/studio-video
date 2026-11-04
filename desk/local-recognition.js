// SpeechRecognition-compatible recognizer backed by the local whisper server (/api/transcribe).
// Listens to the microphone chosen in the studio, sends the last seconds of audio, emits each transcript as a new result.
// Fenêtre courte et envoi en continu : une requête repart dès que la précédente revient (whisper ~0,3 s avec -ac 768).
const RATE=16000,WINDOW=3,STEP=40,MIN_FRESH=.12;

export function wav(samples){
 const buffer=new ArrayBuffer(44+samples.length*2),v=new DataView(buffer);
 const text=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
 text(0,'RIFF');v.setUint32(4,36+samples.length*2,true);text(8,'WAVE');text(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
 v.setUint32(24,RATE,true);v.setUint32(28,RATE*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++)v.setInt16(44+i*2,Math.max(-1,Math.min(1,samples[i]))*0x7fff,true);
 return new Blob([buffer],{type:'audio/wav'});
}
const rms=a=>{let s=0;for(const x of a)s+=x*x;return Math.sqrt(s/(a.length||1));};

export function localRecognition(getAudio){
 return class LocalRecognition{
  constructor(){this.windowed=true;this.alive=false;}
  async start(){
   this.alive=true;
   try{
    const health=await fetch('/api/transcribe');if(!health.ok)throw Object.assign(new Error(),{code:'local-down'});
    const source=await getAudio();const tracks=source.getAudioTracks();this.source=source;if(!tracks.length)throw Object.assign(new Error(),{code:'audio-capture'});
    if(!this.alive)return;
    const ctx=this.ctx=new AudioContext(),ratio=ctx.sampleRate/RATE;
    const node=ctx.createMediaStreamSource(new MediaStream(tracks)),proc=ctx.createScriptProcessor(4096,1,1),mute=ctx.createGain();mute.gain.value=0;
    let ring=new Float32Array(0),fresh=0,busy=false,failures=0,index=0,pos=0;
    proc.onaudioprocess=e=>{
     const input=e.inputBuffer.getChannelData(0),out=[];
     for(;pos<input.length;pos+=ratio)out.push(input[Math.floor(pos)]);
     pos-=input.length;
     const next=new Float32Array(Math.min(RATE*WINDOW,ring.length+out.length));
     const keep=next.length-out.length;next.set(ring.subarray(ring.length-keep));next.set(out.slice(-next.length),keep);ring=next;fresh+=out.length;
    };
    node.connect(proc);proc.connect(mute);mute.connect(ctx.destination);
    this.track=tracks[0];this.track.addEventListener('ended',this.onTrackEnd=()=>this.fail('audio-capture'));
    this.timer=setInterval(async()=>{
     if(busy||!this.alive||fresh<RATE*MIN_FRESH)return;
     const chunk=ring.slice();fresh=0;
     if(rms(chunk.subarray(-RATE*.6))<.004)return;
     busy=true;
     try{
      const r=await fetch('/api/transcribe',{method:'POST',body:wav(chunk),signal:AbortSignal.timeout(4000)});
      if(!r.ok)throw new Error(r.status);
      const {text}=await r.json();failures=0;
      if(this.alive&&text){const results=[];results[index]=[{transcript:text}];this.onresult?.({resultIndex:index++,results});}
     }catch{if(++failures>=20)this.fail('local-down');}
     finally{busy=false;}
    },STEP);
    this.onstart?.();
   }catch(e){this.fail(e.code||(e.name==='NotAllowedError'?'not-allowed':'audio-capture'));}
  }
  fail(code){if(!this.alive)return;this.onerror?.({error:code});this.abort();}
  abort(){
   if(!this.alive)return;this.alive=false;clearInterval(this.timer);
   this.track?.removeEventListener('ended',this.onTrackEnd);this.ctx?.close().catch(()=>{});if(this.source?.owned)this.source.getTracks().forEach(t=>t.stop());
   this.onend?.();
  }
 };
}
