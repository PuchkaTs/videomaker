import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {FootageStore,makePlacements,validateSelection} from './footage-editor-core.mjs';
import {getClipPlayback,getClipWindows} from '../src/video1/media-timing.ts';
import {getExpectedMediaFrameUncorrected} from '../node_modules/remotion/dist/cjs/video/get-current-time.js';
const original={src:'video1/footages/a.mp4',seconds:3.328,kind:'supplied'};
const other={src:'video1/footages/b.mp4',seconds:6,kind:'supplied'};
const catalog=[{id:'a',src:original.src,duration:3.32,fps:25,frames:83,kind:'supplied'},{id:'b',src:other.src,duration:6,fps:24,frames:144,kind:'supplied'}];
const scenes=[{n:1,title:'Opening',fromFrame:0,duration:240,intro:[original],main:[]},{n:2,title:'Repeat',fromFrame:240,duration:300,intro:[original],main:[original,other]}];
async function fixture(t){const root=await fs.mkdtemp(path.join(os.tmpdir(),'videomaker-footage-'));await fs.mkdir(path.join(root,'src/video1'),{recursive:true});await fs.writeFile(path.join(root,'src/video1/footage-edits.json'),'{}\n');t.after(()=>fs.rm(root,{recursive:true,force:true}));return new FootageStore({root,scenes,catalog});}

test('source-frame trim reaches Remotion without being multiplied by playback speed',()=>{
  const p=makePlacements(scenes,{},catalog)[0];const {edit,playback}=validateSelection(p,catalog[0],10);
  assert.equal(playback.startSeconds,.4);assert.equal(playback.trimBefore,12);assert.ok(playback.rate<1);
  const first=getExpectedMediaFrameUncorrected({frame:playback.trimBefore,startFrom:playback.trimBefore,playbackRate:playback.rate})/30;
  assert.equal(first,.4);assert.ok(playback.endSeconds<=catalog[0].duration-.08+1e-9);
  assert.equal(getClipPlayback(original,90,edit).trimBefore,12);
});
test('24fps selection preserves a fractional master-frame offset',()=>{
  const p=makePlacements(scenes,{},catalog)[0];const {playback}=validateSelection(p,catalog[1],1);
  assert.equal(playback.trimBefore,1.25);assert.equal(playback.startSeconds,1/24);
});
test('swapping preserves every neighbouring cut and the narration window',()=>{
  const before=makePlacements(scenes,{},catalog);const edits={'2:main:0':{src:other.src,startFrame:20,sourceFps:24,sourceDuration:6,kind:'supplied'}};
  const after=makePlacements(scenes,edits,catalog);
  assert.deepEqual(after.map(p=>[p.key,p.fromFrame,p.length]),before.map(p=>[p.key,p.fromFrame,p.length]));
  assert.equal(getClipWindows([original,other],228).reduce((n,w)=>n+w.length,0),228);
});
test('bad frames and insufficient remaining footage are rejected',()=>{
  const p=makePlacements(scenes,{},catalog)[0];for(const frame of [-1,1.5,82,Infinity])assert.throws(()=>validateSelection(p,catalog[0],frame));
  assert.throws(()=>validateSelection(p,undefined,0));
});
test('saving affects only one placement, survives reload, and is undoable',async t=>{
  const store=await fixture(t),before=await store.snapshot();
  const after=await store.mutate('apply',{key:'1:intro:0',src:original.src,startFrame:10,revision:before.revision});
  assert.equal(after.placements[0].startFrame,10);assert.equal(after.placements[1].startFrame,0);
  const reloaded=new FootageStore({root:store.root,scenes,catalog});assert.equal((await reloaded.snapshot()).placements[0].startFrame,10);
  const undo=await store.mutate('undo',{revision:after.revision});assert.equal(undo.placements[0].startFrame,0);assert.deepEqual((await store.read()).edits,{});
});
test('stale or concurrent saves cannot overwrite newer choices',async t=>{
  const store=await fixture(t),before=await store.snapshot();const input={key:'1:intro:0',src:original.src,startFrame:10,revision:before.revision};
  const result=await Promise.allSettled([store.mutate('apply',input),store.mutate('apply',{...input,startFrame:11})]);
  assert.equal(result[0].status,'fulfilled');assert.equal(result[1].status,'rejected');assert.equal(result[1].reason.status,409);
  assert.equal((await store.snapshot()).placements[0].startFrame,10);
});
test('reset is scoped to its placement; unlisted paths cannot be saved',async t=>{
  const store=await fixture(t);let state=await store.snapshot();
  await assert.rejects(store.mutate('apply',{key:'1:intro:0',src:'../../private.mp4',startFrame:0,revision:state.revision}));
  for(const key of ['1:intro:0','2:intro:0'])state=await store.mutate('apply',{key,src:other.src,startFrame:12,revision:state.revision});
  state=await store.mutate('reset',{key:'1:intro:0',revision:state.revision});
  assert.equal(state.placements[0].src,original.src);assert.equal(state.placements[1].src,other.src);
});
