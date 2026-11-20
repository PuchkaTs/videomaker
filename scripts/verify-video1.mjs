import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {getTrackTiming, getClipWindows, getClipPlayback} from '../src/video1/media-timing.ts';

const raw = fs.readFileSync('src/video1/scene-data.ts', 'utf8');
const scenes = JSON.parse(raw.slice(raw.indexOf('=') + 1).trim().replace(/;$/, ''));
const edits = JSON.parse(fs.readFileSync('src/video1/footage-edits.json', 'utf8'));
assert.equal(scenes.length, 18);
let end = 0;
const sources = new Map();
const keys = new Set();
for (const scene of scenes) {
  assert.equal(scene.fromFrame, end, `Scene ${scene.n}: timeline gap or overlap`);
  assert.ok(scene.duration > 0);
  end += scene.duration;
  const timing = getTrackTiming(scene.intro.length > 0, scene.duration);
  for (const track of ['intro', 'main']) {
    for (const {clip, index, length} of getClipWindows(scene[track], track === 'intro' ? timing.introDuration : timing.mainDuration)) {
      const key = `${scene.n}:${track}:${index}`; keys.add(key);
      const edit = edits[key];
      if (edit) {
        assert.ok(Number.isInteger(edit.startFrame) && edit.startFrame >= 0);
        assert.ok(Number.isFinite(edit.sourceFps) && edit.sourceFps > 0);
      }
      const playback = getClipPlayback(clip, length, edit);
      sources.set(playback.src, {kind: edit?.kind ?? clip.kind, seconds: edit?.sourceDuration ?? clip.seconds});
    }
  }
}
for (const key of Object.keys(edits)) assert.ok(keys.has(key), `Unknown footage placement: ${key}`);
assert.equal(end, 4765);
for (const [src, clip] of sources) {
  assert.ok(!src.includes(':'), `Absolute media path: ${src}`);
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,duration', '-of', 'json', `public/${src}`], {encoding: 'utf8'}));
  const video = probe.streams.find(s => s.codec_type === 'video');
  assert.ok(video && Number(video.duration) >= clip.seconds - .04, `Insufficient media: ${src}`);
  if (clip.kind === 'generated') assert.equal(probe.streams.filter(s => s.codec_type === 'audio').length, 0);
}
for (const file of ['video1/voiceover.mp3', 'video1/productCutouts/amin-chanar-jar.png', 'video1/productFamily/standards-badges-generated-v1.png', 'fonts/NotoSans-Regular.ttf', 'fonts/NotoSans-Bold.ttf']) assert.ok(fs.statSync(`public/${file}`).size > 100);
console.log(`18 scenes cover all ${end} frames; ${sources.size} playable video sources verified.`);
