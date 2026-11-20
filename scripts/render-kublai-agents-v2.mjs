// Renders outputs/kublai-agents-v2.mp4, or kublai-agents-v2-dialogue.mp4 for the dialogue version
// (1920×1080, 60 fps, H.264 20 Mbit/s yuv420p, AAC 320k).
//   npm run render:agents-v2            (narration)
//   npm run render:agents-v2:dialogue   (customer + agent dialogue)
// Video comes from Remotion (muted); the audio mix (score + narration + brand voice) is built with ffmpeg and
// muxed separately. Remotion's own AAC mux leaves the 2048-sample encoder delay uncompensated
// (audio ~43 ms late); ffmpeg writes the priming metadata correctly. The mix mirrors the
// composition: the version's score stems (music, SFX, whooshes) plus each voice clip at its cue and volume.
import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync, statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cues = JSON.parse(readFileSync(join(ROOT, 'src/kublai-agents-v2/cues.json'), 'utf8'));
const VERSION = process.argv[2] ?? 'narration';
if (!['narration', 'dialogue'].includes(VERSION)) throw new Error(`Unknown voice version: ${VERSION}`);
const dialogue = VERSION === 'dialogue';
const COMPOSITION = dialogue ? 'KublaiAgentsV2Dialogue' : 'KublaiAgentsV2';
const STEMS = ['music', 'sfx', 'whooshes'].map((s) => `public/kublai-v2/stems/${VERSION}/${s}.wav`);
const VOICE_LIST = dialogue ? cues.voiceDialogue : cues.voice;
const out = join(ROOT, dialogue ? 'outputs/kublai-agents-v2-dialogue.mp4' : 'outputs/kublai-agents-v2.mp4');
const work = mkdtempSync(join(tmpdir(), 'kublai-agents-v2-'));
const run = (cmd, args) => execFileSync(cmd, args, {cwd: ROOT, stdio: 'inherit'});

try {
  run('node', ['scripts/kublai-agents-v2-audio.mjs', VERSION]);

  const video = join(work, 'video.mp4');
  // GPU (ANGLE) is ~3x faster for the motion-blur passes; concurrency 4 fits 16 GB RAM.
  run('npx', ['remotion', 'render', 'src/index.ts', COMPOSITION, video, '--muted', '--gl=angle', '--concurrency=4', '--codec=h264', '--pixel-format=yuv420p', '--color-space=bt709', '--video-bitrate=20M', '--x264-preset=slow', '--log=error']);

  // Score stems plus every voice clip from cues.json, each delayed to its cue and given its gain.
  const mix = join(work, 'mix.wav');
  const inputs = STEMS.flatMap((f) => ['-i', f]);
  const chains = [];
  const labels = STEMS.map((_, i) => `[${i}:a]`);
  VOICE_LIST.forEach((v, i) => {
    const ms = Math.round(cues.t[v.cue] * 1000);
    inputs.push('-i', join('public', v.file));
    chains.push(`[${i + STEMS.length}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${v.volume},adelay=${ms}|${ms}[v${i}]`);
    labels.push(`[v${i}]`);
  });
  const graph = `${chains.join(';')};${labels.join('')}amix=inputs=${labels.length}:normalize=0:duration=first,alimiter=limit=0.85:attack=2:release=60:level=disabled[m]`;
  run('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', graph, '-map', '[m]', '-c:a', 'pcm_f32le', mix]);

  run('ffmpeg', ['-v', 'error', '-y', '-i', video, '-i', mix, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-movflags', '+faststart', out]);
  console.log(`${out} (${(statSync(out).size / 1e6).toFixed(1)} MB)`);
} finally {
  rmSync(work, {recursive: true, force: true});
}
