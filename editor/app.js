const $=id=>document.getElementById(id),video=$('video');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${(s%60).toFixed(3).padStart(6,'0')}`;
const short=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
let project,selectedKey,draft,selectedPlayback,currentFrame=0,previewing=false,busy=false,requestId=0;
const placement=()=>project?.placements.find(p=>p.key===selectedKey);
const asset=()=>project?.catalog.find(a=>a.src===draft?.src);
const dirty=()=>Boolean(placement()&&draft&&(draft.src!==placement().src||draft.startFrame!==placement().startFrame));
const notice=(text='',error=false)=>{$('notice').textContent=text;$('notice').className=error?'error':'';};
async function api(route,body){const response=await fetch('/api/'+route,body?{method:'POST',headers:{'Content-Type':'application/json','X-Editor-Token':project.token},body:JSON.stringify(body)}:undefined);const data=await response.json();if(!response.ok)throw new Error(data.error||'Unable to connect to the project.');return data;}
function ingest(data){project={...data,token:data.token||project?.token};$('undo').disabled=!data.canUndo||busy;renderPlacements();}
function renderPlacements(){
  const query=$('search').value.toLowerCase(),filter=$('filter').value;
  const items=project.placements.filter(p=>(filter==='all'||(filter==='edited'?p.edited:project.catalog.find(a=>a.src===p.src)?.kind===filter))&&`${p.scene} ${p.title} ${p.src}`.toLowerCase().includes(query));
  const unique=new Set(project.placements.map(p=>p.src)).size;
  $('counts').textContent=`${project.placements.length} placements · ${unique} used clips`;
  $('placements').innerHTML=items.map(p=>`<button class="placement ${p.key===selectedKey?'active':''}" data-key="${escape(p.key)}" aria-current="${p.key===selectedKey?'true':'false'}"><img loading="lazy" src="/thumbnail/${p.assetId}?frame=${p.startFrame}" alt=""><span class="info"><strong>Scene ${String(p.scene).padStart(2,'0')} · ${p.track==='intro'?'Opening':'Clip '+(p.index+1)}${p.edited?'<span class="edited-dot">●</span>':''}</strong><small>${escape(p.src.split('/').pop())}</small><small>${(p.length/30).toFixed(2)}s in edit · Frame ${p.startFrame+1}</small></span></button>`).join('')||'<p class="empty">No matching used footage.</p>';
  document.querySelectorAll('[data-key]').forEach(button=>button.onclick=()=>selectPlacement(button.dataset.key));
}
function selectPlacement(key,force=false){
  if(busy&&!force)return;
  if(!force&&dirty()&&!confirm('Discard the unsaved selection for this placement?'))return;
  selectedKey=key;const p=placement();draft={src:p.src,startFrame:p.startFrame};notice();renderPlacements();
  $('placement-label').textContent=`VIDEO 1 / SCENE ${String(p.scene).padStart(2,'0')} / ${p.track==='intro'?'OPENING FOOTAGE':'FOOTAGE '+(p.index+1)}`;
  $('scene-title').textContent=p.title;$('scene-detail').textContent=`At ${time(p.fromFrame/30)} in the film · ${(p.length/30).toFixed(2)}-second slot`;
  $('slot-duration').textContent=(p.length/30).toFixed(2)+' seconds';loadSource();
}
function loadSource(){
  video.pause();previewing=false;video.playbackRate=1;const a=asset();currentFrame=draft.startFrame;
  video.src='/media/'+a.id;video.load();
  $('source-name').textContent=a.name;$('source-kind').textContent=a.kind==='generated'?'Higgsfield generation':'Supplied footage';
  $('source-format').textContent=`${a.width} × ${a.height} · ${a.fps.toFixed(2).replace('.00','')} fps`;
  $('source-end').textContent=time(a.duration);$('scrub').max=String(a.frames-1);$('start-frame').max=String(a.frames);
  $('filmstrip').innerHTML=Array.from({length:8},(_,i)=>{const frame=Math.floor((a.frames-1)*i/7);return `<button data-frame="${frame}" aria-label="Seek source frame ${frame+1}"><img loading="lazy" src="/thumbnail/${a.id}?frame=${frame}" alt="Frame ${frame+1}"><span>${short(frame/a.fps)}</span></button>`;}).join('');
  document.querySelectorAll('[data-frame]').forEach(button=>button.onclick=()=>seek(Number(button.dataset.frame)));
  renderTransport();updateSelection();
}
function seek(frame){const a=asset();if(!a)return;video.pause();previewing=false;video.playbackRate=1;currentFrame=Math.max(0,Math.min(a.frames-1,Math.round(frame)));if(video.readyState>=1)video.currentTime=Math.min((currentFrame+.1)/a.fps,a.duration-.001);renderTransport();}
function renderTransport(){const a=asset();if(!a)return;$('current-time').textContent=time(currentFrame/a.fps);$('current-frame').textContent=`Frame ${currentFrame+1} / ${a.frames}`;$('scrub').value=String(currentFrame);$('play').textContent=video.paused?'▶':'❚❚';$('play').setAttribute('aria-label',video.paused?'Play source':'Pause source');}
function updateCurrent(){const a=asset();if(!a)return;currentFrame=Math.max(0,Math.min(a.frames-1,Math.floor(video.currentTime*a.fps+.001)));if(previewing&&selectedPlayback&&video.currentTime>=selectedPlayback.endSeconds){video.pause();previewing=false;}renderTransport();}
async function updateSelection(){
  const a=asset(),p=placement();$('start-frame').value=String(draft.startFrame+1);$('start-time').textContent=time(draft.startFrame/a.fps);
  $('saved-state').textContent=dirty()?'Unsaved selection':p.edited?'Saved selection':'Original selection';$('saved-state').className='pill'+(dirty()?' dirty':'');
  $('apply').disabled=true;$('preview').disabled=true;$('reset').disabled=busy||(!p.edited&&!dirty());$('selection-error').textContent='';selectedPlayback=null;
  const id=++requestId;
  try {
    const data=await api('preview',{key:selectedKey,...draft});if(id!==requestId)return;selectedPlayback=data.playback;
    $('playback-rate').textContent=data.playback.rate.toFixed(2)+'×';$('selection-end').textContent=time(data.playback.endSeconds);
    $('speed-note').textContent=data.playback.rate<.99?`Plays in slow motion at ${data.playback.rate.toFixed(2)}× to fill this scene. Choose an earlier frame or a longer clip for more motion.`:'Plays at original speed. Scene timing stays fixed.';
    $('selected-range').style.marginLeft=(data.playback.startSeconds/a.duration*100)+'%';$('selected-range').style.width=((data.playback.endSeconds-data.playback.startSeconds)/a.duration*100)+'%';
    $('range-caption').textContent=`Selected ${time(data.playback.startSeconds)}–${time(data.playback.endSeconds)}`;
    $('apply').disabled=busy||!dirty();$('preview').disabled=busy;
  }catch(error){if(id!==requestId)return;$('selection-error').textContent=error.message;$('playback-rate').textContent='—';$('selection-end').textContent='—';$('selected-range').style.width='0';}
}
function mark(){video.pause();previewing=false;draft.startFrame=currentFrame;updateSelection();}
async function save(action){
  if(busy)return;busy=true;$('apply').disabled=true;$('reset').disabled=true;$('undo').disabled=true;
  try {const data=await api(action,{key:selectedKey,...draft,revision:project.revision});ingest(data);selectPlacement(selectedKey,true);notice(action==='undo'?'Last change undone. Remotion has been updated.':action==='reset'?'Original selection restored. Remotion has been updated.':'Saved to the project. Remotion updates automatically; render again to refresh the MP4.');}
  catch(error){notice(error.message,true);}
  finally{busy=false;$('undo').disabled=!project.canUndo;updateSelection();}
}
function renderLibrary(){const query=$('library-search').value.toLowerCase(),used=$('library-scope').value==='used';
  const items=project.catalog.filter(a=>(!used||a.uses>0)&&a.name.toLowerCase().includes(query));
  $('library').innerHTML=items.map(a=>`<button class="library-card ${a.src===draft.src?'selected':''}" data-asset="${a.id}"><img loading="lazy" src="/thumbnail/${a.id}?frame=0" alt=""><strong>${escape(a.name)}</strong><small>${a.duration.toFixed(2)}s · ${a.kind} · ${a.uses?a.uses+' placement'+(a.uses===1?'':'s'):'Not currently used'}</small></button>`).join('')||'<p class="empty">No matching clips.</p>';
  document.querySelectorAll('[data-asset]').forEach(button=>button.onclick=()=>{draft={src:project.catalog.find(a=>a.id===button.dataset.asset).src,startFrame:0};$('swap-dialog').close();loadSource();});
}
video.addEventListener('loadedmetadata',()=>seek(draft.startFrame));
video.addEventListener('timeupdate',updateCurrent);video.addEventListener('seeked',updateCurrent);
video.addEventListener('play',()=>{renderTransport();const tick=()=>{if(video.paused)return;updateCurrent();requestAnimationFrame(tick);};requestAnimationFrame(tick);});
video.addEventListener('pause',renderTransport);
video.addEventListener('error',()=>notice('This source could not be played. Choose another clip or check that the original media is available.',true));
$('play').onclick=()=>{if(video.paused){previewing=false;video.playbackRate=1;video.play().catch(error=>notice(error.message,true));}else video.pause();};
for(const [id,delta] of [['back10',-10],['back1',-1],['next1',1],['next10',10]])$(id).onclick=()=>seek(currentFrame+delta);
$('scrub').oninput=()=>seek(Number($('scrub').value));$('mark').onclick=mark;
$('start-frame').onchange=()=>{const n=Number($('start-frame').value);if(!Number.isInteger(n)||n<1){$('start-frame').value=String(draft.startFrame+1);return;}draft.startFrame=n-1;updateSelection();};
$('jump-start').onclick=()=>seek(draft.startFrame);
$('preview').onclick=async()=>{if(!selectedPlayback)return;video.pause();video.currentTime=selectedPlayback.startSeconds;video.playbackRate=selectedPlayback.rate;previewing=true;await video.play().catch(error=>notice(error.message,true));};
$('apply').onclick=()=>save('apply');$('undo').onclick=()=>{if(dirty()&&!confirm('Discard your unsaved selection and undo the last saved change?'))return;save('undo');};
$('reset').onclick=()=>{draft={src:placement().original.src,startFrame:0};loadSource();if(placement().edited)save('reset');};
$('search').oninput=renderPlacements;$('filter').onchange=renderPlacements;
$('swap').onclick=()=>{video.pause();$('library-search').value='';renderLibrary();$('swap-dialog').showModal();};$('close-swap').onclick=()=>$('swap-dialog').close();
$('library-search').oninput=renderLibrary;$('library-scope').onchange=renderLibrary;
window.addEventListener('keydown',event=>{if(!project||$('swap-dialog').open||/INPUT|SELECT|TEXTAREA/.test(event.target.tagName))return;if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();seek(currentFrame+(event.key==='ArrowLeft'?-1:1)*(event.shiftKey?10:1));}if(event.key.toLowerCase()==='i'){event.preventDefault();mark();}});
window.addEventListener('beforeunload',event=>{if(dirty()){event.preventDefault();event.returnValue='';}});
try{ingest(await api('project'));selectPlacement(project.placements[0].key,true);}catch(error){notice(error.message,true);$('counts').textContent='Project unavailable';}
