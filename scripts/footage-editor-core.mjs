import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {getClipWindows, getClipPlayback, getTrackTiming, MIN_PLAYBACK_RATE, MEDIA_END_MARGIN} from '../src/video1/media-timing.ts';
const run = promisify(execFile);
const hash = value => createHash('sha256').update(value).digest('hex');
export class EditorError extends Error {constructor(message, status=400) {super(message); this.status=status;}}

export async function readScenes(root) {
  const raw = await fs.readFile(path.join(root, 'src/video1/scene-data.ts'), 'utf8');
  return JSON.parse(raw.slice(raw.indexOf('=')+1).trim().replace(/;$/, ''));
}

export async function buildCatalog(root) {
  const cachePath = path.join(root, 'work/footage-editor/catalog.json');
  const cached = JSON.parse(await fs.readFile(cachePath, 'utf8').catch(()=>'[]'));
  const assets = [];
  for (const folder of ['footages','generated']) {
    for (const name of (await fs.readdir(path.join(root, 'public/video1', folder))).filter(x=>/\.mp4$/i.test(x)).sort()) {
      const src = `video1/${folder}/${name}`, full = path.join(root, 'public', src), stat = await fs.stat(full);
      let asset = cached.find(a=>a.src===src && a.bytes===stat.size && a.mtime===stat.mtimeMs);
      if (!asset) {
        const {stdout} = await run('ffprobe', ['-v','error','-select_streams','v:0','-show_entries','stream=duration,r_frame_rate,avg_frame_rate,nb_frames,width,height','-of','json', full]);
        const v = JSON.parse(stdout).streams[0];
        const ratio = (v.avg_frame_rate && v.avg_frame_rate!=='0/0' ? v.avg_frame_rate : v.r_frame_rate).split('/').map(Number);
        const fps = ratio[0]/ratio[1], duration = Number(v.duration);
        if (!Number.isFinite(fps) || !Number.isFinite(duration)) throw new Error(`Cannot read video timing: ${name}`);
        asset = {id:hash(src).slice(0,16), src, name, kind:folder==='generated'?'generated':'supplied', fps, duration, frames:Number(v.nb_frames)||Math.floor(duration*fps), width:v.width, height:v.height, bytes:stat.size, mtime:stat.mtimeMs};
      }
      assets.push(asset);
    }
  }
  await fs.mkdir(path.dirname(cachePath), {recursive:true});
  await fs.writeFile(cachePath, JSON.stringify(assets,null,2)+'\n');
  return assets;
}

export function makePlacements(scenes, edits, catalog) {
  const result=[];
  for(const scene of scenes) {
    const timing=getTrackTiming(scene.intro.length>0,scene.duration);
    for(const track of ['intro','main']) {
      const duration=track==='intro'?timing.introDuration:timing.mainDuration;
      for(const window of getClipWindows(scene[track], duration)) {
        const key=`${scene.n}:${track}:${window.index}`, edit=edits[key];
        const playback=getClipPlayback(window.clip,window.length,edit);
        const asset=catalog.find(a=>a.src===playback.src);
        if(!asset) throw new Error(`Missing source: ${playback.src}`);
        result.push({key,scene:scene.n,title:scene.title,track,index:window.index,fromFrame:scene.fromFrame+(track==='intro'?0:timing.mainStart)+window.from,length:window.length,original:window.clip,src:playback.src,assetId:asset.id,startFrame:edit?.startFrame??0,edited:Boolean(edit),playback});
      }
    }
  }
  return result;
}

export function validateSelection(placement, asset, startFrame) {
  if(!placement) throw new EditorError('This scene placement does not exist.');
  if(!asset) throw new EditorError('Choose a video from the project library.');
  if(!Number.isInteger(startFrame) || startFrame<0 || startFrame>=asset.frames) throw new EditorError('Start frame is outside this video.');
  const maxStartFrame=Math.max(0,Math.floor((asset.duration-MEDIA_END_MARGIN-placement.length/30*MIN_PLAYBACK_RATE)*asset.fps));
  if(startFrame>maxStartFrame) throw new EditorError(`Choose frame ${maxStartFrame+1} or earlier so enough motion remains.`);
  const edit={src:asset.src,startFrame,sourceFps:asset.fps,sourceDuration:asset.duration,kind:asset.kind};
  const originalSelection=asset.src===placement.original.src && startFrame===0;
  const playback=getClipPlayback(placement.original,placement.length,originalSelection?undefined:edit);
  return {edit,playback,maxStartFrame};
}

export class FootageStore {
  constructor({root,scenes,catalog,editsPath=path.join(root,'src/video1/footage-edits.json')}) {Object.assign(this,{root,scenes,catalog,editsPath});this.undoStack=[];this.queue=Promise.resolve();}
  async read() {const text=await fs.readFile(this.editsPath,'utf8');return {edits:JSON.parse(text),revision:hash(text)};}
  async snapshot() {const {edits,revision}=await this.read();const placements=makePlacements(this.scenes,edits,this.catalog);return {revision,placements,catalog:this.catalog.map(a=>({...a,uses:placements.filter(p=>p.src===a.src).length})),canUndo:this.undoStack.at(-1)?.afterRevision===revision};}
  async preview({key,src,startFrame}) {const snapshot=await this.snapshot();return validateSelection(snapshot.placements.find(p=>p.key===key),this.catalog.find(a=>a.src===src),startFrame);}
  mutate(action, input) {
    const operation=this.queue.then(async()=>{
      const before=await this.read();
      if(input.revision!==before.revision) throw new EditorError('The project changed in another window. Reload before applying this selection.',409);
      let next={...before.edits};
      if(action==='undo') {
        const last=this.undoStack.at(-1);
        if(!last || last.afterRevision!==before.revision) throw new EditorError('No change is available to undo.',409);
        next=last.edits;
      } else {
        const placement=makePlacements(this.scenes,before.edits,this.catalog).find(p=>p.key===input.key);
        if(!placement) throw new EditorError('This scene placement does not exist.');
        if(action==='reset') delete next[input.key];
        else {
          const {edit}=validateSelection(placement,this.catalog.find(a=>a.src===input.src),input.startFrame);
          if(edit.src===placement.original.src && edit.startFrame===0) delete next[input.key]; else next[input.key]=edit;
        }
      }
      const history=path.join(this.root,'work/footage-editor/history');await fs.mkdir(history,{recursive:true});
      await fs.writeFile(path.join(history,`${Date.now()}-${before.revision.slice(0,12)}.json`),JSON.stringify(before.edits,null,2)+'\n');
      const text=JSON.stringify(next,null,2)+'\n';
      const temporary=this.editsPath+'.tmp';await fs.writeFile(temporary,text);await fs.rename(temporary,this.editsPath);
      if(action==='undo') this.undoStack.pop();else this.undoStack.push({edits:before.edits,afterRevision:hash(text)});
      return this.snapshot();
    });
    this.queue=operation.catch(()=>{});
    return operation;
  }
}
